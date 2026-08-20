import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    host: '0.0.0.0',

    // Vercel dev'in verdiği PORT'u kullanır.
    // Yoksa 3000 üzerinden çalışır.
    port: Number(process.env.PORT) || 3000,

    proxy: {
      '/api-cloudflare': {
        target: 'https://api.cloudflare.com/client/v4',
        changeOrigin: true,
        secure: true,
        rewrite: (path) =>
          path.replace(/^\/api-cloudflare/, ''),
      },
    },
  },
});