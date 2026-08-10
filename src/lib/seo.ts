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
    '@type': 'LegalService',
    '@id': `${SITE.url}/#escritorio`,
    name: SITE.nome,
    alternateName: SITE.nomeCurto,
    url: SITE.url,
    image: urlAbsoluta('/midia/marca-dourada.png'),
    logo: urlAbsoluta('/midia/logo-horizontal.png'),
    telephone: `+${SITE.telefoneE164}`,
    email: SITE.email,
    description:
      'Escritório de advocacia em Cuiabá com atendimento presencial e online nacional em Direito Trabalhista, Previdenciário, do Consumidor e de Família.',
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
    hasMap: SITE.mapa,
    sameAs: [SITE.instagram, SITE.linkedin],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: `+${SITE.telefoneE164}`,
      contactType: 'Atendimento jurídico',
      availableLanguage: ['Portuguese'],
      areaServed: 'BR',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00',
      },
    ],
    knowsLanguage: ['pt-BR'],
    knowsAbout: [
      'Direito Trabalhista',
      'Direito Previdenciário',
      'Direito do Consumidor',
      'Direito de Família',
    ],
    founder: dadosDoAdvogado(),
  };
}

export function dadosDoAdvogado(): Record<string, unknown> {
  return {
    '@type': 'Person',
    '@id': `${SITE.url}/#advogado`,
    name: SITE.advogado,
    alternateName: SITE.nomeCurto,
    url: urlAbsoluta('/sobre-advogado-cuiaba/'),
    jobTitle: 'Advogado',
    image: urlAbsoluta('/midia/retrato-pedro-montalvao.webp'),
    identifier: {
      '@type': 'PropertyValue',
      name: 'Ordem dos Advogados do Brasil — Seccional Mato Grosso',
      value: oabFormatada(),
    },
    alumniOf: {
      '@type': 'CollegeOrUniversity',
      name: 'Universidade de Cuiabá — UNIC',
    },
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      name: 'Pós-graduação em Direito e Processo do Trabalho',
      credentialCategory: 'Pós-graduação lato sensu',
    },
    knowsAbout: [
      'Direito Trabalhista',
      'Direito Previdenciário',
      'Direito do Consumidor',
      'Direito de Família',
    ],
    sameAs: [
      SITE.instagram,
      SITE.linkedin,
    ],
    worksFor: { '@id': `${SITE.url}/#escritorio` },
    workLocation: {
      '@type': 'Place',
      name: SITE.nome,
      address: ENDERECO_LINHA,
    },
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
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: urlAbsoluta(`/${area.slug}/`),
      availableLanguage: { '@type': 'Language', name: 'Português', alternateName: 'pt-BR' },
    },
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
