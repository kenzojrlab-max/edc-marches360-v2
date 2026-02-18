import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
    visualizer({
      open: false,
      filename: 'bundle-analysis.html',
      gzipSize: true,
    }),
  ],
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
    target: 'es2020',
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || (id.includes('/react/') && !id.includes('react-router'))) {
              return 'vendor-react';
            }
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            if (id.includes('firebase/auth') || id.includes('@firebase/auth')) {
              return 'vendor-firebase-auth';
            }
            if (id.includes('firebase/firestore') || id.includes('@firebase/firestore')) {
              return 'vendor-firebase-firestore';
            }
            if (id.includes('firebase/storage') || id.includes('@firebase/storage')) {
              return 'vendor-firebase-storage';
            }
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'vendor-firebase-core';
            }
            if (id.includes('antd') || id.includes('antd-style')) {
              return 'vendor-antd';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }
          }
        },
      },
    },
  },
});