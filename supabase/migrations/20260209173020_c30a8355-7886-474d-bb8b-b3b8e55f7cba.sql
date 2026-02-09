-- Allow anyone to read profile names (needed for review display)
CREATE POLICY "Anyone can view profile names"
ON public.profiles
FOR SELECT
USING (true);
