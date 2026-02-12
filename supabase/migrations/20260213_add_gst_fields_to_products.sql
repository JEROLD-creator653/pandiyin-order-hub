-- Add GST fields to products table for per-product tax management

DO $$ 
BEGIN
  -- Add gst_percentage column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'gst_percentage') THEN
    ALTER TABLE public.products ADD COLUMN gst_percentage NUMERIC(5,2) DEFAULT 5;
  END IF;

  -- Add hsn_code column (Harmonized System of Nomenclature code for GST)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'hsn_code') THEN
    ALTER TABLE public.products ADD COLUMN hsn_code TEXT DEFAULT '';
  END IF;

  -- Add tax_inclusive column (whether product price includes GST or not)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'tax_inclusive') THEN
    ALTER TABLE public.products ADD COLUMN tax_inclusive BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add comment explaining the columns
COMMENT ON COLUMN public.products.gst_percentage IS 'GST percentage rate for this product (e.g., 5, 12, 18, 28)';
COMMENT ON COLUMN public.products.hsn_code IS 'HSN/SAC code for GST classification';
COMMENT ON COLUMN public.products.tax_inclusive IS 'Whether the product price already includes GST (true) or GST will be added on top (false)';
