create type public.seller_status as enum ('pending','verified','rejected','suspended');
create type public.quotation_status as enum ('submitted','withdrawn');

create table public.seller_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  business_name text not null check (char_length(business_name) between 2 and 120),
  gstin text check (gstin is null or gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
  city text not null check (char_length(city) between 2 and 80),
  phone text not null check (phone ~ '^[0-9+ -]{8,15}$'),
  status public.seller_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger seller_profiles_set_updated_at before update on public.seller_profiles
  for each row execute function public.set_updated_at();

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  seller_id uuid not null references public.seller_profiles (user_id) on delete cascade,
  status public.quotation_status not null default 'submitted',
  delivery_days integer not null check (delivery_days between 1 and 90),
  warranty_months integer not null check (warranty_months between 0 and 120),
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, seller_id)
);
create trigger quotations_set_updated_at before update on public.quotations
  for each row execute function public.set_updated_at();

create table public.quotation_tiers (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  min_members integer not null check (min_members >= 1),
  unit_price_paise bigint not null check (unit_price_paise > 0),
  unique (quotation_id, min_members)
);

create table public.buyer_selections (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  selected_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Helper used by policies and functions.
create function public.is_verified_seller() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.seller_profiles
                 where user_id = (select auth.uid()) and status = 'verified')
$$;
revoke execute on function public.is_verified_seller() from public, anon;
grant execute on function public.is_verified_seller() to authenticated;

-- Row level security: reads only; every write goes through the functions below.
alter table public.seller_profiles enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_tiers enable row level security;
alter table public.buyer_selections enable row level security;

create policy "seller_read_own" on public.seller_profiles
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

-- Sellers see only their own quotes while bidding; members see all submitted quotes once locked.
create policy "quotations_read" on public.quotations
  for select to authenticated using (
    seller_id = (select auth.uid())
    or public.is_admin()
    or (status = 'submitted' and exists (
      select 1 from public.group_members gm
      join public.groups g on g.id = gm.group_id
      where gm.group_id = quotations.group_id
        and gm.user_id = (select auth.uid())
        and gm.left_at is null
        and g.status in ('locked','completed')))
  );

-- Tiers follow the visibility of their quotation.
create policy "tiers_read" on public.quotation_tiers
  for select to authenticated using (
    exists (select 1 from public.quotations q where q.id = quotation_tiers.quotation_id)
  );

create policy "selection_read_own" on public.buyer_selections
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

revoke all on public.seller_profiles, public.quotations, public.quotation_tiers, public.buyer_selections
  from anon, authenticated;
grant select on public.seller_profiles, public.quotations, public.quotation_tiers, public.buyer_selections
  to authenticated;

-- Public seller names for offer cards (no phone, no GSTIN).
create view public.sellers_public as
  select user_id, business_name, city from public.seller_profiles where status = 'verified';
grant select on public.sellers_public to authenticated;

