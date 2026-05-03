UPDATE public.orders
SET payment_status = 'paid', updated_at = now()
WHERE order_number = 'PNP-20260503-fab643'
  AND payment_status = 'pending';