type Props = {
  /** 'claro' para fundo escuro, 'escuro' para fundo claro. */
  tom?: 'claro' | 'escuro';
  /** Altura total do bloco, em pixels. */
  altura?: number;
  /** Só o nome, sem o filete e sem "Advocacia" — para espaços apertados. */
  compacta?: boolean;
  className?: string;
};

export function Marca({ tom = 'claro', altura = 44, compacta = false, className = '' }: Props) {
  const src = tom === 'claro'
    ? '/midia/simbolo-logo-branco.png?v=2'
    : '/midia/simbolo-logo.png?v=2';

  return (
    <span
      className={`marca marca--${tom} ${compacta ? 'marca--compacta' : ''} ${className}`.trim()}
      style={{ ['--marca-altura' as string]: `${altura}px` }}
      role="img"
      aria-label="Pedro Montalvão Advocacia"
    >
      <img className="marca__simbolo" src={src} alt="" width="512" height="486" decoding="async" />
      <span className="marca__assinatura" aria-hidden>
        <span className="marca__nome">Pedro Montalvão</span>
        {!compacta && (
          <span className="marca__base">
            <span className="marca__linha" />
            <span className="marca__apoio">Advocacia</span>
          </span>
        )}
      </span>
    </span>
  );
}
