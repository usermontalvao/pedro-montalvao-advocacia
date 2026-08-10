import { Link } from '../lib/router';
import { SITE } from '../site.config';
import { IconeSeta } from '../components/Icones';
import { Revelar } from '../components/Revelar';
import { Faq } from '../components/Faq';
import { SecaoCta } from '../components/SecaoCta';
import { FundoCinema, Parallax, TextoIluminado } from '../components/movimento';
import { VideoFundo } from '../components/VideoFundo';
import conteudo from '../content/home.json';
import areas from '../content/areas.json';

export function Home() {
  return (
    <>
      <section className="heroi-cine heroi-cine--principal">
        <div className="heroi-cine__midia" aria-hidden>
          <Parallax className="heroi-cine__parallax" forca={58}>
            <img
              src="/midia/retrato-home.webp"
              srcSet="/midia/retrato-home-720.webp 720w, /midia/retrato-home.webp 1376w"
              sizes="100vw"
              alt=""
              fetchPriority="high"
            />
          </Parallax>
        </div>

        <div className="envolucro heroi-cine__conteudo">
          <div className="heroi-cine__texto">
            <span className="olho">{conteudo.heroOlho}</span>
            <h1 dangerouslySetInnerHTML={{ __html: conteudo.heroTitulo }} />
            <p className="chamada">{conteudo.heroTexto}</p>

            <div className="grupo-botoes">
              <Link
                className="botao botao--claro"
                para="/contato-advogado-cuiaba/"
                data-cta="heroi"
              >
                Ver formas de atendimento
                <IconeSeta />
              </Link>
              <Link className="botao botao--transparente" para="/areas-de-atuacao/">
                Ver áreas de atuação
              </Link>
            </div>

            <p className="microtexto">{conteudo.heroMicrocopy}</p>
            <a className="rolar-cue" href="#apresentacao" aria-label="Continuar para a apresentação">
              <span aria-hidden />
              Como trabalhamos
            </a>
          </div>
        </div>
      </section>

      <section className="faixa-credenciais" aria-label="Informações principais">
        <div className="envolucro faixa-provas">
          {conteudo.provas.map((prova) => (
            <div className="prova" key={prova.rotulo}>
              <strong>{prova.numero}</strong>
              <span>{prova.rotulo}</span>
            </div>
          ))}
        </div>
      </section>

      <FundoCinema
        id="apresentacao"
        className="cinema--atendimento"
        imagem="/midia/atendimento-escritorio.webp"
        imagemPequena="/midia/atendimento-escritorio-720.webp"
        ancora="center 38%"
      >
        <Revelar>
          <span className="olho">{conteudo.sobreOlho}</span>
          <h2>{conteudo.sobreTitulo}</h2>
          {conteudo.sobreParagrafos.map((paragrafo) => (
            <p key={paragrafo.slice(0, 28)}>{paragrafo}</p>
          ))}
          <Link className="botao botao--transparente" para="/sobre-advogado-cuiaba/">
            Conhecer o advogado
            <IconeSeta />
          </Link>
        </Revelar>
      </FundoCinema>

      <section className="secao secao--escura" id="areas">
        <div className="envolucro">
          <div className="areas-cine">
            <Revelar className="areas-cine__titulo">
              <span className="olho">{conteudo.areasOlho}</span>
              <h2>{conteudo.areasTitulo}</h2>
              <p className="chamada">{conteudo.areasTexto}</p>
            </Revelar>

            <div className="areas-cine__lista">
              {areas.map((area, indice) => (
                <Revelar key={area.slug} atraso={indice * 50}>
                  <Link className="area-linha" para={`/${area.slug}/`}>
                    <span className="area-linha__num">{String(indice + 1).padStart(2, '0')}</span>
                    <span>
                      <h3>{area.nome}</h3>
                      <p>{area.resumoHome}</p>
                    </span>
                    <span className="area-linha__seta" aria-hidden>
                      <IconeSeta tamanho={20} />
                    </span>
                  </Link>
                </Revelar>
              ))}
            </div>
          </div>
        </div>
      </section>

      <VideoFundo
        className="cinema--alcance"
        fonte="/midia/justica.mp4"
        cartaz="/midia/sede-atendimento.webp"
        cartazPequeno="/midia/sede-atendimento-720.webp"
      >
        <Revelar>
          <span className="olho">Atendimento online</span>
        </Revelar>
        <TextoIluminado
          como="h2"
          className="iluminado--destaque"
          texto="Perto, mesmo à distância."
        />
        <Revelar atraso={90}>
          <p>
            Reuniões, documentos e acompanhamento podem acontecer online. Se algum ato exigir
            presença física, isso é alinhado desde o início.
          </p>
          <Link className="botao botao--claro" para="/advogado-online-brasil/">
            Ver o atendimento online
            <IconeSeta />
          </Link>
        </Revelar>
      </VideoFundo>

      <section className="secao secao--processo">
        <div className="envolucro">
          <Revelar className="cabeca-secao">
            <span className="olho">{conteudo.processoOlho}</span>
            <h2>{conteudo.processoTitulo}</h2>
          </Revelar>

          <div className="passos">
            {conteudo.passos.map((passo, indice) => (
              <Revelar key={passo.titulo} atraso={indice * 60}>
                <article className="passo">
                  <h3>{passo.titulo}</h3>
                  <p>{passo.texto}</p>
                </article>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      <section className="secao secao--escura secao--perfil">
        <div className="envolucro perfil-destaque">
          <Revelar className="perfil-destaque__imagem">
            <img
              src="/midia/retrato-pedro-montalvao.webp"
              srcSet="/midia/retrato-pedro-montalvao-720.webp 720w, /midia/retrato-pedro-montalvao.webp 1400w"
              sizes="(max-width: 800px) 100vw, 48vw"
              alt={`${SITE.advogado}, ${SITE.oab ? `OAB/MT ${SITE.oab}` : 'advogado em Cuiabá'}`}
              width={1376}
              height={768}
              loading="lazy"
            />
          </Revelar>
          <Revelar className="perfil-destaque__texto" atraso={80}>
            <span className="olho">Quem conduz</span>
            <h2>Pedro Rodrigues<br />Montalvão Neto</h2>
            <p className="perfil-destaque__oab">OAB/MT 30.021</p>
            <p>
              Advogado cuiabano, com atuação trabalhista, previdenciária, de consumo e de família.
              Quem chega ao escritório fala diretamente com quem conduz o trabalho.
            </p>
            <Link className="botao botao--transparente" para="/sobre-advogado-cuiaba/">
              Conhecer o advogado
              <IconeSeta />
            </Link>
          </Revelar>
        </div>
      </section>

      <section className="secao">
        <div className="envolucro">
          <Revelar className="cabeca-secao">
            <span className="olho">Para ler com calma</span>
            <h2>Direito, sem o juridiquês.</h2>
            <p className="chamada">
              Textos para entender regras, limites e providências antes de qualquer decisão.
            </p>
          </Revelar>

          <Revelar atraso={70}>
            <Link className="capa-artigo capa-artigo--editorial" para="/artigos/">
              <div className="capa-artigo__texto">
                <span className="etiqueta">Publicações</span>
                <h2>Entenda antes de decidir.</h2>
                <p>
                  Conteúdo informativo, escrito para transformar termos técnicos em informação
                  útil — sem promessas nem atalhos.
                </p>
                <span className="cartao__link">
                  Ler os artigos
                  <IconeSeta tamanho={16} />
                </span>
              </div>
              <div className="capa-artigo__marca">
                <img
                  src="/midia/conteudo-juridico.webp"
                  srcSet="/midia/conteudo-juridico-720.webp 720w, /midia/conteudo-juridico.webp 1376w"
                  sizes="(max-width: 860px) 100vw, 420px"
                  alt="Pedro Montalvão"
                  width={1376}
                  height={768}
                  loading="lazy"
                />
              </div>
            </Link>
          </Revelar>
        </div>
      </section>

      <section className="secao secao--creme">
        <div className="envolucro contato-grade">
          <Revelar>
            <span className="olho">Antes do contato</span>
            <h2>{conteudo.faqTitulo}</h2>
            <p className="chamada">
              Quem atende, como funciona e o que você precisa saber antes de enviar documentos.
            </p>
          </Revelar>
          <Revelar atraso={70}>
            <Faq perguntas={conteudo.faq} idPrefixo="home" />
          </Revelar>
        </div>
      </section>

      <SecaoCta
        titulo={conteudo.ctaTitulo}
        texto={conteudo.ctaTexto}
        microcopy={conteudo.ctaMicrocopy}
        botao="Informações pelo WhatsApp"
      />
    </>
  );
}
