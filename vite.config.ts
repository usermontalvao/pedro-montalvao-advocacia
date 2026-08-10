import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gerarRobots, gerarSitemap, lerEnderecoBase } from './scripts/sitemap.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Entrega os arquivos técnicos também no `vite`, não só depois do prerender.
 * Assim, `/sitemap.xml` e `/robots.txt` não caem na rota React de 404 durante
 * a edição local do site.
 */
function arquivosTecnicos() {
  return {
    name: 'arquivos-tecnicos',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use(async (requisicao, resposta, proximo) => {
        const caminho = requisicao.url?.split('?')[0];
        if (caminho !== '/sitemap.xml' && caminho !== '/robots.txt') {
          proximo();
          return;
        }

        try {
          const { listarRotas } = await server.ssrLoadModule('/src/entry-server.tsx');
          const enderecoBase = await lerEnderecoBase(__dirname);
          const conteudo = caminho === '/sitemap.xml'
            ? gerarSitemap(listarRotas(), __dirname, enderecoBase)
            : gerarRobots(enderecoBase);

          resposta.statusCode = 200;
          resposta.setHeader('Content-Type', caminho === '/sitemap.xml'
            ? 'application/xml; charset=utf-8'
            : 'text/plain; charset=utf-8');
          resposta.end(conteudo);
        } catch (erro) {
          proximo(erro as Error);
        }
      });
    },
  };
}

/**
 * Site institucional — projeto SEPARADO do CRM de propósito: ele sobe sozinho
 * (Netlify/Vercel/hospedagem estática) e não carrega nada do build pesado do
 * sistema. Aqui não há backend: o conteúdo vive em `src/content/*.json` e os
 * contatos ficam no navegador do visitante até virarem mensagem de WhatsApp.
 */
export default defineConfig({
  plugins: [react(), arquivosTecnicos()],
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
