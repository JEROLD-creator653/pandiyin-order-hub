import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "ES2020",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-dropdown-menu'],
          supabase: ['@supabase/supabase-js'],
          animations: ['framer-motion'],
          query: ['@tanstack/react-query'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    reportCompressedSize: true,
    sourcemap: false,
  },
  css: {
    devSourcemap: false,
  },
}));
