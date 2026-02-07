import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail, Phone, MapPin, Instagram } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Footer() {
  const [store, setStore] = useState({ phone: '+91 98765 43210', email: 'hello@pandiyin.com', address: 'Madurai, Tamil Nadu', instagram: '' });

  useEffect(() => {
    supabase.from('store_settings').select('*').limit(1).maybeSingle().then(({ data }) => {
      if (data) {
        setStore({
          phone: data.phone || '+91 98765 43210',
          email: data.email || 'hello@pandiyin.com',
          address: data.address || 'Madurai, Tamil Nadu',
          instagram: data.instagram || ''
        });
      }
    });
  }, []);
  return (
    <footer className="bg-foreground text-primary-foreground pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="h-6 w-6" />
              <span className="text-xl font-display font-bold">PANDIYIN</span>
            </div>
            <p className="text-sm opacity-80">Nature In Every Pack. Authentic homemade foods from the heart of Madurai, crafted with love and tradition.</p>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2 text-sm opacity-80">
              <Link to="/products" className="hover:opacity-100 transition-opacity">All Products</Link>
              <Link to="/about" className="hover:opacity-100 transition-opacity">About Us</Link>
              <Link to="/dashboard" className="hover:opacity-100 transition-opacity">My Orders</Link>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-4">Categories</h4>
            <div className="flex flex-col gap-2 text-sm opacity-80">
              <Link to="/products?category=Pickles" className="hover:opacity-100 transition-opacity">Pickles</Link>
              <Link to="/products?category=Snacks" className="hover:opacity-100 transition-opacity">Snacks</Link>
              <Link to="/products?category=Spice Powders" className="hover:opacity-100 transition-opacity">Spice Powders</Link>
              <Link to="/products?category=Sweets" className="hover:opacity-100 transition-opacity">Sweets</Link>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-4">Contact</h4>
            <div className="flex flex-col gap-3 text-sm opacity-80">
              <a href={`tel:${store.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:opacity-100 transition-opacity cursor-pointer">
                <Phone className="h-4 w-4" /> {store.phone}
              </a>
              <a href={`mailto:${store.email}`} className="flex items-center gap-2 hover:opacity-100 transition-opacity cursor-pointer">
                <Mail className="h-4 w-4" /> {store.email}
              </a>
              <a 
                href={`https://www.google.com/maps/search/${encodeURIComponent(store.address)}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 hover:opacity-100 transition-opacity cursor-pointer"
              >
                <MapPin className="h-4 w-4" /> {store.address}
              </a>
              {store.instagram && (
                <a href={store.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-100 transition-opacity cursor-pointer">
                  <Instagram className="h-4 w-4" /> Instagram
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 pt-6 text-center text-sm opacity-60">
          © {new Date().getFullYear()} PANDIYIN Nature In Pack. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
