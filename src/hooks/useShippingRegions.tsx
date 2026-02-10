import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ShippingRegion {
  id: string;
  region_name: string;
  region_key: string;
  states: string[];
  base_charge: number;
  free_delivery_above: number | null;
  is_enabled: boolean;
  sort_order: number;
}

export function useShippingRegions() {
  const [regions, setRegions] = useState<ShippingRegion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from('shipping_regions')
      .select('*')
      .order('sort_order');
    setRegions((data || []).map(r => ({
      ...r,
      base_charge: Number(r.base_charge),
      free_delivery_above: r.free_delivery_above ? Number(r.free_delivery_above) : null,
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getDeliveryCharge = (state: string, subtotal: number): number => {
    const normalizedState = state.trim();

    // Check local region first
    const localRegion = regions.find(r => r.region_key === 'local' && r.is_enabled);
    if (localRegion && localRegion.states.some(s => s.toLowerCase() === normalizedState.toLowerCase())) {
      if (localRegion.free_delivery_above && subtotal >= localRegion.free_delivery_above) return 0;
      return localRegion.base_charge;
    }

    // Rest of India
    const restRegion = regions.find(r => r.region_key === 'rest_of_india' && r.is_enabled);
    if (restRegion) {
      if (restRegion.free_delivery_above && subtotal >= restRegion.free_delivery_above) return 0;
      return restRegion.base_charge;
    }

    return 0;
  };

  return { regions, loading, load, getDeliveryCharge };
}
