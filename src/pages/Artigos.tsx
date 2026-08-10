import { Link } from '../lib/router';
import { SITE, oabFormatada } from '../site.config';
import { IconeSeta } from '../components/Icones';
import { Revelar } from '../components/Revelar';
import { Blocos, type Bloco } from '../components/Blocos';
import { IndiceArtigo, Compartilhar } from '../components/IndiceArtigo';
import { SecaoCta } from '../components/SecaoCta';
import { FormularioContato } from '../components/FormularioContato';
import artigos from '../content/artigos.json';
import areas from '../content/areas.json';

export type Artigo = (typeof artigos)[number];

const FORMATO_DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function dataLegivel(iso: string): string {
  return FORMATO_DATA.format(new Date(`${iso}T12:00:00Z`));
}

/* ------------------------------------------------------------------ índice */

export function ListaArtigos() {
  const [primeiro, ...demais] = artigos;

  return (
    <>
      <section className="artigo-heroi">
        <div className="artigo-heroi__luz" aria-hidden />
        <div className="envolucro">
          <nav className="migalhas" aria-label="Você está em">
            <Link para="/">Início</Link>
            <span aria-hidden>/</span>
            <span>Artigos</span>
          </nav>

          <div style={{ maxWidth: '780px' }}>
            <span className="olho">Conteúdo jurídico</span>
            <h1>Artigos para entender o seu direito</h1>
            <p className="chamada">
              Textos sobre situações que chegam ao escritório todos os dias, em linguagem direta, com
              indicação das normas aplicáveis e do que fazer antes de qualquer medida.
            </p>
          </div>
        </div>
      </section>

      {/* O artigo carro-chefe ganha destaque de capa de revista. */}
      {primeiro && (
        <section className="secao">
          <div className="envolucro">
            <Revelar>
              <Link className="capa-artigo" para={`/artigos/${primeiro.slug}/`}>
                <div className="capa-artigo__texto">
                  <span className="etiqueta">{primeiro.categoria}</span>
                  <h2>{primeiro.titulo}</h2>
                  <p>{primeiro.resumo}</p>
                  <span className="cartao__link">
                    Ler o artigo · {primeiro.tempoLeitura} min
                    <IconeSeta tamanho={15} />
                  </span>
                </div>
                <div className="capa-artigo__marca" aria-hidden>
                  <span>{String(new Date(primeiro.publicadoEm).getUTCFullYear())}</span>
                </div>
              </Link>
            </Revelar>
          </div>
        </section>
      )}

      {demais.length > 0 && (
        <section className="secao secao--fina">
          <div className="envolucro">
            <span className="olho">Todos os artigos</span>
            {demais.map((artigo, indice) => (
              <Revelar key={artigo.slug} atraso={indice * 60}>
                <Link className="artigo-cartao" para={`/artigos/${artigo.slug}/`} style={{ display: 'grid' }}>
                  <span className="etiqueta">{artigo.categoria}</span>
                  <h3>{artigo.titulo}</h3>
                  <p>{artigo.resumo}</p>
                  <span className="cartao__link">
                    Ler artigo · {artigo.tempoLeitura} min
                    <IconeSeta tamanho={15} />
                  </span>
                </Link>
              </Revelar>
            ))}
          </div>
        </section>
      )}

      <SecaoCta
        titulo="Informação geral não substitui análise individual"
        texto="Os canais oficiais podem ser usados para consultar disponibilidade, documentos necessários e formato do atendimento."
      />
    </>
  );
}

/* ------------------------------------------------------------------ artigo */

