import { linkWhatsApp } from '../site.config';
import { IconeWhatsApp } from './Icones';

/**
 * O CTA que acompanha o visitante o tempo todo.
 *
 * No computador é um botão flutuante no canto; no celular vira uma barra fixa.
 * O clique sempre abre diretamente o WhatsApp, sem etapas intermediárias.
 */
export function AcoesFlutuantes({ mensagem }: { mensagem?: string }) {
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
          Falar pelo WhatsApp
        </a>
      </div>
    </>
  );
}
