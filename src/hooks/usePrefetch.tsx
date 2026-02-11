import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for prefetching products data to improve perceived performance
 */
export function usePrefetchProducts() {
  const queryClient = useQueryClient();

  const prefetchProducts = async () => {
    await queryClient.prefetchInfiniteQuery({
      queryKey: ['products'],
      queryFn: async ({ pageParam = 0 }) => {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, image_url, categories(name)')
          .range(pageParam * 12, pageParam * 12 + 11)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
      },
      initialPageParam: 0,
    });
  };

  return { prefetchProducts };
}

/**
 * Hook for prefetching banner data
 */
export function usePrefetchBanners() {
  const queryClient = useQueryClient();

  const prefetchBanners = async () => {
    await queryClient.prefetchQuery({
      queryKey: ['banners'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('website_banners')
          .select('*')
          .eq('is_active', true)
          .order('position', { ascending: true });

        if (error) throw error;
        return data;
      },
    });
  };

  return { prefetchBanners };
}

/**
 * Hook for prefetching categories
 */
export function usePrefetchCategories() {
  const queryClient = useQueryClient();

  const prefetchCategories = async () => {
    await queryClient.prefetchQuery({
      queryKey: ['categories'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) throw error;
        return data;
      },
    });
  };

  return { prefetchCategories };
}

/**
 * Prefetch on mouse hover or page load
 */
export function usePrefetchOnHover(callback: () => Promise<void>) {
  const handleMouseEnter = () => {
    callback();
  };

  return { onMouseEnter: handleMouseEnter };
}
