-- Add new columns to addresses table for improved form support
-- area: Area/Village name from pincode API
-- district: District information from pincode API

ALTER TABLE addresses ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS district TEXT;

-- Add comment to explain phone field normalization
-- Phone field now stores digits only (no country code)
-- Country code is handled separately in the form logic
