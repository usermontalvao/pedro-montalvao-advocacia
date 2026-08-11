/**
 * Auditoria da página de erro.
 *
 * A sugestão do 404 é o tipo de código que apodrece calado: ninguém visita a
 * página de erro de propósito, então um ajuste que a faça sugerir bobagem
 * passaria meses sem ser notado. Aqui cada caso é um endereço errado plausível
 * — erro de digitação, plural, URL antiga, atalho encurtado — com a página que
 * a pessoa realmente queria.
 */
import assert from 'node:assert/strict';
import { PAGINAS_DO_MAPA } from '../src/pages/MapaDoSite';
import { sugerirPaginas } from '../src/lib/sugestaoDeRota';

let verificacoes = 0;

function ok(condicao: boolean, mensagem: string) {
  assert.ok(condicao, mensagem);
  verificacoes += 1;
}

/** O endereço errado e a página que precisa aparecer entre as sugestões. */
const CASOS: [string, string][] = [
  // Encurtou o caminho da calculadora.
  ['/calculadoras/rescisao/', '/calculadoras/calculadora-rescisao-trabalhista/'],
  ['/calculadoras/horas-extras/', '/calculadoras/calculadora-horas-extras/'],
  ['/calculadoras/pensao-alimenticia/', '/calculadoras/calculadora-pensao-alimenticia/'],
  // Digitou errado.
  ['/calculadoras/calculadora-recisao-trabalhista/', '/calculadoras/calculadora-rescisao-trabalhista/'],
  ['/calculadoras/calculadora-ferias/extra', '/calculadoras/calculadora-ferias/'],
  // Singular no lugar do plural, e vice-versa.
  ['/calculadora/', '/calculadoras/'],
  ['/artigo/', '/artigos/'],
  // Endereço antigo ou inventado, mas com a palavra certa.
  ['/advogado-trabalhista/', '/advogado-trabalhista-cuiaba/'],
  ['/contato/', '/contato-advogado-cuiaba/'],
  ['/sobre/', '/sobre-advogado-cuiaba/'],
  ['/privacidade/', '/politica-de-privacidade/'],
  // Área do Direito escrita sem o prefixo.
  ['/calculadoras/trabalhistas/', '/calculadoras/trabalhista/'],
  ['/calculadoras/familia/pensao/', '/calculadoras/familia/'],
];

for (const [errado, esperado] of CASOS) {
  const sugestoes = sugerirPaginas(errado, PAGINAS_DO_MAPA);
  const caminhos = sugestoes.map((sugestao) => sugestao.caminho);
  ok(caminhos.includes(esperado), `${errado}: esperava sugerir ${esperado}, veio ${caminhos.join(', ') || 'nada'}.`);
}

// Endereço sem nenhuma palavra do site não pode inventar sugestão: mandar a
// pessoa para uma página aleatória é pior do que assumir que não sabemos.
for (const semParentesco of ['/xpto/', '/wp-admin/', '/', '/zzz/']) {
  const sugestoes = sugerirPaginas(semParentesco, PAGINAS_DO_MAPA);
  ok(sugestoes.length === 0, `${semParentesco}: não deveria sugerir nada, veio ${sugestoes.map((s) => s.caminho).join(', ')}.`);
}

// A própria página nunca é sugestão de si mesma, e a lista tem teto.
for (const caminho of ['/calculadoras/', '/artigos/', '/calculadoras/calculadora-ferias/']) {
  const sugestoes = sugerirPaginas(caminho, PAGINAS_DO_MAPA);
  ok(!sugestoes.some((s) => s.caminho === caminho), `${caminho}: sugeriu a si mesma.`);
  ok(sugestoes.length <= 3, `${caminho}: sugestões demais (${sugestoes.length}).`);
}

// Toda sugestão precisa existir de fato — o mapa é a fonte, mas a garantia é aqui.
const conhecidos = new Set(PAGINAS_DO_MAPA.map((pagina) => pagina.caminho));
for (const [errado] of CASOS) {
  for (const sugestao of sugerirPaginas(errado, PAGINAS_DO_MAPA)) {
    ok(conhecidos.has(sugestao.caminho), `${errado}: sugeriu caminho inexistente ${sugestao.caminho}.`);
  }
}

console.log(`Auditoria de navegação concluída: ${CASOS.length} endereços errados e ${verificacoes} verificações aprovadas.`);
