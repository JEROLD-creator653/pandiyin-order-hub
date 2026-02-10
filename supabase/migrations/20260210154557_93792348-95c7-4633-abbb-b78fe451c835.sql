
-- Shipping regions table for multi-region delivery
CREATE TABLE public.shipping_regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region_name TEXT NOT NULL,
  region_key TEXT NOT NULL UNIQUE,
  states TEXT[] NOT NULL DEFAULT '{}',
  base_charge NUMERIC NOT NULL DEFAULT 0,
  free_delivery_above NUMERIC,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shipping regions" ON public.shipping_regions FOR SELECT USING (true);
CREATE POLICY "Admins can manage shipping regions" ON public.shipping_regions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default regions
INSERT INTO public.shipping_regions (region_name, region_key, states, base_charge, free_delivery_above, is_enabled, sort_order) VALUES
('Within Tamil Nadu & Pondicherry', 'local', ARRAY['Tamil Nadu','Pondicherry','Puducherry'], 40, 500, true, 0),
('Other Indian States', 'rest_of_india', ARRAY[]::text[], 80, NULL, true, 1),
('International Delivery', 'international', ARRAY[]::text[], 0, NULL, false, 2);

-- Add GST columns to store_settings
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS gst_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gst_number TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS gst_percentage NUMERIC NOT NULL DEFAULT 18,
  ADD COLUMN IF NOT EXISTS gst_inclusive BOOLEAN NOT NULL DEFAULT true;
