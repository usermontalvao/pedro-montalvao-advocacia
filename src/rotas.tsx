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
import { TELEFONES_PUBLICOS } from './site.config';
import { Home } from './pages/Home';
import { Area } from './pages/Area';
import { AreasAtuacao } from './pages/AreasAtuacao';
import { Sobre } from './pages/Sobre';
import { Contato } from './pages/Contato';
import { AtendimentoBrasil, FAQ_ATENDIMENTO_BRASIL } from './pages/AtendimentoBrasil';
import { ListaArtigos, PaginaArtigo } from './pages/Artigos';
import { Juridico, type PaginaJuridica } from './pages/Juridico';
import { MapaDoSite, GRUPOS_DO_MAPA } from './pages/MapaDoSite';
import { ATUALIZADO_EM as GOLPE_ATUALIZADO_EM, AlertaGolpe, FAQ_GOLPE } from './pages/AlertaGolpe';
import { ContaEncerrada } from './pages/ContaEncerrada';
import { SemRegistro } from './pages/SemRegistro';
import { CalculadoraRescisao, FAQ_RESCISAO, ListaCalculadoras } from './pages/Calculadoras';
import { CalculadoraTrabalhista, faqDaCalculadora } from './pages/CalculadorasTrabalhistas';
import { CalculadoraPensao, FAQ_PENSAO } from './pages/CalculadoraPensao';
import { CalculadoraAposentadoria, FAQ_APOSENTADORIA } from './pages/CalculadoraAposentadoria';
import { CategoriaCalculadoras } from './pages/CalculadorasCategoria';
import {
  CATEGORIAS_PUBLICADAS,
  atualizacaoDaCategoria,
  caminhoDaCategoria,
  calculadorasDaCategoria,
  categoriaDaCalculadora,
} from './lib/categoriasCalculadoras';
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
  /**
   * Página de anúncio: entra sem cabeçalho, sem rodapé e sem menu.
   *
   * Cada saída visível numa landing paga é dinheiro indo embora — o visitante
   * chegou por um clique comprado e a única porta que interessa é a conversa.
   */
  semLayout?: boolean;
  /**
   * Fica de fora do sitemap.xml.
   *
   * Landing de campanha não disputa busca orgânica: ela repete, em tom de
   * anúncio, um assunto que o site já trata em página própria. Deixá-la no
   * sitemap seria pedir ao Google que escolhesse entre as duas — e ele
   * escolheria sozinho. Anda junto com `naoIndexar` no SEO da rota.
   */
  foraDoSitemap?: boolean;
};

/** Todas as perguntas de um artigo viram FAQPage nos dados estruturados. */
function perguntasDoArtigo(blocos: Bloco[]) {
  return blocos.flatMap((bloco) => (bloco.t === 'faq' ? bloco.itens : []));
}

/**
 * A trilha de uma calculadora passa pela área dela.
 *
 * Início › Calculadoras › Trabalhista › Horas extras. O degrau da categoria é o
 * mesmo que o visitante vê nas migalhas, então o dado estruturado e a tela
 * contam a mesma história.
 */
