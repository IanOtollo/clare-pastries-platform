
-- Tighten order INSERT: require positive total
DROP POLICY IF EXISTS "Public can place a valid order" ON public.orders;
CREATE POLICY "Public can place a valid order"
ON public.orders
FOR INSERT
TO public
WITH CHECK (
  length(trim(customer_name)) BETWEEN 1 AND 120
  AND length(trim(customer_phone)) BETWEEN 7 AND 20
  AND total_kes > 0
  AND subtotal_kes > 0
);

-- Tighten order_items INSERT: positive prices/qty + order must exist, be pending, unpaid, and recent (10 min window)
DROP POLICY IF EXISTS "Public can add valid order items" ON public.order_items;
CREATE POLICY "Public can add valid order items"
ON public.order_items
FOR INSERT
TO public
WITH CHECK (
  quantity > 0
  AND unit_price_kes > 0
  AND length(trim(product_name)) BETWEEN 1 AND 200
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.status = 'pending'
      AND o.payment_status = 'unpaid'
      AND o.created_at > now() - interval '10 minutes'
  )
);
