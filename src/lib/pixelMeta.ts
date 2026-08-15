/**
 * Meta Pixel — só nas páginas de campanha.
 *
 * O site institucional não carrega rastreador nenhum, e continua assim: este
 * módulo não faz nada até uma página pedir explicitamente por `iniciarPixel()`.
 * Quem paga anúncio, porém, precisa saber quantas pessoas terminaram a triagem
 * e quantas foram para o WhatsApp — sem isso o Meta otimiza no escuro, pelo
 * clique, e o clique não é o que o escritório quer comprar.
 *
 * Para ligar: defina `VITE_META_PIXEL_ID` no ambiente do build. Enquanto ele
 * estiver vazio ou inválido, nada é carregado e nenhum evento é enviado — a
 * landing funciona normalmente, apenas sem medição.
 */

/** Identificador do pixel (Gerenciador de Eventos › Fontes de dados). */
export const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID?.trim() ?? '';

type Fbq = ((...argumentos: unknown[]) => void) & {
  callMethod?: (...argumentos: unknown[]) => void;
  queue?: unknown[];
  push?: unknown;
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/** IDs de Pixel/Dataset da Meta são compostos somente por algarismos. */
export function pixelConfigurado(): boolean {
  return /^\d{5,25}$/.test(META_PIXEL_ID);
}

function ativo(): boolean {
  return typeof window !== 'undefined' && pixelConfigurado();
}

/**
 * Carrega o fbq uma única vez e registra a visita.
 *
 * O script entra por injeção, e não no `index.html`, justamente para não pesar
 * nas páginas orgânicas: quem lê um artigo não baixa nada do Facebook.
 */
export function iniciarPixel(): void {
  if (!ativo()) return;
  if (window.fbq) {
    window.fbq('track', 'PageView');
    return;
  }

  const fila: Fbq = function (...argumentos: unknown[]) {
    if (fila.callMethod) fila.callMethod(...argumentos);
    else fila.queue?.push(argumentos);
  } as Fbq;

  fila.queue = [];
  fila.loaded = true;
  fila.version = '2.0';
  fila.push = fila;

  window.fbq = fila;
  window._fbq = fila;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  fila('init', META_PIXEL_ID);
  fila('track', 'PageView');
}

/** Evento padrão do catálogo do Meta (ViewContent, Lead, Contact…). */
export function evento(nome: string, dados?: Record<string, unknown>): void {
  if (!ativo()) return;
  window.fbq?.('track', nome, dados);
}

/** Evento próprio, para desenhar o funil da triagem passo a passo. */
export function eventoProprio(nome: string, dados?: Record<string, unknown>): void {
  if (!ativo()) return;
  window.fbq?.('trackCustom', nome, dados);
}

/**
 * De qual anúncio veio a visita.
 *
 * O Meta acrescenta os parâmetros no endereço quando o anúncio é montado com
 * eles. O que estiver aqui vai junto na mensagem do WhatsApp — é o único jeito
 * de o escritório saber qual criativo trouxe o cliente que fechou.
 */
export function origemDaVisita(): { campanha?: string; anuncio?: string } {
  if (typeof window === 'undefined') return {};
  const parametros = new URLSearchParams(window.location.search);
  const campanha = parametros.get('utm_campaign') ?? parametros.get('utm_source') ?? undefined;
  const anuncio = parametros.get('utm_content') ?? parametros.get('utm_term') ?? undefined;
  return {
    ...(campanha ? { campanha } : {}),
    ...(anuncio ? { anuncio } : {}),
  };
}
