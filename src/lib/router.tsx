/**
 * Roteador mínimo, escrito à mão de propósito.
 *
 * O site é pré-renderizado: cada rota já chega ao navegador como HTML pronto,
 * e o JavaScript só assume a navegação depois. Para isso não é preciso uma
 * biblioteca de rotas inteira — bastam três coisas: saber o caminho atual,
 * trocar de caminho sem recarregar e reagir ao botão "voltar".
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from 'react';
import { rolarAte } from '../components/movimento';

type ContextoRota = {
  caminho: string;
  navegar: (destino: string) => void;
};

const RotaContext = createContext<ContextoRota>({
  caminho: '/',
  navegar: () => {},
});

/** Todas as rotas do site terminam em barra — inclusive a raiz. */
export function normalizar(caminho: string): string {
  const semQuery = caminho.split('?')[0].split('#')[0];
  if (!semQuery || semQuery === '/') return '/';
  return semQuery.endsWith('/') ? semQuery : `${semQuery}/`;
}

export function Roteador({ caminhoInicial, children }: { caminhoInicial: string; children: ReactNode }) {
  const [caminho, setCaminho] = useState(() => normalizar(caminhoInicial));

  const navegar = useCallback((destino: string) => {
    const alvo = normalizar(destino);
    const ancora = destino.includes('#') ? destino.slice(destino.indexOf('#')) : '';
    if (alvo === normalizar(window.location.pathname) && !ancora) return;
    window.history.pushState({}, '', alvo + ancora);
    setCaminho(alvo);
  }, []);

  useEffect(() => {
    const aoVoltar = () => setCaminho(normalizar(window.location.pathname));
    window.addEventListener('popstate', aoVoltar);
    return () => window.removeEventListener('popstate', aoVoltar);
  }, []);

  const valor = useMemo(() => ({ caminho, navegar }), [caminho, navegar]);
  return <RotaContext.Provider value={valor}>{children}</RotaContext.Provider>;
}

export function useRota() {
  return useContext(RotaContext);
}

type PropsLink = AnchorHTMLAttributes<HTMLAnchorElement> & { para: string };

/**
 * Link interno. Continua sendo um `<a href>` de verdade no HTML — é assim que
 * o Google descobre e distribui autoridade entre as páginas — mas o clique é
 * interceptado para virar navegação instantânea.
 */
export function Link({ para, children, onClick, ...resto }: PropsLink) {
  const { navegar } = useRota();
  const externo = /^(https?:|mailto:|tel:)/.test(para);

  if (externo) {
    return (
      <a href={para} rel="noopener noreferrer" target="_blank" onClick={onClick} {...resto}>
        {children}
      </a>
    );
  }

  return (
    <a
      href={para}
      onClick={(evento) => {
        onClick?.(evento);
        // Deixa passar clique com modificador, botão do meio e nova aba.
        if (evento.defaultPrevented) return;
        if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
        if (evento.button !== 0) return;
        evento.preventDefault();
        navegar(para);
      }}
      {...resto}
    >
      {children}
    </a>
  );
}

/**
 * Depois de trocar de página, o visitante precisa começar do topo — a não ser
 * que o link aponte para uma âncora dentro da própria página.
 */
export function RolarAoTrocarDePagina({ caminho }: { caminho: string }) {
  const primeira = useRef(true);

  useEffect(() => {
    // Na primeira renderização a posição já é a que o navegador escolheu
    // (o topo, ou a âncora que veio no endereço). Mexer nisso só causa salto.
    if (primeira.current) {
      primeira.current = false;
      return;
    }

    const ancora = window.location.hash;
    if (ancora.length > 1) {
      const alvo = document.getElementById(ancora.slice(1));
      if (alvo) {
        rolarAte(alvo);
        return;
      }
    }

    rolarAte(0, true);
  }, [caminho]);

  return null;
}
