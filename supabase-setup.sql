-- Run this once in Supabase Dashboard → SQL Editor.
-- First create the admin user in Authentication → Users, then use that email
-- and password at /htmlPages/admin.html.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  description text not null default '',
  price numeric not null check (price >= 0),
  brand text not null default '',
  category text not null check (category in ('computer', 'camera', 'powerbank', 'solar')),
  in_stock boolean not null default true,
  image_url text not null default ''
);

alter table public.products enable row level security;

-- Ensure the database roles can reach the table before RLS policies are applied.
grant usage on schema public to anon, authenticated;
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;

drop policy if exists "Anyone can view in-stock products" on public.products;
create policy "Anyone can view in-stock products" on public.products
  for select using (in_stock = true or auth.role() = 'authenticated');

drop policy if exists "Authenticated users manage products" on public.products;
create policy "Authenticated users manage products" on public.products
  for all to authenticated using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

grant select on storage.objects to anon;
grant select, insert, update, delete on storage.objects to authenticated;

drop policy if exists "Anyone can view product images" on storage.objects;
create policy "Anyone can view product images" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "Authenticated users manage product images" on storage.objects;
create policy "Authenticated users manage product images" on storage.objects
  for all to authenticated using (bucket_id = 'product-images') with check (bucket_id = 'product-images');
