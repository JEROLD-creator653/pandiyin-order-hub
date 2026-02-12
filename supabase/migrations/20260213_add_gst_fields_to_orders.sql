-- Add GST fields to orders table for tax tracking

-- Create ENUM type for GST type if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gst_type_enum') THEN
    CREATE TYPE public.gst_type_enum AS ENUM ('cgst_sgst', 'igst');
  END IF;
END
$$;

-- Add GST-related columns to orders table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'gst_amount') THEN
    ALTER TABLE public.orders ADD COLUMN gst_amount NUMERIC(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'gst_percentage') THEN
    ALTER TABLE public.orders ADD COLUMN gst_percentage NUMERIC(5,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'gst_type') THEN
    ALTER TABLE public.orders ADD COLUMN gst_type TEXT DEFAULT 'cgst_sgst' CHECK (gst_type IN ('cgst_sgst', 'igst'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'cgst_amount') THEN
    ALTER TABLE public.orders ADD COLUMN cgst_amount NUMERIC(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'sgst_amount') THEN
    ALTER TABLE public.orders ADD COLUMN sgst_amount NUMERIC(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'igst_amount') THEN
    ALTER TABLE public.orders ADD COLUMN igst_amount NUMERIC(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_state') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_state TEXT DEFAULT '';
  END IF;
END
$$;

-- Add GST-related columns to order_items table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'gst_percentage') THEN
    ALTER TABLE public.order_items ADD COLUMN gst_percentage NUMERIC(5,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'hsn_code') THEN
    ALTER TABLE public.order_items ADD COLUMN hsn_code TEXT DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'gst_amount') THEN
    ALTER TABLE public.order_items ADD COLUMN gst_amount NUMERIC(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'tax_inclusive') THEN
    ALTER TABLE public.order_items ADD COLUMN tax_inclusive BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_base_price') THEN
    ALTER TABLE public.order_items ADD COLUMN product_base_price NUMERIC(10,2) DEFAULT 0;
  END IF;
END
$$;
