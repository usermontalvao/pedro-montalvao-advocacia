import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Vídeo de fundo — com freio de mão.
 *
 * Um vídeo pesado no plano de fundo é o jeito mais rápido de destruir a nota
 * de desempenho que faz o site aparecer bem no Google, e de queimar o pacote
 * de dados de quem chega pelo celular. Então ele só baixa quando TODAS estas
 * condições são verdadeiras:
 *
 *   1. a tela é grande (no celular a imagem estática já conta a história);
 *   2. o visitante não pediu economia de dados nem redução de movimento;
 *   3. a conexão não é lenta (2G/3G);
 *   4. o bloco realmente chegou perto da tela.
 *
 * Enquanto nada disso acontece, fica a imagem de cartaz — que é o que o HTML
 * pré-renderizado entrega e o que o rastreador do Google enxerga.
 */
type Conexao = { saveData?: boolean; effectiveType?: string };

export function VideoFundo({
  fonte,
  cartaz,
  cartazPequeno,
  alt = '',
  children,
  className = '',
}: {
  fonte: string;
  cartaz: string;
  cartazPequeno?: string;
  alt?: string;
  children: ReactNode;
  className?: string;
}) {
  const bloco = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [carregar, setCarregar] = useState(false);
  const [tocando, setTocando] = useState(false);

  useEffect(() => {
    const elemento = bloco.current;
    if (!elemento) return;

    const conexao = (navigator as Navigator & { connection?: Conexao }).connection;
    const economiza = conexao?.saveData === true;
    const lenta = /(^|-)2g$/.test(conexao?.effectiveType ?? '');
    const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const telaPequena = window.matchMedia('(max-width: 900px)').matches;

    if (economiza || lenta || menosMovimento || telaPequena) return;
    if (!('IntersectionObserver' in window)) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((entrada) => entrada.isIntersecting)) {
          setCarregar(true);
          observador.disconnect();
        }
      },
      { rootMargin: '400px 0px' },
    );

    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    if (!carregar || !video.current) return;
    const elemento = video.current;
    elemento.load();
    const aoPoder = () => {
      elemento.play().then(() => setTocando(true)).catch(() => setTocando(false));
    };
    elemento.addEventListener('canplay', aoPoder, { once: true });
    return () => elemento.removeEventListener('canplay', aoPoder);
  }, [carregar]);

  return (
    <section ref={bloco} className={`cinema cinema--video ${className}`.trim()}>
      <div className="cinema__fundo">
        <img
          src={cartaz}
          srcSet={cartazPequeno ? `${cartazPequeno} 720w, ${cartaz} 1400w` : undefined}
          sizes="100vw"
          alt={alt}
          loading="lazy"
        />
        {carregar && (
          <video
            ref={video}
            className="cinema__video"
            data-tocando={tocando}
            muted
            loop
            playsInline
            preload="none"
            tabIndex={-1}
            aria-hidden
          >
            <source src={fonte} type="video/mp4" />
          </video>
        )}
      </div>
      <div className="cinema__veu" aria-hidden />
      <div className="envolucro cinema__conteudo">{children}</div>
    </section>
  );
}
