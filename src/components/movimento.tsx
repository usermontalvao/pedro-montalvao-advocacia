import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';

/**
 * A camada de movimento do site.
 *
 * Regra que vale para tudo aqui: **movimento nunca esconde conteúdo**. O HTML
 * pré-renderizado sai completo e legível; a animação só entra depois da
 * hidratação, sobre um texto que já estava lá. Isso mantém o site rápido para
 * o Google e utilizável para quem chega com JavaScript bloqueado.
 *
 * Tudo respeita `prefers-reduced-motion`: quem pediu menos animação ao sistema
 * recebe a página parada.
 */

/* ------------------------------------------------------- rolagem suave */

/**
 * Inércia na rolagem (Lenis). É o detalhe que mais separa um site "feito no
 * template" de um site autoral — a página passa a deslizar em vez de saltar.
 */
export function useRolagemSuave() {
  const reduzido = useReducedMotion();

  useEffect(() => {
    if (reduzido) return;

    let ativo = true;
    let quadro = 0;

    import('lenis').then(({ default: Lenis }) => {
      if (!ativo) return;

      const lenis = new Lenis({
        duration: 1.05,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        // No celular a rolagem nativa já é boa; interceptá-la só atrapalha.
        syncTouch: false,
      });

      /*
        Enquanto o Lenis está no comando, `window.scrollTo` e `scrollIntoView`
        deixam de funcionar — ou seja, os links do índice do artigo e o reset
        de rolagem ao trocar de página parariam de responder. Publicar a
        instância aqui é o que permite ao resto do site continuar mandando a
        página para um ponto específico.
      */
      janelaComLenis().__lenis = lenis;

      const passo = (tempo: number) => {
        lenis.raf(tempo);
        quadro = requestAnimationFrame(passo);
      };
      quadro = requestAnimationFrame(passo);
    });

    // Âncoras internas (#capitulo) passam a deslizar até o destino, já
    // descontando a altura do cabeçalho fixo.
    const aoClicar = (evento: MouseEvent) => {
      const alvo = (evento.target as HTMLElement)?.closest('a');
      if (!alvo) return;
      const destino = alvo.getAttribute('href');
      if (!destino || !destino.startsWith('#') || destino.length < 2) return;

      const elemento = document.getElementById(destino.slice(1));
      if (!elemento) return;

      evento.preventDefault();
      window.history.replaceState({}, '', destino);
      rolarAte(elemento);
    };

    document.addEventListener('click', aoClicar);

    return () => {
      ativo = false;
      cancelAnimationFrame(quadro);
      document.removeEventListener('click', aoClicar);
      janelaComLenis().__lenis?.destroy();
      janelaComLenis().__lenis = undefined;
    };
  }, [reduzido]);
}

type Lenis = {
  raf: (tempo: number) => void;
  destroy: () => void;
  scrollTo: (alvo: number | HTMLElement, opcoes?: Record<string, unknown>) => void;
};

function janelaComLenis() {
  return window as unknown as { __lenis?: Lenis };
}

/** Leva a página até um ponto, com ou sem rolagem suave ativa. */
export function rolarAte(alvo: HTMLElement | number, imediato = false) {
  // A posição é calculada aqui, e não delegada ao Lenis com o elemento: passar
  // o elemento depende de ele descobrir sozinho qual é o contêiner de rolagem,
  // e num layout com `overflow-x` no corpo essa descoberta falha calada.
  const destino =
    typeof alvo === 'number'
      ? alvo
      : Math.max(0, alvo.getBoundingClientRect().top + window.scrollY - 96);

  const lenis = janelaComLenis().__lenis;
  if (lenis) {
    lenis.scrollTo(destino, { immediate: imediato });
    return;
  }

  window.scrollTo({ top: destino, behavior: imediato ? 'auto' : 'smooth' });
}

/* ---------------------------------------------------- troca de página */

