/**
 * Qual página a pessoa provavelmente queria.
 *
 * Um 404 que só diz "não encontrado" empurra a visita para fora. Um 404 que
 * responde "talvez você queira a calculadora de rescisão trabalhista" recupera
 * a visita sem mentir sobre o endereço — que é o motivo de não redirecionar
 * para a home: o buscador precisa ouvir "não existe", e a pessoa precisa saber
 * que digitou algo que não existe.
 *
 * A comparação é entre palavras, não entre caracteres soltos: o endereço
 * errado vira uma lista de palavras e cada página conhecida é pontuada pelo
 * quanto do que foi procurado ela cobre. Erro de digitação entra pela distância
 * de edição; plural e singular, pelo prefixo.
 */

export type PaginaConhecida = {
  caminho: string;
  titulo: string;
  nota?: string;
};

export type Sugestao = PaginaConhecida & { pontos: number; gemea: boolean };

/* Palavras que aparecem em quase todo endereço e não distinguem nada. */
const VAZIAS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'a', 'o', 'as', 'os',
  'para', 'com', 'por', 'um', 'uma', 'www', 'html', 'htm', 'php', 'index',
  'page', 'pagina', 'br', 'pt',
]);

function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function palavrasDe(texto: string): string[] {
  return semAcento(texto)
    .split(/[^a-z0-9]+/)
    .filter((palavra) => palavra.length > 1 && !VAZIAS.has(palavra));
}

/** Distância de edição com teto: acima do limite, o número exato não interessa. */
function distancia(a: string, b: string, limite = 2): number {
  if (Math.abs(a.length - b.length) > limite) return limite + 1;

  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const atual = [i];
    let menor = i;

    for (let j = 1; j <= b.length; j += 1) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min(atual[j - 1] + 1, anterior[j] + 1, anterior[j - 1] + custo);
      menor = Math.min(menor, atual[j]);
    }

    if (menor > limite) return limite + 1;
    anterior = atual;
  }

  return anterior[b.length];
}

/** O quanto uma palavra procurada é coberta pelo vocabulário de uma página. */
function forcaDaPalavra(procurada: string, vocabulario: string[]): number {
  let melhor = 0;

  for (const palavra of vocabulario) {
    if (palavra === procurada) return 1;

    const menor = Math.min(procurada.length, palavra.length);
    const maior = Math.max(procurada.length, palavra.length);

    /*
      Plural e singular entram; "conta" e "contato", não. Sem a proporção de
      tamanho, um prefixo curto casa com qualquer palavra maior que comece
      igual — era assim que a busca por /contato/ sugeria um artigo sobre conta
      bancária.
    */
    const prefixo =
      menor >= 4 &&
      menor / maior >= 0.8 &&
      (palavra.startsWith(procurada) || procurada.startsWith(palavra));
    if (prefixo) melhor = Math.max(melhor, 0.75);

    // Erro de digitação troca, inverte ou esquece uma letra — não encurta a
    // palavra inteira. Daí o limite de um caractere de diferença no tamanho.
    if (menor >= 5 && maior - menor <= 1 && distancia(procurada, palavra) <= 2) {
      melhor = Math.max(melhor, 0.55);
    }
  }

  return melhor;
}

function primeiroTrecho(caminho: string): string {
  return semAcento(caminho).split('/').filter(Boolean)[0] ?? '';
}

/**
 * Endereços que são quase o mesmo texto — `/calculadora/` e `/calculadoras/`.
 *
 * Este caso precisa de tratamento próprio porque a contagem de palavras não o
 * resolve: "calculadora" aparece em vinte e sete páginas e casa 100% com todas
 * elas, então a pontuação por palavra empurraria o visitante para uma
 * calculadora qualquer em vez da lista que ele claramente pediu.
 */
function ehGemea(procurado: string, candidato: string): boolean {
  const a = semAcento(procurado).replace(/^\/|\/$/g, '');
  const b = semAcento(candidato).replace(/^\/|\/$/g, '');
  return a.length >= 4 && distancia(a, b, 2) <= 2;
}

/**
 * As páginas mais parecidas com o endereço pedido, da mais provável para a menos.
 *
 * `minimo` é deliberadamente alto: sugestão ruim em página de erro é pior que
 * nenhuma — manda a pessoa para um lugar irrelevante e ainda parece deboche.
 */
export function sugerirPaginas(
  caminhoProcurado: string,
  paginas: PaginaConhecida[],
  { limite = 3, minimo = 0.5 } = {},
): Sugestao[] {
  const procuradas = palavrasDe(caminhoProcurado);
  if (procuradas.length === 0) return [];

  const trechoProcurado = primeiroTrecho(caminhoProcurado);

  return paginas
    .filter((pagina) => pagina.caminho !== caminhoProcurado && pagina.caminho !== '/')
    .map((pagina) => {
      const vocabulario = [
        ...palavrasDe(pagina.caminho),
        ...palavrasDe(pagina.titulo),
      ];

      const cobertura =
        procuradas.reduce((soma, palavra) => soma + forcaDaPalavra(palavra, vocabulario), 0) /
        procuradas.length;

      // Estar na mesma seção do site é um sinal forte: quem errou dentro de
      // /calculadoras/ quase sempre queria uma calculadora.
      const mesmaSecao = trechoProcurado && primeiroTrecho(pagina.caminho) === trechoProcurado;

      return {
        ...pagina,
        pontos: Math.min(1, cobertura + (mesmaSecao ? 0.15 : 0)),
        gemea: ehGemea(caminhoProcurado, pagina.caminho),
      };
    })
    .filter((pagina) => pagina.gemea || pagina.pontos >= minimo)
    // Endereço quase idêntico vem antes de qualquer parentesco por palavra.
    .sort(
      (a, b) =>
        Number(b.gemea) - Number(a.gemea) ||
        b.pontos - a.pontos ||
        a.caminho.length - b.caminho.length,
    )
    .slice(0, limite);
}
