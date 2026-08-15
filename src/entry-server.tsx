import { renderToString } from 'react-dom/server';
import { App } from './App';
import { ROTAS } from './rotas';
import { montarGrafo, urlAbsoluta, type Seo } from './lib/seo';
import { SITE } from './site.config';

/**
 * Ponto de entrada usado só no build (`scripts/prerender.mjs`).
 *
 * Para cada rota ele devolve o HTML do corpo e as tags do <head>. É isso que
 * transforma um site em React num conjunto de páginas estáticas — cada URL
 * chega ao Google com o texto e os dados estruturados já dentro da resposta.
 */

export function listarRotas() {
  return ROTAS.map((rota) => ({
    caminho: rota.caminho,
    prioridade: rota.prioridade,
    /*
      Data real de atualização, quando existe (artigos a declaram). O sitemap
      usa isto no lugar da data do build — carimbar "hoje" em todas as páginas
      a cada publicação é justamente o padrão que faz o Google parar de
      confiar no `lastmod` do site inteiro.
    */
    atualizadoEm: rota.seo.atualizadoEm,
    // As landings de campanha são geradas em HTML como todas as outras, mas
    // não entram no sitemap — quem filtra é quem monta o XML.
    foraDoSitemap: rota.foraDoSitemap,
  }));
}

export function renderizar(caminho: string) {
  const rota = ROTAS.find((item) => item.caminho === caminho);
  const html = renderToString(<App caminho={caminho} />);
  return { html, head: montarCabeca(rota?.seo ?? seoDe404(caminho)) };
}

function seoDe404(caminho: string): Seo {
  return {
    titulo: 'Página não encontrada | Pedro Montalvão Advocacia',
    descricao: 'A página procurada não foi encontrada.',
    caminho,
    naoIndexar: true,
  };
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function montarCabeca(seo: Seo): string {
  const url = urlAbsoluta(seo.caminho);
  const imagem = urlAbsoluta(seo.imagem ?? '/og-imagem.png');
  const tipo = seo.tipo ?? 'website';

  const linhas = [
    `<title>${escapar(seo.titulo)}</title>`,
    `<meta name="description" content="${escapar(seo.descricao)}" />`,
    `<link rel="canonical" href="${url}" />`,
    seo.naoIndexar
      ? '<meta name="robots" content="noindex, follow" />'
      : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />',

    `<meta property="og:type" content="${tipo}" />`,
    `<meta property="og:site_name" content="${escapar(SITE.nome)}" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${escapar(seo.titulo)}" />`,
    `<meta property="og:description" content="${escapar(seo.descricao)}" />`,
    `<meta property="og:image" content="${imagem}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escapar(SITE.nome)} — ${escapar(seo.titulo)}" />`,

    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapar(seo.titulo)}" />`,
    `<meta name="twitter:description" content="${escapar(seo.descricao)}" />`,
    `<meta name="twitter:image" content="${imagem}" />`,
  ];

  if (seo.publicadoEm) {
    linhas.push(`<meta property="article:published_time" content="${seo.publicadoEm}" />`);
  }
  if (seo.atualizadoEm) {
    linhas.push(`<meta property="article:modified_time" content="${seo.atualizadoEm}" />`);
  }

  linhas.push(
    `<script type="application/ld+json">${montarGrafo(seo.dados)}</script>`,
  );

  return linhas.join('\n    ');
}
