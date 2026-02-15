-- ===== SECURITY FIXES FOR SUPABASE =====
-- 1. Remove SECURITY DEFINER from has_role function
-- 2. Add coupon redemptions tracking and validation
-- 3. Fix profiles table privacy (remove public read)
-- 4. Add server-side coupon validation

-- ===== 1. FIX SECURITY DEFINER FUNCTION =====
-- Replace has_role function without SECURITY DEFINER (preserves dependencies)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ===== 2. COUPON REDEMPTIONS TABLE =====
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, user_id, order_id)
);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS for coupon_redemptions (drop existing first to make migration idempotent)
DROP POLICY IF EXISTS "Users can view own redemptions" ON public.coupon_redemptions;
CREATE POLICY "Users can view own redemptions" 
  ON public.coupon_redemptions FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all redemptions" ON public.coupon_redemptions;
CREATE POLICY "Admins can view all redemptions" 
  ON public.coupon_redemptions FOR SELECT 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "System can insert redemptions" ON public.coupon_redemptions;
CREATE POLICY "System can insert redemptions" 
  ON public.coupon_redemptions FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage redemptions" ON public.coupon_redemptions;
CREATE POLICY "Admins can manage redemptions" 
  ON public.coupon_redemptions FOR ALL 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user_id ON public.coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_id ON public.coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_order_id ON public.coupon_redemptions(order_id);

-- ===== 3. ADD COUPON FIELDS IF NOT EXISTS =====
-- Add expiry date, usage limits, and per-user limits to coupons table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'valid_from') THEN
    ALTER TABLE public.coupons ADD COLUMN valid_from TIMESTAMPTZ DEFAULT now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'valid_until') THEN
    ALTER TABLE public.coupons ADD COLUMN valid_until TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'max_uses') THEN
    ALTER TABLE public.coupons ADD COLUMN max_uses INT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'max_uses_per_user') THEN
    ALTER TABLE public.coupons ADD COLUMN max_uses_per_user INT DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'current_uses') THEN
    ALTER TABLE public.coupons ADD COLUMN current_uses INT DEFAULT 0;
  END IF;
END $$;

-- ===== 4. SERVER-SIDE COUPON VALIDATION FUNCTION =====
CREATE OR REPLACE FUNCTION public.validate_coupon(
  _coupon_code TEXT,
  _user_id UUID,
  _order_total NUMERIC
)
RETURNS TABLE(
  is_valid BOOLEAN,
  error_message TEXT,
  discount_value NUMERIC,
  discount_type TEXT,
  coupon_id UUID
) 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
  v_user_redemptions INT;
  v_total_redemptions INT;
BEGIN
  -- Get coupon details
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE code = UPPER(_coupon_code)
  LIMIT 1;

  -- Check if coupon exists
  IF v_coupon IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid coupon code'::TEXT, 0::NUMERIC, ''::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if coupon is active
  IF NOT v_coupon.is_active THEN
    RETURN QUERY SELECT false, 'This coupon is no longer active'::TEXT, 0::NUMERIC, ''::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check valid_from date
  IF v_coupon.valid_from IS NOT NULL AND v_coupon.valid_from > now() THEN
    RETURN QUERY SELECT false, 'This coupon is not yet valid'::TEXT, 0::NUMERIC, ''::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check expiry date
  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < now() THEN
    RETURN QUERY SELECT false, 'This coupon has expired'::TEXT, 0::NUMERIC, ''::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check minimum order value
  IF v_coupon.min_order_value IS NOT NULL AND _order_total < v_coupon.min_order_value THEN
    RETURN QUERY SELECT false, 
      format('Minimum order amount is %s', v_coupon.min_order_value)::TEXT, 
      0::NUMERIC, ''::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check total usage limit
  IF v_coupon.max_uses IS NOT NULL THEN
    SELECT COALESCE(v_coupon.current_uses, 0) INTO v_total_redemptions;
    IF v_total_redemptions >= v_coupon.max_uses THEN
      RETURN QUERY SELECT false, 'This coupon has reached its usage limit'::TEXT, 0::NUMERIC, ''::TEXT, NULL::UUID;
      RETURN;
    END IF;
  END IF;

  -- Check per-user usage limit
  IF v_coupon.max_uses_per_user IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_redemptions
    FROM public.coupon_redemptions cr
    WHERE cr.coupon_id = v_coupon.id AND cr.user_id = _user_id;
    
    IF v_user_redemptions >= v_coupon.max_uses_per_user THEN
      RETURN QUERY SELECT false, 'You have already used this coupon'::TEXT, 0::NUMERIC, ''::TEXT, NULL::UUID;
      RETURN;
    END IF;
  END IF;

  -- All validations passed
  RETURN QUERY SELECT 
    true, 
    'Coupon is valid'::TEXT, 
    v_coupon.discount_value::NUMERIC,
    v_coupon.discount_type::TEXT,
    v_coupon.id;
