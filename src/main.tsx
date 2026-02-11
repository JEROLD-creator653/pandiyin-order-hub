import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./global-animations.css";
import { setupPerformanceOptimizations, trackWebVitals } from "./lib/performance";

// Initialize performance optimizations
setupPerformanceOptimizations();
trackWebVitals();

createRoot(document.getElementById("root")!).render(<App />);