function trilhaDaCalculadora(
  calculadora: { categoria: string; nomeCurto: string },
  caminho: string,
) {
  const categoria = categoriaDaCalculadora(calculadora);
  return dadosDeNavegacao([
    { nome: 'Início', caminho: '/' },
    { nome: 'Calculadoras', caminho: '/calculadoras/' },
    ...(categoria ? [{ nome: categoria.nome, caminho: caminhoDaCategoria(categoria) }] : []),
    { nome: calculadora.nomeCurto, caminho },
  ]);
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
        'Calculadoras jurídicas gratuitas com memória de cálculo: rescisão com FGTS automático, verbas trabalhistas e pensão em atraso com relatório.',
      caminho: '/calculadoras/',
      atualizadoEm: '2026-08-11',
      dados: [
        {
          '@type': 'CollectionPage',
          name: 'Calculadoras jurídicas — Pedro Montalvão Advocacia',
          description: 'Ferramentas gratuitas para simulações jurídicas informativas, separadas por área do Direito.',
          url: urlAbsoluta('/calculadoras/'),
          // O hub agora aponta para as áreas; a lista de ferramentas de cada
          // uma fica na página da própria área.
          hasPart: CATEGORIAS_PUBLICADAS.map((categoria) => ({
            '@type': 'CollectionPage',
            name: categoria.titulo,
            url: urlAbsoluta(caminhoDaCategoria(categoria)),
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

  /*
    Uma página por área do Direito. A rota nasce da categoria que já tem
    ferramenta publicada, então a lista cresce junto com o conteúdo — sem
    precisar registrar caminho na mão a cada calculadora nova.
  */
  ...CATEGORIAS_PUBLICADAS.map((categoria) => {
    const caminho = caminhoDaCategoria(categoria);
    const itens = calculadorasDaCategoria(categoria);

    return {
      caminho,
      prioridade: 0.9,
      seo: {
        titulo: categoria.seoTitle,
        descricao: categoria.seoDescription,
        caminho,
        atualizadoEm: atualizacaoDaCategoria(categoria),
        dados: [
          {
            '@type': 'CollectionPage',
            '@id': urlAbsoluta(`${caminho}#colecao`),
            name: categoria.titulo,
            description: categoria.seoDescription,
            url: urlAbsoluta(caminho),
            inLanguage: 'pt-BR',
            about: { '@id': urlAbsoluta(`${categoria.areaCaminho}#servico`) },
            hasPart: itens.map((calculadora) => ({
              '@type': 'WebApplication',
              name: calculadora.titulo,
              url: urlAbsoluta(`/calculadoras/${calculadora.slug}/`),
            })),
          },
          dadosDeNavegacao([
            { nome: 'Início', caminho: '/' },
            { nome: 'Calculadoras', caminho: '/calculadoras/' },
            { nome: categoria.nome, caminho },
          ]),
        ],
      },
      elemento: <CategoriaCalculadoras categoria={categoria} key={categoria.slug} />,
    };
  }),

  {
    caminho: '/calculadoras/calculadora-rescisao-trabalhista/',
    prioridade: 0.95,
    seo: {
      titulo: 'Calculadora de rescisão trabalhista | Grátis',
      descricao:
        'Calcule sua rescisão CLT: saldo, aviso-prévio, 13º, férias, FGTS, multa, INSS e IRRF. Resultado estimado com memória de cálculo e tabelas oficiais.',
      caminho: '/calculadoras/calculadora-rescisao-trabalhista/',
      atualizadoEm: '2026-08-10',
      dados: [
        {
          '@type': 'WebApplication',
          '@id': urlAbsoluta('/calculadoras/calculadora-rescisao-trabalhista/#aplicativo'),
          name: 'Calculadora de rescisão trabalhista',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Qualquer navegador moderno',
          inLanguage: 'pt-BR',
          isAccessibleForFree: true,
          description:
            'Ferramenta gratuita para estimar verbas de rescisão CLT com os parâmetros oficiais em vigor.',
          url: urlAbsoluta('/calculadoras/calculadora-rescisao-trabalhista/'),
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'BRL',
          },
          author: { '@id': urlAbsoluta('/#advogado') },
        },
        dadosDePerguntas(FAQ_RESCISAO),
        trilhaDaCalculadora(
          { categoria: 'Direito Trabalhista', nomeCurto: 'Rescisão trabalhista' },
          '/calculadoras/calculadora-rescisao-trabalhista/',
        ),
      ],
    },
    elemento: <CalculadoraRescisao />,
  },

  {
    caminho: '/calculadoras/calculadora-pensao-alimenticia/',
    prioridade: 0.95,
    seo: {
      titulo: 'Calculadora de pensão alimentícia | Prisão e expropriação',
      descricao: 'Calcule pensão alimentícia em atraso nos ritos da prisão civil e expropriação, com correção, juros, pagamentos e relatório por parcela.',
      caminho: '/calculadoras/calculadora-pensao-alimenticia/',
      atualizadoEm: '2026-08-11',
      dados: [
        {
          '@type': 'WebApplication',
          '@id': urlAbsoluta('/calculadoras/calculadora-pensao-alimenticia/#aplicativo'),
          name: 'Calculadora de pensão alimentícia: prisão e expropriação',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Qualquer navegador moderno',
          inLanguage: 'pt-BR',
          isAccessibleForFree: true,
          description: 'Ferramenta gratuita para organizar parcelas alimentícias em atraso com memória de cálculo e relatório.',
          url: urlAbsoluta('/calculadoras/calculadora-pensao-alimenticia/'),
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
          author: { '@id': urlAbsoluta('/#advogado') },
        },
        dadosDePerguntas(FAQ_PENSAO),
        trilhaDaCalculadora(
          { categoria: 'Direito de Família', nomeCurto: 'Pensão alimentícia' },
          '/calculadoras/calculadora-pensao-alimenticia/',
        ),
      ],
    },
    elemento: <CalculadoraPensao />,
  },

  {
    caminho: '/calculadoras/simulador-aposentadoria-cnis/',
    prioridade: 0.95,
    seo: {
      titulo: 'Simulador de aposentadoria com CNIS e RMI | Grátis',
      descricao: 'Importe o CNIS no navegador, confira vínculos e salários e gere regras, conversão especial, RMI e memorial completo para imprimir.',
      caminho: '/calculadoras/simulador-aposentadoria-cnis/',
      atualizadoEm: '2026-08-11',
      dados: [
        {
          '@type': 'WebApplication',
          '@id': urlAbsoluta('/calculadoras/simulador-aposentadoria-cnis/#aplicativo'),
          name: 'Simulador de aposentadoria com CNIS, RMI e memorial',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Qualquer navegador moderno',
          inLanguage: 'pt-BR',
          isAccessibleForFree: true,
          description: 'Ferramenta gratuita para importar o CNIS localmente, comparar regras, estimar RMI e gerar memorial imprimível.',
          url: urlAbsoluta('/calculadoras/simulador-aposentadoria-cnis/'),
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
          author: { '@id': urlAbsoluta('/#advogado') },
        },
        dadosDePerguntas(FAQ_APOSENTADORIA),
        trilhaDaCalculadora(
          { categoria: 'Direito Previdenciário', nomeCurto: 'Aposentadoria e CNIS' },
          '/calculadoras/simulador-aposentadoria-cnis/',
        ),
      ],
    },
    elemento: <CalculadoraAposentadoria />,
  },

  ...calculadoras.filter((calculadora) => !['rescisao', 'pensao_alimenticia', 'aposentadoria_cnis'].includes(calculadora.motor)).map((calculadora) => {
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
          trilhaDaCalculadora(calculadora, caminho),
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

  /*
    Aviso público de golpe — indexada de propósito.

    Quem recebe a mensagem falsa costuma procurar o nome do escritório no
    buscador antes de pagar. Se o aviso oficial não estiver no índice, a única
    coisa que essa busca devolve é o material que o golpista copiou. Por isso
    esta página entra no sitemap, no rodapé e no mapa do site: ao contrário das
    landings de campanha, ser encontrada é a função dela.
  */
  {
    caminho: '/alerta-de-golpe/',
    prioridade: 0.8,
    seo: {
      titulo: 'Alerta de golpe do falso advogado | Pedro Montalvão',
      descricao:
        'Alerta oficial: criminosos usam o nome e a foto do advogado para cobrar Pix. Confira o WhatsApp oficial, reconheça o golpe e saiba como denunciar.',
      caminho: '/alerta-de-golpe/',
      imagem: '/midia/alerta-golpe-cena.png',
      /* A data sai da própria página: a tela e o buscador contam o mesmo dia. */
      atualizadoEm: GOLPE_ATUALIZADO_EM,
      dados: [
        {
          '@type': 'WebPage',
          '@id': urlAbsoluta('/alerta-de-golpe/#aviso'),
          name: 'Alerta de golpe — Pedro Montalvão Advocacia',
          description:
            'Comunicado oficial sobre o uso indevido do nome, da imagem e da identidade visual do escritório, com o único número de contato oficial.',
          url: urlAbsoluta('/alerta-de-golpe/'),
          inLanguage: 'pt-BR',
          datePublished: GOLPE_ATUALIZADO_EM,
          dateModified: GOLPE_ATUALIZADO_EM,
          primaryImageOfPage: {
            '@type': 'ImageObject',
            url: urlAbsoluta('/midia/alerta-golpe-cena.png'),
            width: 1536,
            height: 1024,
          },
          /* O aviso é *sobre* o escritório: é o que liga esta página à entidade. */
          about: { '@id': urlAbsoluta('/#escritorio') },
          publisher: { '@id': urlAbsoluta('/#escritorio') },
        },
        /*
          Os canais verdadeiros, também em dado estruturado.

          É o mesmo conteúdo do quadro da página, dito na linguagem do
          buscador: quando alguém procura o telefone do escritório e o
          resultado aparece com um número ao lado, esse número precisa sair
          daqui — e não de um anúncio comprado por quem se passa pelo
          escritório.
        */
        {
          '@type': 'Organization',
          '@id': urlAbsoluta('/#escritorio'),
          contactPoint: TELEFONES_PUBLICOS.map((numero) => ({
            '@type': 'ContactPoint',
            telephone: `+${numero.e164}`,
            contactType: 'customer service',
            areaServed: 'BR',
            availableLanguage: 'Portuguese',
          })),
        },
        dadosDePerguntas(FAQ_GOLPE),
        dadosDeNavegacao([
          { nome: 'Início', caminho: '/' },
          { nome: 'Alerta de golpe', caminho: '/alerta-de-golpe/' },
        ]),
      ],
    },
    elemento: <AlertaGolpe />,
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

  /*
    Campanha paga — conta bancária bloqueada ou encerrada.

    Não é indexada e não entra no sitemap: o tráfego dela vem do anúncio, e o
    assunto em busca orgânica pertence às páginas do site. Continua sendo
    pré-renderizada como todas as outras, porque um anúncio que abre uma tela
    branca até o JavaScript carregar perde o clique que acabou de ser pago.
  */
  {
    caminho: '/conta-encerrada/',
    prioridade: 0.1,
    semLayout: true,
    foraDoSitemap: true,
    seo: {
      titulo: 'Encerramento e bloqueio de conta bancária | Pedro Montalvão Advocacia',
      descricao:
        'Conteúdo informativo sobre o que o Código de Defesa do Consumidor e a regulação do Banco Central preveem quanto à comunicação prévia e à devolução do saldo em conta encerrada.',
      caminho: '/conta-encerrada/',
      naoIndexar: true,
    },
    elemento: <ContaEncerrada />,
  },

  /*
    Campanha paga — trabalho sem registro em carteira.

    Mesmas regras da campanha acima: fora do índice e fora do sitemap, porque o
    tráfego vem do anúncio e o assunto em busca orgânica pertence às páginas de
    área. Continua pré-renderizada, porque um anúncio que abre uma tela branca
    até o JavaScript carregar perde o clique que acabou de ser pago.
  */
  {
    caminho: '/trabalho-sem-registro/',
    prioridade: 0.1,
    semLayout: true,
    foraDoSitemap: true,
    seo: {
      titulo: 'Trabalho sem registro em carteira | Pedro Montalvão Advocacia',
      descricao:
        'Questionário sobre trabalho sem registro em carteira: prazo para reclamar, tipo de empregador e os elementos que a CLT considera na relação de emprego.',
      caminho: '/trabalho-sem-registro/',
      naoIndexar: true,
    },
    elemento: <SemRegistro />,
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
