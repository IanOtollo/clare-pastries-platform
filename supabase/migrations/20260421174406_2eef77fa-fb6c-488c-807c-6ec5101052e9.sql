
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin new.updated_at = now(); return new; end $$;

drop policy "Anyone can place an order" on public.orders;
create policy "Public can place a valid order"
  on public.orders for insert
  with check (
    length(trim(customer_name)) between 1 and 120
    and length(trim(customer_phone)) between 7 and 20
    and total_kes >= 0
    and subtotal_kes >= 0
  );

drop policy "Anyone can add items to a new order" on public.order_items;
create policy "Public can add valid order items"
  on public.order_items for insert
  with check (
    quantity > 0
    and unit_price_kes >= 0
    and length(trim(product_name)) between 1 and 200
  );
