/**
 * Universal unit / weight helpers for products.
 *
 * GROUP A (direct weight) — value is the actual weight:
 *   - g, kg, ml, l (we treat ml/l as direct mass-equivalents for shipping)
 *
 * GROUP B (count units) — needs `quantity_count` × `per_unit_weight`:
 *   - pcs, pack, bottle, jar, box
 *
 * `combo` is special: admins enter total net weight directly (g/kg)
 * alongside quantity_count for display.
 *
 * `calculated_shipping_weight` is always stored in **kilograms**.
 */

export type UnitType =
  | 'g' | 'kg' | 'ml' | 'l'
  | 'pcs' | 'pack' | 'bottle' | 'jar' | 'box' | 'combo';

export const GROUP_A_UNITS: UnitType[] = ['g', 'kg', 'ml', 'l'];
export const GROUP_B_UNITS: UnitType[] = ['pcs', 'pack', 'bottle', 'jar', 'box', 'combo'];

export const ALL_UNITS: UnitType[] = [...GROUP_A_UNITS, ...GROUP_B_UNITS];

export function isGroupA(unit: string | null | undefined): boolean {
  return GROUP_A_UNITS.includes((unit || '') as UnitType);
}

export function isGroupB(unit: string | null | undefined): boolean {
  return GROUP_B_UNITS.includes((unit || '') as UnitType);
}

/** Convert a value (g | kg) to kilograms. */
export function toKg(value: number, unit: 'g' | 'kg'): number {
  if (!isFinite(value) || value <= 0) return 0;
  return unit === 'kg' ? value : value / 1000;
}

interface ShippingWeightInput {
  unit_type?: string | null;
  weight?: string | number | null;          // legacy display weight (Group A)
  weight_kg?: number | null;                 // legacy total kg
  quantity_count?: number | null;            // Group B
  per_unit_weight?: number | null;           // Group B
  per_unit_weight_unit?: 'g' | 'kg' | string | null;
}

/**
 * Compute shipping weight in kilograms for a product row.
 * Falls back gracefully for legacy products that don't have the new fields.
 */
export function computeShippingWeightKg(p: ShippingWeightInput): number {
  const unit = (p.unit_type || '').toLowerCase();

  // Combo: direct total net weight using g/kg selector
  if (unit === 'combo') {
    const raw = Number(p.weight);
    const weightUnit = (p.per_unit_weight_unit || 'g') as 'g' | 'kg';
    if (raw > 0) return toKg(raw, weightUnit);

    // Legacy fallback (older combos saved as qty x per-unit)
    const qty = Number(p.quantity_count) || 0;
    const pu = Number(p.per_unit_weight) || 0;
    if (qty > 0 && pu > 0) return Math.max(0, qty * toKg(pu, weightUnit));
  }

  // Group B: count × per-unit weight
  if (isGroupB(unit)) {
    const qty = Number(p.quantity_count) || 0;
    const pu = Number(p.per_unit_weight) || 0;
    const puUnit = (p.per_unit_weight_unit || 'g') as 'g' | 'kg';
    return Math.max(0, qty * toKg(pu, puUnit));
  }

  // Group A: prefer explicit `weight` if provided, else fall back to `weight_kg`
  if (isGroupA(unit)) {
    const raw = Number(p.weight);
    if (raw > 0 && (unit === 'g' || unit === 'kg')) return toKg(raw, unit as 'g' | 'kg');
    // ml/l → treat as kg-equivalent (1l ≈ 1kg) when no explicit weight_kg
    if (unit === 'ml' && raw > 0) return raw / 1000;
    if (unit === 'l' && raw > 0) return raw;
  }

  // Final fallback
  return Math.max(0, Number(p.weight_kg) || 0);
}

/**
 * Best shipping-weight source for a product loaded from DB.
 * Reads `calculated_shipping_weight` if present, else recomputes.
 */
export function getProductShippingWeightKg(product: any): number {
  const stored = Number(product?.calculated_shipping_weight);
  if (isFinite(stored) && stored > 0) return stored;
  return computeShippingWeightKg(product || {});
}

/** Pretty display: "250 g", "1 kg", "10 pcs", "2 bottles", "10 kg" (for combos). */
export function formatProductUnit(p: {
  unit_type?: string | null;
  unit?: string | null;
  weight?: string | number | null;
  quantity_count?: number | null;
  per_unit_weight?: number | null;
  per_unit_weight_unit?: string | null;
}): string {
  const unit = (p.unit_type || p.unit || '').toLowerCase();
  if (!unit) return '';

  if (isGroupA(unit)) {
    const v = p.weight ? String(p.weight).trim() : '';
    return v ? `${v} ${unit}` : '';
  }

  if (isGroupB(unit)) {
    // For combos, show the net weight they entered in the admin form (stored in `weight`)
    if (unit === 'combo') {
      const weight = p.weight ? String(p.weight).trim() : '';
      const weightUnit = (p.per_unit_weight_unit || '').toLowerCase();
      if (weight) {
        return weightUnit ? `${weight} ${weightUnit}` : weight;
      }
      // Fallback to quantity if weight not set
      const n = Number(p.quantity_count) || 0;
      return n ? `${n} combo pack${n > 1 ? 's' : ''}` : '';
    }
    
    const n = Number(p.quantity_count) || 0;
    if (!n) return '';
    const plural = n > 1 && unit !== 'pcs' ? `${unit}s` : unit;
    return `${n} ${plural}`;
  }

  return '';
}

/** Friendly label for the unit dropdown. */
export const UNIT_LABELS: Record<UnitType, string> = {
  g: 'g (grams)',
  kg: 'kg (kilograms)',
  ml: 'ml (millilitres)',
  l: 'l (litres)',
  pcs: 'pcs (pieces)',
  pack: 'pack',
  bottle: 'bottle',
  jar: 'jar',
  box: 'box',
  combo: 'combo',
};
