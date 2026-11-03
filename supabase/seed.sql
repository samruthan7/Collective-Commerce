-- Illustrative sample data for development. Brand, names and prices are fictional.
-- Run it in the Supabase SQL Editor. It is safe to run more than once.

insert into public.products (category_id, brand, name, slug, description)
select c.id, v.brand, v.name, v.slug, v.description
from public.categories c
join (values
  ('smartphones', 'Demo', 'Demo Phone One', 'demo-phone-one', 'Illustrative sample product.'),
  ('smartphones', 'Demo', 'Demo Phone Two', 'demo-phone-two', 'Illustrative sample product.'),
  ('laptops', 'Demo', 'Demo Laptop Air', 'demo-laptop-air', 'Illustrative sample product.'),
  ('laptops', 'Demo', 'Demo Laptop Pro', 'demo-laptop-pro', 'Illustrative sample product.')
) as v (category_slug, brand, name, slug, description) on v.category_slug = c.slug
on conflict (slug) do nothing;

insert into public.product_variants (product_id, sku, label, attributes, mrp_paise)
select p.id, v.sku, v.label, v.attributes::jsonb, v.mrp_paise
from public.products p
join (values
  ('demo-phone-one', 'DEMO-PH1-128-BLK', '128 GB, Black', '{"storage_gb":128,"colour":"Black"}', 1499900),
  ('demo-phone-one', 'DEMO-PH1-256-BLU', '256 GB, Blue', '{"storage_gb":256,"colour":"Blue"}', 1699900),
  ('demo-phone-two', 'DEMO-PH2-128-GRN', '128 GB, Green', '{"storage_gb":128,"colour":"Green"}', 2299900),
  ('demo-phone-two', 'DEMO-PH2-256-GRY', '256 GB, Grey', '{"storage_gb":256,"colour":"Grey"}', 2599900),
  ('demo-laptop-air', 'DEMO-LA-8-256', '8 GB RAM, 256 GB SSD', '{"ram_gb":8,"storage_gb":256}', 5499900),
  ('demo-laptop-air', 'DEMO-LA-16-512', '16 GB RAM, 512 GB SSD', '{"ram_gb":16,"storage_gb":512}', 6999900),
  ('demo-laptop-pro', 'DEMO-LP-16-512', '16 GB RAM, 512 GB SSD', '{"ram_gb":16,"storage_gb":512}', 8999900),
  ('demo-laptop-pro', 'DEMO-LP-32-1TB', '32 GB RAM, 1 TB SSD', '{"ram_gb":32,"storage_gb":1024}', 12345600)
) as v (product_slug, sku, label, attributes, mrp_paise) on v.product_slug = p.slug
on conflict (sku) do nothing;