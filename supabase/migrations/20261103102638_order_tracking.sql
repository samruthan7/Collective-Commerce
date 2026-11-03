-- Order tracking: confirmed -> shipped -> delivered.
-- Orders are still buyer_selections of a completed group. This adds only the
-- delivery progress, changed through checked functions (no direct table access).

create type public.fulfilment_status as enum ('confirmed', 'shipped', 'delivered');

create table public.order_tracking (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.fulfilment_status not null default 'confirmed',
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.order_tracking enable row level security;
revoke all on public.order_tracking from anon, authenticated;

-- Buyer's orders with progress (seller contact revealed only after selection closed).
create function public.my_orders_tracked()
returns table (
  group_id uuid, product_name text, variant_label text, seller_name text,
  seller_phone text, seller_city text, unit_price_paise bigint, delivery_days integer,
  fulfilment public.fulfilment_status, selected_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select g.id, p.name, v.label, sp.business_name, sp.phone, sp.city,
    (select t.unit_price_paise from public.quotation_tiers t
      where t.quotation_id = q.id and t.min_members <= coalesce(g.locked_member_count, g.member_count)
      order by t.min_members desc limit 1),
    q.delivery_days,
    coalesce(ot.status, 'confirmed'::public.fulfilment_status),
    bs.selected_at
  from public.buyer_selections bs
  join public.quotations q on q.id = bs.quotation_id and q.status = 'submitted'
  join public.groups g on g.id = bs.group_id
  join public.product_variants v on v.id = g.variant_id
  join public.products p on p.id = v.product_id
  join public.seller_profiles sp on sp.user_id = q.seller_id
  left join public.order_tracking ot on ot.group_id = bs.group_id and ot.user_id = bs.user_id
  where bs.user_id = (select auth.uid()) and g.status = 'completed'
  order by g.selection_deadline_at desc
$$;

-- Seller's orders with progress.
create function public.seller_orders_tracked()
returns table (
  group_id uuid, product_name text, variant_label text, buyer_id uuid, buyer_name text,
  buyer_email text, unit_price_paise bigint, selected_at timestamptz,
  fulfilment public.fulfilment_status
)
language sql stable security definer set search_path = '' as $$
  select g.id, p.name, v.label, bs.user_id,
    coalesce(nullif(pr.full_name, ''), 'Buyer'), u.email::text,
    (select t.unit_price_paise from public.quotation_tiers t
      where t.quotation_id = q.id and t.min_members <= coalesce(g.locked_member_count, g.member_count)
      order by t.min_members desc limit 1),
    bs.selected_at,
    coalesce(ot.status, 'confirmed'::public.fulfilment_status)
  from public.buyer_selections bs
  join public.quotations q on q.id = bs.quotation_id and q.status = 'submitted'
  join public.groups g on g.id = bs.group_id
  join public.product_variants v on v.id = g.variant_id
  join public.products p on p.id = v.product_id
  join public.profiles pr on pr.id = bs.user_id
  join auth.users u on u.id = bs.user_id
  left join public.order_tracking ot on ot.group_id = bs.group_id and ot.user_id = bs.user_id
  where q.seller_id = (select auth.uid()) and g.status = 'completed'
  order by bs.selected_at desc
$$;

-- Seller marks an order shipped (only their own orders, only from "confirmed").
create function public.seller_mark_shipped(p_group_id uuid, p_buyer_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  cur public.fulfilment_status;
  pname text;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED'; end if;

  select p.name into pname
  from public.buyer_selections bs
  join public.quotations q on q.id = bs.quotation_id and q.status = 'submitted'
  join public.groups g on g.id = bs.group_id
  join public.product_variants v on v.id = g.variant_id
  join public.products p on p.id = v.product_id
  where bs.group_id = p_group_id and bs.user_id = p_buyer_id
    and q.seller_id = (select auth.uid()) and g.status = 'completed';
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;

  select status into cur from public.order_tracking
    where group_id = p_group_id and user_id = p_buyer_id;
  if cur is not null and cur <> 'confirmed' then raise exception 'ORDER_STATE'; end if;

  insert into public.order_tracking (group_id, user_id, status)
  values (p_group_id, p_buyer_id, 'shipped')
  on conflict (group_id, user_id) do update set status = 'shipped', updated_at = now();

  insert into public.notifications (user_id, kind, title, body, link)
  values (p_buyer_id, 'order_shipped', 'Your order has shipped',
          'The seller marked your ' || pname || ' as shipped.', '/my/orders');
end $$;

-- Buyer confirms delivery (only after the seller marked it shipped).
create function public.buyer_confirm_delivery(p_group_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  cur public.fulfilment_status;
  the_seller uuid;
  pname text;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED'; end if;

  select q.seller_id, p.name into the_seller, pname
  from public.buyer_selections bs
  join public.quotations q on q.id = bs.quotation_id and q.status = 'submitted'
  join public.groups g on g.id = bs.group_id
  join public.product_variants v on v.id = g.variant_id
  join public.products p on p.id = v.product_id
  where bs.group_id = p_group_id and bs.user_id = (select auth.uid()) and g.status = 'completed';
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;

  select status into cur from public.order_tracking
    where group_id = p_group_id and user_id = (select auth.uid());
  if cur is distinct from 'shipped'::public.fulfilment_status then raise exception 'ORDER_STATE'; end if;

  update public.order_tracking set status = 'delivered', updated_at = now()
    where group_id = p_group_id and user_id = (select auth.uid());

  insert into public.notifications (user_id, kind, title, body, link)
  values (the_seller, 'order_delivered', 'Delivery confirmed',
          'A buyer confirmed delivery of ' || pname || '.', '/seller/orders');
end $$;

revoke execute on function
  public.my_orders_tracked(), public.seller_orders_tracked(),
  public.seller_mark_shipped(uuid, uuid), public.buyer_confirm_delivery(uuid)
  from public, anon;
grant execute on function
  public.my_orders_tracked(), public.seller_orders_tracked(),
  public.seller_mark_shipped(uuid, uuid), public.buyer_confirm_delivery(uuid)
  to authenticated;