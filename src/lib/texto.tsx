import { Fragment, type ReactNode } from 'react';
import { Link } from './router';

/**
 * Formatação inline dos textos que vêm dos JSONs de conteúdo.
 *
 * Suporta só o que o conteúdo jurídico realmente usa: **negrito** e
 * [texto](/link). Nada de biblioteca de Markdown — são duas expressões
 * regulares, e o HTML gerado continua previsível para o rastreador.
 */
const PADRAO = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

export function formatar(texto: string): ReactNode {
  const partes = texto.split(PADRAO).filter(Boolean);

  return partes.map((parte, indice) => {
    if (parte.startsWith('**') && parte.endsWith('**')) {
      return <strong key={indice}>{parte.slice(2, -2)}</strong>;
    }

    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(parte);
    if (link) {
      return (
        <Link key={indice} para={link[2]}>
          {link[1]}
        </Link>
      );
    }

    return <Fragment key={indice}>{parte}</Fragment>;
  });
}

/** Versão em texto puro — para meta description e JSON-LD. */
export function semFormatacao(texto: string): string {
  return texto
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}
