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
import { statSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(RAIZ, 'dist');
const SSR = path.join(RAIZ, '.ssr-build', 'entry-server.js');

const { renderizar, listarRotas } = await import(pathToFileURL(SSR).href);

/** Uma consulta ao git por conjunto de arquivos, não uma por rota. */
const cacheDatas = new Map();

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

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  // Landings de anúncio ficam de fora: são `noindex` e pedir indexação de uma
  // página que manda o robô embora é contradição no mesmo arquivo.
  ...rotas.filter((rota) => !rota.foraDoSitemap).map((rota) =>
    [
      '  <url>',
      `    <loc>${enderecoBase}${rota.caminho}</loc>`,
      `    <lastmod>${atualizacaoDe(rota)}</lastmod>`,
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

/* --------------------------------------------- data real de cada página */

/**
 * Quando esta URL mudou de verdade.
 *
 * O `lastmod` só vale alguma coisa se for honesto. Carimbar a data do build em
 * todas as páginas faz o sitemap inteiro perder credibilidade — o Google
 * passa a ignorar o campo, e aí a página que realmente mudou não é recolhida
 * mais rápido, que é justamente o motivo de existir o sitemap.
 *
 * A data sai, em ordem: do próprio conteúdo (artigos declaram `atualizadoEm`),
 * do último commit que tocou os arquivos-fonte da página, ou — se não houver
 * git — da data do arquivo em disco.
 */
function atualizacaoDe(rota) {
  if (rota.atualizadoEm) return rota.atualizadoEm.slice(0, 10);
  return dataDoGit(fontesDaRota(rota.caminho));
}

/** De quais arquivos esta rota é feita. */
function fontesDaRota(caminho) {
  if (caminho === '/') return ['src/content/home.json', 'src/pages/Home.tsx'];
  if (caminho === '/areas-de-atuacao/') return ['src/content/areas.json', 'src/pages/AreasAtuacao.tsx'];
  if (caminho === '/sobre-advogado-cuiaba/') return ['src/content/sobre.json', 'src/pages/Sobre.tsx'];
  if (caminho === '/contato-advogado-cuiaba/') return ['src/pages/Contato.tsx', 'src/site.config.ts'];
  if (caminho === '/advogado-online-brasil/') return ['src/pages/AtendimentoBrasil.tsx'];
  if (caminho === '/artigos/') return ['src/content/artigos.json', 'src/pages/Artigos.tsx'];
  if (caminho.startsWith('/artigos/')) return ['src/content/artigos.json'];
  if (caminho === '/calculadoras/') {
    return ['src/content/calculadoras.json', 'src/pages/Calculadoras.tsx', 'src/pages/CalculadorasTrabalhistas.tsx'];
  }
  if (caminho.startsWith('/calculadoras/')) {
    return [
      'src/content/calculadoras.json',
      'src/pages/Calculadoras.tsx',
      'src/pages/CalculadorasTrabalhistas.tsx',
      'src/lib/calculoRescisao.ts',
      'src/lib/calculosTrabalhistas.ts',
    ];
  }
  if (caminho === '/politica-de-privacidade/' || caminho === '/termos-de-uso/') {
    return ['src/content/juridico.json'];
  }
  if (caminho === '/conta-encerrada/') {
    return [
      'src/pages/ContaEncerrada.tsx',
      'src/components/TriagemContaEncerrada.tsx',
      'src/lib/triagemContaEncerrada.ts',
    ];
  }
  // O mapa muda quando muda qualquer coleção que ele lista.
  if (caminho === '/mapa-do-site/') {
    return [
      'src/pages/MapaDoSite.tsx',
      'src/content/areas.json',
      'src/content/artigos.json',
      'src/content/calculadoras.json',
      'src/content/juridico.json',
    ];
  }
  // Sobraram as páginas de área, todas escritas no mesmo arquivo.
  return ['src/content/areas.json', 'src/pages/Area.tsx'];
}

function dataDoGit(arquivos) {
  const chave = arquivos.join('|');
  if (cacheDatas.has(chave)) return cacheDatas.get(chave);

  let data;
  try {
    // %cs já sai como AAAA-MM-DD, que é o formato aceito no <lastmod>.
    data = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...arquivos], {
      cwd: RAIZ,
      encoding: 'utf8',
    }).trim();
  } catch {
    data = '';
  }

  if (!data) {
    // Sem git (ou arquivo ainda não commitado): a data de disco é o que há.
    const tempos = arquivos.map((arquivo) => {
      try {
        return statSync(path.join(RAIZ, arquivo)).mtime.getTime();
      } catch {
        return 0;
      }
    });
    data = new Date(Math.max(...tempos, 0) || Date.now()).toISOString().slice(0, 10);
  }

  cacheDatas.set(chave, data);
  return data;
}

/** Lê o domínio direto do site.config.ts, sem precisar compilar TypeScript. */
async function lerEnderecoBase() {
  const config = await fs.readFile(path.join(RAIZ, 'src', 'site.config.ts'), 'utf8');
  const encontrado = /url:\s*'([^']+)'/.exec(config);
  return (encontrado?.[1] ?? 'https://pedromontalvao.com').replace(/\/$/, '');
}
