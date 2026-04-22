
create type fulfillment_type as enum ('delivery','pickup');
create type order_status as enum ('pending','confirmed','baking','ready','out_for_delivery','delivered','collected','cancelled');
create type payment_status as enum ('unpaid','paid','refunded');
create type payment_method as enum ('mpesa','card','cash');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  short_description text not null default '',
  description text not null default '',
  ingredients text[] not null default '{}',
  allergens text[] not null default '{}',
  price_kes integer not null check (price_kes >= 0),
  image_url text,
  featured boolean not null default false,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.products (category);
create index on public.products (featured) where featured = true;

alter table public.products enable row level security;

create policy "Anyone can view available products"
  on public.products for select
  using (available = true);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  fulfillment fulfillment_type not null,
  address_street text,
  address_landmark text,
  address_house text,
  address_town text,
  delivery_phone text,
  delivery_notes text,
  order_notes text,
  subtotal_kes integer not null,
  delivery_fee_kes integer not null default 0,
  total_kes integer not null,
  status order_status not null default 'pending',
  payment_status payment_status not null default 'unpaid',
  payment_method payment_method,
  payment_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.orders (created_at desc);
create index on public.orders (status);

alter table public.orders enable row level security;

create policy "Anyone can place an order"
  on public.orders for insert
  with check (true);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  unit_price_kes integer not null,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index on public.order_items (order_id);

alter table public.order_items enable row level security;

create policy "Anyone can add items to a new order"
  on public.order_items for insert
  with check (true);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
