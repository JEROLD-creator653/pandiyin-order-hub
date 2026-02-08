# Product Recommendation System

## Overview
Intelligent product recommendation system for the Pandiyin Order Hub cart and checkout experience. Mimics professional e-commerce platforms like Amazon, Zepto, and Shopify by suggesting relevant products to increase cart value and improve user experience.

---

## Features

### ✨ Smart Recommendation Logic
- **Category-Based**: Recommends products from the same category as items in cart
- **Complementary Items**: Suggests items that pair well together (e.g., tea + snacks, millet + health powder)
- **Dynamic Updates**: Recommendations refresh automatically when cart changes
- **Filters Out Cart Items**: Never shows products already in the cart
- **Featured Fallback**: Shows featured products when no cart-based recommendations available

### 🎨 Premium UI/UX
- **Responsive Grid Layout**: 2 columns on mobile, up to 6 on desktop
- **Smooth Animations**: Staggered fade-in with Framer Motion
- **Hover Effects**: Lift animation, image zoom, and shadow enhancement
- **Loading Skeletons**: Smooth loading experience
- **Stock Indicators**: Shows "Only X left" badges for low stock items
- **Quick Add to Cart**: One-click add with instant feedback animation

### ⚡ Performance Optimized
- **Smart Caching**: 5-minute cache with React Query
- **Lazy Loading**: Images load on demand
- **Efficient Queries**: Batched database calls with proper indexing
- **Mobile-First**: Optimized for touch interactions and small screens

---

## File Structure

```
src/
├── hooks/
│   └── useProductRecommendations.tsx    # Core recommendation logic & API
├── components/
│   └── ProductRecommendations.tsx       # UI component for displaying recommendations
└── pages/
    └── Cart.tsx                         # Integrated into cart page
```

---

## Implementation Details

### 1. Recommendation Hook (`useProductRecommendations.tsx`)

**Scoring Algorithm:**
```typescript
- Same category: +10 points
- Complementary item: +15 points
- Featured product: +5 points
- New product (<30 days): +2 points
```

**Complementary Item Mappings:**
```typescript
const COMPLEMENTARY_ITEMS = {
  'millet': ['health powder', 'tea', 'snacks', 'health mix'],
  'tea': ['snacks', 'millet', 'health powder', 'biscuits'],
  'health powder': ['millet', 'tea', 'health mix'],
  'snacks': ['tea', 'juice', 'drinks'],
  'spices': ['millet', 'rice', 'dals'],
};
```

**Query Optimization:**
- Uses TanStack Query for caching and background refetching
- 5-minute stale time to reduce unnecessary API calls
- Depends on cart items (re-fetches when cart changes)

### 2. Recommendations Component (`ProductRecommendations.tsx`)

**Props:**
```typescript
interface ProductRecommendationsProps {
  cartItems: CartItem[];       // Current cart items
  maxItems?: number;           // Maximum recommendations (default: 6)
  title?: string;              // Section title (default: "You may also like")
}
```

**Features:**
- Responsive grid (2-6 columns based on screen size)
- Animated "Added to Cart" feedback with checkmark
- Stock status badges
- Smooth hover transitions (lift + shadow)
- Image zoom on hover
- Clickable cards linking to product detail pages

### 3. Cart Integration

**Placement:**
```
┌─────────────────────────────┐
│  Shopping Cart Header       │
├─────────────────────────────┤
│  Cart Items (Left Column)   │
│  Order Summary (Right)      │
├─────────────────────────────┤
│  Product Recommendations    │  ← Full width below cart
├─────────────────────────────┤
│  Checkout Button            │
└─────────────────────────────┘
```

**Empty Cart Behavior:**
- Shows "Featured Products" when cart is empty
- Encourages browsing and initial purchase

---

## Customization Guide

### Change Recommendation Titles
Edit the `title` prop in Cart.tsx:

```tsx
<ProductRecommendations 
  cartItems={items} 
  maxItems={6}
  title="Frequently bought together"  // Or "Add these to your order", "Complete your order"
/>
```

### Adjust Number of Recommendations
Change `maxItems` prop (recommended: 4-8):

```tsx
<ProductRecommendations 
  cartItems={items} 
  maxItems={4}  // Show only 4 items
/>
```

### Modify Complementary Items
Edit `COMPLEMENTARY_ITEMS` in `useProductRecommendations.tsx`:

```typescript
const COMPLEMENTARY_ITEMS: Record<string, string[]> = {
  'your-category': ['recommended', 'items', 'here'],
};
```

### Change Grid Layout
Edit grid classes in `ProductRecommendations.tsx`:

