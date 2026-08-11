import { Link } from '../lib/router';
import { SITE } from '../site.config';
import { IconeSeta } from '../components/Icones';
import { Revelar } from '../components/Revelar';
import { Faq } from '../components/Faq';
import { SecaoCta } from '../components/SecaoCta';
import { AberturaMarca } from '../components/AberturaMarca';
import { Parallax } from '../components/movimento';
import conteudo from '../content/home.json';
import areas from '../content/areas.json';

export function Home() {
  return (
    <>
      <AberturaMarca />

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
            <a className="rolar-cue" href="#areas" aria-label="Continuar para as áreas de atuação">
              <span aria-hidden />
              Onde sua questão começa
            </a>
          </div>
        </div>
      </section>

      <section className="secao secao--areas-home" id="areas">
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

      <section id="apresentacao" className="secao secao--metodo-home">
        <div className="envolucro">
          <div className="metodo-home__abertura">
            <Revelar className="metodo-home__texto">
              <span className="olho">{conteudo.sobreOlho}</span>
              <h2>{conteudo.sobreTitulo}</h2>
              {conteudo.sobreParagrafos.map((paragrafo) => (
                <p key={paragrafo.slice(0, 28)}>{paragrafo}</p>
              ))}

              <div className="metodo-home__responsavel">
                <span>Condução pessoal</span>
                <strong>{SITE.advogado}</strong>
                <small>OAB/MT 30.021</small>
              </div>

              <Link className="botao botao--contorno" para="/sobre-advogado-cuiaba/">
                Conhecer o advogado
                <IconeSeta />
              </Link>
            </Revelar>

            <Revelar className="metodo-home__foto" atraso={80}>
              <img
                src="/midia/atendimento-escritorio.webp"
                srcSet="/midia/atendimento-escritorio-720.webp 720w, /midia/atendimento-escritorio.webp 1376w"
                sizes="(max-width: 900px) 100vw, 48vw"
                alt={`${SITE.advogado} analisando documentos com um cliente no escritório`}
                width={1376}
                height={768}
                loading="lazy"
              />
            </Revelar>
          </div>

          <div className="metodo-home__processo">
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
        </div>
      </section>

      <section className="secao secao--online-home">
        <div className="envolucro online-home">
          <Revelar className="online-home__texto">
            <span className="olho">Atendimento online</span>
            <h2>Perto, mesmo à distância.</h2>
            <p className="chamada">
              Reuniões, documentos e acompanhamento podem acontecer online. Se algum ato exigir
              presença física, isso é alinhado desde o início.
            </p>
            <Link className="botao botao--escuro" para="/advogado-online-brasil/">
              Ver o atendimento online
              <IconeSeta />
            </Link>
          </Revelar>

          <Revelar className="online-home__etapas" atraso={70}>
            <article>
              <span>01</span>
              <div>
                <h3>Reunião</h3>
                <p>O relato e as primeiras orientações podem acontecer por videochamada.</p>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <h3>Documentos</h3>
                <p>O envio e a organização dos documentos são realizados por meios digitais.</p>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <h3>Acompanhamento</h3>
                <p>Etapas e eventual necessidade de presença física são alinhadas com clareza.</p>
              </div>
            </article>
          </Revelar>
        </div>
      </section>

      <section className="secao secao--publicacoes-home">
        <div className="envolucro">
          <Revelar className="cabeca-secao">
            <span className="olho">Para ler com calma</span>
            <h2>Direito, sem o juridiquês.</h2>
            <p className="chamada">
              Textos para entender regras, limites e providências antes de qualquer decisão.
            </p>
          </Revelar>

          <Revelar atraso={70}>
            <Link className="publicacoes-home" para="/artigos/">
              <div className="publicacoes-home__texto">
                <span className="etiqueta">Publicações</span>
                <h3>Entenda antes de decidir.</h3>
                <p>
                  Conteúdo informativo sobre problemas reais, escrito para transformar termos
                  técnicos em informação útil — sem promessas nem atalhos.
                </p>
                <span className="cartao__link">
                  Ler os artigos
                  <IconeSeta tamanho={16} />
                </span>
              </div>
              <div className="publicacoes-home__areas" aria-hidden>
                <span>Trabalho</span>
                <span>INSS</span>
                <span>Consumo</span>
                <span>Família</span>
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
        tom="destaque"
        titulo={conteudo.ctaTitulo}
        texto={conteudo.ctaTexto}
        microcopy={conteudo.ctaMicrocopy}
        botao="Informações pelo WhatsApp"
      />
    </>
  );
}
