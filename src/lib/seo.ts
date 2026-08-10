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
    /*
      Dois tipos, do mais genérico ao mais específico. `LegalService` diz que é
      um serviço jurídico local; `Attorney` diz que é advocacia, e não cartório,
      despachante ou departamento jurídico. Quanto mais precisa a classe, menos
      o buscador precisa adivinhar de que negócio se trata.
    */
    '@type': ['LegalService', 'Attorney'],
    '@id': `${SITE.url}/#escritorio`,
    name: SITE.nome,
    alternateName: SITE.nomeCurto,
    url: SITE.url,
    /*
      Fotografias reais do escritório e do advogado — não o logotipo. Para
      negócio local o Google usa `image` como acervo visual da empresa, e
      logotipo já vai no campo `logo`.
    */
    image: [
      urlAbsoluta('/midia/sede-atendimento.webp'),
      urlAbsoluta('/midia/atendimento-escritorio.webp'),
      urlAbsoluta('/midia/retrato-pedro-montalvao.webp'),
    ],
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
    /*
      O catálogo diz, em forma de dado, o que o escritório faz — e aponta a
      página de cada área. É o que liga a entidade "escritório" às quatro
      páginas que competem por "advogado <área> em Cuiabá", em vez de deixar
      cada uma delas se explicar sozinha.
    */
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Áreas de atuação',
      itemListElement: AREAS_CATALOGO.map((area) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: area.nome,
          serviceType: area.nome,
          url: urlAbsoluta(`/${area.slug}/`),
          provider: { '@id': `${SITE.url}/#escritorio` },
        },
      })),
    },
    founder: dadosDoAdvogado(),
  };
}

/**
 * As quatro áreas, na forma mínima que o catálogo precisa.
 *
 * Ficam aqui, e não importadas de `content/areas.json`, porque este arquivo é
 * lido também pelo build do servidor: manter a lista curta evita arrastar o
 * conteúdo inteiro das áreas para dentro de cada página do site.
 */
const AREAS_CATALOGO = [
  { nome: 'Direito Trabalhista', slug: 'advogado-trabalhista-cuiaba' },
  { nome: 'Direito Previdenciário', slug: 'advogado-previdenciario-cuiaba' },
  { nome: 'Direito do Consumidor', slug: 'advogado-consumidor-cuiaba' },
  { nome: 'Direito de Família', slug: 'advogado-familia-cuiaba' },
] as const;

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
    telephone: `+${SITE.telefoneE164}`,
    email: SITE.email,
    workLocation: {
      '@type': 'Place',
      name: SITE.nome,
      address: ENDERECO_LINHA,
    },
  };
}

/**
 * Página de perfil profissional.
 *
 * `ProfilePage` existe justamente para a página que é *sobre uma pessoa*. Sem
 * ela, /sobre-advogado-cuiaba/ é apenas mais uma página com um `Person`
 * mencionado; com ela, a página passa a ser a fonte canônica daquele perfil.
 */
export function dadosDePerfil(): Record<string, unknown> {
  return {
    '@type': 'ProfilePage',
    '@id': urlAbsoluta('/sobre-advogado-cuiaba/#perfil'),
    url: urlAbsoluta('/sobre-advogado-cuiaba/'),
    name: `${SITE.advogado} — ${oabFormatada()}`,
    inLanguage: 'pt-BR',
    isPartOf: { '@id': `${SITE.url}/#site` },
    mainEntity: { '@id': `${SITE.url}/#advogado` },
    about: { '@id': `${SITE.url}/#advogado` },
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
    image: urlAbsoluta('/midia/conteudo-juridico.webp'),
    isPartOf: { '@id': `${SITE.url}/#site` },
    author: dadosDoAdvogado(),
    publisher: { '@id': `${SITE.url}/#escritorio` },
  };
}

/**
 * O site como entidade.
 *
 * Vai em TODAS as páginas, e não só na inicial: é o nó que os demais
 * referenciam por `isPartOf`. Um `@id` apontando para algo que só existe numa
 * página é uma referência quebrada em todas as outras.
 */
export function dadosDoSite(): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': `${SITE.url}/#site`,
    name: SITE.nome,
    alternateName: SITE.nomeCurto,
    url: urlAbsoluta('/'),
    inLanguage: 'pt-BR',
    publisher: { '@id': `${SITE.url}/#escritorio` },
  };
}

/** Junta tudo num único <script type="application/ld+json"> por página. */
export function montarGrafo(dados: Record<string, unknown>[] = []): string {
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@graph': [dadosDoSite(), dadosDoEscritorio(), ...dados],
    },
    null,
    0,
  );
}
