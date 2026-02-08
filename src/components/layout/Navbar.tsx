import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, Search, LogOut, Package, Shield, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on the homepage
  const isHomePage = location.pathname === '/';

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
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
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

        <form onSubmit={handleSearch} className="hidden md:flex items-center max-w-xs">
          <div className="relative">
            <Search className={`absolute left-2.5 top-2.5 h-4 w-4 transition-colors duration-300 ${
              (isHomePage && !isActive) ? 'md:text-white/60 text-muted-foreground' : 'text-muted-foreground'
            }`} />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`pl-9 h-9 w-48 lg:w-64 transition-all duration-300 ${
                (isHomePage && !isActive)
                  ? 'md:bg-white/20 md:text-white md:placeholder:text-white/50 md:border-white/20 bg-secondary/50 text-foreground placeholder:text-muted-foreground/60'
                  : 'bg-secondary/50 text-foreground placeholder:text-muted-foreground/60'
              }`}
            />
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
                <form onSubmit={e => { handleSearch(e); setMobileOpen(false); }}>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
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
