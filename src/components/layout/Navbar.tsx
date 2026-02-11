import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, User, Menu, Search, LogOut, Package, Shield, UserCog, ArrowRight, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/formatters';

interface ProductSuggestion {
  id: string;
  name: string;
  price: number;
  compare_price: number | null;
  image_url: string | null;
  categories: { name: string } | null;
}

export default function Navbar() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();
  
  // Check if we're on the homepage
  const isHomePage = location.pathname === '/';

  // Sync search query with URL params
  useEffect(() => {
    const urlSearchQuery = searchParams.get('search') || '';
    setSearchQuery(urlSearchQuery);
  }, [searchParams]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideDesktop = searchRef.current?.contains(target);
      const clickedInsideMobile = mobileSearchRef.current?.contains(target);

      if (!clickedInsideDesktop && !clickedInsideMobile) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      setIsLoadingSuggestions(true);
      debounceTimerRef.current = setTimeout(async () => {
        const { data } = await supabase
          .from('products')
          .select('id, name, price, compare_price, image_url, categories(name)')
          .eq('is_available', true)
          .ilike('name', `%${searchQuery.trim()}%`)
          .limit(8);
        
        setSuggestions(data || []);
        setIsLoadingSuggestions(false);
        setShowSuggestions(true);
      }, 200);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoadingSuggestions(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    // Only track scroll on homepage
    if (!isHomePage) {
      setIsScrolled(false);
      return;
    }
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (productId: string) => {
    setShowSuggestions(false);
    navigate(`/products/${productId}`);
  };

  const handleViewAll = () => {
    setShowSuggestions(false);
    navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Products', to: '/products' },
    { label: 'About', to: '/about' },
  ];

  // Only apply transparency logic on homepage and desktop
  const isActive = isHomePage ? (isScrolled || isHovered || mobileOpen) : true;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isHomePage
          ? (isActive
              ? 'bg-white/95 backdrop-blur-md border-b border-black/5 shadow-sm'
              : 'md:bg-transparent bg-white/95 md:border-0 border-b border-black/5')
          : 'bg-white border-b border-black/5 shadow-sm'
      }`}
      onMouseEnter={() => isHomePage && setIsHovered(true)}
      onMouseLeave={() => isHomePage && setIsHovered(false)}
    >
      <div className="container mx-auto px-4 flex items-center justify-between h-16 transition-colors duration-300">
        <Link to="/" className="flex items-center gap-2 transition-colors duration-300">
          <span className={`text-xl font-display font-bold transition-colors duration-300 ${
            (isHomePage && !isActive) ? 'md:text-white text-primary md:drop-shadow-lg' : 'text-primary'
          }`}>
            PANDIYIN
          </span>
          <span className={`hidden sm:inline text-xs font-sans transition-colors duration-300 ${
            (isHomePage && !isActive) ? 'md:text-white/80 text-muted-foreground md:drop-shadow' : 'text-muted-foreground'
          }`}>
            Nature In Pack
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm font-medium transition-colors duration-300 ${
                (isHomePage && !isActive)
                  ? 'md:text-white/90 md:hover:text-white text-foreground/70 hover:text-primary md:drop-shadow'
                  : 'text-foreground/70 hover:text-primary'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearch} className="hidden md:flex items-center max-w-xs relative">
          <div className="relative w-full" ref={searchRef}>
            <div className="relative">
              <Search className={`absolute left-2.5 top-2.5 h-4 w-4 transition-colors duration-300 ${
                (isHomePage && !isActive) ? 'md:text-white/60 text-muted-foreground' : 'text-muted-foreground'
              }`} />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                onClick={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                onKeyDown={(e) => e.key === 'Escape' && setShowSuggestions(false)}
                className={`pl-9 h-9 w-48 lg:w-64 transition-all duration-300 ${
                  (isHomePage && !isActive)
                    ? 'md:bg-white/20 md:text-white md:placeholder:text-white/50 md:border-white/20 bg-secondary/50 text-foreground placeholder:text-muted-foreground/60'
                    : 'bg-secondary/50 text-foreground placeholder:text-muted-foreground/60'
                }`}
              />
            </div>

            {/* Autocomplete Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && searchQuery.trim().length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
                >
                {isLoadingSuggestions ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : suggestions.length > 0 ? (
                  <>
                    <div className="max-h-[400px] overflow-y-auto">
                      {suggestions.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleSuggestionClick(product.id)}
                          className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left border-b border-gray-100 last:border-0"
                        >
                          <div className="w-12 h-12 rounded-md bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.name}
                                className="w-full h-full object-cover rounded-md"
                              />
                            ) : (
                              <Leaf className="h-5 w-5 text-muted-foreground/30" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {product.name}
                            </p>
                            {product.categories?.name && (
                              <p className="text-xs text-muted-foreground truncate">
                                {product.categories.name}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-sm font-semibold text-foreground">
                              {formatPrice(product.price)}
                            </span>
                            {product.compare_price && product.compare_price > product.price && (
                              <span className="text-xs text-muted-foreground line-through">
                                {formatPrice(product.compare_price)}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleViewAll}
                      className="w-full p-3 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-primary border-t border-gray-200"
                    >
                      View all results
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No products found
                  </div>
                )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </form>

        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative">
            <Button
              variant="ghost"
              size="icon"
              className={`transition-colors duration-300 ${
                (isHomePage && !isActive) ? 'md:text-white md:hover:bg-white/10 text-foreground hover:bg-secondary' : 'text-foreground hover:bg-secondary'
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-accent text-accent-foreground">
                  {itemCount}
                </Badge>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`transition-colors duration-300 ${
                    (isHomePage && !isActive) ? 'md:text-white md:hover:bg-white/10 text-foreground hover:bg-secondary' : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <UserCog className="mr-2 h-4 w-4" /> My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <Package className="mr-2 h-4 w-4" /> My Orders
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Shield className="mr-2 h-4 w-4" /> Admin Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/auth')}
              className={`transition-colors duration-300 ${
                (isHomePage && !isActive) ? 'md:bg-white md:text-primary md:hover:bg-white/90' : ''
              }`}
            >
              Sign In
            </Button>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className={`transition-colors duration-300 ${
                  (isHomePage && !isActive) ? 'md:text-white md:hover:bg-white/10 text-foreground hover:bg-secondary' : 'text-foreground hover:bg-secondary'
                }`}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-4 mt-8">
                <form onSubmit={e => { handleSearch(e); setMobileOpen(false); }} className="relative">
                  <div className="relative" ref={mobileSearchRef}>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                        onClick={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                        onKeyDown={(e) => e.key === 'Escape' && setShowSuggestions(false)}
                        className="pl-9"
                      />
                    </div>

                    {/* Mobile Autocomplete Suggestions Dropdown */}
                    <AnimatePresence>
                      {showSuggestions && searchQuery.trim().length >= 2 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
                        >
                        {isLoadingSuggestions ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Searching...
                          </div>
                        ) : suggestions.length > 0 ? (
                          <>
                            <div className="max-h-[300px] overflow-y-auto">
                              {suggestions.map((product) => (
                                <button
                                  key={product.id}
                                  onClick={() => {
                                    handleSuggestionClick(product.id);
                                    setMobileOpen(false);
                                  }}
                                  className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left border-b border-gray-100 last:border-0"
                                >
                                  <div className="w-10 h-10 rounded-md bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                                    {product.image_url ? (
                                      <img 
                                        src={product.image_url} 
                                        alt={product.name}
                                        className="w-full h-full object-cover rounded-md"
                                      />
                                    ) : (
                                      <Leaf className="h-4 w-4 text-muted-foreground/30" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate">
                                      {product.name}
                                    </p>
                                    {product.categories?.name && (
                                      <p className="text-[10px] text-muted-foreground truncate">
                                        {product.categories.name}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-end flex-shrink-0">
                                    <span className="text-xs font-semibold text-foreground">
                                      {formatPrice(product.price)}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() => {
                                handleViewAll();
                                setMobileOpen(false);
                              }}
                              className="w-full p-3 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-primary border-t border-gray-200"
                            >
                              View all results
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No products found
                          </div>
                        )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </form>
                {navLinks.map(l => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobileOpen(false)}
                    className="text-lg font-medium py-2 border-b hover:text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
