import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Leaf, Truck, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CartReminderPopup } from '@/components/CartReminderPopup';
import TrustBadges from '@/components/TrustBadges';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showReminderPopup, setShowReminderPopup] = useState(false);
  
  const { user } = useAuth();
  const { items: cartItems } = useCart();

  useEffect(() => {
    supabase.from('products').select('*, categories(name)').eq('is_featured', true).eq('is_available', true).limit(8).then(({ data }) => setFeatured(data || []));
    supabase.from('banners').select('*').eq('is_active', true).order('sort_order').then(({ data }) => setBanners(data || []));
  }, []);

  // Show cart reminder popup on homepage if user has cart items
  useEffect(() => {
    if (user && cartItems && cartItems.length > 0) {
      setShowReminderPopup(true);
    }
  }, [user, cartItems]);

  const handleImageLoad = useCallback((bannerId: string) => {
    setLoadedImages(prev => ({ ...prev, [bannerId]: true }));
  }, []);

  // Auto-rotate banners every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const nextBanner = useCallback(() => {
    if (isScrollingRef.current || !banners.length) return;
    isScrollingRef.current = true;
    
    setCurrentBannerIndex((prev) => (prev + 1) % (banners.length || 1));
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 300);
  }, [banners.length]);

  const prevBanner = useCallback(() => {
    if (isScrollingRef.current || !banners.length) return;
    isScrollingRef.current = true;
    
    setCurrentBannerIndex((prev) => (prev - 1 + (banners.length || 1)) % (banners.length || 1));
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 300);
  }, [banners.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevBanner();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextBanner();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [nextBanner, prevBanner]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary to-background py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 text-primary font-medium text-sm mb-4 bg-primary/10 px-3 py-1 rounded-full">
              <Leaf className="h-4 w-4" /> 100% Homemade & Natural
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground leading-tight mb-6">
              Nature In <span className="text-primary">Every Pack</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 font-sans">
              Discover authentic homemade foods from the heart of Madurai. Traditional recipes, pure ingredients, delivered to your doorstep.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link to="/products">Shop Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                <Link to="/about">Our Story</Link>
              </Button>
            </div>
          </motion.div>
        </div>
        <div className="absolute -bottom-1 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Professional Banner Carousel */}
      {banners.length > 0 && (
        <section className="relative bg-background overflow-hidden group mt-8 md:mt-12">
          <div className="relative h-48 md:h-72 lg:h-96 w-full">
            {banners.map((banner, index) => (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: index === currentBannerIndex ? 1 : 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0"
                style={{ pointerEvents: index === currentBannerIndex ? 'auto' : 'none' }}
              >
                {/* Loading Skeleton */}
                {!loadedImages[banner.id] && (
                  <Skeleton className="absolute inset-0 w-full h-full" />
                )}
                
                {banner.link_url ? (
                  <Link to={banner.link_url} className="block w-full h-full">
                    <div className="relative w-full h-full">
                      <img 
                        src={banner.image_url} 
                        alt={banner.title} 
                        onLoad={() => handleImageLoad(banner.id)}
                        className={`w-full h-full object-cover transition-opacity duration-500 ${loadedImages[banner.id] ? 'opacity-100' : 'opacity-0'}`}
                      />
                      <div className="absolute inset-0 bg-black/20" />
                    </div>
                  </Link>
                ) : (
                  <div className="relative w-full h-full">
                    <img 
                      src={banner.image_url} 
                      alt={banner.title} 
                      onLoad={() => handleImageLoad(banner.id)}
                      className={`w-full h-full object-cover transition-opacity duration-500 ${loadedImages[banner.id] ? 'opacity-100' : 'opacity-0'}`}
                    />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                )}
              </motion.div>
            ))}
            
            {/* Navigation Arrows - Show on Hover */}
            {banners.length > 1 && (
              <>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={prevBanner}
                    className="bg-white/80 hover:bg-white text-black p-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95"
                    aria-label="Previous banner"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={nextBanner}
                    className="bg-white/80 hover:bg-white text-black p-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95"
                    aria-label="Next banner"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
              </>
            )}

            {/* Dot Indicators */}
            {banners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBannerIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentBannerIndex 
                        ? 'bg-white w-8' 
                        : 'bg-white/50 w-2 hover:bg-white/70'
                    }`}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Trust Badges Scrolling Strip */}
      <TrustBadges />

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-display font-bold">Bestsellers</h2>
              <Button asChild variant="ghost"><Link to="/products">View All <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featured.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="h-full">
                  <Link to={`/products/${p.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full flex flex-col">
                      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <Leaf className="h-12 w-12 text-muted-foreground/30" />
                        )}
                      </div>
                      <CardContent className="p-4 flex flex-col flex-grow justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{(p as any).categories?.name}</p>
                          <h3 className="font-semibold text-sm font-sans line-clamp-2 mb-2">{p.name}</h3>
                        </div>
                        <div className="flex items-center gap-2 mt-auto">
                          <span className="font-bold text-primary">₹{p.price}</span>
                          {p.compare_price && <span className="text-xs text-muted-foreground line-through">₹{p.compare_price}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brand Story */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Leaf className="h-10 w-10 mx-auto text-primary mb-4" />
            <h2 className="text-3xl font-display font-bold mb-6">From Madurai Kitchens to Your Home</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              At PANDIYIN, we believe food should be pure, honest, and full of love. Every product is handcrafted using traditional recipes passed down through generations, with ingredients sourced directly from local farms.
            </p>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/about">Read Our Story</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Cart Reminder Popup */}
      <AnimatePresence>
        {showReminderPopup && cartItems && cartItems.length > 0 && (
          <CartReminderPopup
            cartCount={cartItems.length}
            userName={user?.email?.split('@')[0] || user?.user_metadata?.full_name}
            onClose={() => setShowReminderPopup(false)}
            onCheckout={() => setShowReminderPopup(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
