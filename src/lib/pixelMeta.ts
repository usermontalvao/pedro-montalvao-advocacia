/**
 * Meta Pixel global.
 *
 * O script não entra no HTML estático: o componente global o carrega quando a
 * aplicação assume a página. Formulários, mensagens e respostas de triagem
 * nunca são incluídos nos eventos.
 */

/**
 * Identificador público do dataset/pixel (Gerenciador de Eventos › Fontes de
 * dados). A variável permite trocar o destino em builds de teste, mas o deploy
 * oficial por Git não depende de configuração externa na hospedagem.
 */
export const META_PIXEL_ID =
  import.meta.env.VITE_META_PIXEL_ID?.trim() || '1761556441358818';

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
  if (!ativo() || window.fbq) return;

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
}

/** Registra uma visita depois que o consentimento já foi concedido. */
export function visualizarPagina(): void {
  if (!ativo()) return;
  iniciarPixel();
  window.fbq?.('track', 'PageView');
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
