-- Fix 1: Create a public view for store_settings that hides sensitive data
CREATE OR REPLACE VIEW public.public_store_settings AS
SELECT store_name, gst_enabled, gst_inclusive, gst_percentage
FROM public.store_settings;

ALTER VIEW public.public_store_settings SET (security_invoker = true);

-- Fix 2: Create a public view for gst_settings that hides invoice_counter and business details
CREATE OR REPLACE VIEW public.public_gst_settings AS
SELECT gst_enabled, supported_gst_rates, state
FROM public.gst_settings;

ALTER VIEW public.public_gst_settings SET (security_invoker = true);

-- Fix 3: Remove the public SELECT policy from banners table
-- (public access should go through public_banners view)
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banners;