create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  password text not null,
  name text not null,
  role text not null check (role in ('administrator', 'inventory_manager', 'supplier', 'dealer', 'management')),
  created_at timestamptz not null default now()
);

create table if not exists public.dealers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  company_name text,
  email text unique,
  phone text,
  address text,
  credit_limit numeric default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_person text,
  email text unique,
  phone text,
  address text,
  category text,
  rating numeric default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.parts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  part_number text unique,
  description text,
  quantity integer not null default 0,
  min_quantity integer not null default 0,
  unit_price numeric not null default 0,
  supplier_id uuid references public.suppliers(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sku text unique,
  description text,
  quantity integer not null default 0,
  min_quantity integer not null default 0,
  unit_price numeric not null default 0,
  unit text default 'pcs',
  created_at timestamptz not null default now()
);

create table if not exists public.product_parts (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  part_id uuid not null references public.parts(id) on delete cascade,
  quantity_per_product integer not null default 1
);

create table if not exists public.quotations (
  id uuid primary key default uuid_generate_v4(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  part_id uuid not null references public.parts(id) on delete cascade,
  quantity integer not null default 0,
  price numeric not null default 0,
  delivery_date date,
  valid_until date,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_orders (
  id uuid primary key default uuid_generate_v4(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  part_id uuid not null references public.parts(id) on delete cascade,
  quantity integer not null,
  quoted_price numeric not null default 0,
  expected_delivery date,
  status text not null default 'confirmed',
  created_at timestamptz not null default now()
);

create table if not exists public.dealer_requests (
  id uuid primary key default uuid_generate_v4(),
  dealer_id uuid not null references public.dealers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1,
  status text not null default 'pending' check (status in ('pending', 'approved', 'waiting_for_production', 'fulfilled')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.billing (
  id uuid primary key default uuid_generate_v4(),
  dealer_id uuid not null references public.dealers(id) on delete cascade,
  invoice_number text not null unique,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric not null default 0,
  status text not null default 'generated' check (status in ('generated', 'paid', 'overdue', 'cancelled')),
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete set null,
  dealer_id uuid references public.dealers(id) on delete set null,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  total_amount numeric not null default 0,
  status text not null default 'completed',
  transaction_type text not null default 'supply',
  created_at timestamptz not null default now()
);

create table if not exists public.stock_adjustments (
  id uuid primary key default uuid_generate_v4(),
  item_type text not null check (item_type in ('part', 'product')),
  item_id uuid not null,
  quantity_change integer not null,
  reason text not null default 'manual_adjustment',
  created_at timestamptz not null default now()
);
