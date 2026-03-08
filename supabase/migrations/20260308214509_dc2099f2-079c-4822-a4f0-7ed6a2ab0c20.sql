
-- The public_banners view uses security_invoker=true, which means it checks
-- RLS on the underlying banners table. We dropped the public SELECT policy,
-- so anonymous users get zero rows. Fix: use security_definer instead so the
-- view bypasses RLS (it already filters to is_active=true).

ALTER VIEW public.public_banners SET (security_invoker = false);
ALTER VIEW public.public_store_settings SET (security_invoker = false);
ALTER VIEW public.public_gst_settings SET (security_invoker = false);

-- Grant SELECT on views to anon and authenticated roles
GRANT SELECT ON public.public_banners TO anon, authenticated;
GRANT SELECT ON public.public_store_settings TO anon, authenticated;
GRANT SELECT ON public.public_gst_settings TO anon, authenticated;
