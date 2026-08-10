import { Link } from '../lib/router';
import { SITE, ENDERECO_LINHA, linkWhatsApp, MENSAGEM_PADRAO } from '../site.config';
import { IconeWhatsApp, IconeEmail, IconeMapa, IconeAgenda, IconeSeta } from '../components/Icones';
import { Revelar } from '../components/Revelar';
import { FormularioContato } from '../components/FormularioContato';

export function Contato() {
  return (
    <>
      <section className="heroi">
        <div className="heroi__luz" aria-hidden />
        <div className="envolucro">
          <nav className="migalhas" aria-label="Você está em">
            <Link para="/">Início</Link>
            <span aria-hidden>/</span>
            <span>Contato</span>
          </nav>

          <div style={{ maxWidth: '760px' }}>
            <span className="olho">Contato</span>
            <h1>Fale com o escritório.</h1>
            <p className="chamada">
              Conte o essencial. No retorno, o escritório orienta o que precisa vir depois.
            </p>

            <div className="grupo-botoes">
              <a
                className="botao botao--zap"
                href={linkWhatsApp(MENSAGEM_PADRAO)}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="heroi-contato"
              >
                <IconeWhatsApp tamanho={18} />
                Abrir WhatsApp oficial
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="secao">
        <div className="envolucro">
          <div className="contato-grade">
            <Revelar>
              <span className="olho">Você escolhe o canal</span>
              <h2>Como prefere conversar?</h2>

              <div style={{ marginTop: '1.6rem' }}>
                <div className="canal">
                  <span className="canal__icone" aria-hidden>
                    <IconeWhatsApp tamanho={19} />
                  </span>
                  <div>
                    <strong>WhatsApp</strong>
                    <a href={linkWhatsApp(MENSAGEM_PADRAO)} target="_blank" rel="noopener noreferrer" data-cta="canal">
                      {SITE.telefoneExibicao}
                    </a>
                  </div>
                </div>

                <div className="canal">
                  <span className="canal__icone" aria-hidden>
                    <IconeEmail />
                  </span>
                  <div>
                    <strong>E-mail</strong>
                    <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
                  </div>
                </div>

                <div className="canal">
                  <span className="canal__icone" aria-hidden>
                    <IconeMapa />
                  </span>
                  <div>
                    <strong>Endereço</strong>
                    <span>{ENDERECO_LINHA}</span>
                    <p className="microtexto" style={{ marginTop: '0.4rem' }}>
                      Atendimento presencial mediante agendamento.
                    </p>
                  </div>
                </div>

                <div className="canal">
                  <span className="canal__icone" aria-hidden>
                    <IconeAgenda />
                  </span>
                  <div>
                    <strong>Horário de atendimento</strong>
                    <span>{SITE.horario}</span>
                  </div>
                </div>
              </div>

              <div className="destaque" style={{ marginTop: '2rem' }}>
                <p style={{ fontSize: '0.92rem', marginBottom: '0.6rem' }}>
                  <strong>Antes de enviar sua mensagem</strong>
                </p>
                <p style={{ fontSize: '0.92rem', marginBottom: '0.6rem' }}>
                  Para começar, basta informar a área, a cidade e o que aconteceu em poucas linhas.
                </p>
                <p style={{ fontSize: '0.92rem', marginBottom: 0 }}>
                  Não envie senhas, códigos de autenticação, dados bancários completos ou documentos
                  sensíveis antes de confirmar que está utilizando um canal oficial do escritório.
                </p>
              </div>
            </Revelar>

            <Revelar atraso={90}>
              <div className="painel-form">
                <h2 style={{ fontSize: 'clamp(1.4rem, 2.4vw, 1.8rem)' }}>Deixe o resumo pronto.</h2>
                <p style={{ color: 'var(--texto-suave)', fontSize: '0.95rem' }}>
                  Você preenche. O WhatsApp abre com a mensagem organizada.
                </p>
                <FormularioContato origem="página de contato" />
              </div>
            </Revelar>
          </div>
        </div>
      </section>

      <section className="secao secao--escura localizacao" id="localizacao">
        <div className="envolucro localizacao__grade">
          <Revelar className="localizacao__texto">
            <span className="olho">Localização</span>
            <h2>Em Cuiabá, com hora marcada.</h2>
            <p>
              Para o atendimento presencial, confirme o horário antes do deslocamento.
            </p>
            <address>{ENDERECO_LINHA}</address>
            <a
              className="botao botao--transparente"
              href={SITE.mapa}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir rota no Google Maps
              <IconeSeta />
            </a>
          </Revelar>

          <Revelar className="localizacao__mapa" atraso={80}>
            <iframe
              src={SITE.mapaEmbed}
              width="600"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              title="Localização de Pedro Montalvão Advocacia no Google Maps"
            />
          </Revelar>
        </div>
      </section>

      <section className="secao secao--creme secao--fina">
        <div className="envolucro">
          <Revelar>
            <p className="microtexto" style={{ maxWidth: '80ch' }}>
              O envio da mensagem não formaliza a contratação, não cria automaticamente relação
              advogado-cliente e não interrompe prazos legais. Consulte a{' '}
              <Link para="/politica-de-privacidade/" style={{ textDecoration: 'underline' }}>
                Política de Privacidade
              </Link>{' '}
              e os{' '}
              <Link para="/termos-de-uso/" style={{ textDecoration: 'underline' }}>
                Termos de Uso
              </Link>
              .
            </p>
          </Revelar>
        </div>
      </section>
    </>
  );
}
