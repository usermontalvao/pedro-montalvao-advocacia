import { Link } from '../lib/router';
import { Blocos, type Bloco } from '../components/Blocos';

export type PaginaJuridica = {
  titulo: string;
  atualizadoEm: string;
  blocos: Bloco[];
};

const FORMATO = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function Juridico({ pagina }: { pagina: PaginaJuridica }) {
  return (
    <>
      <section className="heroi" style={{ paddingBottom: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
        <div className="heroi__luz" aria-hidden />
        <div className="envolucro">
          <div className="artigo-cabeca">
            <nav className="migalhas" aria-label="Você está em">
              <Link para="/">Início</Link>
              <span aria-hidden>/</span>
              <span>{pagina.titulo}</span>
            </nav>
            <h1>{pagina.titulo}</h1>
            <p className="microtexto">
              Última atualização: {FORMATO.format(new Date(`${pagina.atualizadoEm}T12:00:00Z`))}
            </p>
          </div>
        </div>
      </section>

      <section className="secao">
        <div className="envolucro">
          <div className="artigo">
            <Blocos blocos={pagina.blocos} />
          </div>
        </div>
      </section>
    </>
  );
}

export function NaoEncontrada() {
  return (
    <section className="heroi" style={{ minHeight: '72vh', display: 'grid', alignItems: 'center' }}>
      <div className="heroi__luz" aria-hidden />
      <div className="envolucro">
        <div style={{ maxWidth: '620px' }}>
          <span className="olho">Erro 404</span>
          <h1>Esta página não foi encontrada</h1>
          <p className="chamada">
            O endereço pode ter mudado ou o conteúdo pode ter sido movido. Use os caminhos abaixo
            para continuar.
          </p>
          <div className="grupo-botoes">
            <Link className="botao botao--dourado" para="/">
              Voltar ao início
            </Link>
            <Link className="botao botao--contorno" para="/contato-advogado-cuiaba/">
              Falar com o escritório
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
