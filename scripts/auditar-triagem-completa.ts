/**
 * Varredura exaustiva da triagem: toca em TODA alternativa de TODA tela.
 *
 * O caminhador usa `proximoPasso`, que é a mesma função que a tela usa — então
 * cada folha desta recursão é uma sequência de toques que uma pessoa real
 * conseguiria fazer, e nenhuma outra.
 *
 * O desfecho é conferido contra `esperado()`, escrito abaixo direto da
 * especificação e sem olhar para `avaliar()`. Comparar o código com ele mesmo
 * não provaria nada.
 *
 * Roda com `npm run test:triagem-completa` e leva ~30s. É por isso que existe
 * separado do `test:triagem`, que é instantâneo: aquele é para rodar a cada
 * alteração, este para rodar antes de subir campanha.
 */
import {
  PASSOS,
  avaliar,
  contarMarcadores,
  mensagemDoWhatsApp,
  passosVisiveis,
  proximoPasso,
  rotuloDaResposta,
  type Desfecho,
  type Respostas,
} from '../src/lib/triagemSemRegistro';

/* ------------------------------------------------------------- o oráculo */

const CORTES: [string, (r: Respostas) => boolean][] = [
  ['não trabalhou sem registro', (r) => r.sem_registro === 'nao'],
  ['saiu há mais de 2 anos', (r) => r.tempo_saida === 'mais_2_anos'],
  ['Administração Pública direta', (r) => r.empregador === 'adm_direta' || r.empregador === 'autarquia'],
  ['sem pessoalidade', (r) => r.pessoalidade === 'livremente'],
  ['sem onerosidade', (r) => r.onerosidade === 'nao'],
  ['sem habitualidade', (r) => r.habitualidade === 'nao'],
  ['sem subordinação', (r) => r.subordinacao === 'nao'],
];

const DUVIDAS: [string, (r: Respostas) => boolean][] = [
  ['empresa pública / economia mista', (r) => r.empregador === 'empresa_publica'],
  ['não sabe o empregador', (r) => r.empregador === 'nao_sei'],
  ['não sabe há quanto tempo saiu', (r) => r.tempo_saida === 'nao_sei'],
  ['MEI ou nota fiscal', (r) => r.pejotizacao === 'sim'],
  ['atendia várias empresas', (r) => r.exclusividade === 'varias'],
  ['não sabe se havia outros clientes', (r) => r.exclusividade === 'nao_sei'],
  ['nenhum indício no dia a dia', (r) => contarMarcadores(r) === 0],
];

function esperado(r: Respostas): { desfecho: Desfecho; motivo?: string } {
  for (const [nome, testa] of CORTES) if (testa(r)) return { desfecho: 'desclassificado', motivo: nome };
  for (const [nome, testa] of DUVIDAS) if (testa(r)) return { desfecho: 'analise_manual', motivo: nome };
  return { desfecho: 'qualificado' };
}

/* ------------------------------------------------------------ a varredura */

const TAGS_CONHECIDAS = new Set([
  'SEM_REGISTRO', 'QUALIFICADO', 'ANALISE_MANUAL', 'DESCLASSIFICADO',
  'POSSIVEL_PEJOTIZACAO', 'PRESCRICAO_BIENAL', 'ADMINISTRACAO_PUBLICA',
  'SEM_PESSOALIDADE', 'SEM_ONEROSIDADE', 'SEM_HABITUALIDADE', 'SEM_SUBORDINACAO',
]);

/*
  Só as chaves em snake_case entram na caça ao vazamento.

  As de uma palavra ("privada", "sim", "principal") são substrings legítimas
  dos próprios rótulos — "Empresa privada" contém "privada" — e acusavam
  vazamento onde não havia. As com sublinhado, essas sim, não têm como aparecer
  num texto escrito para humano.
*/
const CHAVES_CRUAS = PASSOS
  .flatMap((p) => (p.opcoes ?? []).map((o) => o.valor))
  .filter((valor) => valor.includes('_'));

let folhas = 0;
const contagem: Record<Desfecho, number> = { qualificado: 0, analise_manual: 0, desclassificado: 0 };
/*
  Contar folhas engana, e muito: quem é cortado na tela 1 gera UMA folha, quem
  atravessa as dezesseis gera milhares. Medido por caminho, a desclassificação
  parece 0,0% quando na verdade é o desfecho mais provável.

  `chance` corrige isso dando a cada alternativa de cada tela o mesmo peso,
  1/n, e multiplicando ao descer. É a resposta a "se alguém respondesse ao
  acaso, onde cairia" — que também não é o mundo real, mas não distorce a
  favor de nenhum desfecho.
*/
const chance: Record<Desfecho, number> = { qualificado: 0, analise_manual: 0, desclassificado: 0 };
const porMotivo = new Map<string, number>();
const falhas: string[] = [];
const perguntasPorCaminho = new Set<number>();

function reprovar(motivo: string, r: Respostas) {
  if (falhas.length < 12) falhas.push(`${motivo}\n    respostas: ${JSON.stringify(r)}`);
}

