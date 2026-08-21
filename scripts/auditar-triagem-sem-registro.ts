/**
 * Auditoria da triagem de trabalho sem registro (/trabalho-sem-registro/).
 *
 * O que está sendo protegido aqui não é a tela: são as três saídas do
 * questionário. Uma regra de corte que solta por engano manda para o
 * atendimento um caso prescrito; uma que aperta por engano fecha a porta na
 * cara de quem tinha prazo de sobra — e, nesse fluxo, quem é desclassificado
 * não vira lead nem chega ao CRM. Não há um segundo lugar onde o erro apareça.
 *
 * Roda com `npm run test:triagem`.
 */
import {
  PASSOS,
  avaliar,
  contarMarcadores,
  corteAtingido,
  mensagemDoWhatsApp,
  passosVisiveis,
  progresso,
  proximoPasso,
  type Respostas,
} from '../src/lib/triagemSemRegistro';

let falhas = 0;
function conferir(nome: string, condicao: boolean, extra = '') {
  if (condicao) return;
  falhas += 1;
  console.error(`FALHOU: ${nome}${extra ? ` — ${extra}` : ''}`);
}

/* ------------------------------------------------------------- os cortes */

const naoTrabalhou: Respostas = { sem_registro: 'nao' };
conferir('Q1 "não" corta', corteAtingido(naoTrabalhou) !== null);
conferir('Q1 "não" encerra o roteiro', proximoPasso(naoTrabalhou) === undefined);
conferir('Q1 "não" desclassifica', avaliar(naoTrabalhou).desfecho === 'desclassificado');
conferir('Q1 "não" leva 2 tags', avaliar(naoTrabalhou).tags.join() === 'SEM_REGISTRO,DESCLASSIFICADO');
conferir('Q1 "não" barra a barra em 100%', progresso(naoTrabalhou) === 1);

const prescrito: Respostas = { sem_registro: 'sim', ainda_trabalha: 'nao', tempo_saida: 'mais_2_anos' };
conferir('mais de 2 anos desclassifica', avaliar(prescrito).desfecho === 'desclassificado');
conferir('mais de 2 anos tem tag', avaliar(prescrito).tags.includes('PRESCRICAO_BIENAL'));
conferir('mais de 2 anos encerra o roteiro', proximoPasso(prescrito) === undefined);

// As faixas de dentro do prazo NÃO cortam — nem a que encosta no limite.
for (const faixa of ['ate_3_meses', '3_a_6_meses', '6_meses_a_1_ano', '1_a_2_anos', 'nao_sei']) {
  const dentro: Respostas = { sem_registro: 'sim', ainda_trabalha: 'nao', tempo_saida: faixa };
  conferir(`faixa ${faixa} não corta`, corteAtingido(dentro) === null);
  conferir(`faixa ${faixa} continua perguntando`, proximoPasso(dentro)?.chave === 'empregador');
}

const publico: Respostas = { sem_registro: 'sim', ainda_trabalha: 'sim', empregador: 'adm_direta' };
conferir('adm. direta desclassifica', avaliar(publico).desfecho === 'desclassificado');
conferir('adm. direta tem tag', avaliar(publico).tags.includes('ADMINISTRACAO_PUBLICA'));
conferir('autarquia desclassifica', avaliar({ ...publico, empregador: 'autarquia' }).desfecho === 'desclassificado');

/* ------------------------------- o corte não apaga as perguntas anteriores */

const cortadoTarde: Respostas = { sem_registro: 'sim', ainda_trabalha: 'sim', empregador: 'autarquia' };
const vistos = passosVisiveis(cortadoTarde).map((p) => p.chave);
conferir('corte tardio preserva as anteriores', vistos.join() === 'sem_registro,ainda_trabalha,empregador', vistos.join());

/* ---------------------------------------------------------- passos condicionais */

const trabalhando: Respostas = { sem_registro: 'sim', ainda_trabalha: 'sim' };
const chavesTrabalhando = passosVisiveis(trabalhando).map((p) => p.chave);
conferir('quem ainda trabalha não vê tempo_saida', !chavesTrabalhando.includes('tempo_saida'));
conferir('quem ainda trabalha não vê termino', !chavesTrabalhando.includes('termino'));

