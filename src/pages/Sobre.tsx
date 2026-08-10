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
              <span className="olho">Quem conduz o trabalho</span>
              <h1>{conteudo.h1}</h1>
              <p className="chamada">{conteudo.subtitulo}</p>
              {SITE.oab && <p className="microtexto">{oabFormatada()}</p>}
              <div className="grupo-botoes">
                <a
                  className="botao botao--contorno"
                  href={SITE.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver LinkedIn
                  <IconeSeta />
                </a>
                <Link className="botao botao--contorno" para="/contato-advogado-cuiaba/">
                  Formas de atendimento
                  <IconeSeta />
                </Link>
              </div>
            </div>

            <div className="heroi__retrato">
              <img
                src="/midia/retrato-institucional.webp"
                srcSet="/midia/retrato-institucional-720.webp 720w, /midia/retrato-institucional.webp 1376w"
                sizes="(max-width: 900px) 90vw, 420px"
                alt={`${SITE.advogado}, advogado inscrito na OAB de Mato Grosso`}
                width={1376}
                height={768}
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
              <span className="olho">Atuação</span>
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
          <div className="metodo-linha">
            <Revelar className="metodo-linha__introducao">
              <span className="olho">Na prática</span>
              <h2>{conteudo.trabalhoTitulo}</h2>
            </Revelar>
            {conteudo.trabalho.map((item, indice) => (
              <Revelar className="metodo-linha__item" key={item.titulo} atraso={indice * 70}>
                <span>{String(indice + 1).padStart(2, '0')}</span>
                <h3>{item.titulo}</h3>
                <p>{item.texto}</p>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      <section className="secao">
        <div className="envolucro">
          <div className="contato-grade">
            <Revelar>
              <span className="olho">Presencial + online</span>
              <h2>{conteudo.escritorioTitulo}</h2>
              <p style={{ color: 'var(--texto-suave)' }}>{conteudo.escritorioTexto}</p>
              <p className="microtexto">{ENDERECO_LINHA}</p>
            </Revelar>

            <Revelar atraso={90}>
              <img
                src="/midia/sede-atendimento.webp"
                srcSet="/midia/sede-atendimento-720.webp 720w, /midia/sede-atendimento.webp 1400w"
                sizes="(max-width: 900px) 92vw, 520px"
                alt="Pedro Montalvão em ambiente profissional de atendimento"
                width={1400}
                height={1400}
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
        titulo={conteudo.ctaTitulo}
        texto={conteudo.ctaTexto}
        botao="Ver formas de atendimento"
        destino="/contato-advogado-cuiaba/"
        secundario={false}
      />
    </>
  );
}
