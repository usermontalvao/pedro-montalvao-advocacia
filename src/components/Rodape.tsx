import { Link } from '../lib/router';
import { SITE, ENDERECO_LINHA, oabFormatada, linkWhatsApp } from '../site.config';
import { IconeSeta } from './Icones';
import { Marca } from './Marca';
import { Revelar } from './Revelar';
import areas from '../content/areas.json';

export function Rodape() {
  const ano = new Date().getFullYear();

  return (
    <footer className="rodape">
      <div className="rodape__luz" aria-hidden />
      <div className="envolucro rodape__interno">
        <Revelar className="rodape__chamada">
          <div>
            <span className="olho">Informações sobre atendimento</span>
            <h2>Canais de atendimento.</h2>
          </div>
          <Link
            className="botao botao--claro"
            para="/contato-advogado-cuiaba/"
            data-cta="rodape-destaque"
          >
            Canais de atendimento
            <IconeSeta tamanho={16} />
          </Link>
        </Revelar>

        <div className="rodape__corpo">
          <div className="rodape__identidade">
            <Marca tom="claro" altura={52} />
            <p>
              Atendimento presencial ou online, conforme o caso.
            </p>
            <span className="rodape__oab">{oabFormatada()}</span>
          </div>

          <nav className="rodape__coluna" aria-label="Navegação do escritório">
            <h3>Escritório</h3>
            <ul>
              <li><Link para="/sobre-advogado-cuiaba/">Sobre o advogado</Link></li>
              <li><Link para="/advogado-online-brasil/">Atendimento online</Link></li>
              <li><Link para="/artigos/">Artigos</Link></li>
              <li><Link para="/contato-advogado-cuiaba/">Contato e localização</Link></li>
            </ul>
          </nav>

          <nav className="rodape__coluna" aria-label="Áreas de atuação">
            <h3>Atuação</h3>
            <ul>
              <li><Link para="/areas-de-atuacao/">Todas as áreas</Link></li>
              {areas.map((area) => (
                <li key={area.slug}><Link para={`/${area.slug}/`}>{area.nome}</Link></li>
              ))}
            </ul>
          </nav>

          <address className="rodape__contato">
            <h3>Contato</h3>
            <a className="rodape__telefone" href={linkWhatsApp()} target="_blank" rel="noopener noreferrer" data-cta="rodape">
              <span>WhatsApp</span>
              <strong>{SITE.telefoneExibicao}</strong>
            </a>
            <a className="rodape__email" href={`mailto:${SITE.email}`}>{SITE.email}</a>
            <p>{ENDERECO_LINHA}</p>
            <p>{SITE.horario}</p>
            <div className="rodape__sociais">
              <a href={SITE.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href={SITE.mapa} target="_blank" rel="noopener noreferrer">
                Google Maps <IconeSeta tamanho={14} />
              </a>
            </div>
          </address>
        </div>

        <div className="rodape__legal">
          <p className="rodape__aviso">
            {SITE.advogado} — {oabFormatada()}. Conteúdo informativo, sem promessa de resultado. O
            envio de mensagem não formaliza contratação nem substitui a análise individual.
          </p>
          <div className="rodape__documentos">
            <Link para="/politica-de-privacidade/">Privacidade</Link>
            <Link para="/termos-de-uso/">Termos de uso</Link>
          </div>
        </div>

        <div className="rodape__base">
          <span>© {ano} {SITE.nome}</span>
          <span>Cuiabá — Mato Grosso</span>
        </div>
      </div>
    </footer>
  );
}
