create type public.group_status as enum
  ('open','full','bidding','locked','completed','cancelled','expired_no_offers');
create type public.commitment_level as enum ('interested','committed');

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  region_id uuid not null references public.regions (id) on delete restrict,
  created_by uuid not null references public.profiles (id) on delete restrict,
  status public.group_status not null default 'open',
  min_members integer not null default 10 check (min_members > 0),
  max_members integer,
  member_count integer not null default 0 check (member_count >= 0),
  locked_member_count integer,
  join_deadline_at timestamptz not null,
  bidding_deadline_at timestamptz not null,
  selection_deadline_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (max_members is null or max_members >= min_members),
  check (bidding_deadline_at > join_deadline_at),
  check (selection_deadline_at > bidding_deadline_at)
);

-- One open group per variant and region (blueprint rule).
create unique index groups_one_open_per_variant_region
  on public.groups (variant_id, region_id) where status = 'open';
create index groups_status_idx on public.groups (status, join_deadline_at);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  commitment public.commitment_level not null default 'interested',
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  unique (group_id, user_id)
);
create index group_members_user_id_idx on public.group_members (user_id);

create trigger groups_set_updated_at before update on public.groups
  for each row execute function public.set_updated_at();

-- Row level security
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

create policy "groups_read_all" on public.groups
  for select to anon, authenticated using (true);
create policy "groups_admin_update" on public.groups
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "members_read_own" on public.group_members
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

revoke all on public.groups, public.group_members from anon, authenticated;
grant select on public.groups to anon, authenticated;
grant update on public.groups to authenticated;
grant select on public.group_members to authenticated;

-- Anonymised member list ("Aarav K."): no ids, no contact data.
create view public.group_members_public as
select
  gm.group_id, gm.commitment, gm.joined_at,
  coalesce(nullif(split_part(p.full_name, ' ', 1), ''), 'Buyer')
  || case when nullif(split_part(p.full_name, ' ', 2), '') is not null
          then ' ' || left(split_part(p.full_name, ' ', 2), 1) || '.' else '' end as display_name
from public.group_members gm
join public.profiles p on p.id = gm.user_id
where gm.left_at is null;
grant select on public.group_members_public to anon, authenticated;

-- Core: join a specific group. FOR UPDATE serialises all joins to this group.
create function public.join_group_as(
  p_group_id uuid, p_user_id uuid, p_commitment public.commitment_level
) returns public.group_members
language plpgsql security definer set search_path = '' as $$
declare
  g public.groups;
  m public.group_members;
begin
  select * into g from public.groups where id = p_group_id for update;
  if not found then raise exception 'GROUP_NOT_FOUND'; end if;
  if g.status <> 'open' or g.join_deadline_at <= now() then raise exception 'GROUP_NOT_OPEN'; end if;
  if g.max_members is not null and g.member_count >= g.max_members then raise exception 'GROUP_FULL'; end if;

  select * into m from public.group_members where group_id = p_group_id and user_id = p_user_id;
  if found and m.left_at is null then
    raise exception 'ALREADY_MEMBER';
  elsif found then
    update public.group_members
      set left_at = null, joined_at = now(), commitment = p_commitment
      where id = m.id returning * into m;
  else
    insert into public.group_members (group_id, user_id, commitment)
      values (p_group_id, p_user_id, p_commitment) returning * into m;
  end if;

  update public.groups
    set member_count = member_count + 1,
        status = case when max_members is not null and member_count + 1 >= max_members
                      then 'full'::public.group_status else status end
    where id = p_group_id;
  return m;
end $$;

-- Join the open group for a variant; create it if none; overflow happens
-- automatically because a full group is no longer "open".
create function public.join_or_create_group_as(
  p_variant_id uuid, p_region_id uuid, p_user_id uuid, p_commitment public.commitment_level
) returns public.group_members
language plpgsql security definer set search_path = '' as $$
declare
  g_id uuid;
  attempts integer := 0;
