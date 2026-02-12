-- ============================================================
-- FIX GST_TYPE CONSTRAINT - Run this in Supabase Dashboard
-- ============================================================

-- Drop the problematic constraint if it exists
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_gst_type_check CASCADE;

-- Remove the gst_type column and re-add it without constraint issues
ALTER TABLE public.orders 
DROP COLUMN IF EXISTS gst_type CASCADE;

-- Re-add gst_type column with default value and NO constraint
ALTER TABLE public.orders
ADD COLUMN gst_type TEXT DEFAULT 'cgst_sgst';

-- Verify the fix
SELECT column_name, column_default, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'gst_type';