/**
 * Fade curto ao trocar de rota: dá continuidade em vez de corte seco.
 *
 * A primeira página NUNCA é animada. Animar a entrada inicial faria o texto
 * já pintado pelo pré-render sumir e voltar assim que o React hidratasse —
 * pisca na cara do visitante e atrasa a leitura sem ganhar nada.
 */
export function TransicaoPagina({ chave, children }: { chave: string; children: ReactNode }) {
  const reduzido = useReducedMotion();
  const primeira = useRef(chave);

  if (reduzido || primeira.current === chave) return <>{children}</>;

  return (
    <motion.div
      key={chave}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------ botões */

/**
 * Botão que se inclina de leve na direção do cursor. Some no toque e em
 * `prefers-reduced-motion` — é enfeite, não função.
 */
export function Magnetico({ children, className = '' }: { children: ReactNode; className?: string }) {
  const alvo = useRef<HTMLSpanElement>(null);
  const reduzido = useReducedMotion();

  function mover(evento: React.MouseEvent<HTMLSpanElement>) {
    if (reduzido || !alvo.current) return;
    const caixa = alvo.current.getBoundingClientRect();
    const x = evento.clientX - caixa.left - caixa.width / 2;
    const y = evento.clientY - caixa.top - caixa.height / 2;
    alvo.current.style.transform = `translate(${x * 0.14}px, ${y * 0.22}px)`;
  }

  function sair() {
    if (alvo.current) alvo.current.style.transform = '';
  }

  return (
    <span
      ref={alvo}
      className={`magnetico ${className}`.trim()}
      onMouseMove={mover}
      onMouseLeave={sair}
    >
      {children}
    </span>
  );
}

/* ----------------------------------------------------------- números */

/** Conta de 0 até o número quando a faixa de credibilidade entra na tela. */
export function ContadorAnimado({ valor, sufixo = '' }: { valor: number; sufixo?: string }) {
  const referencia = useRef<HTMLSpanElement>(null);
  const [atual, setAtual] = useState(valor);
  const reduzido = useReducedMotion();

  useEffect(() => {
    const elemento = referencia.current;
    if (!elemento || reduzido || !('IntersectionObserver' in window)) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((entrada) => entrada.isIntersecting)) return;
        observador.disconnect();

        const duracao = 900;
        const inicio = performance.now();
        const passo = (agora: number) => {
          const progresso = Math.min(1, (agora - inicio) / duracao);
          const suave = 1 - Math.pow(1 - progresso, 3);
          setAtual(Math.round(valor * suave));
          if (progresso < 1) requestAnimationFrame(passo);
        };
        setAtual(0);
        requestAnimationFrame(passo);
      },
      { threshold: 0.4 },
    );

    observador.observe(elemento);
    return () => observador.disconnect();
  }, [valor, reduzido]);

  return (
    <span ref={referencia}>
      {atual}
      {sufixo}
    </span>
  );
}

/* --------------------------------------------------------- parallax */