const saiu: Respostas = { sem_registro: 'sim', ainda_trabalha: 'nao' };
const chavesSaiu = passosVisiveis(saiu).map((p) => p.chave);
conferir('quem saiu vê tempo_saida', chavesSaiu.includes('tempo_saida'));
conferir('quem saiu vê termino', chavesSaiu.includes('termino'));

/* --------------------------------------- a barra nunca anda para trás */

const roteiroCompleto: Respostas = {
  sem_registro: 'sim',
  ainda_trabalha: 'nao',
  tempo_saida: '3_a_6_meses',
  empregador: 'privada',
  pessoalidade: 'nao',
  onerosidade: 'salario_fixo',
  habitualidade: 'sim',
  subordinacao: 'sim',
  rotina: 'fixo_com_ponto',
  chefia: 'chefe_direto',
  estrutura: 'tudo_da_empresa',
  pejotizacao: 'nao',
  exclusividade: 'principal',
  duracao: 'mais_1_ano',
  remuneracao: '1600_a_2500',
  termino: 'demitido',
};

let anterior = 0;
const acumulado: Respostas = {};
for (const passo of PASSOS) {
  const valor = roteiroCompleto[passo.chave];
  if (valor === undefined) continue;
  acumulado[passo.chave] = valor;
  const agora = progresso(acumulado);
  conferir(`barra não recua em ${passo.chave}`, agora >= anterior, `${anterior} → ${agora}`);
  anterior = agora;
}
conferir('roteiro completo chega a 100%', progresso(roteiroCompleto) === 1);
conferir('roteiro completo não tem próximo passo', proximoPasso(roteiroCompleto) === undefined);

/* ------------------------------------------------------------ desfechos */

const qualificado = avaliar(roteiroCompleto);
conferir('caso cheio qualifica', qualificado.desfecho === 'qualificado', qualificado.alertas.join(' | '));
/*
  O teto de opções por tela.

  Sete é o máximo que cabe num celular de 375px sem rolagem — foi medido, e é
  por isso que a pergunta de onze virou três. Quem acrescentar uma alternativa
  a uma pergunta que já tem sete vai descobrir aqui, e não no anúncio no ar.
*/
conferir('nenhuma pergunta passa de 7 opções',
  PASSOS.every((p) => (p.opcoes?.length ?? 0) <= 7),
  PASSOS.filter((p) => (p.opcoes?.length ?? 0) > 7).map((p) => `${p.chave}:${p.opcoes?.length}`).join(', '));
conferir('qualificado tem a tag', qualificado.tags.includes('QUALIFICADO'));
conferir('qualificado conta os indícios', qualificado.marcadores === 7, String(qualificado.marcadores));
conferir('quinquenal fica no interno', qualificado.alertas.some((a) => a.includes('quinquenal')));

const comPejota = avaliar({ ...roteiroCompleto, pejotizacao: 'sim' });
conferir('MEI vai para análise manual', comPejota.desfecho === 'analise_manual');
conferir('MEI ganha a tag de pejotização', comPejota.tags.includes('POSSIVEL_PEJOTIZACAO'));
conferir('MEI não é desclassificado', !comPejota.tags.includes('DESCLASSIFICADO'));

