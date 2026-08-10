import { useEffect, useState } from 'react';
import { linkWhatsApp } from '../site.config';
import { IconeWhatsApp, IconeAgenda } from './Icones';

/**
 * O CTA que acompanha o visitante o tempo todo.
 *
 * No computador é um botão flutuante no canto; no celular vira uma barra fixa
 * no rodapé com duas ações. Ele só aparece depois de uma rolagem curta — antes
 * disso o herói já tem o próprio botão, e dois convites sobrepostos na primeira
 * tela atrapalham em vez de converter.
 */
export function AcoesFlutuantes({ mensagem }: { mensagem?: string }) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const aoRolar = () => setVisivel(window.scrollY > 520);
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
    return () => window.removeEventListener('scroll', aoRolar);
  }, []);

  if (!visivel) return null;

  return (
    <>
      <a
        className="zap-flutuante"
        href={linkWhatsApp(mensagem)}
        target="_blank"
        rel="noopener noreferrer"
        data-cta="flutuante"
        aria-label="Falar pelo WhatsApp"
      >
        <span className="zap-flutuante__aro">
          <IconeWhatsApp tamanho={20} className="zap-flutuante__icone" />
        </span>
        Falar pelo WhatsApp
      </a>

      <div className="barra-movel">
        <a
          className="botao botao--zap"
          href={linkWhatsApp(mensagem)}
          target="_blank"
          rel="noopener noreferrer"
          data-cta="barra-movel"
        >
          <IconeWhatsApp tamanho={17} />
          WhatsApp
        </a>
        <a className="botao botao--contorno" href="/contato-advogado-cuiaba/" data-cta="barra-movel-contato">
          <IconeAgenda tamanho={17} />
          Contato
        </a>
      </div>
    </>
  );
}
