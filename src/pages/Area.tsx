import { Link } from '../lib/router';
import { IconeSeta } from '../components/Icones';
import { Revelar } from '../components/Revelar';
import { Faq } from '../components/Faq';
import { SecaoCta } from '../components/SecaoCta';
import areas from '../content/areas.json';
import artigos from '../content/artigos.json';

export type ConteudoArea = (typeof areas)[number];

export function Area({ area }: { area: ConteudoArea }) {
  const relacionados = artigos.filter((artigo) => artigo.area === area.slug);
  const outras = areas.filter((item) => item.slug !== area.slug);

  return (
    <>
      <section className="heroi heroi-area">
        <div className="heroi__luz" aria-hidden />
        <div className="envolucro heroi-area__grade">
          <div className="heroi-area__conteudo">
            <nav className="migalhas" aria-label="Você está em">
              <Link para="/">Início</Link>
              <span aria-hidden>/</span>
              <Link para="/areas-de-atuacao/">Áreas de atuação</Link>
              <span aria-hidden>/</span>
              <span>{area.nome}</span>
            </nav>

            <span className="olho">{area.nome}</span>
            <h1>{area.h1}</h1>
            <p className="chamada">{area.subtitulo}</p>

            <div className="grupo-botoes">
              <Link
                className="botao botao--claro"
                para="/contato-advogado-cuiaba/"
                data-cta="heroi-area"
              >
                {area.botaoPrincipal}
                <IconeSeta />
              </Link>
              <a className="botao botao--contorno" href="#temas">
                Explorar os temas
                <IconeSeta />
              </a>
            </div>

            <p className="microtexto">{area.microcopyHero}</p>
          </div>

          <figure className="heroi-area__imagem">
            <img
              src={`/midia/${area.imagem}.webp`}
              srcSet={`/midia/${area.imagem}-720.webp 720w, /midia/${area.imagem}.webp 1376w`}
              sizes="(max-width: 900px) 100vw, 540px"
              alt={`Contexto relacionado a ${area.nome}`}
              width={1376}
              height={768}
              fetchPriority="high"
            />
            <figcaption>{area.nome}</figcaption>
          </figure>
        </div>
      </section>

      {/* -------------------------------------------------------------- intro */}
      <section className="secao">
        <div className="envolucro">
          <div className="contato-grade">
            <Revelar>
              <span className="olho">Antes de qualquer medida</span>
              <h2>{area.introTitulo}</h2>
            </Revelar>
            <Revelar atraso={80}>
              {area.intro.map((paragrafo) => (
                <p key={paragrafo.slice(0, 24)} style={{ color: 'var(--texto-suave)' }}>
                  {paragrafo}
                </p>
              ))}
            </Revelar>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- temas */}
      <section className="secao secao--creme" id="temas">
        <div className="envolucro">
          <Revelar>
            <div className="cabeca-secao">
              <span className="olho">Temas da área</span>
              <h2>{area.temasTitulo}</h2>
            </div>
          </Revelar>

          <Revelar atraso={70}>
            <div className="lista-temas">
              {area.temas.map((tema, indice) => (
                <details className="tema tema--interativo" key={tema.titulo} open={indice < 2}>
                  <summary>
                    <span>{String(indice + 1).padStart(2, '0')}</span>
                    <h3>{tema.titulo}</h3>
                    <i aria-hidden>+</i>
                  </summary>
                  <p>{tema.texto}</p>
                </details>
              ))}
            </div>
          </Revelar>
        </div>
      </section>

      {/* --------------------------------------------- quando procurar + docs */}
      <section className="secao">
        <div className="envolucro">
          <div className="contato-grade">
            <Revelar>
              <span className="olho">Quando vale olhar para isso</span>
              <h2>{area.quandoTitulo}</h2>
              {area.quando.map((paragrafo) => (
                <p key={paragrafo.slice(0, 24)} style={{ color: 'var(--texto-suave)' }}>
                  {paragrafo}
                </p>
              ))}

              <Link
                className="botao botao--escuro"
                para="/contato-advogado-cuiaba/"
                data-cta="meio-area"
                style={{ marginTop: '0.8rem' }}
              >
                Ver formas de atendimento
                <IconeSeta />
              </Link>
            </Revelar>

            <Revelar atraso={90}>
              <div className="painel-form">
                <h3 style={{ marginBottom: '1rem' }}>{area.documentosTitulo}</h3>
                <ul style={{ color: 'var(--texto-suave)', paddingLeft: '1.1rem' }}>
                  {area.documentos.map((documento) => (
                    <li key={documento} style={{ marginBottom: '0.45rem' }}>
                      {documento}
                    </li>
                  ))}
                </ul>
                <p className="microtexto">{area.documentosNota}</p>
              </div>
            </Revelar>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- FAQ */}
      <section className="secao secao--creme">
        <div className="envolucro">
          <div className="contato-grade">
            <Revelar>
              <span className="olho">Perguntas frequentes</span>
              <h2>{area.faqTitulo}</h2>
              <p className="chamada">Respostas gerais. Fatos e documentos podem mudar a orientação.</p>
            </Revelar>
            <Revelar atraso={80}>
              <Faq perguntas={area.faq} idPrefixo={area.slug} />
            </Revelar>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- artigos e outras */}
      {relacionados.length > 0 && (
        <section className="secao">
          <div className="envolucro">
            <Revelar>
              <div className="cabeca-secao">
                <span className="olho">Para ler antes de decidir</span>
                <h2>Artigos sobre {area.nome}</h2>
              </div>
            </Revelar>
            {relacionados.map((artigo, indice) => (
              <Revelar key={artigo.slug} atraso={indice * 70}>
                <Link className="artigo-cartao" para={`/artigos/${artigo.slug}/`} style={{ display: 'grid' }}>
                  <span className="etiqueta">{artigo.categoria}</span>
                  <h3>{artigo.titulo}</h3>
                  <p>{artigo.resumo}</p>
                </Link>
              </Revelar>
            ))}
          </div>
        </section>
      )}

      <section className="secao secao--fina secao--creme">
        <div className="envolucro">
          <Revelar>
            <span className="olho">Outras áreas</span>
            <div className="grade grade--3" style={{ marginTop: '1rem' }}>
              {outras.map((item) => (
                <Link className="cartao" key={item.slug} para={`/${item.slug}/`}>
                  <h3>{item.nome}</h3>
                  <p>{item.resumoHome}</p>
                  <span className="cartao__link">
                    Conhecer a área
                    <IconeSeta tamanho={15} />
                  </span>
                </Link>
              ))}
            </div>
          </Revelar>
        </div>
      </section>

      <SecaoCta
        titulo={area.ctaTitulo}
        texto={area.ctaTexto}
        microcopy={area.ctaMicrocopy}
        botao={area.botaoPrincipal}
        destino="/contato-advogado-cuiaba/"
      />
    </>
  );
}
