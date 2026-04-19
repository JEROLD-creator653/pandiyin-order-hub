DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'store_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;
  END IF;
END $$;

-- Recreate the view with security_invoker
DROP VIEW IF EXISTS public.public_store_settings;
CREATE VIEW public.public_store_settings 
WITH (security_invoker = on) AS
SELECT 
  store_name,
  gst_enabled,
  gst_inclusive,
  gst_percentage,
  bestsellers_label,
  bestsellers_sort_order,
  bestsellers_enabled
FROM public.store_settings;

GRANT SELECT ON public.public_store_settings TO anon, authenticated;