/*
  Os quatro requisitos do art. 3º da CLT são CUMULATIVOS: faltando um, o caso
  sai do fluxo. Nada de "4 de 5" — é tudo ou nada, e é isto que estas linhas
  protegem.
*/
for (const [chave, valorQueFalta, tag] of [
  ['pessoalidade', 'livremente', 'SEM_PESSOALIDADE'],
  ['onerosidade', 'nao', 'SEM_ONEROSIDADE'],
  ['habitualidade', 'nao', 'SEM_HABITUALIDADE'],
  ['subordinacao', 'nao', 'SEM_SUBORDINACAO'],
] as const) {
  const sem = { ...roteiroCompleto, [chave]: valorQueFalta };
  const leitura = avaliar(sem);
  conferir(`sem ${chave} DESCLASSIFICA`, leitura.desfecho === 'desclassificado', leitura.desfecho);
  conferir(`sem ${chave} leva a tag`, leitura.tags.includes(tag));
  conferir(`sem ${chave} não oferece botão`, leitura.pontos.length === 0);
  conferir(`sem ${chave} encerra ali mesmo`, proximoPasso(sem) === undefined);
  // O corte acontece no próprio passo: nada depois dele continua sendo perguntado.
  const ateAli: Respostas = {};
  for (const passo of PASSOS) {
    if (passo.somenteQuando && !passo.somenteQuando(ateAli)) continue;
    ateAli[passo.chave] = sem[passo.chave] ?? '';
    if (passo.chave === chave) break;
  }
  conferir(`${chave} corta sem precisar das perguntas seguintes`, avaliar(ateAli).desfecho === 'desclassificado');
}

// Substituir COM autorização não afasta a pessoalidade.
const comAutorizacao = avaliar({ ...roteiroCompleto, pessoalidade: 'com_autorizacao' });
conferir('substituição autorizada não desclassifica', comAutorizacao.desfecho === 'qualificado', comAutorizacao.desfecho);

// Pago por produção NÃO afasta a onerosidade — só "não recebia" afasta.
const porProducao = avaliar({ ...roteiroCompleto, onerosidade: 'por_servico' });
conferir('pago por produção continua qualificando', porProducao.desfecho === 'qualificado', porProducao.alertas.join(' | '));

// E nenhuma nota de corte parcial pode voltar a existir.
conferir('não há nota de 0 a 100 na leitura', !('pontuacao' in qualificado));

const variasEmpresas = avaliar({ ...roteiroCompleto, exclusividade: 'varias' });
conferir('vários clientes vai a manual', variasEmpresas.desfecho === 'analise_manual');
conferir('vários clientes não desclassifica', variasEmpresas.desfecho !== 'desclassificado');

const empresaPublica = avaliar({ ...roteiroCompleto, empregador: 'empresa_publica' });
conferir('economia mista vai a manual', empresaPublica.desfecho === 'analise_manual');

const naoSabe = avaliar({ ...roteiroCompleto, empregador: 'nao_sei' });
conferir('empregador desconhecido vai a manual', naoSabe.desfecho === 'analise_manual');

const saidaIncerta = avaliar({ ...roteiroCompleto, tempo_saida: 'nao_sei' });
conferir('faixa incerta vai a manual', saidaIncerta.desfecho === 'analise_manual');
conferir('faixa incerta não desclassifica', !saidaIncerta.tags.includes('DESCLASSIFICADO'));

const prazoCurto = avaliar({ ...roteiroCompleto, tempo_saida: '1_a_2_anos' });
conferir('1 a 2 anos ainda qualifica', prazoCurto.desfecho === 'qualificado');
conferir('1 a 2 anos avisa o prazo', prazoCurto.alertas.some((a) => a.includes('PRAZO CURTO')));

const nenhumMarcador = avaliar({
  ...roteiroCompleto,
  onerosidade: 'por_servico',
  rotina: 'livre',
  chefia: 'ninguem',
  estrutura: 'nada',
});
conferir('zero indícios vai a manual', nenhumMarcador.desfecho === 'analise_manual');
conferir(
  'zero indícios conta zero',
  contarMarcadores({ rotina: 'livre', chefia: 'ninguem', estrutura: 'nada', onerosidade: 'por_servico' }) === 0,
);

// Os pesos: 2 para o indício cheio, 1 para o parcial, 0 para nenhum.
conferir('indícios cheios somam 6 + salário', contarMarcadores(roteiroCompleto) === 7, String(contarMarcadores(roteiroCompleto)));
conferir(
  'indícios parciais somam 3',
  contarMarcadores({ rotina: 'com_horario', chefia: 'instrucoes', estrutura: 'em_parte' }) === 3,
);
conferir('resposta em branco não conta', contarMarcadores({ rotina: '', chefia: '', estrutura: '' }) === 0);

