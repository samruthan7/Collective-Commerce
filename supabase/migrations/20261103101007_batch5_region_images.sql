-- Buyer region choice (matches whatever type regions.id uses)
do $$
declare t text;
begin
  select data_type into t from information_schema.columns
   where table_schema = 'public' and table_name = 'regions' and column_name = 'id';

  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'profiles' and column_name = 'region_id'
  ) then
    execute format(
      'alter table public.profiles add column region_id %s references public.regions(id)',
      case t when 'uuid' then 'uuid' when 'bigint' then 'bigint' when 'integer' then 'integer' else 'text' end
    );
  end if;
end $$;

-- Product images
alter table public.products add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product images public read" on storage.objects;
create policy "product images public read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product images admin write" on storage.objects;
create policy "product images admin write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());