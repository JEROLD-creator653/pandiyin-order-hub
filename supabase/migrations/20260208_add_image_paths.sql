-- Add image_path columns to banners and products tables
-- This allows tracking the exact storage location for deletion

ALTER TABLE public.banners ADD COLUMN image_path TEXT DEFAULT '';
ALTER TABLE public.banners ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.products ADD COLUMN image_path TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_banners_user_id ON public.banners(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_banners_image_path ON public.banners(image_path);
CREATE INDEX IF NOT EXISTS idx_products_image_path ON public.products(image_path);
