-- Add user_name column to product_reviews table to store reviewer's name

BEGIN;

-- Add user_name column if it doesn't exist
ALTER TABLE public.product_reviews
  ADD COLUMN IF NOT EXISTS user_name VARCHAR(255) DEFAULT 'Anonymous';

-- Add index for potential future queries
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_name ON public.product_reviews(user_name);

COMMIT;
