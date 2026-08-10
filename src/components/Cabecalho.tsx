import { useEffect, useState } from 'react';
import { Link, useRota } from '../lib/router';
import { IconeSeta } from './Icones';
import { Marca } from './Marca';

const LINKS = [
  { rotulo: 'Início', para: '/' },
  { rotulo: 'Sobre o advogado', para: '/sobre-advogado-cuiaba/' },
  { rotulo: 'Atendimento online', para: '/advogado-online-brasil/' },
  { rotulo: 'Áreas de atuação', para: '/areas-de-atuacao/' },
  { rotulo: 'Artigos', para: '/artigos/' },
  { rotulo: 'Contato', para: '/contato-advogado-cuiaba/' },
];

export function Cabecalho() {
  const { caminho } = useRota();
  const [fixo, setFixo] = useState(false);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const aoRolar = () => setFixo(window.scrollY > 24);
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
    return () => window.removeEventListener('scroll', aoRolar);
  }, []);

  // Trocar de página fecha o menu do celular e devolve a rolagem ao corpo.
  useEffect(() => {
    setAberto(false);
  }, [caminho]);

  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [aberto]);

  const ativo = (para: string) => caminho === para;

  return (
    <>
      <header className={`cabecalho ${fixo || aberto ? 'cabecalho--fixo' : ''}`}>
        <div className="envolucro cabecalho__interno">
          <Link para="/" className="cabecalho__marca" aria-label="Pedro Montalvão Advocacia — início">
            <Marca tom="claro" altura={fixo ? 29 : 34} />
          </Link>

          <nav className="menu" aria-label="Navegação principal">
            <Link
              para="/"
              className={`menu__item ${ativo('/') ? 'menu__item--ativo' : ''}`}
            >
              Início
            </Link>

            <Link
              para="/sobre-advogado-cuiaba/"
              className={`menu__item ${ativo('/sobre-advogado-cuiaba/') ? 'menu__item--ativo' : ''}`}
            >
              Sobre o advogado
            </Link>

            <Link
              para="/advogado-online-brasil/"
              className={`menu__item ${ativo('/advogado-online-brasil/') ? 'menu__item--ativo' : ''}`}
            >
              Atendimento online
            </Link>

            <Link
              para="/areas-de-atuacao/"
              className={`menu__item ${ativo('/areas-de-atuacao/') || caminho.startsWith('/advogado-') && caminho !== '/advogado-online-brasil/' ? 'menu__item--ativo' : ''}`}
            >
              Áreas de atuação
            </Link>

            <Link
              para="/artigos/"
              className={`menu__item ${caminho.startsWith('/artigos') ? 'menu__item--ativo' : ''}`}
            >
              Artigos
            </Link>

            <Link
              para="/contato-advogado-cuiaba/"
              className={`menu__item ${ativo('/contato-advogado-cuiaba/') ? 'menu__item--ativo' : ''}`}
            >
              Contato
            </Link>
          </nav>

          <div className="cabecalho__acao">
            <Link
              className="botao botao--cabecalho"
              para="/contato-advogado-cuiaba/"
              data-cta="cabecalho"
            >
              Como falar
              <IconeSeta tamanho={15} />
            </Link>

            <button
              type="button"
              className="hamburguer"
              aria-expanded={aberto}
              aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
              onClick={() => setAberto((valor) => !valor)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {aberto && (
        <div className="menu-movel" id="menu-movel">
          {LINKS.map((item) => (
            <Link key={item.para} para={item.para}>
              {item.rotulo}
            </Link>
          ))}
          <Link
            className="botao botao--claro"
            para="/contato-advogado-cuiaba/"
            data-cta="menu-movel"
          >
            Ver formas de atendimento
            <IconeSeta tamanho={16} />
          </Link>
        </div>
      )}
    </>
  );
}
