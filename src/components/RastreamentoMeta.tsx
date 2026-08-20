import { useEffect, useRef } from 'react';
import { evento, iniciarPixel, visualizarPagina } from '../lib/pixelMeta';
import { useRota } from '../lib/router';
import { SITE } from '../site.config';

function linkDoEscritorioNoWhatsApp(alvo: EventTarget | null): HTMLAnchorElement | null {
  const ancora = alvo instanceof Element ? alvo.closest('a') : null;
  if (!(ancora instanceof HTMLAnchorElement)) return null;

  try {
    const destino = new URL(ancora.href);
    const numero = destino.pathname.replace(/\D/g, '');
    return destino.hostname === 'wa.me' && numero === SITE.telefoneE164 ? ancora : null;
  } catch {
    return null;
  }
}

/** Centraliza PageView de todas as rotas e cliques no WhatsApp do escritório. */
export function RastreamentoMeta() {
  const { caminho } = useRota();
  const ultimaRota = useRef<string | null>(null);

  useEffect(() => {
    if (ultimaRota.current === caminho) return;

    iniciarPixel();
    visualizarPagina();
    if (caminho === '/conta-encerrada/') {
      evento('ViewContent', { content_name: 'Landing conta bloqueada ou encerrada' });
    }
    ultimaRota.current = caminho;
  }, [caminho]);

  useEffect(() => {
    const medirContato = (clique: MouseEvent) => {
      const ancora = linkDoEscritorioNoWhatsApp(clique.target);
      if (!ancora) return;

      evento('Contact', {
        content_name: ancora.dataset.cta || 'whatsapp',
        page_path: window.location.pathname,
      });
    };

    document.addEventListener('click', medirContato, true);
    return () => document.removeEventListener('click', medirContato, true);
  }, []);

  return null;
}
