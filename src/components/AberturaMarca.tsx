/**
 * Vinheta institucional da home. É decorativa, não bloqueia interação e some
 * sozinha; quem prefere movimento reduzido não a recebe.
 */
export function AberturaMarca() {
  return (
    <div className="abertura-marca" aria-hidden="true">
      <div className="abertura-marca__conteudo">
        <span className="abertura-marca__selo">
          <img
            className="abertura-marca__brasao"
            src="/midia/simbolo-logo.png?v=2"
            alt=""
            width={512}
            height={486}
            decoding="sync"
          />
        </span>
      </div>
    </div>
  );
}
