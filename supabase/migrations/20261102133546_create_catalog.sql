-- Catalog: regions, categories, products and exact variants.
-- Money is stored as whole paise (integers), never as decimals.

-- Admin check used by the security policies below.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create table public.regions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  state text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  slug text not null unique,
  brand text not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique,
  label text not null,
  attributes jsonb not null default '{}'::jsonb,
  mrp_paise integer not null check (mrp_paise > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);
create index product_variants_product_id_idx on public.product_variants (product_id);

create trigger regions_set_updated_at before update on public.regions
  for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger product_variants_set_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();

-- Row level security: everyone reads active rows, only admins change anything.
alter table public.regions enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;

create policy "regions_read_active" on public.regions
  for select to anon, authenticated using (is_active);
create policy "regions_admin_all" on public.regions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "categories_read_active" on public.categories
  for select to anon, authenticated using (is_active);
create policy "categories_admin_all" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "products_read_active" on public.products
  for select to anon, authenticated using (is_active);
create policy "products_admin_all" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "variants_read_active" on public.product_variants
  for select to anon, authenticated using (is_active);
create policy "variants_admin_all" on public.product_variants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Explicit privileges. RLS then limits writes to admins.
revoke all on public.regions, public.categories, public.products, public.product_variants
  from anon, authenticated;
grant select on public.regions, public.categories, public.products, public.product_variants
  to anon, authenticated;
grant insert, update, delete
  on public.regions, public.categories, public.products, public.product_variants
  to authenticated;

-- Reference data. Launch city is Chennai (decision D14 default).
insert into public.regions (slug, name, state)
values ('chennai', 'Chennai', 'Tamil Nadu')
on conflict (slug) do nothing;

insert into public.categories (slug, name, description, sort_order, is_active) values
  ('smartphones', 'Smartphones', 'Phones in exact storage and colour variants.', 1, true),
  ('laptops', 'Laptops', 'Laptops in exact processor, memory and storage variants.', 2, true),
  ('two-wheelers', 'Two-wheelers', 'Coming later.', 3, false),
  ('cars', 'Cars', 'Coming later.', 4, false),
  ('appliances', 'Appliances', 'Coming later.', 5, false),
  ('furniture', 'Furniture', 'Coming later.', 6, false)
on conflict (slug) do nothing;