```tsx
// Current: 2 → 3 → 4 → 6 columns
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">

// Example: 3 → 4 → 5 columns
<div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
```

---

## Database Requirements

Products table must have:
- `id`: Unique identifier
- `name`: Product name
- `price`: Product price
- `image_url`: Product image URL
- `stock_quantity`: Available stock
- `is_available`: Availability flag
- `is_featured`: Featured status
- `category_id`: Category reference
- `created_at`: Timestamp for new product detection

Categories table must have:
- `id`: Unique identifier
- `name`: Category name (used for matching complementary items)

---

## Performance Considerations

### Caching Strategy
- **React Query Cache**: 5 minutes
- **Disabled on Cart Change**: Recommendations update when cart items change
- **Background Refetch**: Automatic updates when data becomes stale

### Query Optimization
- Limits initial fetch to 50 products
- Filters on database side (is_available, stock_quantity > 0)
- Excludes cart items using SQL NOT IN clause
- Scoring happens client-side for flexibility

### Image Optimization
- Uses `loading="lazy"` for below-the-fold images
- Aspect ratio preserved to prevent layout shift
- Fallback icon for missing images

---

## Mobile Optimization

- **Touch-Friendly**: Large tap targets (buttons, cards)
- **Swipe Friendly**: Horizontal scroll if needed (grid wraps)
- **Reduced Animations**: Shorter delays for mobile performance
- **Responsive Text**: Scales appropriately on small screens
- **Optimized Images**: Lazy loading for bandwidth savings

---

## Testing Scenarios

### Test Case 1: Empty Cart
**Expected:** Shows "Featured Products" section with 6 featured items

### Test Case 2: Single Millet Product in Cart
**Expected:** Shows tea, health powder, snacks recommendations

### Test Case 3: Tea + Snacks in Cart
**Expected:** Shows millets, health powders, biscuits

### Test Case 4: All Products Already in Cart
**Expected:** Shows featured products as fallback

### Test Case 5: Mobile Device
**Expected:** 2-column grid, smooth touch interactions, fast loading

---

## Future Enhancements

### Short Term
- [ ] Add "Frequently Bought Together" bundles
- [ ] Show discount badges on recommended items
- [ ] Add "Quick View" modal for recommendations
- [ ] Track recommendation click-through rates

### Long Term
- [ ] Machine learning-based recommendations
- [ ] Personalized recommendations based on user history
- [ ] Collaborative filtering (users who bought X also bought Y)
- [ ] A/B testing different recommendation strategies
- [ ] Real-time analytics dashboard for recommendation performance

---

## Analytics Integration (Future)

Track these metrics:
- **Impression Rate**: How often recommendations are shown
- **Click-Through Rate**: Percentage of users clicking recommendations
- **Add-to-Cart Rate**: Percentage of recommendations added to cart
- **Revenue Impact**: Additional revenue from recommended products
- **Top Recommended Products**: Most frequently recommended items

---

## Troubleshooting

### No Recommendations Showing
1. Check if products have `is_available = true`
2. Verify `stock_quantity > 0`
3. Ensure categories are properly linked
4. Check browser console for errors

### Recommendations Not Updating
1. Clear React Query cache: `queryClient.invalidateQueries(['recommendations'])`
2. Check cart items are properly passed as props
3. Verify Supabase connection
4. Check network tab for failed API calls

### Performance Issues
1. Reduce `maxItems` to 4
2. Increase `staleTime` in useQuery options
3. Optimize product images (compress, resize)
4. Check database indexes on `category_id`, `is_available`, `stock_quantity`

---

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 10+)

---

## Accessibility

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Focus Indicators**: Clear focus states for keyboard users
- **Alt Text**: All product images have descriptive alt attributes
- **Color Contrast**: WCAG AA compliant color combinations

---

## API Reference

### useProductRecommendations Hook

```typescript
const { data, isLoading, error } = useProductRecommendations(
  cartItems: CartItem[],
  maxRecommendations: number
);
```

**Returns:**
- `data`: Array of recommended Product objects
- `isLoading`: Boolean loading state
- `error`: Error object if query fails

### ProductRecommendations Component

```typescript
<ProductRecommendations 
  cartItems={items}          // Required: Current cart items
  maxItems={6}               // Optional: Max recommendations
  title="You may also like"  // Optional: Section title
/>
```

---

## Support & Maintenance

For issues or feature requests:
1. Check this documentation first
2. Review console logs and network requests
3. Test in isolated environment
4. Check Supabase query logs
5. Contact development team with reproduction steps

---

**Last Updated:** February 8, 2026  
**Version:** 1.0.0  
**Author:** Pandiyin Development Team
