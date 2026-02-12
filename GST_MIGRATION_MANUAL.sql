-- ============================================================
-- MANUAL GST FIELDS MIGRATION - Run this in Supabase Dashboard
-- ============================================================
-- 
-- Instructions:
-- 1. Go to your Supabase Dashboard (supabase.com)
-- 2. Go to SQL Editor (left sidebar)
-- 3. Click "New Query"
-- 4. Copy-paste ALL the code below
-- 5. Click "Run"
--
-- ============================================================

-- Add GST-related columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS gst_percentage NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS igst_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_state TEXT DEFAULT '';

-- Add gst_type column with CHECK constraint
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS gst_type TEXT DEFAULT 'cgst_sgst' 
CHECK (gst_type IN ('cgst_sgst', 'igst'));

-- Add GST-related columns to order_items table  
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS gst_percentage NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS hsn_code TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS product_base_price NUMERIC(10,2) DEFAULT 0;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('gst_amount', 'gst_percentage', 'gst_type', 'cgst_amount', 'sgst_amount', 'igst_amount', 'delivery_state')
ORDER BY column_name;
