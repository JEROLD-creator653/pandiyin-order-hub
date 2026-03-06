import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./global-animations.css";
import { setupPerformanceOptimizations, trackWebVitals } from "./lib/performance";

// Preload hero banner from cache BEFORE React renders
// This starts the image download as early as possible
(function preloadHeroBanner() {
  try {
    const cachedUrl = localStorage.getItem('hero_banner_url');
    if (cachedUrl) {
      const img = new Image();
      img.src = cachedUrl;
      // Store on window so React can check if it's already loaded
      (window as any).__heroBannerPreloaded = img;
    }
  } catch (e) {
    // localStorage may not be available
  }
})();

// Initialize performance optimizations
setupPerformanceOptimizations();
trackWebVitals();

createRoot(document.getElementById("root")!).render(<App />);
