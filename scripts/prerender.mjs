/**
 * Transforma o site em páginas estáticas.
 *
 * Um site em React normalmente entrega um HTML vazio e monta tudo no
 * navegador. Para busca orgânica isso é um risco desnecessário: o rastreador
 * precisa executar JavaScript para ver o texto. Aqui cada rota é renderizada
 * no Node e gravada como `dist/<rota>/index.html`, com título, descrição,
 * canonical e dados estruturados já dentro da resposta. O JavaScript continua
 * indo junto — ele apenas assume o controle depois (hidratação).
 *
 * Roda no fim de `npm run build`, depois do build do cliente e do de servidor.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(RAIZ, 'dist');
const SSR = path.join(RAIZ, '.ssr-build', 'entry-server.js');

const { renderizar, listarRotas } = await import(pathToFileURL(SSR).href);

const template = await fs.readFile(path.join(DIST, 'index.html'), 'utf8');
const rotas = listarRotas();

// O template gerado pelo Vite tem o título provisório; ele sai antes de
// entrarem as tags reais de cada rota.
const base = template.replace(/\s*<title>[\s\S]*?<\/title>/, '');

let geradas = 0;

for (const rota of rotas) {
  const { html, head } = renderizar(rota.caminho);

  const pagina = base
    .replace('<!--cabeca-->', head)
    .replace('<div id="raiz"></div>', `<div id="raiz">${html}</div>`);

  const destino =
    rota.caminho === '/'
      ? path.join(DIST, 'index.html')
      : path.join(DIST, rota.caminho, 'index.html');

  await fs.mkdir(path.dirname(destino), { recursive: true });
  await fs.writeFile(destino, pagina, 'utf8');
  geradas += 1;
  console.log('  html  ', rota.caminho);
}

// Página de erro: hospedagens estáticas servem 404.html automaticamente.
{
  const { html, head } = renderizar('/404/');
  const pagina = base
    .replace('<!--cabeca-->', head)
    .replace('<div id="raiz"></div>', `<div id="raiz">${html}</div>`);
  await fs.writeFile(path.join(DIST, '404.html'), pagina, 'utf8');
}

/* ----------------------------------------------------- sitemap e robots */

const enderecoBase = await lerEnderecoBase();
const hoje = new Date().toISOString().slice(0, 10);

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...rotas.map((rota) =>
    [
      '  <url>',
      `    <loc>${enderecoBase}${rota.caminho}</loc>`,
      `    <lastmod>${hoje}</lastmod>`,
      `    <priority>${rota.prioridade.toFixed(2)}</priority>`,
      '  </url>',
    ].join('\n'),
  ),
  '</urlset>',
  '',
].join('\n');

await fs.writeFile(path.join(DIST, 'sitemap.xml'), sitemap, 'utf8');

const robots = [
  'User-agent: *',
  'Allow: /',
  '',
  `Sitemap: ${enderecoBase}/sitemap.xml`,
  '',
].join('\n');

await fs.writeFile(path.join(DIST, 'robots.txt'), robots, 'utf8');

console.log(`\n  ✓ ${geradas} páginas estáticas + 404 + sitemap.xml + robots.txt em dist/\n`);

/** Lê o domínio direto do site.config.ts, sem precisar compilar TypeScript. */
async function lerEnderecoBase() {
  const config = await fs.readFile(path.join(RAIZ, 'src', 'site.config.ts'), 'utf8');
  const encontrado = /url:\s*'([^']+)'/.exec(config);
  return (encontrado?.[1] ?? 'https://www.advcuiaba.com').replace(/\/$/, '');
}
