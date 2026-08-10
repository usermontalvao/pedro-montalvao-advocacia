import type { ReactNode } from 'react';
import type { Seo } from './lib/seo';
import {
  dadosDeArtigo,
  dadosDeNavegacao,
  dadosDePerguntas,
  dadosDeServico,
  dadosDoAdvogado,
} from './lib/seo';
import { Home } from './pages/Home';
import { Area } from './pages/Area';
import { Sobre } from './pages/Sobre';
import { Contato } from './pages/Contato';
import { ListaArtigos, PaginaArtigo } from './pages/Artigos';
import { Juridico, type PaginaJuridica } from './pages/Juridico';
import type { Bloco } from './components/Blocos';
import home from './content/home.json';
import sobre from './content/sobre.json';
import areas from './content/areas.json';
import artigos from './content/artigos.json';
import juridico from './content/juridico.json';

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
      dados: [
        {
          '@type': 'WebSite',
          '@id': '#site',
          name: 'Pedro Montalvão Advocacia',
          inLanguage: 'pt-BR',
        },
        dadosDoAdvogado(),
        dadosDePerguntas(home.faq),
      ],
    },
    elemento: <Home />,
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
    caminho: '/sobre-advogado-cuiaba/',
    prioridade: 0.7,
    seo: {
      titulo: sobre.seoTitle,
      descricao: sobre.seoDescription,
      caminho: '/sobre-advogado-cuiaba/',
      dados: [
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
      titulo: 'Contato | Pedro Montalvão Advocacia em Cuiabá',
      descricao:
        'Entre em contato com o escritório Pedro Montalvão Advocacia, em Cuiabá. Consulte endereço, e-mail e canal oficial de atendimento pelo WhatsApp.',
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
      titulo: 'Artigos jurídicos | Pedro Montalvão Advocacia',
      descricao:
        'Artigos informativos sobre Direito do Consumidor, Trabalhista, Previdenciário e de Família, com orientação prática sobre o que fazer em cada situação.',
      caminho: '/artigos/',
      dados: [
        {
          '@type': 'Blog',
          name: 'Artigos — Pedro Montalvão Advocacia',
          inLanguage: 'pt-BR',
          blogPost: artigos.map((artigo) => ({
            '@type': 'BlogPosting',
            headline: artigo.titulo,
            url: `/artigos/${artigo.slug}/`,
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
];

export function acharRota(caminho: string): Rota | undefined {
  return ROTAS.find((rota) => rota.caminho === caminho);
}
