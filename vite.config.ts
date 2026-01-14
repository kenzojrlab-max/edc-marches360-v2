import path from 'path';
import { defineConfig } from 'vite'; // loadEnv n'est plus nécessaire ici pour la config client
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  // SUPPRESSION DU BLOC 'define' QUI EXPOSAIT LA CLÉ
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});