/** Deslocamento sutil da foto do herói conforme a página desce. */
export function Parallax({
  children,
  forca = 40,
  className = '',
}: {
  children: ReactNode;
  forca?: number;
  className?: string;
}) {
  const alvo = useRef<HTMLDivElement>(null);
  const reduzido = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: alvo, offset: ['start end', 'end start'] });
  const bruto = useTransform(scrollYProgress, [0, 1], [forca, -forca]);
  const y = useSpring(bruto, { stiffness: 120, damping: 26, mass: 0.4 });

  return (
    <div ref={alvo} className={className}>
      <motion.div className="parallax__interno" style={reduzido ? undefined : { y }}>
        {children}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------- barra de leitura do artigo */

/** Fio dourado no topo mostrando quanto falta do artigo. */
export function ProgressoLeitura() {
  const { scrollYProgress } = useScroll();
  const largura = useSpring(scrollYProgress, { stiffness: 160, damping: 30, mass: 0.3 });

  return <motion.div className="progresso-leitura" style={{ scaleX: largura }} aria-hidden />;
}

/* ------------------------------------------------- blocos cinematográficos */

/**
 * Fundo que se move e cresce enquanto o bloco atravessa a tela.
 *
 * É o efeito que dá sensação de câmera: a imagem anda mais devagar que o
 * texto, então o bloco ganha profundidade em vez de parecer um slide parado.
 */
export function FundoCinema({
  imagem,
  imagemPequena,
  alt = '',
  children,
  ancora = 'center',
  className = '',
}: {
  imagem: string;
  imagemPequena?: string;
  alt?: string;
  children: ReactNode;
  ancora?: string;
  className?: string;
}) {
  const alvo = useRef<HTMLElement>(null);
  const reduzido = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: alvo, offset: ['start end', 'end start'] });

  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  const escala = useTransform(scrollYProgress, [0, 0.5, 1], [1.14, 1.04, 1.14]);

  return (
    <section ref={alvo} className={`cinema ${className}`.trim()}>
      <motion.div className="cinema__fundo" style={reduzido ? undefined : { y, scale: escala }}>
        <img
          src={imagem}
          srcSet={imagemPequena ? `${imagemPequena} 720w, ${imagem} 1400w` : undefined}
          sizes="100vw"
          alt={alt}
          style={{ objectPosition: ancora }}
          loading="lazy"
        />
      </motion.div>
      <div className="cinema__veu" aria-hidden />
      <div className="envolucro cinema__conteudo">{children}</div>
    </section>
  );
}

/**
 * Frase que acende palavra por palavra conforme a página desce.
 *
 * O texto inteiro está sempre no HTML — o que muda é só a opacidade de cada
 * palavra. Nada é escondido de quem não roda JavaScript.
 */
export function TextoIluminado({ texto, className = '' }: { texto: string; className?: string }) {
  const alvo = useRef<HTMLParagraphElement>(null);
  const reduzido = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: alvo,
    offset: ['start 0.85', 'start 0.28'],
  });

  const palavras = texto.split(' ');

  if (reduzido) {
    return <p className={`iluminado ${className}`.trim()}>{texto}</p>;
  }

  return (
    <p ref={alvo} className={`iluminado ${className}`.trim()}>
      {palavras.map((palavra, indice) => (
        <Fragment key={`${palavra}-${indice}`}>
          <Palavra
            progresso={scrollYProgress}
            faixa={[indice / palavras.length, (indice + 1.6) / palavras.length]}
          >
            {palavra}
          </Palavra>{' '}
        </Fragment>
      ))}
    </p>
  );
}

function Palavra({
  children,
  progresso,
  faixa,
}: {
  children: ReactNode;
  progresso: MotionValue<number>;
  faixa: [number, number];
}) {
  const opacidade = useTransform(progresso, faixa, [0.16, 1]);
  /*
    O espaço entre as palavras fica FORA deste <span>, como nó de texto irmão.
    Dentro não funciona: a palavra é `inline-block` e o navegador descarta o
    espaço na borda — a frase sai emendada. E resolver com `margin` seria pior
    ainda: consertaria só o visual, enquanto o HTML entregue ao Google e ao
    leitor de tela continuaria com tudo grudado.
  */
  return (
    <motion.span style={{ opacity: opacidade }} className="iluminado__palavra">
      {children}
    </motion.span>
  );
}

/** Fio vertical dourado que se preenche ao longo das etapas do atendimento. */
export function TrilhaEtapas({ children }: { children: ReactNode }) {
  const alvo = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: alvo, offset: ['start 0.8', 'end 0.6'] });
  const altura = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });

  return (
    <div ref={alvo} className="trilha">
      <div className="trilha__fio" aria-hidden>
        <motion.div className="trilha__fio-cheio" style={{ scaleY: altura }} />
      </div>
      {children}
    </div>
  );
}
