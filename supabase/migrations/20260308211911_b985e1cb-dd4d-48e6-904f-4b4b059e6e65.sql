
-- Fix: Replace security_barrier view with regular view (no SECURITY DEFINER issue)
DROP VIEW IF EXISTS public.public_banners;
CREATE OR REPLACE VIEW public.public_banners AS
SELECT id, title, subtitle, image_url, link_url, sort_order, is_active, created_at
FROM public.banners
WHERE is_active = true;
