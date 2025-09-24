
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
    // Aggressive memory optimization
    target: 'esnext',
    minify: false, // Disable minification to save memory
    sourcemap: false, // Disable sourcemaps to save memory
    cssCodeSplit: false, // Disable CSS code splitting
    reportCompressedSize: false,
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        // Let Vite handle chunking automatically
        manualChunks: undefined,
        // Reduce chunk size to help with memory
        maxParallelFileOps: 2,
      },
      // Reduce memory usage during build
      maxParallelFileOps: 2,
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
    ],
    exclude: [
      // Exclude heavy dependencies to reduce memory usage
      'emoji-picker-react',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'recharts',
      'framer-motion'
    ]
  },
  // Performance optimizations
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    treeShaking: true,
    // Reduce memory usage
    minifySyntax: false,
    minifyWhitespace: false,
    minifyIdentifiers: false,
  },
}));
