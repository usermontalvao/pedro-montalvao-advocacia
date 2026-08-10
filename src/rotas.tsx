import type { ReactNode } from 'react';
import type { Seo } from './lib/seo';
import {
  dadosDeArtigo,
  dadosDeNavegacao,
  dadosDePerguntas,
  dadosDeServico,
  dadosDoAdvogado,
  dadosDePerfil,
  urlAbsoluta,
} from './lib/seo';
import { Home } from './pages/Home';
import { Area } from './pages/Area';
import { AreasAtuacao } from './pages/AreasAtuacao';
import { Sobre } from './pages/Sobre';
import { Contato } from './pages/Contato';
import { AtendimentoBrasil, FAQ_ATENDIMENTO_BRASIL } from './pages/AtendimentoBrasil';
import { ListaArtigos, PaginaArtigo } from './pages/Artigos';
import { Juridico, type PaginaJuridica } from './pages/Juridico';
import { MapaDoSite, GRUPOS_DO_MAPA } from './pages/MapaDoSite';
import { CalculadoraRescisao, FAQ_RESCISAO, ListaCalculadoras } from './pages/Calculadoras';
import { CalculadoraTrabalhista, faqDaCalculadora } from './pages/CalculadorasTrabalhistas';
import type { Bloco } from './components/Blocos';
import home from './content/home.json';
import sobre from './content/sobre.json';
import areas from './content/areas.json';
import artigos from './content/artigos.json';
import juridico from './content/juridico.json';
import calculadoras from './content/calculadoras.json';

export type Rota = {
  caminho: string;
  seo: Seo;
  elemento: ReactNode;
  /** Peso no sitemap.xml — a home e o artigo carro-chefe puxam mais. */
  prioridade: number;
};

/** Todas as perguntas de um artigo viram FAQPage nos dados estruturados. */
function perguntasDoArtigo(blocos: Bloco[]) {
  return blocos.flatMap((bloco) => (bloco.t === 'faq' ? bloco.itens : []));
}

