
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Simplified build configuration to prevent memory issues
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: mode === 'development',
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Let Vite handle chunking automatically to prevent memory issues
        manualChunks: undefined,
      }
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'date-fns',
      'recharts',
      'framer-motion',
      'lucide-react'
    ],
    exclude: [
      // Exclude large dependencies that should be loaded lazily
      'emoji-picker-react'
    ]
  },
  // Performance optimizations
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    // Tree shaking optimizations
    treeShaking: true,
  },
}));
