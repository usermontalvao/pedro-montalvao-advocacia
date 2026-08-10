import { Link } from '../lib/router';
import { SITE, ENDERECO_LINHA, oabFormatada, linkWhatsApp } from '../site.config';
import { Marca } from './Marca';
import areas from '../content/areas.json';

export function Rodape() {
  const ano = new Date().getFullYear();

  return (
    <footer className="rodape">
      <div className="envolucro">
        <div className="rodape__grade">
          <div>
            <Marca tom="claro" altura={46} />
            <p style={{ maxWidth: '34ch', marginTop: '1.3rem' }}>
              Atuação em Direito Trabalhista, Previdenciário, do Consumidor e de Família em Cuiabá,
              Mato Grosso, com atendimento online para todo o Brasil.
            </p>
          </div>

          <div>
            <h4>Áreas de atuação</h4>
            <ul>
              {areas.map((area) => (
                <li key={area.slug}>
                  <Link para={`/${area.slug}/`}>{area.nome}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Navegação</h4>
            <ul>
              <li>
                <Link para="/">Início</Link>
              </li>
              <li>
                <Link para="/sobre-advogado-cuiaba/">Sobre o advogado</Link>
              </li>
              <li>
                <Link para="/artigos/">Artigos</Link>
              </li>
              <li>
                <Link para="/contato-advogado-cuiaba/">Contato</Link>
              </li>
              <li>
                <Link para="/politica-de-privacidade/">Política de Privacidade</Link>
              </li>
              <li>
                <Link para="/termos-de-uso/">Termos de Uso</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4>Contato</h4>
            <ul>
              <li>
                <a href={linkWhatsApp()} target="_blank" rel="noopener noreferrer" data-cta="rodape">
                  WhatsApp {SITE.telefoneExibicao}
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </li>
              <li>{ENDERECO_LINHA}</li>
              <li>{SITE.horario}</li>
            </ul>
          </div>
        </div>

        <p className="rodape__aviso">
          <strong style={{ color: '#a9a49a' }}>Responsável:</strong> {SITE.advogado} — {oabFormatada()}.
          O conteúdo deste site possui caráter informativo e não substitui a análise individual de um
          caso. O envio de mensagem não formaliza contratação nem representa promessa de resultado.
        </p>

        <div className="rodape__base">
          <span>
            © {ano} {SITE.nome}. Todos os direitos reservados.
          </span>
          <span>Cuiabá — Mato Grosso · Atendimento online em todo o Brasil</span>
        </div>
      </div>
    </footer>
  );
}
