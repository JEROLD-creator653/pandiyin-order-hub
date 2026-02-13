# Premium Loading System - Quick Reference

## 🎯 Auto-Loading (Default)
Already works automatically on ALL page navigation. **No code needed!**

```tsx
// These automatically trigger the loader:
<Link to="/products">Products</Link>
navigate('/cart')
Browser back/forward buttons
```

---

## 📦 Import Loaders

```tsx
// Option 1: Import from loaders barrel export
import { 
  useRouteLoader,    // Hook for manual control
  Loader,            // Page/section loader
  ButtonLoader,      // Button spinner
  SkeletonCard,      // Product skeleton
  TableSkeleton      // Table skeleton
} from '@/components/loaders';

// Option 2: Import directly
import { Loader } from '@/components/ui/loader';
import { useRouteLoader } from '@/contexts/RouteLoaderContext';
```

---

## 💻 Usage Examples

### 1. Manual Route Control (Advanced)
```tsx
function ProductsPage() {
  const { registerDataLoad, startRouteLoad, endRouteLoad } = useRouteLoader();
  
  useEffect(() => {
    const fetchData = async () => {
      // Register promise - loader waits for it
      const promise = supabase.from('products').select('*');
      registerDataLoad(promise);
      const { data } = await promise;
      setProducts(data);
    };
    fetchData();
  }, []);
}
```

### 2. Button Loading
```tsx
<Button disabled={isLoading}>
  {isLoading ? <ButtonLoader text="Saving..." /> : "Save"}
</Button>
```

### 3. Section Loading
```tsx
{isLoading ? (
  <Loader text="Loading..." size="lg" />
) : (
  <ProductList products={products} />
)}
```

### 4. Skeleton Loading
```tsx
{isLoading ? (
  <SkeletonCard count={8} />  // 8 product skeletons
) : (
  <ProductGrid products={products} />
)}

{isLoading ? (
  <TableSkeleton rows={10} columns={5} />
) : (
  <DataTable data={orders} />
)}
```

### 5. Force Loading (Custom Duration)
```tsx
const { forceLoad } = useRouteLoader();

await forceLoad(2500); // Force 2.5 second load
```

---

## ⚙️ Configuration

Edit `App.tsx` to change global settings:

```tsx
<RouteLoaderProvider 
  minLoadDuration={2000}    // Min 2 seconds (default)
  maxLoadDuration={3000}    // Max 3 seconds (default)
  autoTrigger={true}        // Auto on navigation (default)
  excludePaths={['/auth']}  // Exclude these paths
>
```

---

## 🎨 Components API

### Loader
```tsx
<Loader 
  text="Loading..."     // Optional text
  size="sm|md|lg"       // Size variant (default: md)
  className=""          // Custom classes
  delay={200}           // Delay before showing (ms)
/>
```

### ButtonLoader
```tsx
<ButtonLoader 
  text="Processing..."  // Loading text
  className=""          // Custom classes
/>
```

### SkeletonCard
```tsx
<SkeletonCard 
  count={8}             // Number of cards
  className=""          // Custom classes
/>
```

### TableSkeleton
```tsx
<TableSkeleton 
  rows={10}             // Number of rows
  columns={5}           // Number of columns
  className=""          // Custom classes
/>
```

---

## 🔧 Hook API

### useRouteLoader()
```tsx
const {
  isLoading,              // Current loading state
  startRouteLoad,         // Start loading (returns Promise)
  endRouteLoad,           // End loading (respects min duration)
  forceLoad,              // Force load for X ms (returns Promise)
  registerDataLoad        // Register data promise
} = useRouteLoader();

// Examples:
await startRouteLoad(2000);     // Start with 2s min
endRouteLoad();                 // End when ready
await forceLoad(3000);          // Force 3s load
registerDataLoad(fetchPromise); // Wait for data
```

---

## 📝 Key Features

✅ **Auto-triggers** on all navigation  
✅ **2-3 second** forced minimum display  
✅ **Premium animations** (Apple/Stripe style)  
✅ **Background preloading** for data/images  
✅ **Smooth transitions** with framer-motion  
✅ **Mobile responsive** and dark mode compatible  
✅ **TypeScript** fully typed  
✅ **Zero configuration** needed (works out of box)  

---

## 🚀 That's It!

The system is **already working**. Just navigate and enjoy the smooth loading experience!

For full documentation, see: [PREMIUM_LOADING_SYSTEM.md](PREMIUM_LOADING_SYSTEM.md)
