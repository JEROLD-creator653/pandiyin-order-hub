-- ===== EMAIL EXISTENCE CHECK FUNCTION =====
-- Function to check if an email already exists in Supabase Auth
-- This enables better UX by detecting existing accounts before signup

CREATE OR REPLACE FUNCTION public.check_email_exists(_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Needs DEFINER to access auth schema
SET search_path = public, auth
AS $$
BEGIN
  -- Check if email exists in auth.users table
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE email = LOWER(TRIM(_email))
  );
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_email_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_exists TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.check_email_exists IS 'Checks if an email address is already registered. Used during signup to provide better UX by detecting existing accounts.';
