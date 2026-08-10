import { Link } from '../lib/router';
import { linkWhatsApp, MENSAGEM_PADRAO, SITE } from '../site.config';
import { IconeSeta, IconeWhatsApp } from '../components/Icones';
import { Revelar } from '../components/Revelar';
import {
  FundoCinema,
  Magnetico,
  Parallax,
  TextoIluminado,
  TrilhaEtapas,
} from '../components/movimento';
import { VideoFundo } from '../components/VideoFundo';
import { Faq } from '../components/Faq';
import { SecaoCta } from '../components/SecaoCta';
import conteudo from '../content/home.json';
import areas from '../content/areas.json';
import artigos from '../content/artigos.json';

/**
 * A home é construída como uma sequência de planos, não como uma pilha de
 * caixas: cada bloco ocupa a tela, tem fundo próprio e reage à rolagem. A
 * ordem conta uma história — quem é o escritório, no que ele atua, como o
 * atendimento funciona, o que ler antes de decidir e como falar com ele.
 */
export function Home() {
  const destaque = artigos.find((artigo) => artigo.destaque) ?? artigos[0];

  return (
    <>
      {/* ------------------------------------------------ plano 1: abertura */}
      <section className="heroi-cine heroi-cine--dividido">
        <Parallax forca={34} className="heroi-cine__fundo">
          <img
            src="/midia/retrato-institucional.webp"
            srcSet="/midia/retrato-institucional-720.webp 720w, /midia/retrato-institucional.webp 1400w"
            sizes="(max-width: 900px) 100vw, 66vw"
            alt={`Dr. ${SITE.advogado}, advogado em Cuiabá`}
            fetchPriority="high"
            style={{ objectPosition: '38% 22%' }}
          />
        </Parallax>
        <div className="heroi-cine__veu" aria-hidden />

        <div className="envolucro heroi-cine__conteudo">
          <span className="olho">{conteudo.heroOlho}</span>
          <h1 dangerouslySetInnerHTML={{ __html: conteudo.heroTitulo }} />
          <p className="chamada">{conteudo.heroTexto}</p>

          <div className="grupo-botoes">
            <Magnetico>
              <a
                className="botao botao--zap"
                href={linkWhatsApp(MENSAGEM_PADRAO)}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="heroi"
              >
                <IconeWhatsApp tamanho={18} />
                Falar pelo WhatsApp
              </a>
            </Magnetico>
            <a className="botao botao--contorno" href="#areas">
              Conhecer as áreas de atuação
              <IconeSeta />
            </a>
          </div>

          <p className="microtexto">{conteudo.heroMicrocopy}</p>

          <div className="rolar-cue" aria-hidden>
            <span />
            Role para conhecer o escritório
          </div>
        </div>
      </section>

      {/* --------------------------------------- plano 2: prova de seriedade */}
      <section className="secao secao--escura secao--fina">
        <div className="envolucro">
          <div className="faixa-provas" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
            {conteudo.provas.map((prova) => (
              <Revelar key={prova.rotulo} como="div">
                <div className="prova">
                  <strong>{prova.numero}</strong>
                  <span>{prova.rotulo}</span>
                </div>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------- plano 3: o manifesto */}
      <VideoFundo
        fonte="/midia/justica.mp4"
        cartaz="/midia/atendimento-escritorio.webp"
        cartazPequeno="/midia/atendimento-escritorio-720.webp"
        alt=""
      >
          <span className="olho">{conteudo.sobreOlho}</span>
          <TextoIluminado
            className="iluminado--destaque"
            texto="Questões jurídicas envolvem decisões importantes, prazos e documentos que precisam ser avaliados com atenção. Por isso aqui você fala com quem cuida do seu caso."
          />

          <Revelar atraso={120}>
            <div style={{ maxWidth: '58ch', marginTop: '2.6rem' }}>
              {conteudo.sobreParagrafos.slice(1).map((paragrafo) => (
                <p key={paragrafo.slice(0, 24)} style={{ color: 'var(--texto-claro-suave)' }}>
                  {paragrafo}
                </p>
              ))}
              <Link className="botao botao--contorno" para="/sobre-advogado-cuiaba/" style={{ marginTop: '0.8rem' }}>
                Conheça o advogado
                <IconeSeta />
              </Link>
            </div>
          </Revelar>
      </VideoFundo>

      {/* ----------------------------------------------- plano 4: as áreas */}
      <section className="secao secao--escura" id="areas">
        <div className="envolucro">
          <div className="areas-cine">
            <div className="areas-cine__titulo">
              <span className="olho">{conteudo.areasOlho}</span>
              <h2 style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.6rem)' }}>{conteudo.areasTitulo}</h2>
              <p className="chamada" style={{ fontSize: '1rem' }}>
                {conteudo.areasTexto}
              </p>
            </div>

            <div>
              {areas.map((area, indice) => (
                <Revelar key={area.slug} atraso={indice * 70}>
                  <Link className="area-linha" para={`/${area.slug}/`}>
                    <span className="area-linha__num">{String(indice + 1).padStart(2, '0')}</span>
                    <span>
                      <h3>{area.nome}</h3>
                      <p>{area.resumoHome}</p>
                    </span>
                    <span className="area-linha__seta" aria-hidden>
                      <IconeSeta tamanho={17} />
                    </span>
                  </Link>
                </Revelar>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------- plano 5: o escritório, em imagem */}
      <FundoCinema
        imagem="/midia/escritorio-cuiaba.webp"
        imagemPequena="/midia/escritorio-cuiaba-720.webp"
        alt="Entrada do escritório Pedro Montalvão Advocacia, no bairro Pedra 90, em Cuiabá"
        ancora="center 42%"
      >
        <Revelar>
          <span className="olho">Cuiabá · Mato Grosso · Brasil</span>
          <h2>Portas abertas em Cuiabá, atendimento em todo o país</h2>
          <p className="chamada" style={{ maxWidth: '48ch' }}>
            A sede fica no bairro Pedra 90 e recebe clientes com hora marcada. Para quem está em
            outra cidade ou estado, todo o atendimento acontece à distância — conversa, envio de
            documentos e acompanhamento.
          </p>
          <div className="grupo-botoes">
            <Link className="botao botao--dourado" para="/contato-advogado-cuiaba/">
              Ver endereço e canais
              <IconeSeta />
            </Link>
          </div>
        </Revelar>
      </FundoCinema>

      {/* ---------------------------------------------- plano 6: o processo */}
      <FundoCinema
        className="cinema--processo"
        imagem="/midia/atendimento-escritorio.webp"
        imagemPequena="/midia/atendimento-escritorio-720.webp"
        alt={`Dr. ${SITE.advogado} analisando documentos com um cliente no escritório`}
        ancora="70% center"
      >
          <Revelar>
            <div className="cabeca-secao">
              <span className="olho">{conteudo.processoOlho}</span>
              <h2>{conteudo.processoTitulo}</h2>
            </div>
          </Revelar>

          <TrilhaEtapas>
            {conteudo.passos.map((passo, indice) => (
              <Revelar key={passo.titulo} atraso={indice * 80}>
                <div className="etapa">
                  <span className="etapa__ordem">Etapa {indice + 1}</span>
                  <h3>{passo.titulo}</h3>
                  <p>{passo.texto}</p>
                </div>
              </Revelar>
            ))}
          </TrilhaEtapas>
      </FundoCinema>

      {/* ------------------------------------------- plano 7: artigo em foco */}
      {destaque && (
        <section className="secao">
          <div className="envolucro">
            <Revelar>
              <div className="cabeca-secao">
                <span className="olho">Conteúdo jurídico</span>
                <h2>Entenda seus direitos antes de decidir</h2>
                <p className="chamada">
                  Artigos escritos para quem está passando pelo problema agora — sem juridiquês e sem
                  promessa de resultado.
                </p>
              </div>
            </Revelar>

            <Revelar atraso={80}>
              <Link className="capa-artigo" para={`/artigos/${destaque.slug}/`}>
                <div className="capa-artigo__texto">
                  <span className="etiqueta">{destaque.categoria}</span>
                  <h2>{destaque.titulo}</h2>
                  <p>{destaque.resumo}</p>
                  <span className="cartao__link">
                    Ler o artigo · {destaque.tempoLeitura} min
                    <IconeSeta tamanho={15} />
                  </span>
                </div>
                <div className="capa-artigo__marca" aria-hidden>
                  <span>{destaque.tempoLeitura}′</span>
                </div>
              </Link>
            </Revelar>

            <Revelar atraso={140}>
              <p style={{ marginTop: '1.8rem' }}>
                <Link className="cartao__link" para="/artigos/">
                  Ver todos os artigos
                  <IconeSeta tamanho={15} />
                </Link>
              </p>
            </Revelar>
          </div>
        </section>
      )}

      {/* --------------------------------------------------- plano 8: dúvidas */}
      <section className="secao secao--creme">
        <div className="envolucro">
          <div className="contato-grade">
            <Revelar>
              <span className="olho">Dúvidas frequentes</span>
              <h2>{conteudo.faqTitulo}</h2>
              <p className="chamada">
                Se a sua dúvida não estiver aqui, mande uma mensagem: a resposta costuma levar poucos
                minutos.
              </p>
            </Revelar>

            <Revelar atraso={80}>
              <Faq perguntas={conteudo.faq} idPrefixo="home" />
            </Revelar>
          </div>
        </div>
      </section>

      <SecaoCta
        titulo={conteudo.ctaTitulo}
        texto={conteudo.ctaTexto}
        microcopy={conteudo.ctaMicrocopy}
      />
    </>
  );
}
