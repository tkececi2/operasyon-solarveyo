import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    // Chunk size optimizations
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'ui-vendor': ['@headlessui/react', '@tremor/react', 'lucide-react', 'framer-motion'],
          'chart-vendor': ['recharts'],
          'utils-vendor': ['date-fns', 'react-hot-toast', 'react-hook-form', 'zod'],
          'export-vendor': ['jspdf', 'html2canvas', 'xlsx']
        }
      }
    },
    // Source map for production debugging
    sourcemap: false,
    // Minification
    minify: 'esbuild'
  },
  // Development optimizations
  server: {
    hmr: {
      overlay: false
    }
  },
  // Dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      '@tremor/react',
      'recharts',
      'lucide-react'
    ]
  }
})