function conferirFolha(r: Respostas, probabilidade: number) {
  folhas += 1;
  chance[esperado(r).desfecho] += probabilidade;
  const lida = avaliar(r);
  const alvo = esperado(r);

  contagem[lida.desfecho] += 1;
  const chave = `${lida.desfecho} · ${alvo.motivo ?? 'todos os requisitos presentes'}`;
  porMotivo.set(chave, (porMotivo.get(chave) ?? 0) + 1);
  perguntasPorCaminho.add(passosVisiveis(r).length);

  /* ------------------------------------------- o desfecho é o esperado? */
  if (lida.desfecho !== alvo.desfecho) {
    reprovar(`desfecho ${lida.desfecho}, esperado ${alvo.desfecho} (${alvo.motivo})`, r);
    return;
  }

  /* ------------------------------------- a regra cumulativa, checada à parte */
  const faltaRequisito =
    r.pessoalidade === 'livremente' || r.onerosidade === 'nao' ||
    r.habitualidade === 'nao' || r.subordinacao === 'nao';
  if (faltaRequisito && lida.desfecho !== 'desclassificado') {
    reprovar('requisito ausente NÃO desclassificou', r);
  }
  if (lida.desfecho === 'qualificado' && faltaRequisito) {
    reprovar('qualificado com requisito ausente', r);
  }

  /* --------------------------------- desclassificado não vira lead nunca */
  if (lida.desfecho === 'desclassificado') {
    if (lida.pontos.length > 0) reprovar('desclassificado com pontos na tela (viraria botão)', r);
    if (!lida.motivo) reprovar('desclassificado sem motivo escrito', r);
    if (!lida.tags.includes('DESCLASSIFICADO')) reprovar('desclassificado sem a tag', r);
    if (lida.tags.includes('QUALIFICADO') || lida.tags.includes('ANALISE_MANUAL')) {
      reprovar('desclassificado com tag de aprovação', r);
    }
    if (lida.marcadores !== 0) reprovar('desclassificado com contagem de indícios', r);
  } else {
    if (lida.pontos.length === 0) reprovar('aprovado sem nenhuma frase na tela', r);
    if (lida.motivo) reprovar('aprovado com motivo de recusa', r);
  }

  /* -------------------------------------------------------------- tags */
  if (!lida.tags.includes('SEM_REGISTRO')) reprovar('sem a tag base', r);
  if (new Set(lida.tags).size !== lida.tags.length) reprovar('tag repetida', r);
  for (const tag of lida.tags) if (!TAGS_CONHECIDAS.has(tag)) reprovar(`tag desconhecida: ${tag}`, r);
  if (r.pejotizacao === 'sim' && lida.desfecho !== 'desclassificado'
      && !lida.tags.includes('POSSIVEL_PEJOTIZACAO')) {
    reprovar('MEI sem a tag de pejotização', r);
  }

  /* ------------------------------------------ o resumo que vai ao WhatsApp */
  const texto = mensagemDoWhatsApp(r, lida);
  for (const passo of passosVisiveis(r)) {
    if (!r[passo.chave]) continue;
    const rotulo = rotuloDaResposta(passo, r[passo.chave]);
    if (!texto.includes(`${passo.rotuloResumo}: ${rotulo}`)) {
      reprovar(`resposta de "${passo.chave}" não saiu no resumo`, r);
    }
  }
  for (const crua of CHAVES_CRUAS) {
    if (texto.includes(crua)) { reprovar(`chave crua vazou no resumo: ${crua}`, r); break; }
  }
  if (texto.includes('/100') || /Pontuação/.test(texto)) reprovar('nota de 0 a 100 voltou', r);
  if (texto.includes('\n\n\n')) reprovar('linha vazia dupla no resumo', r);
}

/** Em cada tela, toca em todas as alternativas. */
function andar(respostas: Respostas, probabilidade: number) {
  const passo = proximoPasso(respostas);
  if (!passo) { conferirFolha(respostas, probabilidade); return; }

  if (!passo.opcoes || passo.opcoes.length === 0) {
    reprovar(`a pergunta "${passo.chave}" não tem alternativa para tocar`, respostas);
    return;
  }
  const fatia = probabilidade / passo.opcoes.length;
  for (const opcao of passo.opcoes) andar({ ...respostas, [passo.chave]: opcao.valor }, fatia);
}

const comeco = Date.now();
andar({}, 1);
const segundos = ((Date.now() - comeco) / 1000).toFixed(1);

/* ---------------------------------------------------------------- saída */

console.log(`\nCaminhos possíveis percorridos: ${folhas.toLocaleString('pt-BR')}  (${segundos}s)`);
console.log(`Telas por caminho: de ${Math.min(...perguntasPorCaminho)} a ${Math.max(...perguntasPorCaminho)}\n`);

console.log('desfecho              caminhos    % dos caminhos   % respondendo ao acaso');
for (const desfecho of ['qualificado', 'analise_manual', 'desclassificado'] as const) {
  const n = contagem[desfecho];
  console.log(
    `${desfecho.padEnd(18)} ${String(n).padStart(9)}  ${(n / folhas * 100).toFixed(1).padStart(13)}%  ` +
    `${(chance[desfecho] * 100).toFixed(1).padStart(20)}%`,
  );
}

console.log('\nPor motivo:');
for (const [motivo, n] of [...porMotivo.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(9)}  ${motivo}`);
}

if (falhas.length > 0) {
  console.error(`\n${falhas.length} FALHA(S):`);
  for (const f of falhas) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('\nNenhuma divergência: o formulário acerta em todos os caminhos.');
