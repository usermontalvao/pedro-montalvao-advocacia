/**
 * A marca — logotipo tipográfico.
 *
 * Nada de emblema genérico (balança, coluna, martelo: todo escritório usa) e
 * nada de fonte manuscrita (envelhece rápido e some quando fica pequena). O
 * que sobra é o que sempre funcionou em advocacia: o nome, em serifada de
 * alto contraste, caixa alta, entreletra generosa, cortado por um filete
 * dourado. Sóbrio, legível a 20px e a 200px.
 *
 * É TEXTO, não imagem: nunca pixeliza, é lido por buscador e leitor de tela,
 * e herda a cor de onde estiver.
 */

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
  return (
    <span
      className={`marca marca--${tom} ${compacta ? 'marca--compacta' : ''} ${className}`.trim()}
      style={{ ['--marca-altura' as string]: `${altura}px` }}
    >
      <span className="marca__nome">
        Pedro <span className="marca__sobrenome">Montalvão</span>
      </span>
      {!compacta && (
        <span className="marca__base">
          <span className="marca__filete" aria-hidden />
          <span className="marca__apoio">Advocacia</span>
          <span className="marca__filete" aria-hidden />
        </span>
      )}
    </span>
  );
}
