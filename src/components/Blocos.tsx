import { formatar } from '../lib/texto';
import { linkWhatsApp } from '../site.config';
import { IconeWhatsApp } from './Icones';
import { Faq, type Pergunta } from './Faq';

/**
 * Renderiza o corpo dos artigos e das páginas jurídicas a partir do JSON.
 *
 * O conteúdo é escrito uma vez em `src/content/*.json` e sai daqui como HTML
 * semântico — títulos com âncora, listas, citações de lei e as caixas de
 * conversão que aparecem no meio da leitura.
 */
export type Bloco =
  | { t: 'p'; texto: string }
  | { t: 'h2'; texto: string; id?: string }
  | { t: 'h3'; texto: string; id?: string }
  | { t: 'ul'; itens: string[] }
  | { t: 'ol'; itens: string[] }
  | { t: 'destaque'; texto: string }
  | { t: 'lei'; texto: string; fonte: string }
  | { t: 'faq'; itens: Pergunta[] }
  | { t: 'cta'; titulo: string; texto: string; botao: string; mensagem?: string };

export function Blocos({ blocos }: { blocos: Bloco[] }) {
  return (
    <>
      {blocos.map((bloco, indice) => {
        switch (bloco.t) {
          case 'h2':
            return (
              <h2 key={indice} id={bloco.id}>
                {bloco.texto}
              </h2>
            );

          case 'h3':
            return (
              <h3 key={indice} id={bloco.id}>
                {bloco.texto}
              </h3>
            );

          case 'ul':
            return (
              <ul key={indice}>
                {bloco.itens.map((item, i) => (
                  <li key={i}>{formatar(item)}</li>
                ))}
              </ul>
            );

          case 'ol':
            return (
              <ol key={indice}>
                {bloco.itens.map((item, i) => (
                  <li key={i}>{formatar(item)}</li>
                ))}
              </ol>
            );

          case 'destaque':
            return (
              <aside className="destaque" key={indice}>
                <p>{formatar(bloco.texto)}</p>
              </aside>
            );

          case 'lei':
            return (
              <blockquote className="citacao-lei" key={indice}>
                {bloco.texto}
                <cite>{bloco.fonte}</cite>
              </blockquote>
            );

          case 'faq':
            return <Faq key={indice} perguntas={bloco.itens} idPrefixo={`bloco-${indice}`} />;

          case 'cta':
            return (
              <aside className="caixa-cta" key={indice}>
                <h3>{bloco.titulo}</h3>
                <p>{bloco.texto}</p>
                <a
                  className="botao botao--zap"
                  href={linkWhatsApp(bloco.mensagem)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cta="artigo"
                >
                  <IconeWhatsApp tamanho={18} />
                  {bloco.botao}
                </a>
              </aside>
            );

          case 'p':
          default:
            return <p key={indice}>{formatar(bloco.texto)}</p>;
        }
      })}
    </>
  );
}

/** Índice lateral construído a partir dos próprios títulos H2 do texto. */
export function Sumario({ blocos }: { blocos: Bloco[] }) {
  const titulos = blocos.filter(
    (bloco): bloco is Extract<Bloco, { t: 'h2' }> => bloco.t === 'h2' && !!bloco.id,
  );

  if (titulos.length < 3) return null;

  return (
    <nav className="sumario" aria-label="Neste artigo">
      <strong>Neste artigo</strong>
      <ol>
        {titulos.map((titulo) => (
          <li key={titulo.id}>
            <a href={`#${titulo.id}`}>{titulo.texto}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