begin
  if not exists (select 1 from public.product_variants where id = p_variant_id and is_active)
     or not exists (select 1 from public.regions where id = p_region_id and is_active) then
    raise exception 'VARIANT_NOT_FOUND';
  end if;

  loop
    attempts := attempts + 1;
    g_id := null;
    select id into g_id from public.groups
      where variant_id = p_variant_id and region_id = p_region_id and status = 'open'
      for update;

    if g_id is null then
      begin
        insert into public.groups
          (variant_id, region_id, created_by, min_members, max_members,
           join_deadline_at, bidding_deadline_at, selection_deadline_at)
        values
          (p_variant_id, p_region_id, p_user_id, 10, 50,
           now() + interval '7 days', now() + interval '10 days', now() + interval '13 days')
        returning id into g_id;
      exception when unique_violation then
        if attempts >= 5 then raise exception 'GROUP_BUSY'; end if;
        continue;
      end;
    end if;

    return public.join_group_as(g_id, p_user_id, p_commitment);
  end loop;
end $$;

create function public.leave_group_as(p_group_id uuid, p_user_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  g public.groups;
  m public.group_members;
begin
  select * into g from public.groups where id = p_group_id for update;
  if not found then raise exception 'GROUP_NOT_FOUND'; end if;
  if g.status not in ('open','full','bidding') then raise exception 'LEAVE_NOT_ALLOWED'; end if;

  select * into m from public.group_members
    where group_id = p_group_id and user_id = p_user_id and left_at is null;
  if not found then raise exception 'NOT_MEMBER'; end if;

  update public.group_members set left_at = now() where id = m.id;
  update public.groups set member_count = member_count - 1 where id = p_group_id;
end $$;

-- Wrappers for logged-in users: the user id comes from the JWT, never from the client.
create function public.join_or_create_group(
  p_variant_id uuid, p_region_id uuid, p_commitment public.commitment_level default 'interested'
) returns public.group_members
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED'; end if;
  return public.join_or_create_group_as(p_variant_id, p_region_id, (select auth.uid()), p_commitment);
end $$;

create function public.join_group(
  p_group_id uuid, p_commitment public.commitment_level default 'interested'
) returns public.group_members
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED'; end if;
  return public.join_group_as(p_group_id, (select auth.uid()), p_commitment);
end $$;

create function public.leave_group(p_group_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED'; end if;
  perform public.leave_group_as(p_group_id, (select auth.uid()));
end $$;

-- Sweeper: every transition is a guarded UPDATE, so running it twice changes nothing.
create function public.sweep_groups() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare a integer; b integer; c integer; d integer;
begin
  update public.groups set status = 'bidding'
    where status in ('open','full') and join_deadline_at <= now() and member_count >= min_members;
  get diagnostics a = row_count;

  update public.groups set status = 'cancelled'
    where status = 'open' and join_deadline_at <= now() and member_count < min_members;
  get diagnostics b = row_count;

  -- Phase 6 will lock groups that have quotations; until then no offers means expired.
  update public.groups set status = 'expired_no_offers'
    where status = 'bidding' and bidding_deadline_at <= now();
  get diagnostics c = row_count;

  update public.groups set status = 'completed'
    where status = 'locked' and selection_deadline_at <= now();
  get diagnostics d = row_count;

  return jsonb_build_object('to_bidding', a, 'cancelled', b, 'expired_no_offers', c, 'completed', d);
end $$;

-- Function privileges: *_as and sweep are server-only; wrappers are for logged-in users.
revoke execute on function
  public.join_group_as(uuid, uuid, public.commitment_level),
  public.join_or_create_group_as(uuid, uuid, uuid, public.commitment_level),
  public.leave_group_as(uuid, uuid),
  public.sweep_groups()
  from public, anon, authenticated;
grant execute on function
  public.join_group_as(uuid, uuid, public.commitment_level),
  public.join_or_create_group_as(uuid, uuid, uuid, public.commitment_level),
  public.leave_group_as(uuid, uuid),
  public.sweep_groups()
  to service_role;

revoke execute on function
  public.join_or_create_group(uuid, uuid, public.commitment_level),
  public.join_group(uuid, public.commitment_level),
  public.leave_group(uuid)
  from public, anon;
grant execute on function
  public.join_or_create_group(uuid, uuid, public.commitment_level),
  public.join_group(uuid, public.commitment_level),
  public.leave_group(uuid)
  to authenticated;

-- Live updates and the minute-by-minute sweeper.
alter publication supabase_realtime add table public.groups;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('sweep-groups', '* * * * *', 'select public.sweep_groups()');