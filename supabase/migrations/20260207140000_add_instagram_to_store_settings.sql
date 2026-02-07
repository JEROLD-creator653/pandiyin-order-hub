-- Add instagram column to store_settings table
ALTER TABLE public.store_settings ADD COLUMN instagram TEXT DEFAULT '';

-- Update the default store settings with the new Instagram URL
UPDATE public.store_settings 
SET 
  phone = '+91 63837 09933',
  email = 'pandiyinnatureinpack@gmail.com',
  instagram = 'https://www.instagram.com/pandiyin_nature_in_pack?igsh=MXI2b2hwdHdlYnVwZg=='
WHERE store_name = 'PANDIYIN Nature In Pack';
