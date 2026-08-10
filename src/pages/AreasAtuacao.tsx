import { useState } from 'react';
import { Link } from '../lib/router';
import { IconeSeta } from '../components/Icones';
import { Revelar } from '../components/Revelar';
import { SecaoCta } from '../components/SecaoCta';
import areas from '../content/areas.json';

export function AreasAtuacao() {
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const areaAtiva = areas[indiceAtivo];

  return (
    <>
      <section className="areas-pagina__hero">
        <div className="envolucro">
          <nav className="migalhas" aria-label="Você está em">
            <Link para="/">Início</Link>
            <span aria-hidden>/</span>
            <span>Áreas de atuação</span>
          </nav>

          <div className="areas-pagina__abertura">
            <div className="areas-pagina__texto">
              <span className="olho">Áreas de atuação</span>
              <h1>O ponto de partida é o que aconteceu.</h1>
              <p className="chamada">
                Escolha o tema mais próximo da sua situação para conhecer as questões analisadas,
                os documentos que podem ser relevantes e os limites de uma orientação geral.
              </p>
              <Link className="botao botao--claro" para="/contato-advogado-cuiaba/">
                Ver canais de atendimento
                <IconeSeta />
              </Link>
            </div>

            <div className="areas-pagina__mosaico" aria-label="Contextos das áreas de atuação">
              {areas.map((area, indice) => (
                <Link
                  className="areas-pagina__miniatura"
                  key={area.slug}
                  para={`/${area.slug}/`}
                  aria-label={`Conhecer ${area.nome}`}
                >
                  <img
                    src={`/midia/${area.imagem}-720.webp`}
                    alt=""
                    width={720}
                    height={402}
                    loading={indice < 2 ? 'eager' : 'lazy'}
                  />
                  <span>{area.menu}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="secao areas-pagina__explorar">
        <div className="envolucro">
          <Revelar>
            <div className="cabeca-secao">
              <span className="olho">Explore cada frente</span>
              <h2>Quatro áreas. Diferentes contextos.</h2>
              <p className="chamada">
                Passe pelas opções para visualizar os principais assuntos de cada página.
              </p>
            </div>
          </Revelar>

          <div className="areas-explorador">
            <div className="areas-explorador__abas" role="tablist" aria-label="Escolha uma área">
              {areas.map((area, indice) => (
                <button
                  id={`aba-${area.slug}`}
                  type="button"
                  role="tab"
                  aria-selected={indiceAtivo === indice}
                  aria-controls="painel-area"
                  tabIndex={indiceAtivo === indice ? 0 : -1}
                  key={area.slug}
                  onClick={() => setIndiceAtivo(indice)}
                  onFocus={() => setIndiceAtivo(indice)}
                  onMouseEnter={() => setIndiceAtivo(indice)}
                >
                  <span>{String(indice + 1).padStart(2, '0')}</span>
                  {area.nome}
                </button>
              ))}
            </div>

            <article
              className="areas-explorador__painel"
              id="painel-area"
              role="tabpanel"
              aria-labelledby={`aba-${areaAtiva.slug}`}
            >
              <img
                key={areaAtiva.imagem}
                src={`/midia/${areaAtiva.imagem}.webp`}
                srcSet={`/midia/${areaAtiva.imagem}-720.webp 720w, /midia/${areaAtiva.imagem}.webp 1376w`}
                sizes="(max-width: 900px) 100vw, 760px"
                alt={`Contexto relacionado a ${areaAtiva.nome}`}
                width={1376}
                height={768}
              />
              <div className="areas-explorador__conteudo">
                <span className="etiqueta">{areaAtiva.nome}</span>
                <h3>{areaAtiva.introTitulo}</h3>
                <p>{areaAtiva.intro[0]}</p>
                <ul>
                  {areaAtiva.temas.slice(0, 3).map((tema) => (
                    <li key={tema.titulo}>{tema.titulo}</li>
                  ))}
                </ul>
                <Link className="botao botao--claro" para={`/${areaAtiva.slug}/`}>
                  Conhecer esta área
                  <IconeSeta />
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="secao secao--creme areas-pagina__orientacao">
        <div className="envolucro">
          <div className="areas-pagina__orientacao-grade">
            <Revelar>
              <span className="olho">Antes de escolher</span>
              <h2>Uma situação pode envolver mais de uma área.</h2>
            </Revelar>
            <Revelar atraso={70}>
              <p className="chamada">
                A classificação inicial serve para organizar o contato. O enquadramento jurídico
                depende dos fatos, dos documentos e da relação existente entre as pessoas ou
                instituições envolvidas.
              </p>
              <Link className="cartao__link" para="/contato-advogado-cuiaba/">
                Consultar os canais oficiais
                <IconeSeta tamanho={15} />
              </Link>
            </Revelar>
          </div>
        </div>
      </section>

      <SecaoCta
        titulo="Não encontrou uma opção exata?"
        texto="Utilize a página de contato para informar o contexto. O primeiro retorno ajuda a identificar a área relacionada e os documentos iniciais."
        botao="Ver canais de atendimento"
        destino="/contato-advogado-cuiaba/"
        secundario={false}
      />
    </>
  );
}
