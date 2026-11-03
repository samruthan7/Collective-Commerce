-- Reviews: a buyer can rate a seller once, only after delivery is confirmed.
create table public.reviews (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.seller_profiles (user_id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
alter table public.reviews enable row level security;
create policy "reviews_read_own" on public.reviews
  for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.reviews from anon, authenticated;
grant select on public.reviews to authenticated;

create function public.submit_review(p_group_id uuid, p_rating integer, p_comment text)
returns void language plpgsql security definer set search_path = '' as $$
declare the_seller uuid;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_rating is null or p_rating not between 1 and 5 then raise exception 'INVALID_RATING'; end if;

  select q.seller_id into the_seller
  from public.buyer_selections bs
  join public.quotations q on q.id = bs.quotation_id
  join public.order_tracking ot
    on ot.group_id = bs.group_id and ot.user_id = bs.user_id and ot.status = 'delivered'
  where bs.group_id = p_group_id and bs.user_id = (select auth.uid());
  if not found then raise exception 'REVIEW_NOT_ALLOWED'; end if;

  begin
    insert into public.reviews (group_id, user_id, seller_id, rating, comment)
    values (p_group_id, (select auth.uid()), the_seller, p_rating, nullif(trim(p_comment), ''));
  exception when unique_violation then
    raise exception 'ALREADY_REVIEWED';
  end;
end $$;

-- Sellers shown to buyers now carry an average rating and review count.
create or replace view public.sellers_public as
  select sp.user_id, sp.business_name, sp.city,
         r.avg_rating, coalesce(r.review_count, 0) as review_count
  from public.seller_profiles sp
  left join (
    select seller_id, round(avg(rating)::numeric, 1) as avg_rating, count(*)::integer as review_count
    from public.reviews group by seller_id
  ) r on r.seller_id = sp.user_id
  where sp.status = 'verified';

-- Reports: a buyer flags a problem with an order; admins review it.
create table public.order_reports (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.seller_profiles (user_id) on delete cascade,
  reason text not null check (reason in
    ('not_delivered','wrong_item','price_changed','seller_unresponsive','other')),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create unique index order_reports_one_open on public.order_reports (group_id, user_id)
  where status = 'open';
alter table public.order_reports enable row level security;
revoke all on public.order_reports from anon, authenticated;

create function public.submit_order_report(p_group_id uuid, p_reason text, p_details text)
returns void language plpgsql security definer set search_path = '' as $$
declare the_seller uuid;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED'; end if;

  select q.seller_id into the_seller
  from public.buyer_selections bs
  join public.quotations q on q.id = bs.quotation_id
  join public.groups g on g.id = bs.group_id
  where bs.group_id = p_group_id and bs.user_id = (select auth.uid()) and g.status = 'completed';
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;

  begin
    insert into public.order_reports (group_id, user_id, seller_id, reason, details)
    values (p_group_id, (select auth.uid()), the_seller, p_reason, nullif(trim(p_details), ''));
  exception when unique_violation then
    raise exception 'REPORT_EXISTS';
  end;
end $$;

create function public.admin_list_reports()
returns table (
  id uuid, group_id uuid, product_name text, buyer_name text, buyer_email text,
  seller_name text, reason text, details text, status text, created_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  return query
  select r.id, r.group_id, p.name, coalesce(nullif(pr.full_name, ''), 'Buyer'), u.email::text,
         sp.business_name, r.reason, r.details, r.status, r.created_at
  from public.order_reports r
  join public.groups g on g.id = r.group_id
  join public.product_variants v on v.id = g.variant_id
  join public.products p on p.id = v.product_id
  join public.profiles pr on pr.id = r.user_id
  join auth.users u on u.id = r.user_id
  join public.seller_profiles sp on sp.user_id = r.seller_id
  order by (r.status = 'open') desc, r.created_at desc;
end $$;

create function public.admin_resolve_report(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  update public.order_reports set status = 'resolved', resolved_at = now()
    where id = p_id and status = 'open';
  if not found then raise exception 'REPORT_NOT_FOUND'; end if;
end $$;

revoke execute on function
  public.submit_review(uuid, integer, text), public.submit_order_report(uuid, text, text),
  public.admin_list_reports(), public.admin_resolve_report(uuid)
  from public, anon;
grant execute on function
  public.submit_review(uuid, integer, text), public.submit_order_report(uuid, text, text),
  public.admin_list_reports(), public.admin_resolve_report(uuid)
  to authenticated;