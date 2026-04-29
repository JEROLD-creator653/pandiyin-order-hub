-- Allow storing Razorpay as payment gateway in orders
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'razorpay';
