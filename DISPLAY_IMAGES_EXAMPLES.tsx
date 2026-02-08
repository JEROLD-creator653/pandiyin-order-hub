/**
 * Display Images from Database to Frontend
 * Examples of how to fetch and display banner/product images
 */

// ============================================
// Example 1: Display Banners (Homepage)
// ============================================

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
  sort_order: number;
}

export function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Fetch active banners from database
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (error) throw error;
        setBanners(data || []);
      } catch (error) {
        console.error('Failed to fetch banners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();

    // Set up real-time subscription for changes
    const subscription = supabase
      .channel('banners')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'banners' },
        () => fetchBanners()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />;
  }

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <section className="relative bg-background overflow-hidden group">
      <div className="relative h-48 md:h-72 lg:h-96 w-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {/* Display Banner Image */}
          <a
            href={currentBanner.link_url ? currentBanner.link_url : '#'}
            className="block w-full h-full cursor-pointer"
          >
            <img
              src={currentBanner.image_url}
              alt={currentBanner.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// Example 2: Product Grid (Products Page)
// ============================================

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url: string;
  is_available: boolean;
  categories?: {
    name: string;
  };
}

export function ProductGrid({ categoryFilter?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let query = supabase
          .from('products')
          .select('id, name, description, price, image_url, categories(name)')
          .eq('is_available', true)
          .order('created_at', { ascending: false });

        // Filter by category if provided
        if (categoryFilter) {
          query = query.eq('category_id', categoryFilter);
        }

        const { data, error } = await query;

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryFilter]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No products found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map((product) => (
        <a
          key={product.id}
          href={`/products/${product.id}`}
          className="group"
        >
          <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
            {/* Product Image from Database */}
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">
              {product.categories?.name}
            </p>
            <h3 className="font-semibold text-sm line-clamp-2">
              {product.name}
            </h3>
            <p className="font-bold text-primary">₹{product.price}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

// ============================================
// Example 3: Product Detail Page
// ============================================

export function ProductDetail({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(name)')
          .eq('id', productId)
          .single();

        if (error) throw error;
        setProduct(data);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />;
  }

  if (!product) {
    return <div className="text-center text-muted-foreground">Product not found</div>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Product Image */}
      <div className="aspect-square bg-muted rounded-lg overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Product Details */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
        <p className="text-muted-foreground mb-4">
          Category: {product.categories?.name}
        </p>
        <p className="text-2xl font-bold text-primary mb-4">₹{product.price}</p>
        <p className="text-muted-foreground mb-6">{product.description}</p>
        {/* Add to Cart Button */}
      </div>
    </div>
  );
}

// ============================================
// Example 4: Real-time Image Updates
// ============================================

export function LiveProductList() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Initial fetch
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true);

      setProducts(data || []);
    };

    fetchProducts();

    // Real-time updates (when admin uploads new images)
    const subscription = supabase
      .channel('products')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProducts((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setProducts((prev) =>
              prev.map((p) => (p.id === payload.new.id ? payload.new : p))
            );
          } else if (payload.eventType === 'DELETE') {
            setProducts((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="grid gap-4">
      {products.map((product) => (
        <div key={product.id} className="flex gap-4 p-4 border rounded-lg">
          {/* Image updates in real-time */}
          <img
            src={product.image_url}
            alt={product.name}
            className="w-24 h-24 object-cover rounded"
          />
          <div className="flex-1">
            <h3 className="font-semibold">{product.name}</h3>
            <p className="text-sm text-muted-foreground">
              {product.description}
            </p>
            <p className="font-bold text-primary">₹{product.price}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Example 5: Fallback Image Handler
// ============================================

interface ProductImageProps {
  src?: string;
  alt: string;
  fallback?: string;
}

export function ProductImage({
  src,
  alt,
  fallback = '/placeholder.png',
}: ProductImageProps) {
  const [imageSrc, setImageSrc] = useState(src || fallback);
  const [error, setError] = useState(false);

  const handleError = () => {
    if (!error) {
      setImageSrc(fallback);
      setError(true);
    }
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      onError={handleError}
      className="w-full h-full object-cover"
    />
  );
}

// Usage:
// <ProductImage 
//   src={product.image_url} 
//   alt={product.name}
//   fallback="/placeholder-product.png"
// />

// ============================================
// Example 6: Lazy Loading Images
// ============================================

import { useState } from 'react';

export function LazyImage({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && (
        <div className={`${className} bg-muted animate-pulse rounded`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}

// Usage:
// <LazyImage 
//   src={product.image_url} 
//   alt={product.name}
//   className="w-full h-32 object-cover rounded"
// />

// ============================================
// Example 7: Image Gallery
// ============================================

export function ProductImageGallery({ productId }: { productId: string }) {
  const [product, setProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data } = await supabase
        .from('products')
        .select('image_url, images')
        .eq('id', productId)
        .single();

      setProduct(data);
    };

    fetchProduct();
  }, [productId]);

  if (!product) return null;

  // Combine main image with additional images
  const allImages = [product.image_url, ...(product.images || [])];

  return (
    <div>
      {/* Main Image */}
      <div className="mb-4 aspect-square bg-muted rounded-lg overflow-hidden">
        <img
          src={allImages[selectedImage]}
          alt="Product"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnail Gallery */}
      {allImages.length > 1 && (
        <div className="flex gap-2">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={`w-16 h-16 rounded overflow-hidden border-2 ${
                selectedImage === idx ? 'border-primary' : 'border-transparent'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Example 8: Search with Image Preview
// ============================================

export function ProductSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);

  const handleSearch = async (searchTerm: string) => {
    setQuery(searchTerm);

    if (searchTerm.length < 2) {
      setResults([]);
      return;
    }

    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .eq('is_available', true)
        .limit(5);

      setResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search products..."
        className="w-full px-4 py-2 border rounded-lg"
      />

      {/* Search Results with Images */}
      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((product) => (
            <a
              key={product.id}
              href={`/products/${product.id}`}
              className="flex gap-3 p-2 rounded hover:bg-muted"
            >
              <img
                src={product.image_url}
                alt={product.name}
                className="w-12 h-12 object-cover rounded"
              />
              <div className="flex-1">
                <p className="font-semibold text-sm">{product.name}</p>
                <p className="text-xs text-muted-foreground">₹{product.price}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
