import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, FolderTree, ShoppingCart, Ticket, Users, Image, Settings, LogOut, ChevronLeft, Menu, Leaf, Truck, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Alerts & Orders', to: '/admin/alerts', icon: Bell },
  { label: 'Products', to: '/admin/products', icon: Package },
  { label: 'Categories', to: '/admin/categories', icon: FolderTree },
  { label: 'Orders', to: '/admin/orders', icon: ShoppingCart },
  { label: 'Coupons', to: '/admin/coupons', icon: Ticket },
  { label: 'Customers', to: '/admin/customers', icon: Users },
  { label: 'Banners', to: '/admin/banners', icon: Image },
  { label: 'Shipping', to: '/admin/shipping', icon: Truck },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    // The outer wrapper is locked to exactly the screen width — no overflow allowed here
    <div style={{ width: '100vw', maxWidth: '100vw', overflowX: 'hidden' }} className="min-h-screen flex bg-background">
      
      {/* ── Sidebar: uses fixed + translate so it never participates in layout width ── */}
      <aside
        style={{ width: collapsed ? '4rem' : '15rem' }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 border-r border-sidebar-border",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!collapsed && (
            <Link to="/admin" className="flex items-center gap-2 min-w-0">
              <Leaf className="h-6 w-6 flex-shrink-0 text-sidebar-primary" />
              <span className="font-display font-bold text-sm truncate">PANDIYIN Admin</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent flex-shrink-0"
            onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.to || (item.to !== '/admin' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className={cn("w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent", collapsed && "justify-center")}
            onClick={() => { signOut(); navigate('/'); }}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="ml-3">Sign Out</span>}
          </Button>
          <Button
            variant="ghost"
            className={cn("w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent mt-1", collapsed && "justify-center")}
            onClick={() => navigate('/')}
          >
            <Leaf className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="ml-3">View Store</span>}
          </Button>
        </div>
      </aside>

      {/* ── Main content: offset by sidebar width on desktop, full width on mobile ── */}
      <div
        className="flex flex-col flex-1 transition-all duration-300"
        style={{ marginLeft: 0 }}
      >
        {/* Spacer so content doesn't go under the desktop sidebar */}
        <div className={cn("hidden md:block flex-shrink-0 transition-all duration-300", collapsed ? "w-16" : "w-60")} style={{ display: 'none' }} />

        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b h-14 flex items-center px-4 md:px-6">
          <Button variant="ghost" size="icon" className="md:hidden mr-2 flex-shrink-0" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div
            className="hidden md:block flex-shrink-0 transition-all duration-300"
            style={{ width: collapsed ? '4rem' : '15rem' }}
          />
          <h2 className="font-display font-semibold text-lg">
            {navItems.find(i => i.to === location.pathname || (i.to !== '/admin' && location.pathname.startsWith(i.to)))?.label || 'Admin'}
          </h2>
        </header>

        {/* Content area: left padding on desktop to clear the fixed sidebar; scrolls horizontally for wide tables */}
        <main
          className="flex-1 p-4 md:p-6 overflow-x-auto"
          style={{ paddingLeft: undefined }}
        >
          {/* Desktop: push content past sidebar using a wrapper */}
          <div className="md:hidden" />
          <div
            className="w-full"
            style={{ minWidth: 0 }}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden z-40"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}
