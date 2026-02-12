import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'antd',
      'firebase/app',
      'firebase/firestore',
      'firebase/auth',
      'firebase/storage',
      'recharts',
      'lucide-react',
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-antd': ['antd', 'antd-style'],
          'vendor-firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage'],
          'vendor-charts': ['recharts'],
          'vendor-xlsx': ['xlsx'],
        },
      },
    },
  },
});