CREATE POLICY "Users can update own pending orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND payment_status = 'pending')
WITH CHECK (auth.uid() = user_id);