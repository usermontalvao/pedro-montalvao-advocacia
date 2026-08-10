import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Site institucional — projeto SEPARADO do CRM de propósito: ele sobe sozinho
 * (Netlify/Vercel/hospedagem estática) e não carrega nada do build pesado do
 * sistema. Aqui não há backend: o conteúdo vive em `src/content/*.json` e os
 * contatos ficam no navegador do visitante até virarem mensagem de WhatsApp.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    // O prerender (scripts/prerender.mjs) precisa do template original de
    // index.html para injetar o HTML de cada rota, então ele roda depois.
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 2048,
  },
  server: { port: 4321, open: true },
});
