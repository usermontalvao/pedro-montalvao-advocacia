import { SITE, ENDERECO_LINHA, oabFormatada } from '../site.config';

/**
 * Tudo que vai para dentro do <head> de cada página.
 *
 * Como o site é pré-renderizado, esses dados não são aplicados no navegador:
 * eles são escritos direto no HTML pelo script de prerender. O Google recebe
 * título, descrição, canonical e dados estruturados já na primeira resposta,
 * sem depender de JavaScript.
 */
export type Seo = {
  titulo: string;
  descricao: string;
  caminho: string;
  imagem?: string;
  tipo?: 'website' | 'article';
  publicadoEm?: string;
  atualizadoEm?: string;
  naoIndexar?: boolean;
  dados?: Record<string, unknown>[];
};

export function urlAbsoluta(caminho: string): string {
  if (caminho.startsWith('http')) return caminho;
  const limpo = caminho.startsWith('/') ? caminho : `/${caminho}`;
  return `${SITE.url}${limpo}`;
}

/** Ficha do escritório: é ela que alimenta o painel de conhecimento do Google. */
export function dadosDoEscritorio(): Record<string, unknown> {
  return {
    '@type': ['LegalService', 'Attorney'],
    '@id': `${SITE.url}/#escritorio`,
    name: SITE.nome,
    url: SITE.url,
    image: urlAbsoluta('/midia/marca-dourada.png'),
    logo: urlAbsoluta('/midia/logo-horizontal.png'),
    telephone: `+${SITE.telefoneE164}`,
    email: SITE.email,
    priceRange: '$$',
    description:
      'Escritório de advocacia em Cuiabá com atuação em Direito Trabalhista, Previdenciário, do Consumidor e de Família, com atendimento presencial e online.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.endereco.logradouro,
      addressLocality: SITE.endereco.cidade,
      addressRegion: SITE.endereco.uf,
      postalCode: SITE.endereco.cep,
      addressCountry: SITE.endereco.pais,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE.endereco.latitude,
      longitude: SITE.endereco.longitude,
    },
    areaServed: [
      { '@type': 'City', name: 'Cuiabá' },
      { '@type': 'State', name: 'Mato Grosso' },
      { '@type': 'Country', name: 'Brasil' },
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00',
      },
    ],
    knowsLanguage: 'pt-BR',
    founder: dadosDoAdvogado(),
  };
}

export function dadosDoAdvogado(): Record<string, unknown> {
  return {
    '@type': 'Person',
    '@id': `${SITE.url}/#advogado`,
    name: `Dr. ${SITE.advogado}`,
    jobTitle: 'Advogado',
    image: urlAbsoluta('/midia/retrato-pedro-montalvao.webp'),
    ...(SITE.oab
      ? {
          identifier: {
            '@type': 'PropertyValue',
            name: 'OAB',
            value: oabFormatada(),
          },
        }
      : {}),
    worksFor: { '@id': `${SITE.url}/#escritorio` },
    address: ENDERECO_LINHA,
  };
}

export function dadosDeNavegacao(
  trilha: { nome: string; caminho: string }[],
): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trilha.map((item, indice) => ({
      '@type': 'ListItem',
      position: indice + 1,
      name: item.nome,
      item: urlAbsoluta(item.caminho),
    })),
  };
}

export function dadosDePerguntas(
  perguntas: { pergunta: string; resposta: string }[],
): Record<string, unknown> {
  return {
    '@type': 'FAQPage',
    mainEntity: perguntas.map((item) => ({
      '@type': 'Question',
      name: item.pergunta,
      acceptedAnswer: { '@type': 'Answer', text: item.resposta },
    })),
  };
}

export function dadosDeServico(area: {
  nome: string;
  seoDescription: string;
  slug: string;
}): Record<string, unknown> {
  return {
    '@type': 'Service',
    serviceType: area.nome,
    name: `${area.nome} — ${SITE.nome}`,
    description: area.seoDescription,
    url: urlAbsoluta(`/${area.slug}/`),
    provider: { '@id': `${SITE.url}/#escritorio` },
    areaServed: [
      { '@type': 'City', name: 'Cuiabá' },
      { '@type': 'State', name: 'Mato Grosso' },
      { '@type': 'Country', name: 'Brasil' },
    ],
  };
}

export function dadosDeArtigo(artigo: {
  titulo: string;
  resumo: string;
  slug: string;
  publicadoEm: string;
  atualizadoEm: string;
  palavraChave: string;
}): Record<string, unknown> {
  const url = urlAbsoluta(`/artigos/${artigo.slug}/`);
  return {
    '@type': 'Article',
    headline: artigo.titulo,
    description: artigo.resumo,
    inLanguage: 'pt-BR',
    keywords: artigo.palavraChave,
    datePublished: artigo.publicadoEm,
    dateModified: artigo.atualizadoEm,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    image: urlAbsoluta('/og-imagem.png'),
    author: dadosDoAdvogado(),
    publisher: { '@id': `${SITE.url}/#escritorio` },
  };
}

/** Junta tudo num único <script type="application/ld+json"> por página. */
export function montarGrafo(dados: Record<string, unknown>[] = []): string {
  return JSON.stringify(
    { '@context': 'https://schema.org', '@graph': [dadosDoEscritorio(), ...dados] },
    null,
    0,
  );
}
