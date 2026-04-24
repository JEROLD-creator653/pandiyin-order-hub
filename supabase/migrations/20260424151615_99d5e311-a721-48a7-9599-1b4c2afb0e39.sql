-- Add images array column to product_reviews
ALTER TABLE public.product_reviews 
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}'::text[];

-- Update the public_product_reviews view to include images
DROP VIEW IF EXISTS public.public_product_reviews CASCADE;
CREATE VIEW public.public_product_reviews AS
SELECT 
  id,
  product_id,
  rating,
  description,
  user_name,
  created_at,
  images
FROM public.product_reviews;

GRANT SELECT ON public.public_product_reviews TO anon, authenticated;

-- Create review-images storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for review-images bucket
-- Public can view all review images
CREATE POLICY "Anyone can view review images"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-images');

-- Authenticated users can upload to their own folder (userId/...)
CREATE POLICY "Authenticated users can upload review images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own review images
CREATE POLICY "Users can delete their own review images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'review-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can manage all review images
CREATE POLICY "Admins can manage all review images"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'review-images'
  AND public.has_role(auth.uid(), 'admin')
);