-- Simplify product reviews schema to rating + description only

BEGIN;

-- Drop view first to allow column changes
DROP VIEW IF EXISTS public.product_review_stats;

-- Drop review votes table (no helpful voting in simplified schema)
DROP TABLE IF EXISTS public.review_votes;

-- Remove functions that may have been created
DROP FUNCTION IF EXISTS update_review_helpful_count();
DROP FUNCTION IF EXISTS set_verified_purchase();

-- Remove triggers on product_reviews table
DROP TRIGGER IF EXISTS set_verified_purchase_trigger ON public.product_reviews;
DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON public.product_reviews;

-- Rename review_text column to description (only if review_text exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'product_reviews' 
    AND column_name = 'review_text'
  ) THEN
    ALTER TABLE public.product_reviews RENAME COLUMN review_text TO description;
  END IF;
END $$;

-- Drop unused columns
ALTER TABLE public.product_reviews
  DROP COLUMN IF EXISTS title,
  DROP COLUMN IF EXISTS images,
  DROP COLUMN IF EXISTS helpful_count,
  DROP COLUMN IF EXISTS verified_purchase,
  DROP COLUMN IF EXISTS order_id,
  DROP COLUMN IF EXISTS updated_at;

-- Enforce minimum description length (only if description column exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'product_reviews' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.product_reviews
      DROP CONSTRAINT IF EXISTS product_reviews_description_length_check;
    ALTER TABLE public.product_reviews
      ADD CONSTRAINT product_reviews_description_length_check CHECK (char_length(description) >= 20);
  END IF;
END $$;

-- Recreate stats view without verified_purchases
CREATE OR REPLACE VIEW public.product_review_stats AS
SELECT 
  product_id,
  COUNT(*) as total_reviews,
  ROUND(AVG(rating)::numeric, 2) as average_rating,
  COUNT(*) FILTER (WHERE rating = 5) as five_star,
  COUNT(*) FILTER (WHERE rating = 4) as four_star,
  COUNT(*) FILTER (WHERE rating = 3) as three_star,
  COUNT(*) FILTER (WHERE rating = 2) as two_star,
  COUNT(*) FILTER (WHERE rating = 1) as one_star
FROM public.product_reviews
GROUP BY product_id;

-- Grant permissions on tables and view
GRANT SELECT ON public.product_reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;
GRANT SELECT ON public.product_review_stats TO anon, authenticated;

COMMIT;
