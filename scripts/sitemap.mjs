/**
 * Sitemap e robots — uma fonte só, usada pelo build e pelo servidor de dev.
 *
 * O arquivo nasce no `npm run build`, dentro de `dist/`. Só que em
 * desenvolvimento `dist/` não existe, e a página do mapa aponta para
 * `/sitemap.xml`: sem isto, o link responde 404 na máquina de quem edita o site
 * e dá a impressão de que o sitemap não foi feito. O plugin de dev em
 * `vite.config.ts` chama estas mesmas funções, então o que se vê no navegador
 * durante a edição é exatamente o que vai para o ar.
 */
import fs from 'node:fs/promises';
import { statSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/** Lê o domínio direto do site.config.ts, sem precisar compilar TypeScript. */
export async function lerEnderecoBase(raiz) {
  const config = await fs.readFile(path.join(raiz, 'src', 'site.config.ts'), 'utf8');
  const encontrado = /url:\s*'([^']+)'/.exec(config);
  return (encontrado?.[1] ?? 'https://pedromontalvao.com').replace(/\/$/, '');
}

export function gerarSitemap(rotas, raiz, enderecoBase) {
  // Uma consulta ao git por conjunto de arquivos, não uma por rota.
  const cacheDatas = new Map();

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    // Landings de anúncio ficam de fora: são `noindex` e pedir indexação de
    // uma página que manda o robô embora é contradição no mesmo arquivo.
    ...rotas.filter((rota) => !rota.foraDoSitemap).map((rota) =>
      [
        '  <url>',
        `    <loc>${enderecoBase}${rota.caminho}</loc>`,
        `    <lastmod>${atualizacaoDe(rota, raiz, cacheDatas)}</lastmod>`,
        `    <priority>${rota.prioridade.toFixed(2)}</priority>`,
        '  </url>',
      ].join('\n'),
    ),
    '</urlset>',
    '',
  ].join('\n');
}

export function gerarRobots(enderecoBase) {
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${enderecoBase}/sitemap.xml`, ''].join('\n');
}

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
function atualizacaoDe(rota, raiz, cacheDatas) {
  if (rota.atualizadoEm) return rota.atualizadoEm.slice(0, 10);
  return dataDoGit(fontesDaRota(rota.caminho), raiz, cacheDatas);
}

/** De quais arquivos esta rota é feita. */
function fontesDaRota(caminho) {
  // O aviso de golpe é da home: mudou o aviso, mudou a data da home.
  if (caminho === '/') {
    return ['src/content/home.json', 'src/pages/Home.tsx', 'src/components/AvisoDeGolpe.tsx'];
  }
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
  if (caminho === '/alerta-de-golpe/') {
    return [
      'src/pages/AlertaGolpe.tsx',
      'src/components/FitaCena.tsx',
      'src/lib/numeroOficial.ts',
      'src/site.config.ts',
    ];
  }
  if (caminho === '/conta-encerrada/') {
    return [
      'src/pages/ContaEncerrada.tsx',
      'src/components/TriagemContaEncerrada.tsx',
      'src/lib/triagemContaEncerrada.ts',
    ];
  }
  if (caminho === '/trabalho-sem-registro/') {
    return [
      'src/pages/SemRegistro.tsx',
      'src/components/TriagemSemRegistro.tsx',
      'src/lib/triagemSemRegistro.ts',
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

function dataDoGit(arquivos, raiz, cacheDatas) {
  const chave = arquivos.join('|');
  if (cacheDatas.has(chave)) return cacheDatas.get(chave);

  let data;
  try {
    // %cs já sai como AAAA-MM-DD, que é o formato aceito no <lastmod>.
    data = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...arquivos], {
      cwd: raiz,
      encoding: 'utf8',
    }).trim();
  } catch {
    data = '';
  }

  if (!data) {
    // Sem git (ou arquivo ainda não commitado): a data de disco é o que há.
    const tempos = arquivos.map((arquivo) => {
      try {
        return statSync(path.join(raiz, arquivo)).mtime.getTime();
      } catch {
        return 0;
      }
    });
    data = new Date(Math.max(...tempos, 0) || Date.now()).toISOString().slice(0, 10);
  }

  cacheDatas.set(chave, data);
  return data;
}