export const ROTAS: Rota[] = [
  {
    caminho: '/',
    prioridade: 1,
    seo: {
      titulo: home.seoTitle,
      descricao: home.seoDescription,
      caminho: '/',
      // O nó do site já entra em todas as páginas por `montarGrafo`.
      dados: [dadosDoAdvogado(), dadosDePerguntas(home.faq)],
    },
    elemento: <Home />,
  },

  {
    caminho: '/advogado-online-brasil/',
    prioridade: 0.95,
    seo: {
      titulo: 'Advogado online para todo o Brasil | Pedro Montalvão',
      descricao:
        'Atendimento jurídico online em todo o Brasil: trabalhista, previdenciário, do consumidor e de família. Reunião, documentos e acompanhamento à distância.',
      caminho: '/advogado-online-brasil/',
      dados: [
        {
          '@type': 'Service',
          '@id': urlAbsoluta('/advogado-online-brasil/#servico'),
          name: 'Atendimento jurídico online em todo o Brasil',
          serviceType: 'Atendimento jurídico online',
          provider: { '@id': urlAbsoluta('/#escritorio') },
          areaServed: { '@type': 'Country', name: 'Brasil' },
          availableChannel: {
            '@type': 'ServiceChannel',
            serviceUrl: urlAbsoluta('/advogado-online-brasil/'),
            availableLanguage: { '@type': 'Language', name: 'Português', alternateName: 'pt-BR' },
          },
        },
        dadosDePerguntas(FAQ_ATENDIMENTO_BRASIL),
        dadosDeNavegacao([
          { nome: 'Início', caminho: '/' },
          { nome: 'Atendimento online', caminho: '/advogado-online-brasil/' },
        ]),
      ],
    },
    elemento: <AtendimentoBrasil />,
  },

  {
    caminho: '/areas-de-atuacao/',
    prioridade: 0.9,
    seo: {
      titulo: 'Áreas de atuação | Advogado em Cuiabá — Pedro Montalvão',
      descricao:
        'Direito Trabalhista, Previdenciário, do Consumidor e de Família em Cuiabá. Veja os temas atendidos, os documentos que ajudam e como começa o atendimento.',
      caminho: '/areas-de-atuacao/',
      dados: [
        {
          '@type': 'CollectionPage',
          name: 'Áreas de atuação — Pedro Montalvão Advocacia',
          url: urlAbsoluta('/areas-de-atuacao/'),
          hasPart: areas.map((area) => ({
            '@type': 'WebPage',
            name: area.nome,
            url: urlAbsoluta(`/${area.slug}/`),
          })),
        },
        dadosDeNavegacao([
          { nome: 'Início', caminho: '/' },
          { nome: 'Áreas de atuação', caminho: '/areas-de-atuacao/' },
        ]),
      ],
    },
    elemento: <AreasAtuacao />,
  },

  ...areas.map((area) => ({
    caminho: `/${area.slug}/`,
    prioridade: 0.9,
    seo: {
      titulo: area.seoTitle,
      descricao: area.seoDescription,
      caminho: `/${area.slug}/`,
      dados: [
        dadosDeServico(area),
        dadosDePerguntas(area.faq),
        dadosDeNavegacao([
          { nome: 'Início', caminho: '/' },
          { nome: area.nome, caminho: `/${area.slug}/` },
        ]),
      ],
    },
    elemento: <Area area={area} />,
  })),

  {
    caminho: '/calculadoras/',
    prioridade: 0.9,
    seo: {
      titulo: 'Calculadoras jurídicas gratuitas | Pedro Montalvão',
      descricao:
        'Calculadoras jurídicas gratuitas com memória de cálculo. Comece pela calculadora de rescisão trabalhista atualizada com tabelas de 2026.',
      caminho: '/calculadoras/',
      atualizadoEm: '2026-08-10',
      dados: [
        {
          '@type': 'CollectionPage',
          name: 'Calculadoras jurídicas — Pedro Montalvão Advocacia',
          description: 'Ferramentas gratuitas para simulações jurídicas informativas.',
          url: urlAbsoluta('/calculadoras/'),
          hasPart: calculadoras.map((calculadora) => ({
              '@type': 'WebApplication',
              name: calculadora.titulo,
              url: urlAbsoluta(`/calculadoras/${calculadora.slug}/`),
            })),
        },
        dadosDeNavegacao([
          { nome: 'Início', caminho: '/' },
          { nome: 'Calculadoras', caminho: '/calculadoras/' },
        ]),
      ],
    },
    elemento: <ListaCalculadoras />,
  },

  {
    caminho: '/calculadoras/calculadora-rescisao-trabalhista/',
    prioridade: 0.95,
    seo: {
      titulo: 'Calculadora de rescisão trabalhista 2026 | Grátis',
      descricao:
        'Calcule sua rescisão CLT em 2026: saldo, aviso-prévio, 13º, férias, FGTS, multa, INSS e IRRF. Resultado estimado com memória de cálculo.',
      caminho: '/calculadoras/calculadora-rescisao-trabalhista/',
      atualizadoEm: '2026-08-10',
      dados: [
        {
          '@type': 'WebApplication',
          '@id': urlAbsoluta('/calculadoras/calculadora-rescisao-trabalhista/#aplicativo'),
          name: 'Calculadora de rescisão trabalhista 2026',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Qualquer navegador moderno',
          inLanguage: 'pt-BR',
          isAccessibleForFree: true,
          description:
            'Ferramenta gratuita para estimar verbas de rescisão CLT com parâmetros de 2026.',
          url: urlAbsoluta('/calculadoras/calculadora-rescisao-trabalhista/'),
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'BRL',
          },
          author: { '@id': urlAbsoluta('/#advogado') },
        },
        dadosDePerguntas(FAQ_RESCISAO),
        dadosDeNavegacao([
          { nome: 'Início', caminho: '/' },
          { nome: 'Calculadoras', caminho: '/calculadoras/' },
          {
            nome: 'Rescisão trabalhista',
            caminho: '/calculadoras/calculadora-rescisao-trabalhista/',
          },
        ]),
      ],
    },
    elemento: <CalculadoraRescisao />,
  },

  ...calculadoras.filter((calculadora) => calculadora.motor !== 'rescisao').map((calculadora) => {
    const caminho = `/calculadoras/${calculadora.slug}/`;
    return {
      caminho,
      prioridade: 0.9,
      seo: {
        titulo: `${calculadora.titulo} | Grátis`,
        descricao: calculadora.resumo,
        caminho,
        atualizadoEm: calculadora.atualizadoEm,
        dados: [
          {
            '@type': 'WebApplication',
            '@id': urlAbsoluta(`${caminho}#aplicativo`),
            name: calculadora.titulo,
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Qualquer navegador moderno',
            inLanguage: 'pt-BR',
            isAccessibleForFree: true,
            description: calculadora.resumo,
            url: urlAbsoluta(caminho),
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'BRL',
            },
            author: { '@id': urlAbsoluta('/#advogado') },
          },
          dadosDePerguntas(faqDaCalculadora(calculadora)),
          dadosDeNavegacao([
            { nome: 'Início', caminho: '/' },
            { nome: 'Calculadoras', caminho: '/calculadoras/' },
            { nome: calculadora.nomeCurto, caminho },
          ]),
        ],
      },
      elemento: <CalculadoraTrabalhista calculadora={calculadora} key={calculadora.slug} />,
    };
  }),

  {
    caminho: '/sobre-advogado-cuiaba/',
    prioridade: 0.7,
    seo: {
      titulo: sobre.seoTitle,
      descricao: sobre.seoDescription,
      caminho: '/sobre-advogado-cuiaba/',
      dados: [
        dadosDePerfil(),
        dadosDoAdvogado(),
        dadosDeNavegacao([
          { nome: 'Início', caminho: '/' },
          { nome: 'Sobre o advogado', caminho: '/sobre-advogado-cuiaba/' },
        ]),
      ],
    },
    elemento: <Sobre />,
  },

  {
    caminho: '/contato-advogado-cuiaba/',
    prioridade: 0.8,
    seo: {
      titulo: 'Contato e endereço em Cuiabá | Pedro Montalvão Advocacia',
      descricao:
        'Fale com o escritório em Cuiabá: WhatsApp, e-mail, endereço no bairro Pedra 90 e horário de atendimento — segunda a sexta, das 8h às 18h.',
      caminho: '/contato-advogado-cuiaba/',
      dados: [
        {
          '@type': 'ContactPage',
          name: 'Contato — Pedro Montalvão Advocacia',
        },
        dadosDeNavegacao([
          { nome: 'Início', caminho: '/' },
          { nome: 'Contato', caminho: '/contato-advogado-cuiaba/' },
        ]),
      ],
    },
    elemento: <Contato />,
  },

  {
    caminho: '/artigos/',
    prioridade: 0.8,
    seo: {
      titulo: 'Artigos jurídicos | Advogado em Cuiabá — Pedro Montalvão',
      descricao:
        'Artigos sobre Direito do Consumidor, Trabalhista, Previdenciário e de Família — escritos para explicar regras, prazos e o que fazer em cada situação.',
      caminho: '/artigos/',
      dados: [
        {
          '@type': 'Blog',
          name: 'Artigos — Pedro Montalvão Advocacia',
          inLanguage: 'pt-BR',
          blogPost: artigos.map((artigo) => ({
            '@type': 'BlogPosting',
            headline: artigo.titulo,
            url: urlAbsoluta(`/artigos/${artigo.slug}/`),
            datePublished: artigo.publicadoEm,
          })),
        },
        dadosDeNavegacao([
          { nome: 'Início', caminho: '/' },
          { nome: 'Artigos', caminho: '/artigos/' },
        ]),
      ],
    },
    elemento: <ListaArtigos />,
  },

  ...artigos.map((artigo) => ({
    caminho: `/artigos/${artigo.slug}/`,
    prioridade: 0.95,
    seo: {
      titulo: artigo.seoTitle,
      descricao: artigo.seoDescription,
      caminho: `/artigos/${artigo.slug}/`,
      tipo: 'article' as const,
      publicadoEm: artigo.publicadoEm,
      atualizadoEm: artigo.atualizadoEm,
      dados: [
        dadosDeArtigo(artigo),
        dadosDePerguntas(perguntasDoArtigo(artigo.blocos as Bloco[])),
        dadosDeNavegacao([
          { nome: 'Início', caminho: '/' },
          { nome: 'Artigos', caminho: '/artigos/' },
          { nome: artigo.categoria, caminho: `/artigos/${artigo.slug}/` },
        ]),
      ],
    },
    elemento: <PaginaArtigo artigo={artigo} />,
  })),

  {
    caminho: `/${juridico.privacidade.slug}/`,
    prioridade: 0.3,
    seo: {
      titulo: juridico.privacidade.seoTitle,
      descricao: juridico.privacidade.seoDescription,
      caminho: `/${juridico.privacidade.slug}/`,
    },
    elemento: <Juridico pagina={juridico.privacidade as PaginaJuridica} />,
  },

  {
    caminho: `/${juridico.termos.slug}/`,
    prioridade: 0.3,
    seo: {
      titulo: juridico.termos.seoTitle,
      descricao: juridico.termos.seoDescription,
      caminho: `/${juridico.termos.slug}/`,
    },
    elemento: <Juridico pagina={juridico.termos as PaginaJuridica} />,
  },

  {
    caminho: '/mapa-do-site/',
    prioridade: 0.3,
    seo: {
      titulo: 'Mapa do site | Pedro Montalvão Advocacia',
      descricao:
        'Todas as páginas do site em uma tela: áreas de atuação, artigos jurídicos, sobre o advogado, contato em Cuiabá e os documentos do site.',
      caminho: '/mapa-do-site/',
      dados: [
        {
          '@type': 'CollectionPage',
          name: 'Mapa do site — Pedro Montalvão Advocacia',
          url: urlAbsoluta('/mapa-do-site/'),
          /*
            O mapa em HTML descrito como dado: cada grupo é uma coleção com as
            suas páginas dentro, na mesma ordem em que aparecem na tela.
          */
          hasPart: GRUPOS_DO_MAPA.map((grupo) => ({
            '@type': 'ItemList',
            name: grupo.nome,
            itemListElement: grupo.entradas.map((entrada, indice) => ({
              '@type': 'ListItem',
              position: indice + 1,
              name: entrada.titulo,
              url: urlAbsoluta(entrada.caminho),
            })),
          })),
        },
        dadosDeNavegacao([
          { nome: 'Início', caminho: '/' },
          { nome: 'Mapa do site', caminho: '/mapa-do-site/' },
        ]),
      ],
    },
    elemento: <MapaDoSite />,
  },
];

export function acharRota(caminho: string): Rota | undefined {
  return ROTAS.find((rota) => rota.caminho === caminho);
}
