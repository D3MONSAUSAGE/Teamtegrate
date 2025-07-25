
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
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'query-vendor': ['@tanstack/react-query'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'date-vendor': ['date-fns'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // Feature chunks - using actual file paths that exist
          'tasks': ['src/pages/TasksPage.tsx'],
          'projects': ['src/pages/ProjectsPage.tsx'],
          'calendar': ['src/pages/CalendarPage.tsx'],
          'chat': ['src/pages/ChatPage.tsx'],
          'reports': ['src/pages/ReportsPage.tsx'],
          'settings': ['src/pages/SettingsPage.tsx'],
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? path.basename(chunkInfo.facadeModuleId, path.extname(chunkInfo.facadeModuleId))
            : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        },
      },
    },
    // Optimize build performance
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: mode === 'development',
    // Reduce bundle size
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
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
