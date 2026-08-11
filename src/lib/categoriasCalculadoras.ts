import calculadoras from '../content/calculadoras.json';
import categorias from '../content/categoriasCalculadoras.json';

/**
 * As calculadoras separadas por área do Direito.
 *
 * O catálogo em `categoriasCalculadoras.json` lista todas as áreas que o
 * escritório pretende cobrir — inclusive as que ainda não têm ferramenta
 * publicada. Quem decide se uma área vira página é o conteúdo: só entra no site
 * a categoria que já tem calculadora, porque uma página de categoria vazia não
 * ajuda ninguém e ainda pesa como conteúdo raso na busca.
 *
 * O resto do site (rotas, hub, mapa, auditoria) lê daqui em vez de filtrar
 * `categoria` na mão, então publicar uma calculadora previdenciária amanhã já
 * cria a página `/calculadoras/previdenciario/` sem tocar em mais nada.
 */

export type CategoriaCalculadora = (typeof categorias)[number];
export type CalculadoraDoCatalogo = (typeof calculadoras)[number];

export const CATEGORIAS_CALCULADORAS: CategoriaCalculadora[] = categorias;

export function caminhoDaCategoria(categoria: CategoriaCalculadora): string {
  return `/calculadoras/${categoria.slug}/`;
}

export function calculadorasDaCategoria(
  categoria: CategoriaCalculadora,
): CalculadoraDoCatalogo[] {
  return calculadoras.filter((calculadora) => calculadora.categoria === categoria.categoria);
}

/** Categorias que já têm pelo menos uma ferramenta no ar — as que viram página. */
export const CATEGORIAS_PUBLICADAS: CategoriaCalculadora[] = CATEGORIAS_CALCULADORAS.filter(
  (categoria) => calculadorasDaCategoria(categoria).length > 0,
);

/** Áreas anunciadas no hub, mas ainda sem ferramenta — não geram rota. */
export const CATEGORIAS_EM_PREPARO: CategoriaCalculadora[] = CATEGORIAS_CALCULADORAS.filter(
  (categoria) => calculadorasDaCategoria(categoria).length === 0,
);

export function categoriaDaCalculadora(
  calculadora: Pick<CalculadoraDoCatalogo, 'categoria'>,
): CategoriaCalculadora | undefined {
  return CATEGORIAS_CALCULADORAS.find((categoria) => categoria.categoria === calculadora.categoria);
}

/**
 * As ferramentas da categoria já divididas nos blocos declarados no catálogo.
 *
 * A ordem dos blocos vem do JSON; a das ferramentas, do arquivo de conteúdo.
 * Um grupo sem ferramenta simplesmente não aparece, e uma ferramenta com grupo
 * desconhecido cai num bloco final em vez de sumir da página.
 */
export function gruposDaCategoria(categoria: CategoriaCalculadora): {
  nome: string;
  descricao: string;
  itens: CalculadoraDoCatalogo[];
}[] {
  const daCategoria = calculadorasDaCategoria(categoria);
  const declarados = categoria.grupos.map((grupo) => ({
    nome: grupo.nome,
    descricao: grupo.descricao,
    itens: daCategoria.filter((calculadora) => calculadora.grupo === grupo.nome),
  }));

  const nomesDeclarados = new Set(categoria.grupos.map((grupo) => grupo.nome));
  const soltas = daCategoria.filter((calculadora) => !nomesDeclarados.has(calculadora.grupo));

  return [
    ...declarados.filter((grupo) => grupo.itens.length > 0),
    ...(soltas.length
      ? [{ nome: 'Outras ferramentas', descricao: 'Cálculos da área que ainda não entraram em um bloco próprio.', itens: soltas }]
      : []),
  ];
}

/** Data mais recente entre as ferramentas da categoria — vira o `lastmod` da página. */
export function atualizacaoDaCategoria(categoria: CategoriaCalculadora): string | undefined {
  const datas = calculadorasDaCategoria(categoria)
    .map((calculadora) => calculadora.atualizadoEm)
    .filter(Boolean)
    .sort();
  return datas.at(-1);
}
