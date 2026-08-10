import { Link } from '../lib/router';
import { linkWhatsApp, SITE } from '../site.config';
import { IconeWhatsApp, IconeSeta } from './Icones';
import { Revelar } from './Revelar';

/** Bloco de conversão que fecha cada página. */
export function SecaoCta({
  titulo,
  texto,
  microcopy,
  botao = 'Solicitar informações',
  mensagem,
  destino,
  secundario = true,
}: {
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
            <span className="olho">Canais oficiais</span>
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
                  className="botao botao--claro"
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
                  Endereço e outros canais
                  <IconeSeta />
                </Link>
              )}
            </div>

            <p className="microtexto" style={{ marginInline: 'auto' }}>
              {microcopy ??
                (destino
                  ? 'A página reúne WhatsApp, e-mail, endereço, horário e formulário de contato. O envio de mensagem não representa contratação automática.'
                  : `Atendimento pelo WhatsApp ${SITE.telefoneExibicao}. As informações enviadas serão utilizadas para retorno e análise inicial. O contato não representa contratação automática de serviços advocatícios.`)}
            </p>
          </div>
        </Revelar>
      </div>
    </section>
  );
}
