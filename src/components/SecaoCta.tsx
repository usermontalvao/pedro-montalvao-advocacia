import { Link } from '../lib/router';
import { linkWhatsApp, SITE } from '../site.config';
import { IconeWhatsApp, IconeSeta } from './Icones';
import { Revelar } from './Revelar';

/** Bloco de conversão que fecha cada página. */
export function SecaoCta({
  titulo,
  texto,
  microcopy,
  botao = 'Falar pelo WhatsApp',
  mensagem,
  secundario = true,
}: {
  titulo: string;
  texto: string;
  microcopy?: string;
  botao?: string;
  mensagem?: string;
  secundario?: boolean;
}) {
  return (
    <section className="secao secao--escura">
      <div className="envolucro">
        <Revelar>
          <div className="cabeca-secao cabeca-secao--centro" style={{ marginBottom: 0 }}>
            <span className="olho">Fale com o escritório</span>
            <h2>{titulo}</h2>
            <p className="chamada">{texto}</p>

            <div className="grupo-botoes" style={{ justifyContent: 'center' }}>
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
              {secundario && (
                <Link className="botao botao--contorno" para="/contato-advogado-cuiaba/">
                  Ver outros canais de contato
                  <IconeSeta />
                </Link>
              )}
            </div>

            <p className="microtexto" style={{ marginInline: 'auto' }}>
              {microcopy ??
                `Atendimento pelo WhatsApp ${SITE.telefoneExibicao}. As informações enviadas serão utilizadas para retorno e análise inicial. O contato não representa contratação automática de serviços advocatícios.`}
            </p>
          </div>
        </Revelar>
      </div>
    </section>
  );
}
