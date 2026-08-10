import { useEffect, useState } from 'react';
import { linkWhatsApp } from '../site.config';
import { IconeWhatsApp } from './Icones';
import type { Bloco } from './Blocos';

/**
 * Índice do artigo que acompanha a leitura.
 *
 * Ele marca o capítulo em que o leitor está — o que resolve o problema real de
 * um texto longo: saber onde se está e quanto falta. Os links são âncoras de
 * verdade, então o Google costuma usá-los como atalhos no resultado da busca.
 */
export function IndiceArtigo({ blocos, mensagem }: { blocos: Bloco[]; mensagem?: string }) {
  const titulos = blocos.filter(
    (bloco): bloco is Extract<Bloco, { t: 'h2' }> => bloco.t === 'h2' && !!bloco.id,
  );

  const [atual, setAtual] = useState<string | null>(titulos[0]?.id ?? null);

  useEffect(() => {
    if (titulos.length === 0 || !('IntersectionObserver' in window)) return;

    const secoes = titulos
      .map((titulo) => document.getElementById(titulo.id!))
      .filter((elemento): elemento is HTMLElement => !!elemento);

    const observador = new IntersectionObserver(
      (entradas) => {
        // O título "atual" é o último que já passou pela faixa superior da tela.
        const visiveis = entradas
          .filter((entrada) => entrada.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visiveis[0]) setAtual(visiveis[0].target.id);
      },
      { rootMargin: '-96px 0px -66% 0px', threshold: 0 },
    );

    secoes.forEach((secao) => observador.observe(secao));
    return () => observador.disconnect();
  }, [titulos.length]);

  if (titulos.length < 3) return null;

  return (
    <nav className="indice-fixo" aria-label="Índice do artigo">
      <strong>Neste artigo</strong>
      <ol>
        {titulos.map((titulo) => (
          <li key={titulo.id}>
            <a href={`#${titulo.id}`} data-atual={atual === titulo.id}>
              {titulo.texto}
            </a>
          </li>
        ))}
      </ol>

      <div className="indice-fixo__acao">
        <p>Passou por isso? Fale com o escritório.</p>
        <a
          className="botao botao--zap"
          href={linkWhatsApp(mensagem)}
          target="_blank"
          rel="noopener noreferrer"
          data-cta="indice-artigo"
        >
          <IconeWhatsApp tamanho={16} />
          WhatsApp
        </a>
      </div>
    </nav>
  );
}

/** Compartilhamento sem rastreador de rede social embutido na página. */
export function Compartilhar({ titulo }: { titulo: string }) {
  const [copiado, setCopiado] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => setUrl(window.location.href), []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2200);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="compartilhar">
      <span>Compartilhar:</span>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${titulo} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <IconeWhatsApp tamanho={15} />
        WhatsApp
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        LinkedIn
      </a>
      <button type="button" onClick={copiar}>
        {copiado ? 'Link copiado' : 'Copiar link'}
      </button>
    </div>
  );
}
