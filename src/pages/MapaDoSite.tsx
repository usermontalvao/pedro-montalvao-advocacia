import { Link } from '../lib/router';
import { IconeSeta } from '../components/Icones';
import { Revelar } from '../components/Revelar';
import { SecaoCta } from '../components/SecaoCta';
import areas from '../content/areas.json';
import artigos from '../content/artigos.json';
import juridico from '../content/juridico.json';
import calculadoras from '../content/calculadoras.json';

/**
 * Mapa do site — a versão para gente.
 *
 * O `sitemap.xml` gerado no build serve ao rastreador: é uma lista de URLs sem
 * nome nem contexto. Esta página serve a quem chegou por uma busca lateral e
 * não sabe o que mais existe aqui. As duas listas nascem da mesma fonte — o
 * conteúdo em JSON —, então uma área ou um artigo novo aparece nos dois lugares
 * sem ninguém precisar lembrar.
 *
 * Só as páginas fixas (início, sobre, contato, documentos) estão escritas à
 * mão, porque são as únicas que não vêm de uma coleção.
 */

type Entrada = {
  caminho: string;
  titulo: string;
  nota: string;
};

type Grupo = {
  nome: string;
  descricao: string;
  entradas: Entrada[];
};

export const GRUPOS_DO_MAPA: Grupo[] = [
  {
    nome: 'O escritório',
    descricao: 'Quem atende, como funciona o atendimento e onde encontrar.',
    entradas: [
      {
        caminho: '/',
        titulo: 'Início',
        nota: 'Apresentação do escritório, áreas atendidas e formas de contato.',
      },
      {
        caminho: '/sobre-advogado-cuiaba/',
        titulo: 'Sobre o advogado',
        nota: 'Formação, inscrição na OAB e o modo de conduzir cada caso.',
      },
      {
        caminho: '/advogado-online-brasil/',
        titulo: 'Atendimento online no Brasil',
        nota: 'Como funciona o acompanhamento à distância, de qualquer estado.',
      },
      {
        caminho: '/contato-advogado-cuiaba/',
        titulo: 'Contato e localização',
        nota: 'WhatsApp, e-mail, endereço em Cuiabá e horário de atendimento.',
      },
      {
        caminho: '/mapa-do-site/',
        titulo: 'Mapa do site',
        nota: 'Índice de todas as páginas publicadas e acessíveis no site.',
      },
    ],
  },

  {
    nome: 'Áreas de atuação',
    descricao: 'Quatro pontos de partida — o caso pode atravessar mais de um.',
    entradas: [
      {
        caminho: '/areas-de-atuacao/',
        titulo: 'Todas as áreas',
        nota: 'Panorama das quatro áreas, para escolher o assunto mais próximo.',
      },
      ...areas.map((area) => ({
        caminho: `/${area.slug}/`,
        titulo: area.nome,
        nota: area.resumoHome,
      })),
    ],
  },

  {
    nome: 'Calculadoras',
    descricao: 'Ferramentas gratuitas com memória de cálculo e parâmetros identificados.',
    entradas: [
      {
        caminho: '/calculadoras/',
        titulo: 'Todas as calculadoras',
        nota: 'Página central das ferramentas jurídicas disponíveis no site.',
      },
      ...calculadoras.map((calculadora) => ({
        caminho: `/calculadoras/${calculadora.slug}/`,
        titulo: calculadora.titulo,
        nota: calculadora.resumo,
      })),
    ],
  },

  {
    nome: 'Artigos',
    descricao: 'Textos que explicam regra, prazo e o que fazer em cada situação.',
    entradas: [
      {
        caminho: '/artigos/',
        titulo: 'Todos os artigos',
        nota: 'Lista completa, com o assunto e o tempo de leitura de cada texto.',
      },
      ...artigos.map((artigo) => ({
        caminho: `/artigos/${artigo.slug}/`,
        titulo: artigo.titulo,
        nota: `${artigo.categoria} · ${artigo.tempoLeitura} min de leitura`,
      })),
    ],
  },

  {
    nome: 'Documentos',
    descricao: 'O que rege o uso do site e o tratamento dos dados enviados.',
    entradas: [
      {
        caminho: `/${juridico.privacidade.slug}/`,
        titulo: juridico.privacidade.titulo,
        nota: 'Quais dados são coletados no formulário, para quê e por quanto tempo.',
      },
      {
        caminho: `/${juridico.termos.slug}/`,
        titulo: juridico.termos.titulo,
        nota: 'Condições de uso do site e o alcance do conteúdo informativo.',
      },
    ],
  },
];

/** Todas as URLs listadas aqui — usada para conferir o mapa contra as rotas. */
export const CAMINHOS_DO_MAPA = GRUPOS_DO_MAPA.flatMap((grupo) =>
  grupo.entradas.map((entrada) => entrada.caminho),
);

export function MapaDoSite() {
  const total = CAMINHOS_DO_MAPA.length;

  return (
    <>
      <section className="heroi" style={{ paddingBottom: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
        <div className="heroi__luz" aria-hidden />
        <div className="envolucro">
          <div className="artigo-cabeca">
            <nav className="migalhas" aria-label="Você está em">
              <Link para="/">Início</Link>
              <span aria-hidden>/</span>
              <span>Mapa do site</span>
            </nav>
            <h1>Mapa do site</h1>
            <p className="chamada">
              Todas as {total} páginas publicadas, reunidas em uma tela só — do panorama das áreas
              aos artigos e aos documentos do site.
            </p>
          </div>
        </div>
      </section>

      <section className="secao">
        <div className="envolucro">
          <div className="mapa-site">
            {GRUPOS_DO_MAPA.map((grupo, indice) => (
              <Revelar key={grupo.nome} como="section" className="mapa-site__grupo" atraso={indice * 60}>
                <div className="mapa-site__cabeca">
                  <span className="olho">{String(indice + 1).padStart(2, '0')}</span>
                  <h2>{grupo.nome}</h2>
                  <p>{grupo.descricao}</p>
                </div>

                <ul className="mapa-site__lista">
                  {grupo.entradas.map((entrada) => (
                    <li key={entrada.caminho}>
                      <Link className="mapa-site__item" para={entrada.caminho}>
                        <span className="mapa-site__texto">
                          <span className="mapa-site__titulo">{entrada.titulo}</span>
                          <span className="mapa-site__nota">{entrada.nota}</span>
                        </span>
                        <IconeSeta tamanho={15} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Revelar>
            ))}
          </div>

          <p className="mapa-site__rodape">
            Para buscadores existe a versão em XML desta mesma lista:{' '}
            <a href="/sitemap.xml">sitemap.xml</a>.
          </p>
        </div>
      </section>

      <SecaoCta
        titulo="Não achou o seu assunto?"
        texto="Conte em poucas linhas o que aconteceu. O escritório indica por onde começar."
        botao="Ver formas de atendimento"
        destino="/contato-advogado-cuiaba/"
        secundario={false}
      />
    </>
  );
}
