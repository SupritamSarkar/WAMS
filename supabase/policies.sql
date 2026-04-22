alter table public.users enable row level security;
alter table public.dealers enable row level security;
alter table public.suppliers enable row level security;
alter table public.parts enable row level security;
alter table public.products enable row level security;
alter table public.product_parts enable row level security;
alter table public.quotations enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.dealer_requests enable row level security;
alter table public.billing enable row level security;
alter table public.transactions enable row level security;
alter table public.stock_adjustments enable row level security;

create policy "authenticated_read_all_users"
on public.users for select
to authenticated
using (true);

create policy "authenticated_crud_dealers"
on public.dealers for all
to authenticated
using (true)
with check (true);

create policy "authenticated_crud_suppliers"
on public.suppliers for all
to authenticated
using (true)
with check (true);

create policy "authenticated_crud_parts"
on public.parts for all
to authenticated
using (true)
with check (true);

create policy "authenticated_crud_products"
on public.products for all
to authenticated
using (true)
with check (true);

create policy "authenticated_crud_product_parts"
on public.product_parts for all
to authenticated
using (true)
with check (true);

create policy "authenticated_crud_quotations"
on public.quotations for all
to authenticated
using (true)
with check (true);

create policy "authenticated_crud_purchase_orders"
on public.purchase_orders for all
to authenticated
using (true)
with check (true);

create policy "authenticated_crud_dealer_requests"
on public.dealer_requests for all
to authenticated
using (true)
with check (true);

create policy "authenticated_crud_billing"
on public.billing for all
to authenticated
using (true)
with check (true);

create policy "authenticated_crud_transactions"
on public.transactions for all
to authenticated
using (true)
with check (true);

create policy "authenticated_crud_stock_adjustments"
on public.stock_adjustments for all
to authenticated
using (true)
with check (true);
