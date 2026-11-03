create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  link text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
create policy "notifications_read_own" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;

create function public.mark_notifications_read() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED'; end if;
  update public.notifications set read_at = now()
    where user_id = (select auth.uid()) and read_at is null;
end $$;
revoke execute on function public.mark_notifications_read() from public, anon;
grant execute on function public.mark_notifications_read() to authenticated;

-- Tell a seller when an admin verifies them.
create or replace function public.admin_set_seller_status(p_user_id uuid, p_status public.seller_status)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  update public.seller_profiles set status = p_status where user_id = p_user_id;
  if not found then raise exception 'SELLER_NOT_FOUND'; end if;
  if p_status = 'verified' then
    insert into public.notifications (user_id, kind, title, body, link)
    values (p_user_id, 'seller_verified', 'You are verified', 'You can now bid on groups.', '/seller');
  end if;
end $$;

-- Sweeper v3: same transitions as before, now with notifications.
create or replace function public.sweep_groups() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare a integer; b integer; c integer; d integer; e integer;
begin
  with moved as (
    update public.groups g set status = 'bidding'
    where g.status in ('open','full') and g.join_deadline_at <= now() and g.member_count >= g.min_members
    returning g.id, g.variant_id
  ), named as (
    select m.id, p.name from moved m
    join public.product_variants v on v.id = m.variant_id
    join public.products p on p.id = v.product_id
  ), to_members as (
    insert into public.notifications (user_id, kind, title, body, link)
    select gm.user_id, 'group_bidding', 'Sellers are bidding',
           'Your group for ' || n.name || ' reached its minimum. Sellers are now sending offers.',
           '/groups/' || n.id
    from named n join public.group_members gm on gm.group_id = n.id and gm.left_at is null
    returning 1
  ), to_sellers as (
    insert into public.notifications (user_id, kind, title, body, link)
    select sp.user_id, 'bidding_open', 'New group to bid on',
           n.name || ' has a group open for bidding.', '/seller/groups/' || n.id
    from named n cross join public.seller_profiles sp where sp.status = 'verified'
    returning 1
  )
  select count(*) into a from moved;

  with moved as (
    update public.groups g set status = 'cancelled'
    where g.status = 'open' and g.join_deadline_at <= now() and g.member_count < g.min_members
    returning g.id, g.variant_id
  ), named as (
    select m.id, p.name from moved m
    join public.product_variants v on v.id = m.variant_id
    join public.products p on p.id = v.product_id
  ), to_members as (
    insert into public.notifications (user_id, kind, title, body, link)
    select gm.user_id, 'group_cancelled', 'Group cancelled',
           'Your group for ' || n.name || ' did not reach its minimum number of buyers.', '/groups/' || n.id
    from named n join public.group_members gm on gm.group_id = n.id and gm.left_at is null
    returning 1
  )
  select count(*) into b from moved;

  with moved as (
    update public.groups g set status = 'locked', locked_member_count = g.member_count
    where g.status = 'bidding' and g.bidding_deadline_at <= now()
      and exists (select 1 from public.quotations q where q.group_id = g.id and q.status = 'submitted')
    returning g.id, g.variant_id
  ), named as (
    select m.id, p.name from moved m
    join public.product_variants v on v.id = m.variant_id
    join public.products p on p.id = v.product_id
  ), to_members as (
    insert into public.notifications (user_id, kind, title, body, link)
    select gm.user_id, 'group_locked', 'Offers are ready',
           'Compare the offers for ' || n.name || ' and choose one.', '/groups/' || n.id
    from named n join public.group_members gm on gm.group_id = n.id and gm.left_at is null
    returning 1
  ), to_sellers as (
    insert into public.notifications (user_id, kind, title, body, link)
    select q.seller_id, 'bidding_closed', 'Bidding closed',
           'Buyers can now choose between the offers for ' || n.name || '.', '/seller/quotes'
    from named n join public.quotations q on q.group_id = n.id and q.status = 'submitted'
    returning 1
  )
  select count(*) into c from moved;

  with moved as (
    update public.groups g set status = 'expired_no_offers'
    where g.status = 'bidding' and g.bidding_deadline_at <= now()
    returning g.id, g.variant_id
  ), named as (
    select m.id, p.name from moved m
    join public.product_variants v on v.id = m.variant_id
    join public.products p on p.id = v.product_id
  ), to_members as (
    insert into public.notifications (user_id, kind, title, body, link)
    select gm.user_id, 'group_expired', 'Group closed',
           'No seller sent an offer for ' || n.name || '.', '/groups/' || n.id
    from named n join public.group_members gm on gm.group_id = n.id and gm.left_at is null
    returning 1
  )
  select count(*) into d from moved;

  update public.groups set status = 'completed'
    where status = 'locked' and selection_deadline_at <= now();
  get diagnostics e = row_count;

  return jsonb_build_object('to_bidding', a, 'cancelled', b, 'locked', c,
                            'expired_no_offers', d, 'completed', e);
end $$;

-- Buyer's orders: only after selection closed. Seller contact is revealed here.
create function public.my_orders()
returns table (
  group_id uuid, product_name text, variant_label text, seller_name text,
  seller_phone text, seller_city text, unit_price_paise bigint, delivery_days integer
)
language sql stable security definer set search_path = '' as $$
  select g.id, p.name, v.label, sp.business_name, sp.phone, sp.city,
    (select t.unit_price_paise from public.quotation_tiers t
      where t.quotation_id = q.id and t.min_members <= coalesce(g.locked_member_count, g.member_count)
      order by t.min_members desc limit 1),
    q.delivery_days
  from public.buyer_selections bs
  join public.quotations q on q.id = bs.quotation_id and q.status = 'submitted'
  join public.groups g on g.id = bs.group_id
  join public.product_variants v on v.id = g.variant_id
  join public.products p on p.id = v.product_id
  join public.seller_profiles sp on sp.user_id = q.seller_id
  where bs.user_id = (select auth.uid()) and g.status = 'completed'
  order by g.selection_deadline_at desc
$$;

-- Seller's orders: buyers who chose this seller, after selection closed.
create function public.seller_orders()
returns table (
  group_id uuid, product_name text, variant_label text, buyer_name text,
  buyer_email text, unit_price_paise bigint, selected_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select g.id, p.name, v.label,
    coalesce(nullif(pr.full_name, ''), 'Buyer'), u.email::text,
    (select t.unit_price_paise from public.quotation_tiers t
      where t.quotation_id = q.id and t.min_members <= coalesce(g.locked_member_count, g.member_count)
      order by t.min_members desc limit 1),
    bs.selected_at
  from public.buyer_selections bs
  join public.quotations q on q.id = bs.quotation_id and q.status = 'submitted'
  join public.groups g on g.id = bs.group_id
  join public.product_variants v on v.id = g.variant_id
  join public.products p on p.id = v.product_id
  join public.profiles pr on pr.id = bs.user_id
  join auth.users u on u.id = bs.user_id
  where q.seller_id = (select auth.uid()) and g.status = 'completed'
  order by bs.selected_at desc
$$;

revoke execute on function public.my_orders(), public.seller_orders() from public, anon;
grant execute on function public.my_orders(), public.seller_orders() to authenticated;