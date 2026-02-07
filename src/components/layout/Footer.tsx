import { Link } from 'react-router-dom';
import { Leaf, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
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
              <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> +91 98765 43210</span>
              <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@pandiyin.com</span>
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Madurai, Tamil Nadu</span>
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
