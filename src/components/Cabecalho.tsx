import { useEffect, useState } from 'react';
import { Link, useRota } from '../lib/router';
import { linkWhatsApp, MENSAGEM_PADRAO } from '../site.config';
import { IconeWhatsApp } from './Icones';
import { Marca } from './Marca';
import areas from '../content/areas.json';

const LINKS = [
  { rotulo: 'Início', para: '/' },
  { rotulo: 'Sobre o advogado', para: '/sobre-advogado-cuiaba/' },
  { rotulo: 'Atendimento online', para: '/advogado-online-brasil/' },
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
            <Marca tom="claro" altura={fixo ? 34 : 42} />
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

            <div className="menu__grupo">
              <button type="button" className="menu__item" aria-haspopup="true">
                Áreas de atuação
              </button>
              <div className="menu__painel">
                {areas.map((area) => (
                  <Link key={area.slug} para={`/${area.slug}/`}>
                    {area.nome}
                    <small>{resumoCurto(area.resumoHome)}</small>
                  </Link>
                ))}
              </div>
            </div>

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
            <a
              className="botao botao--cabecalho"
              href={linkWhatsApp(MENSAGEM_PADRAO)}
              target="_blank"
              rel="noopener noreferrer"
              data-cta="cabecalho"
            >
              <IconeWhatsApp tamanho={16} />
              Atendimento
            </a>

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
          {LINKS.slice(0, 3).map((item) => (
            <Link key={item.para} para={item.para}>
              {item.rotulo}
            </Link>
          ))}
          {areas.map((area) => (
            <Link key={area.slug} para={`/${area.slug}/`}>
              {area.nome}
            </Link>
          ))}
          {LINKS.slice(3).map((item) => (
            <Link key={item.para} para={item.para}>
              {item.rotulo}
            </Link>
          ))}
          <a
            className="botao botao--zap"
            href={linkWhatsApp(MENSAGEM_PADRAO)}
            target="_blank"
            rel="noopener noreferrer"
            data-cta="menu-movel"
          >
            <IconeWhatsApp tamanho={17} />
            Canais de atendimento
          </a>
        </div>
      )}
    </>
  );
}

function resumoCurto(texto: string): string {
  const corte = texto.split(',').slice(0, 3).join(',');
  return corte.length < texto.length ? `${corte}…` : texto;
}
