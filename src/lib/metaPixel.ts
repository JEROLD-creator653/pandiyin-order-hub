// Meta (Facebook) Pixel helper utilities.
// The base pixel script is loaded inline in index.html with PageView fired once on initial load.
// These helpers safely no-op if fbq is not yet available (SSR, ad-blockers, etc).

export const META_PIXEL_ID = '962826566368029';

type Fbq = (...args: any[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

const fbq = (...args: any[]): void => {
  if (typeof window === 'undefined') return;
  try {
    if (typeof window.fbq === 'function') {
      window.fbq(...args);
    }
  } catch {
    // swallow — analytics must never break the app
  }
};

/**
 * Initialise the Meta Pixel if it hasn't been loaded yet.
 * Safe to call multiple times — guarded by `_initialized` flag.
 */
let initialized = false;
export const initMetaPixel = (pixelId: string = META_PIXEL_ID): void => {
  if (typeof window === 'undefined' || initialized) return;
  // The base script in index.html already runs `fbq('init', ...)` and `PageView`.
  // We still mark as initialised so re-inits don't double-fire.
  initialized = true;
  if (typeof window.fbq !== 'function') {
    // If the inline script failed for any reason, attempt re-init.
    fbq('init', pixelId);
    fbq('track', 'PageView');
  }
};

export const trackPageView = (): void => {
  fbq('track', 'PageView');
};

interface ProductLike {
  id: string;
  name?: string;
  price?: number;
}

export const trackViewContent = (product: ProductLike): void => {
  fbq('track', 'ViewContent', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value: product.price,
    currency: 'INR',
  });
};

export const trackAddToCart = (product: ProductLike, quantity: number = 1): void => {
  fbq('track', 'AddToCart', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value: (product.price ?? 0) * quantity,
    currency: 'INR',
  });
};

interface CartLike {
  items: Array<{ product_id: string; quantity: number }>;
  value: number;
}

export const trackInitiateCheckout = (cart: CartLike): void => {
  const numItems = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  fbq('track', 'InitiateCheckout', {
    content_ids: cart.items.map(i => i.product_id),
    num_items: numItems,
    value: cart.value,
    currency: 'INR',
  });
};

interface OrderLike {
  id: string;
  value: number;
  content_ids?: string[];
}

// De-dupe Purchase per order id (covers React StrictMode + back/forward nav).
const firedPurchases = new Set<string>();
export const trackPurchase = (order: OrderLike): void => {
  if (firedPurchases.has(order.id)) return;
  firedPurchases.add(order.id);
  fbq('track', 'Purchase', {
    content_ids: order.content_ids ?? [],
    value: order.value,
    currency: 'INR',
  });
};
