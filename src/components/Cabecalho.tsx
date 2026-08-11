import { useEffect, useRef, useState } from 'react';
import { Link, useRota } from '../lib/router';
import { IconeSeta, IconeWhatsApp } from './Icones';
import { Marca } from './Marca';
import { SITE, linkWhatsApp, oabFormatada } from '../site.config';

const LINKS = [
  { rotulo: 'Início', para: '/' },
  { rotulo: 'Sobre o advogado', para: '/sobre-advogado-cuiaba/' },
  { rotulo: 'Atendimento online', para: '/advogado-online-brasil/' },
  { rotulo: 'Áreas de atuação', para: '/areas-de-atuacao/' },
  { rotulo: 'Calculadoras', para: '/calculadoras/' },
  { rotulo: 'Artigos', para: '/artigos/' },
  { rotulo: 'Contato', para: '/contato-advogado-cuiaba/' },
];

export function Cabecalho() {
  const { caminho } = useRota();
  const [fixo, setFixo] = useState(false);
  const [recolhido, setRecolhido] = useState(false);
  const [aberto, setAberto] = useState(false);
  const ultimoY = useRef(0);
  const botao = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const jaAbriu = useRef(false);

  /*
    Duas leituras da mesma rolagem, e elas não se confundem:

    `fixo`      — passou do topo, então o cabeçalho ganha fundo e encolhe.
    `recolhido` — está descendo a página, então o cabeçalho sai do caminho.
                  Ao subir um pouco, ele volta. No celular isso devolve uma
                  faixa inteira de tela para a leitura sem tirar o menu de
                  perto — é o comportamento que o visitante já espera de um
                  aplicativo.
  */
  useEffect(() => {
    ultimoY.current = window.scrollY;
    let pendente = false;

    const medir = () => {
      const y = window.scrollY;
      const diferenca = y - ultimoY.current;

      setFixo(y > 24);

      // A margem de 6px evita que o tremor natural do dedo no celular fique
      // escondendo e mostrando o cabeçalho sem parar.
      if (Math.abs(diferenca) > 6) {
        setRecolhido(diferenca > 0 && y > 220);
        ultimoY.current = y;
      }
      pendente = false;
    };

    const aoRolar = () => {
      if (pendente) return;
      pendente = true;
      requestAnimationFrame(medir);
    };

    medir();
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

  /*
    Teclado e leitor de tela. O menu cobre a tela inteira, então precisa se
    comportar como caixa de diálogo: Esc fecha, o foco entra nele ao abrir e
    volta para o botão ao fechar. Sem a volta do foco, quem navega por teclado
    é devolvido ao início da página a cada vez que fecha o menu.
  */
  useEffect(() => {
    if (!aberto) {
      // Só devolve o foco se ele tiver saído daqui — senão, o botão roubaria
      // o foco assim que a página carrega.
      if (jaAbriu.current) botao.current?.focus({ preventScroll: true });
      return;
    }

    jaAbriu.current = true;
    painel.current?.querySelector('a')?.focus({ preventScroll: true });

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAberto(false);
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto]);

  const ativo = (para: string) => caminho === para;

  return (
    <>
      <header
        className={`cabecalho ${fixo || aberto ? 'cabecalho--fixo' : ''} ${
          recolhido && !aberto ? 'cabecalho--recolhido' : ''
        }`}
      >
        <div className="envolucro cabecalho__interno">
          <Link para="/" className="cabecalho__marca" aria-label="Pedro Montalvão Advocacia — início">
            <Marca tom="claro" altura={34} semSimbolo />
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
              para="/calculadoras/"
              className={`menu__item ${caminho.startsWith('/calculadoras') ? 'menu__item--ativo' : ''}`}
            >
              Calculadoras
            </Link>

            <Link
              para="/artigos/"
              className={`menu__item ${caminho.startsWith('/artigos') ? 'menu__item--ativo' : ''}`}
            >
              Artigos
            </Link>

            {/*
              "Contato" não repete aqui: o botão à direita leva exatamente para
              a mesma página, e o link duplicado só roubava os ~95px que
              faltavam para o menu respirar. Ele continua no menu do celular e
              no rodapé, onde o espaço não é disputado.
            */}
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
              ref={botao}
              type="button"
              className="hamburguer"
              aria-expanded={aberto}
              aria-controls="menu-movel"
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
        <div
          ref={painel}
          className="menu-movel"
          id="menu-movel"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
        >
          <div className="menu-movel__fundo" aria-hidden />

          <nav className="menu-movel__lista" aria-label="Navegação principal">
            {LINKS.map((item, indice) => (
              <Link
                key={item.para}
                para={item.para}
                className={`menu-movel__link ${
                  ativo(item.para) ? 'menu-movel__link--ativo' : ''
                }`}
                style={{ '--i': indice } as React.CSSProperties}
              >
                <span className="menu-movel__num" aria-hidden>
                  {String(indice + 1).padStart(2, '0')}
                </span>
                <span className="menu-movel__rotulo">{item.rotulo}</span>
                <span className="menu-movel__seta" aria-hidden>
                  <IconeSeta tamanho={17} />
                </span>
              </Link>
            ))}
          </nav>

          <div className="menu-movel__pe" style={{ '--i': LINKS.length } as React.CSSProperties}>
            <a
              className="botao botao--zap"
              href={linkWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              data-cta="menu-movel"
            >
              <IconeWhatsApp tamanho={17} />
              Falar pelo WhatsApp
            </a>
            <p className="menu-movel__assinatura">
              {SITE.advogado}
              <span>{oabFormatada()} · {SITE.cidade}/{SITE.uf}</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
