ALTER TABLE public.store_settings 
  ADD COLUMN IF NOT EXISTS bestsellers_label text NOT NULL DEFAULT 'Bestsellers',
  ADD COLUMN IF NOT EXISTS bestsellers_sort_order integer NOT NULL DEFAULT -1,
  ADD COLUMN IF NOT EXISTS bestsellers_enabled boolean NOT NULL DEFAULT true;

-- Update the public_store_settings view to expose these new columns
DROP VIEW IF EXISTS public.public_store_settings;
CREATE VIEW public.public_store_settings AS
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