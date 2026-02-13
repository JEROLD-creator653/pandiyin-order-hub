/**
 * Centralized export for all loader components
 * Use these components throughout the application for consistent loading states
 */

// Export individual loader components from ui/loader.tsx
export { 
  Loader,           // Generic full-page or section loader
  ButtonLoader,     // Inline button loading spinner
  SkeletonCard,     // Product card skeleton loader
  TableSkeleton     // Admin table skeleton loader
} from '../ui/loader';

// Export route loading hook
export { useRouteLoader } from '@/contexts/RouteLoaderContext';

/**
 * USAGE EXAMPLES:
 * 
 * 1. Auto Loading on Navigation (Already configured globally):
 *    - Automatically shows loader on every page transition
 *    - Configured in App.tsx via RouteLoaderProvider
 * 
 * 2. Manual Route Loading:
 *    ```tsx
 *    const { startRouteLoad, endRouteLoad, registerDataLoad } = useRouteLoader();
 *    
 *    // Start loading manually
 *    await startRouteLoad(2000); // 2 seconds minimum
 *    
 *    // Register data load promises
 *    const dataPromise = fetchProducts();
 *    registerDataLoad(dataPromise);
 *    await dataPromise;
 *    endRouteLoad();
 *    ```
 * 
 * 3. Button Loading:
 *    ```tsx
 *    <Button disabled={isLoading}>
 *      {isLoading ? <ButtonLoader text="Saving..." /> : "Save"}
 *    </Button>
 *    ```
 * 
 * 4. Section/Page Loading:
 *    ```tsx
 *    {isLoading ? <Loader text="Loading products..." size="lg" /> : <ProductList />}
 *    ```
 * 
 * 5. Skeleton Loaders:
 *    ```tsx
 *    {isLoading ? <SkeletonCard count={8} /> : <ProductGrid />}
 *    {isLoading ? <TableSkeleton rows={10} columns={5} /> : <DataTable />}
 *    ```
 */