const aindaTrabalha = avaliar({
  sem_registro: 'sim', ainda_trabalha: 'sim', empregador: 'privada',
  pessoalidade: 'nao', onerosidade: 'salario_fixo', habitualidade: 'sim', subordinacao: 'sim',
  rotina: 'com_horario', chefia: 'instrucoes', estrutura: 'em_parte', pejotizacao: 'nao', exclusividade: 'principal',
  duracao: '6_meses_a_1_ano', remuneracao: 'ate_1600',
});
conferir('contrato em curso qualifica', aindaTrabalha.desfecho === 'qualificado');
conferir('contrato em curso não prescreve', aindaTrabalha.alertas.some((a) => a.includes('não corre')));

/* ------------------------------------------------------------ a mensagem */

const texto = mensagemDoWhatsApp(roteiroCompleto, qualificado, {
  campanha: 'Sem registro — MT',
  anuncio: 'anúncio A',
});
// Nome e telefone NÃO são perguntados: chegam com a própria conversa.
conferir('mensagem não pede nome nem telefone', !texto.includes('Nome:') && !texto.includes('WhatsApp:'));
conferir('mensagem traz as tags', texto.includes('SEM_REGISTRO, QUALIFICADO'));
conferir('mensagem afirma os quatro requisitos', texto.includes('os quatro presentes'));
conferir('mensagem não traz nota nenhuma', !/\d+\s*\/\s*100/.test(texto));
conferir('mensagem traz a origem do anúncio', texto.includes('anúncio A'));
conferir('mensagem traz a faixa de saída', texto.includes('Saiu há: De 3 a 6 meses'));
conferir('mensagem traz a faixa de salário', texto.includes('Remuneração mensal: De R$ 1.600 a R$ 2.500'));
conferir('os três indícios aparecem no resumo',
  ['Horário: Sim, horário fixo e batia ponto', 'Organização do trabalho: Tinha um chefe', 'Estrutura: Sim, trabalhava lá']
    .every((r) => texto.includes(r)), texto);
conferir('mensagem não vaza a chave crua',
  !texto.includes('fixo_com_ponto') && !texto.includes('salario_fixo') && !texto.includes('chefe_direto'));

const curta = mensagemDoWhatsApp(
  { sem_registro: 'sim', ainda_trabalha: 'sim', empregador: 'privada' },
  aindaTrabalha,
);
conferir('a mensagem nunca abre linha vazia dupla', !curta.includes('\n\n\n'));
conferir('a mensagem começa pelo assunto', curta.startsWith('Olá. Respondi o questionário'));

/* --------------------------------------------------------------- roteiro */

/*
  NENHUMA pergunta pede que se digite, e nenhuma pede confirmação: o fluxo
  inteiro é escolha que avança ao toque.

  Já houve aqui um campo de data, um de dinheiro, uma múltipla escolha com
  "Continuar" e um formulário de contato. Todos saíram, um a um, e é fácil um
  deles voltar sem que ninguém perceba — a tela continuaria funcionando. Estas
  duas linhas são o que garante que não volte calado.
*/
conferir(
  'nenhuma pergunta é de digitar',
  PASSOS.every((p) => p.tipo === 'opcoes'),
  PASSOS.filter((p) => p.tipo !== 'opcoes').map((p) => `${p.chave}:${p.tipo}`).join(', '),
);
conferir(
  'toda pergunta tem alternativas para tocar',
  PASSOS.every((p) => (p.opcoes?.length ?? 0) >= 2),
  PASSOS.filter((p) => (p.opcoes?.length ?? 0) < 2).map((p) => p.chave).join(', '),
);

conferir('toda chave é única', new Set(PASSOS.map((p) => p.chave)).size === PASSOS.length);
conferir('todo passo tem rótulo de resumo', PASSOS.every((p) => p.rotuloResumo.length > 0));
conferir(
  'toda opção de todo passo tem valor único',
  PASSOS.every((p) => !p.opcoes || new Set(p.opcoes.map((o) => o.valor)).size === p.opcoes.length),
);

if (falhas > 0) {
  console.error(`\n${falhas} verificação(ões) falharam.`);
  process.exit(1);
}
console.log(`Triagem "sem registro": todas as verificações passaram.`);
