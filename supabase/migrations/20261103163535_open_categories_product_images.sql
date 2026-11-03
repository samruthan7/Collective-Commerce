-- Open the four remaining categories.
update public.categories
set is_active = true,
    description = case slug
      when 'two-wheelers' then 'Bikes and scooters in exact model and colour variants.'
      when 'cars' then 'Cars in exact trim, fuel and colour variants.'
      when 'appliances' then 'Home appliances in exact model and capacity variants.'
      when 'furniture' then 'Furniture in exact size, material and colour variants.'
    end
where slug in ('two-wheelers', 'cars', 'appliances', 'furniture');

-- A picture is required on every new product. Older products without one stay editable,
-- but nobody can remove a picture that exists.
create function public.require_product_image() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if coalesce(btrim(new.image_url), '') = '' then raise exception 'IMAGE_REQUIRED'; end if;
  elsif coalesce(btrim(new.image_url), '') = '' and coalesce(btrim(old.image_url), '') <> '' then
    raise exception 'IMAGE_REQUIRED';
  end if;
  return new;
end $$;

create trigger products_require_image
  before insert or update on public.products
  for each row execute function public.require_product_image();

-- Lets the app clean up a picture if saving the product fails.
drop policy if exists "product images admin delete" on storage.objects;
create policy "product images admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());