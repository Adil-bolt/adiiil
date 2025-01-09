import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'axios': path.resolve(__dirname, './node_modules/axios'),
    },
  },
  server: {
    host: true, // Écoute sur toutes les interfaces réseau
    port: 5173,
    open: true,
    watch: {
      usePolling: true,
    },
    hmr: {
      overlay: true,
    },
  },
  preview: {
    host: true, // Écoute sur toutes les interfaces réseau pour le mode preview aussi
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react'],
        }
      }
    },
    watch: {}
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
  },
});