export function PaginaArtigo({ artigo }: { artigo: Artigo }) {
  const area = areas.find((item) => item.slug === artigo.area);
  const outros = artigos.filter((item) => item.slug !== artigo.slug).slice(0, 3);
  const blocos = artigo.blocos as Bloco[];
  const primeiraChamada = blocos.find(
    (bloco): bloco is Extract<Bloco, { t: 'cta' }> => bloco.t === 'cta',
  );

  return (
    <>
      <article>
        <header className="artigo-heroi">
          <div className="artigo-heroi__luz" aria-hidden />
          <div className="envolucro">
            <nav className="migalhas" aria-label="Você está em">
              <Link para="/">Início</Link>
              <span aria-hidden>/</span>
              <Link para="/artigos/">Artigos</Link>
              <span aria-hidden>/</span>
              <span>{artigo.categoria}</span>
            </nav>

            <span className="etiqueta">{artigo.categoria}</span>
            <h1>{artigo.titulo}</h1>
            <p className="chamada">{artigo.resumo}</p>

            <div className="assinatura">
              <img
                className="assinatura__foto"
                src="/midia/retrato-institucional-720.webp"
                alt=""
                width={46}
                height={46}
                loading="lazy"
              />
              <div className="assinatura__quem">
                {SITE.advogado}
                <span>{SITE.oab ? oabFormatada() : 'Advogado — OAB/MT'}</span>
              </div>
              <div className="assinatura__dados">
                <span>Atualizado em {dataLegivel(artigo.atualizadoEm)}</span>
                <span>{artigo.tempoLeitura} min de leitura</span>
              </div>
            </div>
          </div>
        </header>

        <div className="secao">
          <div className="envolucro">
            <div className="artigo-corpo">
              <IndiceArtigo blocos={blocos} mensagem={primeiraChamada?.mensagem} />

              <div className="artigo">
                <Blocos blocos={blocos} />

                <Compartilhar titulo={artigo.titulo} />

                <div className="artigo-rodape">
                  <img
                    src="/midia/retrato-institucional-720.webp"
                    alt={`${SITE.advogado}, advogado em Cuiabá`}
                    width={62}
                    height={62}
                    loading="lazy"
                  />
                  <div>
                    <strong>
                      Escrito e revisado por {SITE.advogado}
                      {SITE.oab ? ` — ${oabFormatada()}` : ''}
                    </strong>
                    <p>
                      Advogado em Cuiabá, com atuação em Direito do Consumidor, Trabalhista,
                      Previdenciário e de Família. Este conteúdo é informativo, apresenta regras
                      gerais e não substitui a análise individual do seu caso. Atualizado em{' '}
                      {dataLegivel(artigo.atualizadoEm)}.
                    </p>
                  </div>
                </div>

                {area && (
                  <p style={{ marginTop: '2rem' }}>
                    <Link className="cartao__link" para={`/${area.slug}/`}>
                      Ver a página de {area.nome}
                      <IconeSeta tamanho={15} />
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Quem leu o artigo inteiro é o contato mais qualificado do site. */}
      <section className="secao secao--creme">
        <div className="envolucro">
          <div className="contato-grade">
            <Revelar>
              <span className="olho">Análise individual</span>
              <h2>Informações sobre atendimento</h2>
              <p className="chamada">
                O formulário organiza um resumo e abre o canal oficial do escritório. A
                disponibilidade e os documentos necessários são informados no retorno.
              </p>
              <p className="microtexto">
                Nenhuma informação é gravada em servidor. Não envie senhas, códigos de autenticação
                ou dados bancários completos.
              </p>
            </Revelar>

            <Revelar atraso={80}>
              <div className="painel-form">
                <FormularioContato origem={`artigo: ${artigo.slug}`} />
              </div>
            </Revelar>
          </div>
        </div>
      </section>

      {outros.length > 0 && (
        <section className="secao secao--fina">
          <div className="envolucro">
            <span className="olho">Continue lendo</span>
            {outros.map((item) => (
              <Link
                className="artigo-cartao"
                key={item.slug}
                para={`/artigos/${item.slug}/`}
                style={{ display: 'grid' }}
              >
                <h3>{item.titulo}</h3>
                <p>{item.resumo}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