END;
$$;

-- ===== 5. FUNCTION TO REDEEM COUPON =====
CREATE OR REPLACE FUNCTION public.redeem_coupon(
  _coupon_code TEXT,
  _user_id UUID,
  _order_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_coupon_id UUID;
BEGIN
  -- Get coupon ID
  SELECT id INTO v_coupon_id
  FROM public.coupons
  WHERE code = UPPER(_coupon_code) AND is_active = true
  LIMIT 1;

  IF v_coupon_id IS NULL THEN
    RETURN false;
  END IF;

  -- Insert redemption record
  INSERT INTO public.coupon_redemptions (coupon_id, user_id, order_id)
  VALUES (v_coupon_id, _user_id, _order_id)
  ON CONFLICT (coupon_id, user_id, order_id) DO NOTHING;

  -- Increment usage counter
  UPDATE public.coupons
  SET current_uses = COALESCE(current_uses, 0) + 1
  WHERE id = v_coupon_id;

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- ===== 6. FIX PROFILES TABLE PRIVACY =====
-- Drop existing public read policies
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Ensure only proper policies exist
-- Users can only view their own profile
-- Admins can view all profiles

-- The existing policies are correct:
-- "Users can view own profile" - already exists
-- "Admins can view all profiles" - already exists
-- No public access policy needed

-- ===== 7. FIX COUPONS TABLE PRIVACY =====
-- Remove public read for inactive or expired coupons
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can view valid coupons" ON public.coupons;

-- Create more restrictive coupon policy
CREATE POLICY "Authenticated users can view valid coupons" 
  ON public.coupons FOR SELECT 
  TO authenticated
  USING (
    is_active = true 
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until >= now())
    AND (max_uses IS NULL OR COALESCE(current_uses, 0) < max_uses)
  );

-- ===== 8. ADD CHECK CONSTRAINTS =====
ALTER TABLE public.coupons 
  DROP CONSTRAINT IF EXISTS check_valid_dates,
  ADD CONSTRAINT check_valid_dates 
    CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from);

ALTER TABLE public.coupons
  DROP CONSTRAINT IF EXISTS check_max_uses_positive,
  ADD CONSTRAINT check_max_uses_positive 
    CHECK (max_uses IS NULL OR max_uses > 0);

ALTER TABLE public.coupons
  DROP CONSTRAINT IF EXISTS check_max_uses_per_user_positive,
  ADD CONSTRAINT check_max_uses_per_user_positive 
    CHECK (max_uses_per_user IS NULL OR max_uses_per_user > 0);

-- ===== 9. UPDATE TRIGGER FOR COUPON USAGE =====
CREATE OR REPLACE FUNCTION public.check_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent current_uses from exceeding max_uses
  IF NEW.max_uses IS NOT NULL AND NEW.current_uses > NEW.max_uses THEN
    RAISE EXCEPTION 'Coupon usage limit exceeded';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_coupon_usage ON public.coupons;
CREATE TRIGGER trigger_check_coupon_usage
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.check_coupon_usage();

-- ===== 10. FIX handle_new_user TRIGGER =====
-- This function MUST use SECURITY DEFINER because it runs during user creation
-- when auth.uid() doesn't exist yet. It's safe because it only inserts initial data.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== GRANT NECESSARY PERMISSIONS =====
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.coupon_redemptions TO authenticated;
GRANT INSERT ON public.coupon_redemptions TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon TO authenticated;
