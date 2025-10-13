
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  // Use absolute path for assets to work correctly on all routes
  base: "/",

  // explicitly target output dir
  build: {
    outDir: "dist",
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize chunk size
    chunkSizeWarningLimit: 800,
    // Minify output
    minify: "terser",
    // Terser options for better minification
    terserOptions: {
      compress: {
        drop_console: mode === "production",
        drop_debugger: true
      }
    },
    // Optimize rollup output
    rollupOptions: {
      output: {
        // Use function form for manualChunks
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-router-dom') || 
              id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@radix-ui') || id.includes('/components/ui/')) {
            return 'vendor-ui';
          }
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-animations';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },

  server: {
    host: "::",
    port: 8080,
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom']
  },
  
  // Optimize dependencies scanning
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', '@tanstack/react-query'],
    exclude: ['@capacitor/core']
  },
}));
