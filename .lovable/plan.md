

# PANDIYIN Nature In Pack — Premium E-Commerce Platform

## Brand & Design
- **Color palette**: Organic green + warm beige/cream luxury tones
- **Typography**: Modern, clean fonts with premium feel
- **Animations**: Smooth page transitions, hover effects, subtle micro-interactions
- **Mobile-first responsive design** across all pages

---

## Phase 1: Foundation (Backend + Auth)

### Supabase Cloud Setup
- Database tables: products, categories, orders, order_items, coupons, banners, delivery_settings, cart_items
- User profiles table with delivery addresses
- User roles table (admin role for dashboard access)
- Supabase Storage buckets for product images and banners

### Authentication
- Email signup/login for customers
- Protected admin routes with role-based access
- User session management

---

## Phase 2: Customer Storefront

### Homepage
- Hero banner carousel (admin-controlled)
- Featured products section
- Category showcase
- Brand story section
- WhatsApp floating chat button

### Product Browsing
- Product listing page with category filtering
- Search functionality
- Product detail page with images, description, pricing
- "Add to Cart" and "Buy Now" buttons

### Shopping Cart & Checkout
- Cart with quantity management
- Coupon code application
- Delivery address form (Madurai local delivery)
- Delivery charges display (admin-configurable)
- Payment options: Stripe (cards/UPI), Cash on Delivery
- Order confirmation page

### Customer Dashboard
- Order history with status tracking
- Profile & address management
- Saved addresses for quick checkout

---

## Phase 3: Admin Dashboard

### Dashboard Home
- Revenue overview with charts (daily/weekly/monthly)
- Order count & status summary
- Low stock alerts
- Recent orders feed

### Product Management
- Add/edit/delete products with image upload
- Stock quantity management
- Category assignment
- Price and description editing

### Category Management
- Create/edit/delete product categories
- Category ordering

### Order Management
- View all orders with filters (status, date)
- Update order status (Pending → Processing → Shipped → Delivered)
- Order detail view with customer info

### Coupon Management
- Create discount coupons (percentage or fixed)
- Set expiry dates and usage limits

### User Management
- View registered customers
- Customer order history

### Banner Control
- Upload/manage homepage banners
- Set banner order and active status

### Settings
- Configure delivery charges
- Store settings

---

## Phase 4: Payments (Stripe)

- Stripe integration for card and UPI payments
- COD option as alternative
- Payment status tracking in admin dashboard

---

## Key Features Across the App
- WhatsApp integration (floating button linking to business WhatsApp)
- Toast notifications for cart actions and order updates
- SEO-friendly page titles and structure
- Fast loading with optimized images

