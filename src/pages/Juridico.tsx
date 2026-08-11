import { useEffect, useMemo, useState } from 'react';
import { Link } from '../lib/router';
import { Blocos, type Bloco } from '../components/Blocos';
import { IconeSeta } from '../components/Icones';
import areas from '../content/areas.json';
import { CATEGORIAS_PUBLICADAS, caminhoDaCategoria } from '../lib/categoriasCalculadoras';
import { sugerirPaginas } from '../lib/sugestaoDeRota';
import { PAGINAS_DO_MAPA } from './MapaDoSite';

export type PaginaJuridica = {
  titulo: string;
  atualizadoEm: string;
  blocos: Bloco[];
};

const FORMATO = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function Juridico({ pagina }: { pagina: PaginaJuridica }) {
  return (
    <>
      <section className="heroi" style={{ paddingBottom: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
        <div className="heroi__luz" aria-hidden />
        <div className="envolucro">
          <div className="artigo-cabeca">
            <nav className="migalhas" aria-label="Você está em">
              <Link para="/">Início</Link>
              <span aria-hidden>/</span>
              <span>{pagina.titulo}</span>
            </nav>
            <h1>{pagina.titulo}</h1>
            <p className="microtexto">
              Última atualização: {FORMATO.format(new Date(`${pagina.atualizadoEm}T12:00:00Z`))}
            </p>
          </div>
        </div>
      </section>

      <section className="secao">
        <div className="envolucro">
          <div className="artigo">
            <Blocos blocos={pagina.blocos} />
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Página de erro — que não redireciona para a home de propósito.
 *
 * Redirecionar transformaria todo endereço quebrado num "soft 404": o buscador
 * receberia a home no lugar de um erro honesto, e a visita cairia num lugar que
 * não pediu, sem entender o que houve. Além disso, link quebrado que redireciona
 * nunca aparece como link quebrado — o erro fica invisível por meses.
 *
 * Em vez disso, a página assume o erro e devolve caminho: primeiro a página mais
 * parecida com o que foi digitado, depois as seções que resolvem a maioria das
 * visitas.
 */
export function NaoEncontrada() {
  /*
    O endereço real só existe no navegador: o arquivo `404.html` é gerado uma
    vez, no build, e a hospedagem o serve para qualquer URL desconhecida. Ler o
    caminho depois da montagem também evita divergência na hidratação.
  */
  const [caminho, setCaminho] = useState('');

  useEffect(() => {
    setCaminho(window.location.pathname);
  }, []);

  const sugestoes = useMemo(
    () => (caminho ? sugerirPaginas(caminho, PAGINAS_DO_MAPA) : []),
    [caminho],
  );

  return (
    <>
      <section className="heroi erro-heroi">
        <div className="heroi__luz" aria-hidden />
        <div className="envolucro">
          <div className="erro-cabeca">
            <span className="olho">Erro 404</span>
            <h1>Esta página não foi encontrada</h1>
            <p className="chamada">
              O endereço pode ter mudado, ter sido digitado com um erro ou nunca ter existido. O
              site continua inteiro — abaixo estão os caminhos que levam ao que você procurava.
            </p>
            {caminho && caminho !== '/' && (
              <p className="erro-endereco">
                Endereço pedido: <code>{caminho}</code>
              </p>
            )}
            <div className="grupo-botoes">
              <Link className="botao botao--dourado" para="/">
                Voltar ao início
              </Link>
              <Link className="botao botao--contorno" para="/contato-advogado-cuiaba/">
                Falar com o escritório
              </Link>
            </div>
          </div>
        </div>
      </section>

      {sugestoes.length > 0 && (
        <section className="secao secao--fina">
          <div className="envolucro">
            <div className="cabeca-secao">
              <span className="olho">Talvez seja isto</span>
              <h2>
                {sugestoes.length === 1
                  ? 'Uma página parecida com o que você digitou.'
                  : 'Páginas parecidas com o que você digitou.'}
              </h2>
            </div>
            <ul className="erro-sugestoes">
              {sugestoes.map((sugestao) => (
                <li key={sugestao.caminho}>
                  <Link para={sugestao.caminho}>
                    <span>
                      <strong>{sugestao.titulo}</strong>
                      {sugestao.nota && <small>{sugestao.nota}</small>}
                    </span>
                    <IconeSeta tamanho={16} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="secao secao--creme">
        <div className="envolucro">
          <div className="cabeca-secao">
            <span className="olho">Por onde continuar</span>
            <h2>As seções que resolvem a maior parte das visitas.</h2>
          </div>

          <div className="grade grade--2">
            <article className="cartao">
              <h3>Calculadoras por área</h3>
              <p>Ferramentas gratuitas com memória de cálculo, separadas pela área do seu caso.</p>
              <div className="erro-atalhos">
                {CATEGORIAS_PUBLICADAS.map((categoria) => (
                  <Link key={categoria.slug} para={caminhoDaCategoria(categoria)}>
                    {categoria.nome}
                  </Link>
                ))}
                <Link para="/calculadoras/">Todas</Link>
              </div>
            </article>

            <article className="cartao">
              <h3>Áreas de atuação</h3>
              <p>O que o escritório atende, os documentos que ajudam e como começa o atendimento.</p>
              <div className="erro-atalhos">
                {areas.map((area) => (
                  <Link key={area.slug} para={`/${area.slug}/`}>
                    {/* Tira "Direito" e a preposição junto: "do Consumidor" sozinho fica capenga. */}
                    {area.nome.replace(/^Direito (d[aeo]s? )?/, '')}
                  </Link>
                ))}
              </div>
            </article>
          </div>

          <p className="erro-mapa">
            Se preferir ver tudo de uma vez, o <Link para="/mapa-do-site/">mapa do site</Link> lista
            todas as páginas publicadas, e os <Link para="/artigos/">artigos</Link> explicam regra,
            prazo e o que fazer em cada situação.
          </p>
        </div>
      </section>
    </>
  );
}
