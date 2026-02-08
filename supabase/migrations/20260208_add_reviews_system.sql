-- Add Product Reviews and Ratings System
-- This migration creates tables for product reviews, ratings, and helpful votes

-- 1. Product Reviews Table
CREATE TABLE public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  review_text TEXT NOT NULL,
  helpful_count INT NOT NULL DEFAULT 0,
  verified_purchase BOOLEAN NOT NULL DEFAULT false,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 2. Review Helpful Votes Table
CREATE TABLE public.review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES public.product_reviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX idx_product_reviews_rating ON public.product_reviews(rating);
CREATE INDEX idx_product_reviews_created_at ON public.product_reviews(created_at DESC);
CREATE INDEX idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX idx_review_votes_user_id ON public.review_votes(user_id);

-- RLS Policies for product_reviews

-- Anyone can view reviews
CREATE POLICY "Anyone can view product reviews" 
  ON public.product_reviews FOR SELECT 
  USING (true);

-- Authenticated users can create reviews for products they purchased
CREATE POLICY "Users can create reviews" 
  ON public.product_reviews FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" 
  ON public.product_reviews FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" 
  ON public.product_reviews FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews" 
  ON public.product_reviews FOR ALL 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for review_votes

-- Anyone can view votes
CREATE POLICY "Anyone can view review votes" 
  ON public.review_votes FOR SELECT 
  USING (true);

-- Authenticated users can vote
CREATE POLICY "Users can vote on reviews" 
  ON public.review_votes FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update own votes" 
  ON public.review_votes FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes" 
  ON public.review_votes FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Function to update helpful_count on review_votes changes
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_helpful = true THEN
    UPDATE public.product_reviews 
    SET helpful_count = helpful_count + 1 
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' AND OLD.is_helpful = true THEN
    UPDATE public.product_reviews 
    SET helpful_count = helpful_count - 1 
    WHERE id = OLD.review_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_helpful = true AND NEW.is_helpful = false THEN
      UPDATE public.product_reviews 
      SET helpful_count = helpful_count - 1 
      WHERE id = NEW.review_id;
    ELSIF OLD.is_helpful = false AND NEW.is_helpful = true THEN
      UPDATE public.product_reviews 
      SET helpful_count = helpful_count + 1 
      WHERE id = NEW.review_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for helpful_count updates
CREATE TRIGGER update_review_helpful_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.review_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();

-- Function to set verified_purchase flag
CREATE OR REPLACE FUNCTION set_verified_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user has completed order for this product
  IF EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    WHERE o.user_id = NEW.user_id 
      AND oi.product_id = NEW.product_id
      AND o.status = 'delivered'
  ) THEN
    NEW.verified_purchase := true;
  ELSE
    NEW.verified_purchase := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for verified_purchase
CREATE TRIGGER set_verified_purchase_trigger
  BEFORE INSERT ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION set_verified_purchase();

-- Trigger for updated_at
CREATE TRIGGER update_product_reviews_updated_at 
  BEFORE UPDATE ON public.product_reviews 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add average rating and review count columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;

-- Function to update product rating stats
CREATE OR REPLACE FUNCTION update_product_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  product_uuid UUID;
BEGIN
  -- Get the product_id from the review
  IF TG_OP = 'DELETE' THEN
    product_uuid := OLD.product_id;
  ELSE
    product_uuid := NEW.product_id;
  END IF;

  -- Update product's average rating and review count
  UPDATE public.products
  SET 
    average_rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM public.product_reviews
      WHERE product_id = product_uuid
    ), 0),
    review_count = COALESCE((
      SELECT COUNT(*)
      FROM public.product_reviews
      WHERE product_id = product_uuid
    ), 0),
    updated_at = now()
  WHERE id = product_uuid;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update product stats on review changes
CREATE TRIGGER update_product_rating_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating_stats();

-- Create view for review statistics by rating
CREATE OR REPLACE VIEW public.product_review_stats AS
SELECT 
  product_id,
  COUNT(*) as total_reviews,
  ROUND(AVG(rating)::numeric, 2) as average_rating,
  COUNT(*) FILTER (WHERE rating = 5) as five_star,
  COUNT(*) FILTER (WHERE rating = 4) as four_star,
  COUNT(*) FILTER (WHERE rating = 3) as three_star,
  COUNT(*) FILTER (WHERE rating = 2) as two_star,
  COUNT(*) FILTER (WHERE rating = 1) as one_star,
  COUNT(*) FILTER (WHERE verified_purchase = true) as verified_purchases
FROM public.product_reviews
GROUP BY product_id;
