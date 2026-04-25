-- 1) Add columns to products (all nullable / with defaults for backward compatibility)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_combo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS combo_badge text DEFAULT '',
  ADD COLUMN IF NOT EXISTS unit_type text,
  ADD COLUMN IF NOT EXISTS quantity_count integer,
  ADD COLUMN IF NOT EXISTS per_unit_weight numeric,
  ADD COLUMN IF NOT EXISTS per_unit_weight_unit text DEFAULT 'g',
  ADD COLUMN IF NOT EXISTS calculated_shipping_weight numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS short_description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS seo_title text DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_description text DEFAULT '';

-- 2) Constrain unit_type to known values (allow NULL for legacy rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_unit_type_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_unit_type_check
      CHECK (unit_type IS NULL OR unit_type IN ('g','kg','pcs','pack','bottle','jar','box','combo','ml','l'));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_per_unit_weight_unit_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_per_unit_weight_unit_check
      CHECK (per_unit_weight_unit IS NULL OR per_unit_weight_unit IN ('g','kg'));
  END IF;
END$$;

-- 3) Backfill unit_type from existing unit field (case-insensitive)
UPDATE public.products
SET unit_type = CASE
  WHEN unit_type IS NOT NULL AND unit_type <> '' THEN unit_type
  WHEN lower(coalesce(unit, '')) IN ('g','gram','grams') THEN 'g'
  WHEN lower(coalesce(unit, '')) IN ('kg','kilogram','kilograms') THEN 'kg'
  WHEN lower(coalesce(unit, '')) IN ('ml','millilitre','milliliter') THEN 'ml'
  WHEN lower(coalesce(unit, '')) IN ('l','litre','liter') THEN 'l'
  WHEN lower(coalesce(unit, '')) IN ('pcs','piece','pieces','pc') THEN 'pcs'
  WHEN lower(coalesce(unit, '')) = 'pack' THEN 'pack'
  WHEN lower(coalesce(unit, '')) = 'bottle' THEN 'bottle'
  WHEN lower(coalesce(unit, '')) = 'jar' THEN 'jar'
  WHEN lower(coalesce(unit, '')) = 'box' THEN 'box'
  WHEN lower(coalesce(unit, '')) = 'combo' THEN 'combo'
  ELSE 'g'
END
WHERE unit_type IS NULL OR unit_type = '';

-- 4) For Group B (count units) backfill quantity_count + per_unit_weight from current weight_kg
UPDATE public.products
SET
  quantity_count = COALESCE(quantity_count, 1),
  per_unit_weight = COALESCE(per_unit_weight, GREATEST(weight_kg * 1000, 0)),
  per_unit_weight_unit = COALESCE(per_unit_weight_unit, 'g')
WHERE unit_type IN ('pcs','pack','bottle','jar','box','combo','ml','l');

-- 5) Backfill calculated_shipping_weight (in kg) for ALL products
UPDATE public.products
SET calculated_shipping_weight = CASE
  WHEN unit_type IN ('g','kg','ml','l') THEN COALESCE(weight_kg, 0)
  WHEN unit_type IN ('pcs','pack','bottle','jar','box','combo') THEN
    COALESCE(quantity_count, 1) *
    CASE WHEN per_unit_weight_unit = 'kg'
         THEN COALESCE(per_unit_weight, 0)
         ELSE COALESCE(per_unit_weight, 0) / 1000.0
    END
  ELSE COALESCE(weight_kg, 0)
END
WHERE calculated_shipping_weight = 0;

-- 6) Helpful index for combo filtering on storefront
CREATE INDEX IF NOT EXISTS idx_products_is_combo ON public.products (is_combo) WHERE is_combo = true;
