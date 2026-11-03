-- ===== GSTIN check digit =====
create function public.is_valid_gstin(g text) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  chars constant text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  s integer := 0;
  v integer;
  i integer;
begin
  if g is null or g !~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$' then return false; end if;
  if substr(g, 1, 2)::integer not between 1 and 38 then return false; end if;
  for i in 1..14 loop
    v := (position(substr(g, i, 1) in chars) - 1) * case when i % 2 = 1 then 1 else 2 end;
    s := s + v / 36 + v % 36;
  end loop;
  return substr(chars, ((36 - s % 36) % 36) + 1, 1) = substr(g, 15, 1);
end $$;

-- Sellers can no longer apply with a GSTIN that fails the check.
create or replace function public.apply_as_seller(p_business_name text, p_gstin text, p_city text, p_phone text)
returns void language plpgsql security definer set search_path = '' as $$
declare g text := nullif(upper(trim(p_gstin)), '');
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED'; end if;
  if g is not null and not public.is_valid_gstin(g) then raise exception 'INVALID_GSTIN'; end if;
  insert into public.seller_profiles (user_id, business_name, gstin, city, phone)
    values ((select auth.uid()), p_business_name, g, p_city, p_phone)
  on conflict (user_id) do update
    set business_name = excluded.business_name, gstin = excluded.gstin,
        city = excluded.city, phone = excluded.phone, status = 'pending'
    where public.seller_profiles.status in ('pending','rejected');
end $$;

-- ===== KYC documents =====
create table public.seller_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.seller_profiles (user_id) on delete cascade,
  doc_type text not null check (doc_type in ('gst_certificate','business_proof','id_proof')),
  storage_path text not null unique,
  original_name text not null check (char_length(original_name) <= 200),
  created_at timestamptz not null default now()
);
create index seller_documents_user_idx on public.seller_documents (user_id);

alter table public.seller_documents enable row level security;
create policy "seller_documents_read" on public.seller_documents
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
revoke all on public.seller_documents from anon, authenticated;
grant select on public.seller_documents to authenticated;

create function public.add_seller_document(p_doc_type text, p_path text, p_name text)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_doc_type not in ('gst_certificate','business_proof','id_proof') then
    raise exception 'INVALID_DOC_TYPE';
  end if;
  if left(p_path, length(uid::text) + 1) <> uid::text || '/' then raise exception 'INVALID_PATH'; end if;
  if not exists (select 1 from public.seller_profiles where user_id = uid and status <> 'suspended') then
    raise exception 'SELLER_NOT_FOUND';
  end if;
  if (select count(*) from public.seller_documents where user_id = uid) >= 10 then
    raise exception 'TOO_MANY_DOCUMENTS';
  end if;
  insert into public.seller_documents (user_id, doc_type, storage_path, original_name)
  values (uid, p_doc_type, p_path, left(p_name, 200));
end $$;

revoke execute on function public.add_seller_document(text, text, text) from public, anon;
grant execute on function public.add_seller_document(text, text, text) to authenticated;

-- Private bucket: PDF, JPG, PNG only, 5 MB max.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kyc-documents', 'kyc-documents', false, 5242880,
        array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

drop policy if exists "kyc upload own folder" on storage.objects;
create policy "kyc upload own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'kyc-documents'
              and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "kyc read own or admin" on storage.objects;
create policy "kyc read own or admin" on storage.objects
  for select to authenticated
  using (bucket_id = 'kyc-documents'
         and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));

-- ===== Admin MFA, enforced in the database =====
-- An admin who has turned on two-step login can only act as admin on an MFA-verified session.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  )
  and (
    coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    or not exists (
      select 1 from auth.mfa_factors f
      where f.user_id = (select auth.uid()) and f.status = 'verified'
    )
  );
$$;