import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, User, Menu, Search, LogOut, Package, Shield,
  UserCog, ArrowRight, Leaf, X, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/formatters';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProductSuggestion {
  id: string;
  name: string;
  price: number;
  compare_price: number | null;
  image_url: string | null;
  categories: { name: string } | null;
}

interface NavItem {
  label: string;
  to: string;
}

/* ------------------------------------------------------------------ */
/*  Static nav links (before & after dynamic categories)               */
/* ------------------------------------------------------------------ */

const staticBefore: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'All Products', to: '/products' },
];

const staticAfter: NavItem[] = [
  { label: 'About Us', to: '/about' },
  { label: 'Contact', to: '#contact' },
  { label: 'Track Your Order', to: '/dashboard' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Navbar() {
  /* --- state --- */
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  /* --- hooks --- */
  const { user, isAdmin, signOut } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  /* --- refs --- */
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLFormElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const isHomePage = location.pathname === '/';
  const isProductsPage = location.pathname === '/products';

  /* ---------------------------------------------------------------- */
  /*  Build dynamic nav links                                          */
  /* ---------------------------------------------------------------- */

  const navLinks = useMemo<NavItem[]>(() => {
    const categoryLinks: NavItem[] = categories.map((c) => ({
      label: c.name,
      to: `/products?category=${encodeURIComponent(c.name)}`,
    }));
    return [...staticBefore, ...categoryLinks, ...staticAfter];
  }, [categories]);

  /* ---------------------------------------------------------------- */
  /*  Effects                                                          */
  /* ---------------------------------------------------------------- */

  // Fetch categories from DB
  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .order('sort_order');
      if (data) setCategories(data);
    };
    loadCategories();
  }, []);

  // Sync URL search param → local state
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  // Auto-focus mobile search
  useEffect(() => {
    if (mobileSearchOpen && mobileSearchInputRef.current) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
    }
  }, [mobileSearchOpen]);

  // Auto-focus desktop search
  useEffect(() => {
    if (desktopSearchOpen && desktopSearchInputRef.current) {
      setTimeout(() => desktopSearchInputRef.current?.focus(), 100);
    }
  }, [desktopSearchOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !searchRef.current?.contains(target) &&
        !mobileSearchRef.current?.contains(target)
      ) {
        setShowSuggestions(false);
        setMobileSearchOpen(false);
        setDesktopSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced product search
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

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
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [searchQuery]);

  // Homepage scroll → opaque
  useEffect(() => {
    if (!isHomePage) { setIsScrolled(false); return; }
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  /* ---------------------------------------------------------------- */
  /*  Handlers                                                         */
  /* ---------------------------------------------------------------- */

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      setMobileSearchOpen(false);
      setDesktopSearchOpen(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (productId: string) => {
    setShowSuggestions(false);
    setMobileSearchOpen(false);
    setDesktopSearchOpen(false);
    navigate(`/products/${productId}`);
  };

  const handleViewAll = () => {
    setShowSuggestions(false);
    setMobileSearchOpen(false);
    setDesktopSearchOpen(false);
    navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleNavClick = (item: NavItem) => {
    setMobileOpen(false);
    if (item.to === '#contact') {
      const footer = document.getElementById('footer');
      if (footer) footer.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(item.to);
    }
  };

  /** Is a nav item currently active? */
  const isNavActive = (item: NavItem) => {
    if (item.to === '/') return location.pathname === '/';
    if (item.to === '#contact') return false;
    if (item.to.includes('?category=')) {
      const currentFull = location.pathname + location.search;
      return decodeURIComponent(currentFull) === decodeURIComponent(item.to);
    }
    return location.pathname === item.to;
  };

  /* appearance helpers */
  const isActive = isHomePage ? (isScrolled || isHovered || mobileOpen) : true;

  /* ---------------------------------------------------------------- */
  /*  Suggestions dropdown (shared desktop / mobile)                   */
  /* ---------------------------------------------------------------- */

  const SuggestionsDropdown = ({ isMobile = false }: { isMobile?: boolean }) => (
    <AnimatePresence>
      {showSuggestions && searchQuery.trim().length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 ${
            isMobile ? 'max-h-[300px]' : 'max-h-[400px]'
          } overflow-y-auto`}
        >
          {isLoadingSuggestions ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSuggestionClick(product.id)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left border-b border-gray-100 last:border-0"
                >
                  <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-md bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center`}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Leaf className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-muted-foreground/30`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-foreground truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      {product.name}
                    </p>
                    {product.categories?.name && (
                      <p className={`text-muted-foreground truncate ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                        {product.categories.name}
                      </p>
                    )}
                  </div>
                  <span className={`font-semibold text-foreground flex-shrink-0 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {formatPrice(product.price)}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={handleViewAll}
                className="w-full p-3 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 transition-colors text-primary border-t border-gray-200 font-medium"
              >
                <span className={isMobile ? 'text-xs' : 'text-sm'}>View all results</span>
                <ArrowRight className={isMobile ? 'h-3 w-3' : 'h-4 w-4'} />
              </button>
            </>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">No products found</div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isHomePage
          ? isActive
            ? 'bg-white/95 backdrop-blur-md border-b border-black/5 shadow-sm'
            : 'md:bg-transparent bg-white/95 md:border-0 border-b border-black/5'
          : 'bg-white border-b border-black/5 shadow-sm'
      }`}
      onMouseEnter={() => isHomePage && setIsHovered(true)}
      onMouseLeave={() => isHomePage && setIsHovered(false)}
    >
      {/* ==================== MOBILE HEADER ==================== */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between h-16 px-3 sm:px-4">
          {/* Left: Hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0 text-foreground hover:bg-secondary">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-80 p-0 flex flex-col [&>button]:hidden">
              {/* --- Drawer header --- */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-200">
                <h2 className="text-lg font-bold tracking-wide text-foreground">MENU</h2>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="h-9 w-9 rounded-md hover:bg-secondary flex items-center justify-center transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5 text-foreground" />
                </button>
              </div>

              <SheetHeader className="sr-only">
                <SheetTitle>Mobile navigation</SheetTitle>
              </SheetHeader>

              {/* --- Scrollable body --- */}
              <div className="flex-1 overflow-y-auto">
                {/* Nav items */}
                <nav className="px-3 py-3 space-y-0.5">
                  {navLinks.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleNavClick(item)}
                      className={`w-full text-left px-4 py-3 text-[15px] font-medium rounded-lg transition-colors ${
                        isNavActive(item)
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-secondary'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>

                {/* User section */}
                <div className="border-t border-gray-200 px-5 py-4">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{user.email?.split('@')[0] || 'Profile'}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full rounded-full h-9 text-sm" onClick={() => { navigate('/profile'); setMobileOpen(false); }}>
                        <UserCog className="mr-2 h-4 w-4" /> Profile
                      </Button>
                      <Button variant="outline" className="w-full rounded-full h-9 text-sm" onClick={() => { navigate('/dashboard'); setMobileOpen(false); }}>
                        <Package className="mr-2 h-4 w-4" /> My Orders
                      </Button>
                      {isAdmin && (
                        <Button variant="outline" className="w-full rounded-full h-9 text-sm" onClick={() => { navigate('/admin'); setMobileOpen(false); }}>
                          <Shield className="mr-2 h-4 w-4" /> Admin
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button className="w-full rounded-full h-10 text-sm" onClick={() => { navigate('/auth'); setMobileOpen(false); }}>
                      <User className="mr-2 h-4 w-4" /> Login / Sign Up
                    </Button>
                  )}
                </div>
              </div>

              {/* --- Social + Sign out footer --- */}
              <div className="border-t border-gray-200 px-5 py-4 space-y-4">
                {/* Social icons */}
                <div className="flex items-center justify-center gap-5">
                  {/* Instagram */}
                  <a href="https://instagram.com/pandiyin_nature_in_pack" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                    className="h-10 w-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all">
                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </a>
                  {/* Facebook */}
                  <a href="https://facebook.com/pandiyin" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                    className="h-10 w-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all">
                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </a>
                  {/* YouTube */}
                  <a href="https://youtube.com/@pandiyin" target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                    className="h-10 w-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all">
                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                    </svg>
                  </a>
                </div>

                {user && (
                  <Button variant="destructive" className="w-full rounded-full h-10" onClick={() => { signOut(); setMobileOpen(false); }}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Center: Logo */}
          <Link to="/" className="flex-1 flex justify-center mx-1 min-w-0">
            <div className="flex flex-col items-center leading-none">
              <span className="text-base sm:text-lg font-display font-bold text-primary">PANDIYIN</span>
              <span className="text-[9px] sm:text-[10px] tracking-[0.15em] text-muted-foreground font-medium -mt-0.5">Nature In Pack</span>
            </div>
          </Link>

          {/* Right: Search + Cart */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            {!isProductsPage && (
              <Button variant="ghost" size="icon" className="h-9 w-9 text-foreground hover:bg-secondary"
                onClick={() => setMobileSearchOpen(true)}>
                <Search className="h-5 w-5" />
              </Button>
            )}
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-foreground hover:bg-secondary">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-accent text-accent-foreground">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ==================== DESKTOP HEADER (single row) ==================== */}
      <div className="hidden lg:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16 gap-6">
            {/* Logo — fixed left */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 transition-colors duration-300">
              <span className={`text-xl font-display font-bold transition-colors duration-300 ${
                isHomePage && !isActive ? 'text-white drop-shadow-lg' : 'text-primary'
              }`}>
                PANDIYIN
              </span>
              <span className={`text-xs font-sans transition-colors duration-300 ${
                isHomePage && !isActive ? 'text-white/80 drop-shadow' : 'text-muted-foreground'
              }`}>
                Nature In Pack
              </span>
            </Link>

            {/* Center nav — grows to fill space */}
            <nav className="flex-1 flex items-center justify-center gap-1 min-w-0 overflow-x-auto scrollbar-hide">
              {navLinks.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item)}
                  className={`px-2.5 xl:px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                    isNavActive(item)
                      ? isHomePage && !isActive
                        ? 'text-white bg-white/15'
                        : 'text-primary bg-primary/10'
                      : isHomePage && !isActive
                        ? 'text-white/85 hover:text-white hover:bg-white/10'
                        : 'text-foreground/70 hover:text-primary hover:bg-secondary'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right icons — fixed right */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Search toggle */}
              <div className="relative" ref={searchRef}>
                <AnimatePresence>
                  {desktopSearchOpen ? (
                    <motion.form
                      key="search-input"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 280, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      onSubmit={handleSearch}
                      className="flex items-center overflow-hidden"
                    >
                      <div className="relative w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          ref={desktopSearchInputRef}
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                          onClick={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') { setDesktopSearchOpen(false); setShowSuggestions(false); }
                          }}
                          className="pl-9 pr-8 h-9 bg-secondary/50"
                          autoComplete="off"
                        />
                        <button type="button" onClick={() => { setDesktopSearchOpen(false); setShowSuggestions(false); setSearchQuery(''); }}
                          className="absolute right-2 top-2 text-muted-foreground hover:text-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <SuggestionsDropdown isMobile={false} />
                    </motion.form>
                  ) : (
                    <Button
                      key="search-icon"
                      variant="ghost" size="icon"
                      onClick={() => setDesktopSearchOpen(true)}
                      className={`transition-colors duration-300 ${
                        isHomePage && !isActive ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-secondary'
                      }`}
                    >
                      <Search className="h-5 w-5" />
                    </Button>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile / Login */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"
                      className={`transition-colors duration-300 ${
                        isHomePage && !isActive ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-secondary'
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
                <Button variant="ghost" size="icon"
                  onClick={() => navigate('/auth')}
                  className={`transition-colors duration-300 ${
                    isHomePage && !isActive ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  <User className="h-5 w-5" />
                </Button>
              )}

              {/* Cart */}
              <Link to="/cart" className="relative">
                <Button variant="ghost" size="icon"
                  className={`transition-colors duration-300 ${
                    isHomePage && !isActive ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-secondary'
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
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MOBILE FLOATING SEARCH OVERLAY ==================== */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute top-0 left-0 right-0 bg-white pt-3 pb-4 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto px-3 sm:px-4">
                <form onSubmit={(e) => { handleSearch(e); setMobileSearchOpen(false); }} ref={mobileSearchRef} className="relative space-y-2">
                  <div className="relative flex items-center gap-2">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      ref={mobileSearchInputRef}
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                      onClick={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                      onKeyDown={(e) => e.key === 'Escape' && setMobileSearchOpen(false)}
                      className="pl-9 h-10"
                      autoComplete="off"
                    />
                    {searchQuery && (
                      <button type="button" className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        onClick={() => setSearchQuery('')}>
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  <SuggestionsDropdown isMobile={true} />
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
