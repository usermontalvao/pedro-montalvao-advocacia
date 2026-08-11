/**
 * A decisão da rolagem encaixada, isolada do navegador.
 *
 * Fica separada de `movimento.tsx` de propósito: aqui não há React, nem DOM,
 * nem Lenis — só aritmética. É o pedaço que precisa estar certo em todos os
 * cantos (fim da página, bloco mais alto que a tela, parada bem no limite) e
 * o único jeito de conferir isso sem depender de um scroll real é podendo
 * chamá-lo com números na mão.
 */

export type BlocoEncaixavel = {
  /** Distância do topo do documento até o topo do bloco. */
  topo: number;
  /** Altura do bloco. */
  altura: number;
};

export type EstadoDaJanela = {
  /** Posição atual da rolagem. */
  rolagem: number;
  /** Altura visível. */
  altura: number;
  /** Maior rolagem possível: `scrollHeight - altura`. */
  limite: number;
};

/** Abaixo disso o bloco não é de tela cheia e não entra na conta. */
const FRACAO_DE_TELA_CHEIA = 0.9;

/** Desencontro tão pequeno que mexer na página só produziria um tranco. */
const FOLGA_MINIMA = 8;

/** Acima disso a parada foi deliberada: quem rolou para longe queria ir para longe. */
const FRACAO_MAXIMA_DE_CORRECAO = 0.38;

/**
 * Devolve a posição em que a rolagem deve assentar, ou `null` para deixar a
 * página exatamente onde o visitante a parou.
 */
export function alvoDeEncaixe(
  blocos: BlocoEncaixavel[],
  janela: EstadoDaJanela,
): number | null {
  const { rolagem, altura, limite } = janela;
  if (altura <= 0) return null;

  let melhor: number | null = null;

  for (const bloco of blocos) {
    if (bloco.altura < altura * FRACAO_DE_TELA_CHEIA) continue;
    // Um destino que a página não alcança faria o encaixe insistir para
    // sempre num ponto que nunca chega.
    if (bloco.topo > limite - 2) continue;
    if (melhor === null || Math.abs(bloco.topo - rolagem) < Math.abs(melhor - rolagem)) {
      melhor = bloco.topo;
    }
  }

  if (melhor === null) return null;

  const desencontro = Math.abs(melhor - rolagem);
  if (desencontro < FOLGA_MINIMA) return null;
  if (desencontro > altura * FRACAO_MAXIMA_DE_CORRECAO) return null;

  return melhor;
}
