
-- Fix security definer view warning on public_banners
ALTER VIEW public.public_banners SET (security_invoker = true);
