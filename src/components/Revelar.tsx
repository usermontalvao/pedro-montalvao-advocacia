import { useEffect, useLayoutEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

/**
 * Aparece suavemente quando entra na tela.
 *
 * O conteúdo nasce VISÍVEL — no HTML servido e no primeiro quadro. Só depois,
 * antes da pintura, quem está abaixo da dobra é escondido para entrar animado.
 * A ordem importa: se o padrão fosse "invisível até o observador avisar", uma
 * falha do observador, um scroll programático ou um navegador sem suporte
 * deixariam a página em branco — que foi exatamente o que aconteceu aqui antes.
 */
export function Revelar({
  children,
  atraso = 0,
  como: Tag = 'div',
  className = '',
}: {
  children: ReactNode;
  atraso?: number;
  como?: ElementType;
  className?: string;
}) {
  const referencia = useRef<HTMLElement | null>(null);
  const [visivel, setVisivel] = useState(true);
  const [animar, setAnimar] = useState(false);

  useLayoutEffect(() => {
    const elemento = referencia.current;
    if (!elemento || !('IntersectionObserver' in window)) return;

    const posicao = elemento.getBoundingClientRect();
    // Já está na tela: nada a animar, evita o piscar do conteúdo.
    if (posicao.top < window.innerHeight * 0.92) return;

    setAnimar(true);
    setVisivel(false);
  }, []);

  useEffect(() => {
    const elemento = referencia.current;
    if (!elemento || !animar || visivel) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            setVisivel(true);
            observador.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.05 },
    );

    observador.observe(elemento);

    // Rede de segurança: se por qualquer motivo o observador não disparar,
    // o conteúdo aparece assim mesmo. Página em branco nunca é opção.
    const resgate = window.setTimeout(() => setVisivel(true), 2500);

    return () => {
      observador.disconnect();
      window.clearTimeout(resgate);
    };
  }, [animar, visivel]);

  return (
    <Tag
      ref={referencia}
      className={`${animar ? 'revelar' : ''} ${className}`.trim()}
      data-visivel={visivel ? 'true' : 'false'}
      style={atraso ? { transitionDelay: `${atraso}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
