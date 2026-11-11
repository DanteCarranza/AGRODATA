import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';

const proxy = { '/api': { target: 'http://localhost:3000', changeOrigin: true } };

// SINGLEFILE=1 genera un único index.html (solo para vistas previas/demos)
export default defineConfig({
  // Rutas relativas: el build funciona en la raíz del dominio o en una subcarpeta (/agrodatacore/)
  base: './',
  plugins: [react(), tailwindcss(), ...(process.env.SINGLEFILE ? [viteSingleFile()] : [])],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  // allowedHosts: true deja entrar dominios de túnel (pinggy, trycloudflare, devtunnels).
  // Sin esto Vite responde "Blocked request. This host is not allowed."
  server: { port: 5173, host: true, allowedHosts: true, proxy },
  preview: { port: 4173, host: true, allowedHosts: true, proxy },
});