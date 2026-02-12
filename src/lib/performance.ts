/**
 * Performance utilities for document head optimization
 * - Preload critical resources
 * - DNS prefetch external services
 * - Prefetch next likely pages
 */

export function setupPerformanceOptimizations() {
  // Prefetch DNS for external services
  const dns = [
    'https://cdn.supabase.io',
    'https://images.unsplash.com',
  ];

  dns.forEach((hostname) => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = hostname;
    document.head.appendChild(link);
  });

  // Preconnect to Supabase
  const preconnect = document.createElement('link');
  preconnect.rel = 'preconnect';
  preconnect.href = 'https://supabase.co';
  document.head.appendChild(preconnect);

  // Prefetch probable next routes
  const nextRoutes = ['products', 'cart', 'about'];
  nextRoutes.forEach((route) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `/${route}`;
    document.head.appendChild(link);
  });
}

/**
 * Optimize LCP (Largest Contentful Paint) by preloading critical images
 */
export function preloadCriticalImages(imageUrls: string[]) {
  imageUrls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.type = 'image/webp';
    document.head.appendChild(link);
  });
}

/**
 * Lazy load non-critical CSS
 */
export function lazyLoadCSS(href: string) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.media = 'print';
  link.onload = () => {
    link.media = 'all';
  };
  document.head.appendChild(link);
}

/**
 * Enable service worker for offline support and caching
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    });
  }
}

/**
 * Monitor and report Web Vitals for performance tracking
 */
export function trackWebVitals() {
  // Largest Contentful Paint
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', (lastEntry as any).renderTime || (lastEntry as any).loadTime);
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    const fiobserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        console.log('FID:', (entry as any).processingDuration);
      });
    });
    fiobserver.observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    const clsobserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let clsValue = 0;
      entries.forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      console.log('CLS:', clsValue);
    });
    clsobserver.observe({ entryTypes: ['layout-shift'] });
  }
}