-- Seller applies (or re-applies after rejection).
create function public.apply_as_seller(p_business_name text, p_gstin text, p_city text, p_phone text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED'; end if;
  insert into public.seller_profiles (user_id, business_name, gstin, city, phone)
    values ((select auth.uid()), p_business_name, nullif(upper(trim(p_gstin)), ''), p_city, p_phone)
  on conflict (user_id) do update
    set business_name = excluded.business_name, gstin = excluded.gstin,
        city = excluded.city, phone = excluded.phone, status = 'pending'
    where public.seller_profiles.status in ('pending','rejected');
end $$;

-- Admin verifies, rejects or suspends.
create function public.admin_set_seller_status(p_user_id uuid, p_status public.seller_status)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  update public.seller_profiles set status = p_status where user_id = p_user_id;
  if not found then raise exception 'SELLER_NOT_FOUND'; end if;
end $$;

-- Submit or replace a quotation. Tiers: min_members ascending, price strictly falling.
create function public.submit_quotation(
  p_group_id uuid, p_delivery_days integer, p_warranty_months integer, p_notes text, p_tiers jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  g public.groups;
  q_id uuid;
  t jsonb;
  mn integer; pr bigint;
  prev_min integer := 0; prev_price bigint := null; first_min integer := null;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.is_verified_seller() then raise exception 'NOT_VERIFIED_SELLER'; end if;

  select * into g from public.groups where id = p_group_id for share;
  if not found then raise exception 'GROUP_NOT_FOUND'; end if;
  if g.status <> 'bidding' or g.bidding_deadline_at <= now() then raise exception 'BIDDING_CLOSED'; end if;

  if jsonb_typeof(p_tiers) <> 'array' or jsonb_array_length(p_tiers) not between 1 and 5 then
    raise exception 'INVALID_TIERS';
  end if;
  for t in select e.value from jsonb_array_elements(p_tiers) with ordinality as e(value, ord) order by e.ord loop
    mn := (t->>'min_members')::integer;
    pr := (t->>'unit_price_paise')::bigint;
    if mn is null or pr is null or mn < 1 or pr < 1 or mn <= prev_min
       or (prev_price is not null and pr >= prev_price) then
      raise exception 'INVALID_TIERS';
    end if;
    if first_min is null then first_min := mn; end if;
    prev_min := mn; prev_price := pr;
  end loop;
  -- The first tier must be reachable by the group's minimum.
  if first_min > g.min_members then raise exception 'INVALID_TIERS'; end if;

  insert into public.quotations (group_id, seller_id, delivery_days, warranty_months, notes)
    values (p_group_id, (select auth.uid()), p_delivery_days, p_warranty_months, nullif(trim(p_notes), ''))
  on conflict (group_id, seller_id) do update
    set status = 'submitted', delivery_days = excluded.delivery_days,
        warranty_months = excluded.warranty_months, notes = excluded.notes
  returning id into q_id;

  delete from public.quotation_tiers where quotation_id = q_id;
  insert into public.quotation_tiers (quotation_id, min_members, unit_price_paise)
    select q_id, x.min_members, x.unit_price_paise
    from jsonb_to_recordset(p_tiers) as x(min_members integer, unit_price_paise bigint);
  return q_id;
end $$;

create function public.withdraw_quotation(p_group_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED'; end if;
  update public.quotations q set status = 'withdrawn'
    from public.groups g
    where q.group_id = p_group_id and q.seller_id = (select auth.uid())
      and g.id = q.group_id and g.status = 'bidding';
  if not found then raise exception 'QUOTE_NOT_FOUND'; end if;
end $$;

-- A group member picks one offer (can change until the selection deadline).
create function public.select_offer(p_group_id uuid, p_quotation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare g public.groups;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into g from public.groups where id = p_group_id;
  if not found then raise exception 'GROUP_NOT_FOUND'; end if;
  if g.status <> 'locked' or g.selection_deadline_at <= now() then raise exception 'SELECTION_CLOSED'; end if;
  if not exists (select 1 from public.group_members
                 where group_id = p_group_id and user_id = (select auth.uid()) and left_at is null) then
    raise exception 'NOT_MEMBER';
  end if;
  if not exists (select 1 from public.quotations
                 where id = p_quotation_id and group_id = p_group_id and status = 'submitted') then
    raise exception 'OFFER_NOT_FOUND';
  end if;
  insert into public.buyer_selections (group_id, user_id, quotation_id)
    values (p_group_id, (select auth.uid()), p_quotation_id)
  on conflict (group_id, user_id) do update
    set quotation_id = excluded.quotation_id, selected_at = now();
end $$;

revoke execute on function
  public.apply_as_seller(text, text, text, text),
  public.admin_set_seller_status(uuid, public.seller_status),
  public.submit_quotation(uuid, integer, integer, text, jsonb),
  public.withdraw_quotation(uuid),
  public.select_offer(uuid, uuid)
  from public, anon;
grant execute on function
  public.apply_as_seller(text, text, text, text),
  public.admin_set_seller_status(uuid, public.seller_status),
  public.submit_quotation(uuid, integer, integer, text, jsonb),
  public.withdraw_quotation(uuid),
  public.select_offer(uuid, uuid)
  to authenticated;

-- Sweeper v2: groups with offers lock (member count frozen); the rest expire.
create or replace function public.sweep_groups() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare a integer; b integer; c integer; d integer; e integer;
begin
  update public.groups set status = 'bidding'
    where status in ('open','full') and join_deadline_at <= now() and member_count >= min_members;
  get diagnostics a = row_count;

  update public.groups set status = 'cancelled'
    where status = 'open' and join_deadline_at <= now() and member_count < min_members;
  get diagnostics b = row_count;

  update public.groups g set status = 'locked', locked_member_count = g.member_count
    where g.status = 'bidding' and g.bidding_deadline_at <= now()
      and exists (select 1 from public.quotations q where q.group_id = g.id and q.status = 'submitted');
  get diagnostics c = row_count;

  update public.groups set status = 'expired_no_offers'
    where status = 'bidding' and bidding_deadline_at <= now();
  get diagnostics d = row_count;

  update public.groups set status = 'completed'
    where status = 'locked' and selection_deadline_at <= now();
  get diagnostics e = row_count;

  return jsonb_build_object('to_bidding', a, 'cancelled', b, 'locked', c,
                            'expired_no_offers', d, 'completed', e);
end $$;