import { Link } from '../lib/router';
import { SITE, oabFormatada, ENDERECO_LINHA } from '../site.config';
import { IconeSeta } from '../components/Icones';
import { Revelar } from '../components/Revelar';
import { SecaoCta } from '../components/SecaoCta';
import conteudo from '../content/sobre.json';
import areas from '../content/areas.json';

export function Sobre() {
  return (
    <>
      <section className="heroi">
        <div className="heroi__luz" aria-hidden />
        <div className="envolucro">
          <nav className="migalhas" aria-label="Você está em">
            <Link para="/">Início</Link>
            <span aria-hidden>/</span>
            <span>Sobre o advogado</span>
          </nav>

          <div className="heroi__grade">
            <div>
              <span className="olho">O advogado</span>
              <h1>{conteudo.h1}</h1>
              <p className="chamada">{conteudo.subtitulo}</p>
              {SITE.oab && <p className="microtexto">{oabFormatada()}</p>}
            </div>

            <div className="heroi__retrato">
              <img
                src="/midia/retrato-institucional.webp"
                srcSet="/midia/retrato-institucional-720.webp 720w, /midia/retrato-institucional.webp 1400w"
                sizes="(max-width: 900px) 90vw, 420px"
                alt={`${SITE.advogado}, advogado inscrito na OAB de Mato Grosso`}
                width={1400}
                height={1400}
                fetchPriority="high"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="secao">
        <div className="envolucro">
          <div className="contato-grade">
            <Revelar>
              <span className="olho">Trajetória</span>
              <h2>{conteudo.sobreTitulo}</h2>
            </Revelar>
            <Revelar atraso={80}>
              {conteudo.sobre.map((paragrafo) => (
                <p key={paragrafo.slice(0, 24)} style={{ color: 'var(--texto-suave)' }}>
                  {paragrafo}
                </p>
              ))}
            </Revelar>
          </div>
        </div>
      </section>

      <section className="secao secao--escura">
        <div className="envolucro">
          <Revelar>
            <div className="cabeca-secao">
              <span className="olho">Método</span>
              <h2>{conteudo.trabalhoTitulo}</h2>
            </div>
          </Revelar>

          <div className="passos">
            {conteudo.trabalho.map((item, indice) => (
              <Revelar key={item.titulo} atraso={indice * 80}>
                <div className="passo">
                  <h3>{item.titulo}</h3>
                  <p>{item.texto}</p>
                </div>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      <section className="secao">
        <div className="envolucro">
          <div className="contato-grade">
            <Revelar>
              <span className="olho">Estrutura</span>
              <h2>{conteudo.escritorioTitulo}</h2>
              <p style={{ color: 'var(--texto-suave)' }}>{conteudo.escritorioTexto}</p>
              <p className="microtexto">{ENDERECO_LINHA}</p>
            </Revelar>

            <Revelar atraso={90}>
              <img
                src="/midia/escritorio-cuiaba.webp"
                srcSet="/midia/escritorio-cuiaba-720.webp 720w, /midia/escritorio-cuiaba.webp 1400w"
                sizes="(max-width: 900px) 92vw, 520px"
                alt="Entrada do escritório Pedro Montalvão Advocacia em Cuiabá"
                width={1400}
                height={1867}
                loading="lazy"
                style={{ borderRadius: 'var(--raio-g)', width: '100%', objectFit: 'cover', aspectRatio: '4 / 3' }}
              />
            </Revelar>
          </div>
        </div>
      </section>

      <section className="secao secao--creme secao--fina">
        <div className="envolucro">
          <Revelar>
            <span className="olho">Áreas de atuação</span>
            <div className="grade grade--4" style={{ marginTop: '1rem' }}>
              {areas.map((area) => (
                <Link className="cartao" key={area.slug} para={`/${area.slug}/`}>
                  <h3>{area.nome}</h3>
                  <p>{area.resumoHome}</p>
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

      <SecaoCta titulo={conteudo.ctaTitulo} texto={conteudo.ctaTexto} />
    </>
  );
}
