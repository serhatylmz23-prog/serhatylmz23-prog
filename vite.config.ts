import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],

  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    port: 5173,
    proxy: {
      // Yerel geliştirmede gizli anahtarlar tarayıcıya verilmez. İstekler,
      // local-api.js üzerinde çalışan dar kapsamlı sunucu uç noktalarına gider.
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: false,
      },
    },
  },

  preview: {
    host: '0.0.0.0',
  },
});