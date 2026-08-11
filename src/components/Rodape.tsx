import { Link } from '../lib/router';
import { SITE, ENDERECO_LINHA, oabFormatada, linkWhatsApp } from '../site.config';
import { IconeSeta } from './Icones';
import { Marca } from './Marca';
import areas from '../content/areas.json';

export function Rodape() {
  const ano = new Date().getFullYear();

  return (
    <footer className="rodape rodape--novo">
      <div className="rodape__luz" aria-hidden />
      <div className="envolucro rodape-novo">
        <div className="rodape-novo__topo">
          <div className="rodape-novo__marca">
            <Marca tom="claro" altura={52} />
            <p>Advocacia em Cuiabá · atendimento online no Brasil</p>
            <span>{oabFormatada()}</span>
          </div>

          <div className="rodape-novo__contato">
            <span className="rodape-novo__rotulo">Contato oficial</span>
            <a
              className="rodape-novo__whatsapp"
              href={linkWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              data-cta="rodape"
            >
              <span>
                <small>WhatsApp</small>
                <strong>{SITE.telefoneExibicao}</strong>
              </span>
              <IconeSeta tamanho={20} />
            </a>
            <a className="rodape-novo__email" href={`mailto:${SITE.email}`}>
              {SITE.email}
            </a>
          </div>
        </div>

        <div className="rodape-novo__navegacao">
          <nav className="rodape-novo__atalhos" aria-label="Navegação do rodapé">
            <Link para="/sobre-advogado-cuiaba/">Sobre</Link>
            <Link para="/advogado-online-brasil/">Atendimento online</Link>
            <Link para="/areas-de-atuacao/">Áreas de atuação</Link>
            <Link para="/calculadoras/">Calculadoras</Link>
            <Link para="/artigos/">Artigos</Link>
            <Link para="/contato-advogado-cuiaba/">Contato e localização</Link>
          </nav>

          <nav className="rodape-novo__areas" aria-label="Áreas jurídicas">
            <span>Atuação</span>
            {areas.map((area) => (
              <Link key={area.slug} para={`/${area.slug}/`}>
                {area.nome.replace('Direito ', '')}
              </Link>
            ))}
          </nav>
        </div>

        <div className="rodape-novo__informacoes">
          <address>
            <a href={SITE.mapa} target="_blank" rel="noopener noreferrer">
              {ENDERECO_LINHA}
              <IconeSeta tamanho={13} />
            </a>
            <span>{SITE.horario}</span>
          </address>

          <div className="rodape-novo__sociais">
            <a href={SITE.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href={SITE.mapa} target="_blank" rel="noopener noreferrer">Google Maps</a>
          </div>
        </div>

        <div className="rodape-novo__base">
          <span>© {ano} {SITE.nome}</span>
          <div>
            <Link para="/mapa-do-site/">Mapa do site</Link>
            <Link para="/politica-de-privacidade/">Privacidade</Link>
            <Link para="/termos-de-uso/">Termos de uso</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
