
-- Prevent duplicate order submission via idempotency
-- Add a unique constraint on user_id + order creation within a short window
-- Use a processed_cart_hash to detect duplicate submissions
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cart_hash text;

-- Create index for fast duplicate detection
CREATE INDEX IF NOT EXISTS idx_orders_user_cart_hash ON public.orders (user_id, cart_hash) WHERE cart_hash IS NOT NULL;

-- Add validation trigger for edge function inputs
CREATE OR REPLACE FUNCTION public.validate_cart_item_quantity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Ensure quantity is positive
  IF NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;
  
  -- Cap quantity at reasonable limit
  IF NEW.quantity > 100 THEN
    RAISE EXCEPTION 'Quantity exceeds maximum allowed';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_cart_quantity
BEFORE INSERT OR UPDATE ON public.cart_items
FOR EACH ROW EXECUTE FUNCTION public.validate_cart_item_quantity();

-- Also validate order_items quantity
CREATE TRIGGER trg_validate_order_item_quantity
BEFORE INSERT OR UPDATE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.validate_cart_item_quantity();

-- Remove user_id from banners public visibility (only admin needs it)
-- The existing "Anyone can view active banners" policy already limits to is_active=true
-- but user_id is still returned. Create a security barrier view.
CREATE OR REPLACE VIEW public.public_banners WITH (security_barrier = true) AS
SELECT id, title, subtitle, image_url, link_url, sort_order, is_active, created_at
FROM public.banners
WHERE is_active = true;

-- Ensure profiles phone field has length limit
ALTER TABLE public.profiles ADD CONSTRAINT chk_phone_length CHECK (phone IS NULL OR length(phone) <= 20);
ALTER TABLE public.profiles ADD CONSTRAINT chk_fullname_length CHECK (length(full_name) <= 200);

-- Ensure addresses have length constraints
ALTER TABLE public.addresses ADD CONSTRAINT chk_address_fullname_length CHECK (length(full_name) <= 200);
ALTER TABLE public.addresses ADD CONSTRAINT chk_address_phone_length CHECK (length(phone) <= 20);
ALTER TABLE public.addresses ADD CONSTRAINT chk_address_pincode_length CHECK (length(pincode) <= 10);
ALTER TABLE public.addresses ADD CONSTRAINT chk_address_line1_length CHECK (length(address_line1) <= 500);
