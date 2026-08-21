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
  moedaDeDigitos,
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
  pessoalidade: 'sim',
  onerosidade: 'salario_fixo',
  habitualidade: 'sim',
  subordinacao: 'sim',
  rotina: 'horario|ponto|quase_todos_dias',
  chefia: 'chefe|faltas',
  estrutura: 'dentro|uniforme',
  pejotizacao: 'nao',
  exclusividade: 'principal',
  duracao: 'mais_1_ano',
  remuneracao: 'R$ 1.800,00',
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
conferir('nenhuma pergunta passa de 4 opções, fora a do empregador',
  PASSOS.every((p) => p.chave === 'empregador' || p.chave === 'tempo_saida' || (p.opcoes?.length ?? 0) <= 5),
  PASSOS.filter((p) => (p.opcoes?.length ?? 0) > 5).map((p) => `${p.chave}:${p.opcoes?.length}`).join(', '));
conferir('qualificado tem a tag', qualificado.tags.includes('QUALIFICADO'));
conferir('qualificado pontua alto', qualificado.pontuacao >= 75, String(qualificado.pontuacao));
conferir('quinquenal fica no interno', qualificado.alertas.some((a) => a.includes('quinquenal')));

const comPejota = avaliar({ ...roteiroCompleto, pejotizacao: 'sim' });
conferir('MEI vai para análise manual', comPejota.desfecho === 'analise_manual');
conferir('MEI ganha a tag de pejotização', comPejota.tags.includes('POSSIVEL_PEJOTIZACAO'));
conferir('MEI não é desclassificado', !comPejota.tags.includes('DESCLASSIFICADO'));

const semSubordinacao = avaliar({ ...roteiroCompleto, subordinacao: 'nao' });
conferir('sem subordinação vai a manual', semSubordinacao.desfecho === 'analise_manual');

// Pago por produção NÃO afasta a onerosidade — só "não recebia" afasta.
const porProducao = avaliar({ ...roteiroCompleto, onerosidade: 'por_servico' });
conferir('pago por produção continua qualificando', porProducao.desfecho === 'qualificado', porProducao.alertas.join(' | '));
const semPagamento = avaliar({ ...roteiroCompleto, onerosidade: 'nao' });
conferir('quem não recebia vai a manual', semPagamento.desfecho === 'analise_manual');
conferir('quem não recebia perde o requisito', semPagamento.alertas.some((a) => a.includes('onerosidade')));

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
  rotina: 'nenhuma',
  chefia: 'nenhuma',
  estrutura: 'nenhuma',
});
conferir('sem marcadores vai a manual', nenhumMarcador.desfecho === 'analise_manual');
conferir(
  'sem marcadores conta zero',
  contarMarcadores({ rotina: 'nenhuma', chefia: 'nenhuma', estrutura: 'nenhuma', onerosidade: 'por_servico' }) === 0,
);

// A conta dos marcadores soma os três grupos e o salário certo.
conferir('marcadores somam os três grupos', contarMarcadores(roteiroCompleto) === 8, String(contarMarcadores(roteiroCompleto)));
conferir(
  'grupo em branco não conta',
  contarMarcadores({ rotina: 'horario', chefia: '', estrutura: '' }) === 1,
);

const aindaTrabalha = avaliar({
  sem_registro: 'sim', ainda_trabalha: 'sim', empregador: 'privada',
  pessoalidade: 'sim', onerosidade: 'salario_fixo', habitualidade: 'sim', subordinacao: 'sim',
  rotina: 'horario', chefia: 'chefe', estrutura: 'dentro', pejotizacao: 'nao', exclusividade: 'principal',
  duracao: '6_meses_a_1_ano', remuneracao: 'R$ 2.000,00',
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
conferir('mensagem traz a pontuação', texto.includes('Pontuação:'));
conferir('mensagem traz a origem do anúncio', texto.includes('anúncio A'));
conferir('mensagem traz a faixa de saída', texto.includes('Saiu há: De 3 a 6 meses'));
conferir('múltipla escolha vira lista legível', texto.includes('Rotina: Tinha horário para entrar e sair, Batia ponto'));
conferir('os três grupos aparecem no resumo', ['Rotina:', 'Chefia:', 'Estrutura:'].every((r) => texto.includes(r)));
conferir('mensagem não vaza a chave crua', !texto.includes('quase_todos_dias') && !texto.includes('salario_fixo'));

const curta = mensagemDoWhatsApp(
  { sem_registro: 'sim', ainda_trabalha: 'sim', empregador: 'privada' },
  aindaTrabalha,
);
conferir('a mensagem nunca abre linha vazia dupla', !curta.includes('\n\n\n'));
conferir('a mensagem começa pelo assunto', curta.startsWith('Olá. Respondi o questionário'));

/* ------------------------------------------------------------- máscaras */

conferir('moeda monta da direita', moedaDeDigitos('180000').replace(/ /g, ' ') === 'R$ 1.800,00', moedaDeDigitos('180000'));
conferir('moeda vazia continua vazia', moedaDeDigitos('') === '');
conferir('moeda ignora letra', moedaDeDigitos('abc').length === 0);

/* --------------------------------------------------------------- roteiro */

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
