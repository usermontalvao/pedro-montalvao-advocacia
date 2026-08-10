import { Link } from '../lib/router';
import { linkWhatsApp, SITE } from '../site.config';
import { IconeWhatsApp, IconeSeta } from './Icones';
import { Revelar } from './Revelar';

/** Bloco de conversão que fecha cada página. */
export function SecaoCta({
  olho = 'Contato',
  titulo,
  texto,
  microcopy,
  botao = 'Informações pelo WhatsApp',
  mensagem,
  destino,
  secundario = true,
}: {
  /** Linha curta acima do título. Trocar o rótulo muda o convite. */
  olho?: string;
  titulo: string;
  texto: string;
  microcopy?: string;
  botao?: string;
  mensagem?: string;
  destino?: string;
  secundario?: boolean;
}) {
  return (
    <section className="secao secao--escura">
      <div className="envolucro">
        <Revelar>
          <div className="cabeca-secao cabeca-secao--centro" style={{ marginBottom: 0 }}>
            <span className="olho">{olho}</span>
            <h2>{titulo}</h2>
            <p className="chamada">{texto}</p>

            <div className="grupo-botoes" style={{ justifyContent: 'center' }}>
              {destino ? (
                <Link className="botao botao--claro" para={destino} data-cta="secao-final">
                  {botao}
                  <IconeSeta />
                </Link>
              ) : (
                <a
                  className="botao botao--zap"
                  href={linkWhatsApp(mensagem)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cta="secao-final"
                >
                  <IconeWhatsApp tamanho={18} />
                  {botao}
                </a>
              )}
              {secundario && (
                <Link className="botao botao--transparente" para="/contato-advogado-cuiaba/">
                  Outras formas de atendimento
                  <IconeSeta />
                </Link>
              )}
            </div>

            <p className="microtexto" style={{ marginInline: 'auto' }}>
              {microcopy ??
                (destino
                  ? 'WhatsApp, e-mail, endereço, horário e formulário estão reunidos na página de contato.'
                  : `WhatsApp oficial: ${SITE.telefoneExibicao}. A mensagem não formaliza contratação.`)}
            </p>
          </div>
        </Revelar>
      </div>
    </section>
  );
}
