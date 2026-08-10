import { Link } from '../lib/router';
import { SITE, ENDERECO_LINHA, oabFormatada, linkWhatsApp } from '../site.config';
import { IconeSeta } from './Icones';
import { Marca } from './Marca';
import { Revelar } from './Revelar';
import areas from '../content/areas.json';

/**
 * Rodapé.
 *
 * A informação é a mesma de sempre — o que muda é a forma de apresentá-la.
 * Antes tudo descia numa coluna só de parágrafos soltos, o que no celular
 * virava uma parede de texto de dois metros de altura. Agora cada bloco tem
 * um papel visível:
 *
 *   chamada    o último convite, em corpo grande;
 *   identidade quem assina, com a inscrição na OAB (exigência do Provimento);
 *   navegação  duas colunas curtas, não uma lista longa;
 *   contato    linhas de ficha — rótulo à esquerda, valor à direita;
 *   base       o miúdo legal, que precisa existir sem gritar.
 */
export function Rodape() {
  const ano = new Date().getFullYear();

  return (
    <footer className="rodape">
      <div className="rodape__luz" aria-hidden />
      <div className="envolucro rodape__interno">
        <Revelar className="rodape__chamada">
          <div>
            <span className="olho">Presencial em Cuiabá · online no Brasil</span>
            <h2>Contato com o escritório.</h2>
          </div>
          <Link
            className="botao botao--claro"
            para="/contato-advogado-cuiaba/"
            data-cta="rodape-destaque"
          >
            Ver formas de atendimento
            <IconeSeta tamanho={16} />
          </Link>
        </Revelar>

        <div className="rodape__corpo">
          <div className="rodape__identidade">
            <Marca tom="claro" altura={46} />
            <p>Atendimento direto, do primeiro relato à condução.</p>
            <span className="rodape__oab">{oabFormatada()}</span>
          </div>

          <nav className="rodape__navegacao" aria-label="Navegação do rodapé">
            <div className="rodape__coluna">
              <h3>Escritório</h3>
              <ul>
                <li><Link para="/sobre-advogado-cuiaba/">Sobre o advogado</Link></li>
                <li><Link para="/advogado-online-brasil/">Atendimento online</Link></li>
                <li><Link para="/calculadoras/">Calculadoras</Link></li>
                <li><Link para="/artigos/">Artigos</Link></li>
                <li><Link para="/contato-advogado-cuiaba/">Contato e localização</Link></li>
              </ul>
            </div>

            <div className="rodape__coluna">
              <h3>Atuação</h3>
              <ul>
                <li><Link para="/areas-de-atuacao/">Todas as áreas</Link></li>
                {areas.map((area) => (
                  <li key={area.slug}><Link para={`/${area.slug}/`}>{area.nome}</Link></li>
                ))}
              </ul>
            </div>
          </nav>

          <address className="rodape__contato">
            <h3>Contato</h3>

            <a
              className="rodape__linha rodape__linha--destaque"
              href={linkWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              data-cta="rodape"
            >
              <span>WhatsApp</span>
              <strong>{SITE.telefoneExibicao}</strong>
            </a>

            <a className="rodape__linha" href={`mailto:${SITE.email}`}>
              <span>E-mail</span>
              <strong>{SITE.email}</strong>
            </a>

            <p className="rodape__linha">
              <span>Escritório</span>
              <strong>{ENDERECO_LINHA}</strong>
            </p>

            <p className="rodape__linha">
              <span>Horário</span>
              <strong>{SITE.horario}</strong>
            </p>

            <div className="rodape__sociais">
              <a href={SITE.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href={SITE.mapa} target="_blank" rel="noopener noreferrer">
                Google Maps
                <IconeSeta tamanho={13} />
              </a>
            </div>
          </address>
        </div>

        <div className="rodape__base">
          <p className="rodape__aviso">
            {SITE.advogado} — {oabFormatada()}. Conteúdo informativo, sem promessa de resultado. O
            envio de mensagem não formaliza contratação nem substitui a análise individual.
          </p>

          <div className="rodape__miudo">
            <span>© {ano} {SITE.nome} · Cuiabá — Mato Grosso</span>
            <div className="rodape__documentos">
              <Link para="/mapa-do-site/">Mapa do site</Link>
              <Link para="/politica-de-privacidade/">Privacidade</Link>
              <Link para="/termos-de-uso/">Termos de uso</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
