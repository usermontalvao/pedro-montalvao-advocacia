import { Link } from '../lib/router';
import { linkWhatsApp } from '../site.config';
import { IconeSeta, IconeWhatsApp } from '../components/Icones';
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
      <section className="heroi">
        <div className="heroi__luz" aria-hidden />
        <div className="envolucro">
          <nav className="migalhas" aria-label="Você está em">
            <Link para="/">Início</Link>
            <span aria-hidden>/</span>
            <span>{area.nome}</span>
          </nav>

          <div style={{ maxWidth: '860px' }}>
            <span className="olho">{area.nome}</span>
            <h1>{area.h1}</h1>
            <p className="chamada">{area.subtitulo}</p>

            <div className="grupo-botoes">
              <a
                className="botao botao--zap"
                href={linkWhatsApp(area.mensagemZap)}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="heroi-area"
              >
                <IconeWhatsApp tamanho={18} />
                {area.botaoPrincipal}
              </a>
              <a className="botao botao--contorno" href="#temas">
                Conhecer as formas de atuação
                <IconeSeta />
              </a>
            </div>

            <p className="microtexto">{area.microcopyHero}</p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- intro */}
      <section className="secao">
        <div className="envolucro">
          <div className="contato-grade">
            <Revelar>
              <span className="olho">Como o escritório atua</span>
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
              <span className="olho">Temas atendidos</span>
              <h2>{area.temasTitulo}</h2>
            </div>
          </Revelar>

          <Revelar atraso={70}>
            <div className="lista-temas">
              {area.temas.map((tema) => (
                <article className="tema" key={tema.titulo}>
                  <h3>{tema.titulo}</h3>
                  <p>{tema.texto}</p>
                </article>
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
              <span className="olho">Momento certo</span>
              <h2>{area.quandoTitulo}</h2>
              {area.quando.map((paragrafo) => (
                <p key={paragrafo.slice(0, 24)} style={{ color: 'var(--texto-suave)' }}>
                  {paragrafo}
                </p>
              ))}

              <a
                className="botao botao--dourado"
                href={linkWhatsApp(area.mensagemZap)}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="meio-area"
                style={{ marginTop: '0.8rem' }}
              >
                <IconeWhatsApp tamanho={18} />
                Tirar uma dúvida agora
              </a>
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
              <p className="chamada">
                Respostas gerais. A orientação aplicável ao seu caso depende dos fatos e dos
                documentos.
              </p>
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
                    Ver página
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
        mensagem={area.mensagemZap}
      />
    </>
  );
}
