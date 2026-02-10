import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  category_id: string;
  is_available: boolean;
  average_rating: number | null;
  review_count: number | null;
  categories?: {
    name: string;
  };
}

interface CartItem {
  id: string;
  product_id: string;
  product: Product;
}

// Define complementary product relationships
const COMPLEMENTARY_ITEMS: Record<string, string[]> = {
  // Millet products pair well with health powders and tea
  'millet': ['health powder', 'tea', 'snacks', 'health mix'],
  'millets': ['health powder', 'tea', 'snacks', 'health mix'],
  
  // Tea pairs with snacks and health items
  'tea': ['snacks', 'millet', 'health powder', 'biscuits'],
  
  // Health powders pair with millets and tea
  'health powder': ['millet', 'tea', 'health mix'],
  'health mix': ['millet', 'tea', 'health powder'],
  
  // Snacks pair with beverages
  'snacks': ['tea', 'juice', 'drinks'],
  'biscuits': ['tea', 'coffee'],
  
  // Spices and masala pair with food items
  'spices': ['millet', 'rice', 'dals'],
  'masala': ['millet', 'rice', 'dals'],
};

/**
 * Intelligent recommendation hook that suggests products based on:
 * 1. Same category as cart items
 * 2. Complementary items (e.g., tea + snacks)
 * 3. Popular/featured products
 * 
 * Filters out products already in cart
 */
export function useProductRecommendations(cartItems: CartItem[], maxRecommendations = 6) {
  return useQuery({
    queryKey: ['recommendations', cartItems.map(i => i.product_id).sort().join(',')],
    queryFn: async () => {
      if (cartItems.length === 0) {
        // If cart is empty, return featured/popular products
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(name)')
          .eq('is_available', true)
          .eq('is_featured', true)
          .gt('stock_quantity', 0)
          .limit(maxRecommendations);
        
        if (error) throw error;
        return (data || []) as Product[];
      }

      // Extract cart product IDs for filtering
      const cartProductIds = cartItems.map(item => item.product_id);
      
      // Extract category IDs and names from cart items
      const cartCategories = new Set<string>();
      const cartCategoryNames = new Set<string>();
      
      cartItems.forEach(item => {
        if (item.product.category_id) {
          cartCategories.add(item.product.category_id);
        }
        if (item.product.categories?.name) {
          cartCategoryNames.add(item.product.categories.name.toLowerCase());
        }
      });

      // Determine complementary category keywords
      const complementaryKeywords = new Set<string>();
      cartCategoryNames.forEach(catName => {
        // Check for exact matches
        if (COMPLEMENTARY_ITEMS[catName]) {
          COMPLEMENTARY_ITEMS[catName].forEach(comp => complementaryKeywords.add(comp));
        }
        
        // Check for partial matches
        Object.keys(COMPLEMENTARY_ITEMS).forEach(key => {
          if (catName.includes(key) || key.includes(catName)) {
            COMPLEMENTARY_ITEMS[key].forEach(comp => complementaryKeywords.add(comp));
          }
        });
      });

      // Fetch all available products
      const { data: allProducts, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_available', true)
        .gt('stock_quantity', 0)
        .not('id', 'in', `(${cartProductIds.join(',')})`)
        .limit(50); // Fetch more to filter intelligently

      if (error) throw error;
      if (!allProducts) return [];

      // Score products based on relevance
      const scoredProducts = allProducts.map((product: any) => {
        let score = 0;
        const productCategoryName = product.categories?.name?.toLowerCase() || '';
        const productName = product.name.toLowerCase();

        // Same category as cart items (high priority)
        if (product.category_id && cartCategories.has(product.category_id)) {
          score += 10;
        }

        // Complementary items (very high priority)
        complementaryKeywords.forEach(keyword => {
          if (productCategoryName.includes(keyword) || productName.includes(keyword)) {
            score += 15;
          }
        });

        // Featured products get bonus
        if (product.is_featured) {
          score += 5;
        }

        // Boost newer products slightly
        const daysOld = (Date.now() - new Date(product.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld < 30) {
          score += 2;
        }

        return { product, score };
      });

      // Sort by score and return top recommendations
      const recommendations = scoredProducts
        .filter(item => item.score > 0) // Only items with positive relevance
        .sort((a, b) => b.score - a.score)
        .slice(0, maxRecommendations)
        .map(item => item.product as Product);

      // If we don't have enough recommendations, fill with featured products
      if (recommendations.length < maxRecommendations) {
        const featured = allProducts
          .filter((p: any) => 
            p.is_featured && 
            !recommendations.find(r => r.id === p.id)
          )
          .slice(0, maxRecommendations - recommendations.length);
        
        recommendations.push(...featured);
      }

      return recommendations;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
