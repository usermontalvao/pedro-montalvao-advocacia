import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import calculadoras from '../src/content/calculadoras.json';
import categorias from '../src/content/categoriasCalculadoras.json';
import { calcularInss2026, calcularIrrf2026, calcularRescisao } from '../src/lib/calculoRescisao';
import { MOTORES, type MotorCalculadora, type ValoresCalculadora } from '../src/lib/calculosTrabalhistas';
import { montarMensagemCalculadora } from '../src/lib/mensagemCalculadora';
import { calcularPensao, dataPtParaIsoPensao, mascararDataPensao, validarEntradaPensao } from '../src/lib/calculoPensao';
import { calcularTaxasLegaisBcb } from '../src/lib/dadosPensao';

let verificacoes = 0;

function igual<T>(recebido: T, esperado: T, mensagem: string) {
  assert.equal(recebido, esperado, mensagem);
  verificacoes += 1;
}

function ok(condicao: unknown, mensagem: string) {
  assert.ok(condicao, mensagem);
  verificacoes += 1;
}

function valores(motor: MotorCalculadora, sobrescrever: ValoresCalculadora = {}): ValoresCalculadora {
  return {
    ...Object.fromEntries(motor.campos.map((campo) => [campo.chave, campo.padrao ?? ''])),
    ...sobrescrever,
  };
}

const cenarios: Record<string, ValoresCalculadora> = {
  horas_extras: { salario: '3000', horas50: '10' },
  horas_trabalhadas: { entrada: '08:00', saida: '18:00', intervaloInicio: '12:00', intervaloFim: '13:00', diasSemana: '5' },
  salario_liquido: { salario: '5000' },
  ferias: { salario: '3000' },
  decimo_terceiro: { salario: '3000' },
  fgts: { salario: '3000' },
  aviso_previo: { salario: '3000', admissao: '2020-01-01', desligamento: '2026-08-10' },
  adicional_noturno: { salario: '3000', horas: '40' },
  insalubridade: {},
  periculosidade: { salario: '3000' },
  inss_irrf: { salario: '6000' },
  seguro_desemprego: { salario1: '3000', salario2: '3000', salario3: '3000' },
  intervalo_intrajornada: { salario: '3000' },
  banco_horas: { salario: '3000', positivas: '10' },
  salario_dias: { salario: '3000' },
  comissoes_dsr: { comissoes: '1000' },
  estabilidade_gestante: { salario: '3000', dispensa: '2026-08-10', parto: '2026-12-10' },
  estabilidade_acidente: { salario: '3000', cessacao: '2026-06-01', dispensa: '2026-08-10' },
  ferias_dobro: { salario: '3000' },
  multa_477: { salario: '3000' },
  multa_467: { verbas: '3000' },
  diferencas_salariais: { salarioRecebido: '2500', salarioDevido: '3000' },
  vale_transporte: { salario: '3000', tarifa: '5' },
  vinculo_sem_registro: { salario: '3000', inicio: '2025-01-01', fim: '2026-01-01' },
  rescisao_domestico: { salario: '3000', admissao: '2020-01-01', desligamento: '2026-08-10' },
};

// Integridade editorial e ligação entre as páginas e os motores.
igual(calculadoras.length, 27, 'A biblioteca deve conter 27 calculadoras jurídicas.');
igual(new Set(calculadoras.map((item) => item.slug)).size, 27, 'Os slugs precisam ser únicos.');
igual(new Set(calculadoras.map((item) => item.motor)).size, 27, 'Os identificadores de motor precisam ser únicos.');

for (const calculadora of calculadoras) {
  // Sem o ano no fim, "Calculadora de FGTS" é o título legítimo mais curto.
  ok(calculadora.titulo.length >= 18, `${calculadora.slug}: título editorial muito curto.`);
  ok(!/\b20\d{2}\b/.test(calculadora.titulo), `${calculadora.slug}: o título não deve carregar o ano.`);
  ok(calculadora.resumo.length >= 80, `${calculadora.slug}: descrição editorial muito curta.`);
  // Toda ferramenta precisa caber em um bloco declarado na área dela, senão
  // ela cai no cesto "outras ferramentas" da página de categoria.
  const categoria = categorias.find((item) => item.categoria === calculadora.categoria);
  ok(Boolean(categoria), `${calculadora.slug}: categoria "${calculadora.categoria}" não está no catálogo de áreas.`);
  ok(
    Boolean(categoria?.grupos.some((grupo) => grupo.nome === calculadora.grupo)),
    `${calculadora.slug}: grupo "${calculadora.grupo}" não existe na área ${calculadora.categoria}.`,
  );
  ok(calculadora.fonteUrl.startsWith('https://'), `${calculadora.slug}: fonte oficial sem HTTPS.`);
  ok(/^2026-08-(10|11)$/.test(calculadora.atualizadoEm), `${calculadora.slug}: data de revisão inesperada.`);
  if (!['rescisao', 'pensao_alimenticia'].includes(calculadora.motor)) {
    ok(Boolean(MOTORES[calculadora.motor]), `${calculadora.slug}: motor não encontrado.`);
  }
}

// Teste de fumaça: todos os motores devem produzir resultado finito, não negativo e com memória.
for (const [nome, motor] of Object.entries(MOTORES)) {
  const resultado = motor.calcular(valores(motor, cenarios[nome]));
  ok(Number.isFinite(resultado.total), `${nome}: total não finito.`);
  ok(resultado.total >= 0, `${nome}: total negativo.`);
  ok(resultado.linhas.length > 0, `${nome}: memória de cálculo vazia.`);
  for (const linha of resultado.linhas) {
    if (typeof linha.valor === 'number') ok(Number.isFinite(linha.valor), `${nome}/${linha.rotulo}: valor não finito.`);
  }
}

// Tabelas oficiais de contribuição e redução do IRRF de 2026.
igual(calcularInss2026(1_621), 121.58, 'INSS na primeira faixa de 2026.');
igual(calcularInss2026(3_000), 248.6, 'INSS progressivo sobre R$ 3.000.');
igual(calcularInss2026(10_000), 988.09, 'INSS deve respeitar o teto de 2026.');
igual(calcularIrrf2026(5_000, calcularInss2026(5_000), 0).valor, 0, 'IRRF deve ser zerado até R$ 5.000 em 2026.');

const horas = MOTORES.horas_extras.calcular(valores(MOTORES.horas_extras, {
  salario: '2200', horas50: '10', horas100: '0', horasOutras: '0', diasUteis: '25', repousos: '0',
}));
igual(horas.total, 150, '10 horas extras de 50% sobre salário-hora de R$ 10.');

const jornadaComIntervalo = MOTORES.horas_trabalhadas.calcular(valores(MOTORES.horas_trabalhadas, {
  entrada: '08:00', saida: '18:00', intervaloInicio: '12:00', intervaloFim: '13:00',
  semIntervalo: 'nao', diasSemana: '5', jornada: '44', salario: '2200', adicional: '50',
}));
igual(jornadaComIntervalo.total, 45, 'Cinco jornadas líquidas de nove horas devem totalizar 45 horas.');
igual(jornadaComIntervalo.linhas.find((linha) => linha.rotulo === 'Horas acima de 44 semanais')?.valor, 1, 'Uma hora deve exceder o limite semanal de 44 horas.');
igual(jornadaComIntervalo.linhas.find((linha) => linha.rotulo.includes('adicional de 50%'))?.valor, 15, 'Uma hora excedente com salário-hora de R$ 10 deve valer R$ 15.');

const jornadaSemIntervalo = MOTORES.horas_trabalhadas.calcular(valores(MOTORES.horas_trabalhadas, {
  entrada: '08:00', saida: '18:00', semIntervalo: 'sim', diasSemana: '5', jornada: '44', salario: '0',
}));
igual(jornadaSemIntervalo.total, 50, 'A opção sem intervalo deve manter as dez horas diárias.');
igual(jornadaSemIntervalo.linhas.find((linha) => linha.rotulo === 'Horas acima de 44 semanais')?.valor, 6, 'Cinquenta horas semanais devem gerar seis horas excedentes.');

const jornadaNoturna = MOTORES.horas_trabalhadas.calcular(valores(MOTORES.horas_trabalhadas, {
  entrada: '22:00', saida: '06:00', intervaloInicio: '02:00', intervaloFim: '03:00',
  semIntervalo: 'nao', diasSemana: '5', jornada: '44', salario: '0',
}));
igual(jornadaNoturna.total, 35, 'Jornada atravessando meia-noite deve descontar corretamente o intervalo.');
igual(MOTORES.horas_trabalhadas.validar?.(valores(MOTORES.horas_trabalhadas, {
  entrada: '08:00', saida: '18:00', intervaloInicio: '19:00', intervaloFim: '20:00', semIntervalo: 'nao',
}))?.length, 1, 'Intervalo fora da jornada deve ser rejeitado.');

const ferias = MOTORES.ferias.calcular(valores(MOTORES.ferias, { salario: '3000', vender: 'nao' }));
igual(ferias.total, 3_631.4, 'Férias integrais de R$ 3.000 com terço e INSS.');

const decimo = MOTORES.decimo_terceiro.calcular(valores(MOTORES.decimo_terceiro, {
  salario: '3000', avos: '6', adiantamento: '0', dependentes: '0',
}));
igual(decimo.total, 1_387.5, '13º de 6/12 sobre R$ 3.000, líquido de INSS.');

const fgts = MOTORES.fgts.calcular(valores(MOTORES.fgts, {
  salario: '3000', meses: '12', categoria: '8', decimo: 'sim', multa: '0', saldoAnterior: '0',
}));
igual(fgts.total, 3_120, 'FGTS de 12 meses e 13º sobre R$ 3.000.');

const aviso = MOTORES.aviso_previo.calcular(valores(MOTORES.aviso_previo, {
  salario: '3000', admissao: '2020-01-01', desligamento: '2026-08-10', modalidade: 'sem',
}));
igual(aviso.total, 4_800, 'Aviso proporcional de 48 dias para seis anos completos.');

const noturno = MOTORES.adicional_noturno.calcular(valores(MOTORES.adicional_noturno, {
  salario: '2200', jornada: '44', horas: '52.5', percentual: '20', reduzida: 'sim',
}));
igual(noturno.total, 120, 'Hora noturna reduzida: 52,5 horas de relógio equivalem a 60 horas.');

const insalubridade = MOTORES.insalubridade.calcular(valores(MOTORES.insalubridade, {
  base: '1621', grau: '20', meses: '1',
}));
igual(insalubridade.linhas[0].valor, 324.2, 'Insalubridade média sobre o salário mínimo de 2026.');

const periculosidade = MOTORES.periculosidade.calcular(valores(MOTORES.periculosidade, {
  salario: '3000', meses: '1',
}));
igual(periculosidade.linhas[0].valor, 900, 'Periculosidade de 30% sobre salário-base de R$ 3.000.');

const seguro = MOTORES.seguro_desemprego.calcular(valores(MOTORES.seguro_desemprego, {
  salario1: '3000', salario2: '3000', salario3: '3000', solicitacao: '1', meses: '12',
}));
igual(seguro.linhas[1].valor, 2_166.66, 'Parcela do seguro-desemprego na segunda faixa de 2026.');
igual(seguro.total, 8_666.64, 'Quatro parcelas na primeira solicitação com 12 meses.');

const intervalo = MOTORES.intervalo_intrajornada.calcular(valores(MOTORES.intervalo_intrajornada, {
  salario: '2200', jornada: '44', minutos: '60', dias: '1', adicional: '50',
}));
igual(intervalo.total, 15, 'Uma hora de intervalo suprimido com adicional de 50%.');

const banco = MOTORES.banco_horas.calcular(valores(MOTORES.banco_horas, {
  salario: '2200', jornada: '44', positivas: '10', negativas: '0', adicional: '50',
}));
igual(banco.total, 150, 'Saldo positivo de dez horas com adicional de 50%.');

const proporcional = MOTORES.salario_dias.calcular(valores(MOTORES.salario_dias, {
  salario: '3000', dias: '15', divisor: '30', dependentes: '0',
}));
igual(proporcional.total, 1_387.5, 'Salário líquido proporcional de 15 dias.');

const comissoes = MOTORES.comissoes_dsr.calcular(valores(MOTORES.comissoes_dsr, {
  comissoes: '1000', diasUteis: '25', repousos: '5',
}));
igual(comissoes.total, 1_200, 'DSR de R$ 200 sobre R$ 1.000 em comissões.');

const gestante = MOTORES.estabilidade_gestante.calcular(valores(MOTORES.estabilidade_gestante, {
  salario: '3000', dispensa: '2026-08-10', parto: '2026-12-10',
}));
igual(gestante.linhas[0].valor, '2027-05-10', 'Estabilidade gestante até cinco meses após o parto.');

const acidente = MOTORES.estabilidade_acidente.calcular(valores(MOTORES.estabilidade_acidente, {
  salario: '3000', cessacao: '2026-06-01', dispensa: '2026-08-10',
}));
igual(acidente.linhas[0].valor, '2027-06-01', 'Estabilidade acidentária de doze meses após a cessação.');

const vinculo = MOTORES.vinculo_sem_registro.calcular(valores(MOTORES.vinculo_sem_registro, {
  salario: '3000', inicio: '2025-01-01', fim: '2026-01-01', salariosPagos: 'sim',
}));
igual(vinculo.linhas[0].valor, 12, 'Um ano deve corresponder a doze meses equivalentes.');
igual(vinculo.total, 10_120, 'Parcelas básicas de um ano sem salários em atraso.');

const rescisao = calcularRescisao({
  admissao: '2020-01-01',
  desligamento: '2026-08-10',
  salario: 3_000,
  metodoSaldo: 'trinta',
  tipoDesligamento: 'sem_justa_causa',
  tipoAviso: 'indenizado',
  feriasVencidas: 0,
  adiantamentoDecimo: 0,
  dependentes: 0,
  outrasVerbas: 0,
  naturezaOutrasVerbas: 'remuneratoria',
  outrosDescontos: 0,
});
igual(rescisao.diasAviso, 48, 'Rescisão: aviso proporcional de 48 dias.');
igual(rescisao.percentualMultaFgts, 0.4, 'Rescisão: multa de 40% na dispensa sem justa causa.');
ok(rescisao.liquidoTrct > 0, 'Rescisão: líquido deve ser positivo no cenário auditado.');
ok(rescisao.fgtsHistoricoEstimado > 20_000, 'Rescisão: FGTS histórico deve ser projetado automaticamente pelo vínculo.');
ok(rescisao.fgtsMulta > 8_000, 'Rescisão: multa deve considerar o FGTS histórico e o depósito rescisório estimados.');

const taxaLegalBcb = calcularTaxasLegaisBcb(
  Array.from({ length: 21 }, (_, indice) => ({ data: `${String(indice + 1).padStart(2, '0')}/01/2026`, valor: '0.055131' })),
  [{ data: '01/01/2026', valor: '0.20' }],
);
igual(taxaLegalBcb['2026-02'], 0.962232, 'Taxa Legal: fórmula e arredondamentos devem reproduzir o Comunicado BCB 44.645/2026.');

const dadosPensao = {
  salariosMinimos: { '2026-06': 1621, '2026-07': 1621, '2026-08': 1621 },
  ipcaMensal: { '2026-05': 0.58, '2026-06': 0.16, '2026-07': 0.07 },
  taxaLegalMensal: { '2026-08': 1.154527 },
  salarioViaApi: true,
  ipcaViaApi: true,
  taxaLegalViaApi: true,
  ultimoIpca: '2026-07',
  ultimaTaxaLegal: '2026-08',
};
const pensaoPrisao = calcularPensao({
  rito: 'prisao', tipoBase: 'salario_minimo', valorBase: 0, percentual: 30,
  inicio: '2026-06', fim: '2026-08', dataReferencia: '2026-08-11', dataAjuizamento: '2026-08-11', diaVencimento: 10,
  mesSubsequente: false, incluirDecimo: false, criterioJuros: 'sem_juros', jurosMensal: null,
}, dadosPensao);
igual(pensaoPrisao.prisao.parcelas, 3, 'Prisão: devem entrar as três prestações vencidas mais recentes.');
igual(pensaoPrisao.expropriacao.parcelas, 0, 'Prisão: período de três meses não deve criar bloco patrimonial.');
igual(pensaoPrisao.total, 1_460.36, 'Prisão: correção de junho e julho deve respeitar o IPCA disponível.');

const pensaoComRitosSeparados = calcularPensao({
  rito: 'prisao', tipoBase: 'valor_fixo', valorBase: 500, percentual: 0,
  inicio: '2026-01', fim: '2026-08', dataReferencia: '2026-08-11', dataAjuizamento: '2026-08-11', diaVencimento: 10,
  mesSubsequente: false, incluirDecimo: false, criterioJuros: 'taxa_mensal', jurosMensal: 1,
}, dadosPensao);
igual(pensaoComRitosSeparados.prisao.parcelas, 3, 'Cálculo combinado: as três parcelas mais recentes devem ficar no rito da prisão.');
igual(pensaoComRitosSeparados.expropriacao.parcelas, 5, 'Cálculo combinado: as cinco parcelas anteriores devem ir para expropriação.');
igual(pensaoComRitosSeparados.parcelas.filter((parcela) => parcela.ritoAplicavel === 'prisao').length, 3, 'Relatório combinado: três linhas devem ser identificadas como prisão.');
igual(pensaoComRitosSeparados.parcelas.filter((parcela) => parcela.ritoAplicavel === 'expropriacao').length, 5, 'Relatório combinado: cinco linhas devem ser identificadas como expropriação.');
igual(
  pensaoComRitosSeparados.total,
  Math.round((pensaoComRitosSeparados.prisao.total + pensaoComRitosSeparados.expropriacao.total) * 100) / 100,
  'Cálculo combinado: total geral deve conciliar com os dois subtotais.',
);
ok(pensaoComRitosSeparados.expropriacao.totalJuros > 0, 'Cálculo combinado: parcelas patrimoniais devem receber o critério único de juros.');
ok(pensaoComRitosSeparados.prisao.totalJuros > 0, 'Cálculo combinado: parcelas da prisão devem receber o mesmo critério de juros.');
igual(pensaoComRitosSeparados.parcelas[0].fatorCorrecao.toFixed(7), '1.0343685', 'Correção: o prolongamento da tabela de maio precisa incluir IPCA de maio, junho e julho.');
igual(pensaoComRitosSeparados.parcelas[0].diasJuros, 214, 'Juros: o período deve ser contado em dias corridos, incluindo vencimento e data-base.');
ok(pensaoComRitosSeparados.parcelas[0].percentualJurosAcumulado < 8, 'Juros: o cálculo pro rata não pode arredondar sete meses e dois dias para oito meses inteiros.');

const pensaoProcessoEmCurso = calcularPensao({
  rito: 'prisao', tipoBase: 'valor_fixo', valorBase: 500, percentual: 0,
  inicio: '2026-01', fim: '2026-08', dataReferencia: '2026-08-11', dataAjuizamento: '2026-03-15', diaVencimento: 10,
  mesSubsequente: false, incluirDecimo: false, criterioJuros: 'sem_juros', jurosMensal: null,
}, dadosPensao);
igual(pensaoProcessoEmCurso.prisao.parcelas, 8, 'Prisão: além das três anteriores ao ajuizamento, devem entrar as vencidas durante o processo.');
igual(pensaoProcessoEmCurso.expropriacao.parcelas, 0, 'Prisão: parcelas vencidas no curso não podem ser deslocadas para a expropriação por um limite fixo de três.');

const pensaoTaxaLegal = calcularPensao({
  rito: 'expropriacao', tipoBase: 'valor_fixo', valorBase: 500, percentual: 0,
  inicio: '2026-08', fim: '2026-08', dataReferencia: '2026-08-11', dataAjuizamento: '', diaVencimento: 10,
  mesSubsequente: false, incluirDecimo: false, criterioJuros: 'taxa_legal', jurosMensal: null,
}, dadosPensao);
igual(pensaoTaxaLegal.parcelas[0].diasJuros, 2, 'Taxa Legal: vencimento e data-base devem ser apropriados como dias corridos inclusivos.');
igual(pensaoTaxaLegal.parcelas[0].percentualJurosAcumulado, 0.074486, 'Taxa Legal: fração pro rata deve usar a taxa mensal dividida pelos 31 dias de agosto.');
igual(pensaoTaxaLegal.parcelas[0].juros, 0.37, 'Taxa Legal: juros proporcionais de dois dias devem ser aplicados ao saldo corrigido.');
ok(pensaoTaxaLegal.taxaLegalCompleta, 'Taxa Legal: o resultado deve registrar que todas as competências necessárias vieram da API.');

const pensaoExpropriacao = calcularPensao({
  rito: 'expropriacao', tipoBase: 'valor_fixo', valorBase: 500, percentual: 0,
  inicio: '2026-01', fim: '2026-08', dataReferencia: '2026-08-11', dataAjuizamento: '', diaVencimento: 10,
  mesSubsequente: false, incluirDecimo: false, criterioJuros: 'taxa_mensal', jurosMensal: 1,
}, dadosPensao);
igual(pensaoExpropriacao.expropriacao.parcelas, 8, 'Expropriação: todo o período informado deve ser incluído.');
igual(pensaoExpropriacao.prisao.parcelas, 0, 'Expropriação isolada não deve criar bloco de prisão.');
ok(pensaoExpropriacao.total > 4_000, 'Expropriação: o total deve refletir correção e juros parametrizados.');

const entradaComDataBaseInvalida = {
  rito: 'prisao' as const, tipoBase: 'salario_minimo' as const, valorBase: 0, percentual: 30,
  inicio: '2026-01', fim: '2026-08', dataReferencia: '2026-01-01', dataAjuizamento: '2026-01-01', diaVencimento: 10,
  mesSubsequente: false, incluirDecimo: false, criterioJuros: 'sem_juros' as const, jurosMensal: null,
};
ok(
  validarEntradaPensao(entradaComDataBaseInvalida).some((erro) => erro.includes('última parcela')),
  'Pensão: a data-base anterior ao último vencimento precisa impedir o cálculo.',
);

const cssCalculadoras = readFileSync('src/styles/global.css', 'utf8');
ok(cssCalculadoras.includes('body > *:not(#raiz)'), 'Impressão: a raiz real do aplicativo precisa permanecer visível.');
ok(!cssCalculadoras.includes('body > *:not(#root)'), 'Impressão: o seletor antigo não pode ocultar todo o relatório.');
ok(/@page\s*\{[^}]*margin:\s*0;/s.test(cssCalculadoras), 'Impressão: a página não deve reservar margem para cabeçalho automático do navegador.');
ok(/\.relatorio-pensao\s*\{[^}]*padding:\s*14mm 11mm 16mm !important;/s.test(cssCalculadoras), 'Impressão: o relatório deve manter margens internas próprias após remover o cabeçalho do navegador.');
ok(readFileSync('public/midia/logo-horizontal.png').length > 0, 'Relatório: a marca do escritório precisa existir.');
const paginaPensao = readFileSync('src/pages/CalculadoraPensao.tsx', 'utf8');
ok(paginaPensao.includes('URL_CALCULADORA_PENSAO'), 'Relatório: deve exibir o endereço público da calculadora.');
ok(paginaPensao.includes('pensao-memorias-separadas'), 'Relatório: os ritos devem aparecer em memoriais visualmente separados.');
ok(paginaPensao.includes('API pública SGS 1619') && paginaPensao.includes('API pública SGS 433'), 'Relatório: deve identificar as APIs públicas usadas nos dados e índices.');
ok(/\[inicioMes, setInicioMes\] = useState\(''\)/.test(paginaPensao) && /\[inicioAno, setInicioAno\] = useState\(''\)/.test(paginaPensao), 'Pensão: mês e ano iniciais não podem vir preenchidos com um caso hipotético.');
ok(/\[fimMes, setFimMes\] = useState\(''\)/.test(paginaPensao) && /\[fimAno, setFimAno\] = useState\(''\)/.test(paginaPensao), 'Pensão: mês e ano finais não podem vir preenchidos com um caso hipotético.');
ok(paginaPensao.includes('setDataReferenciaTexto(dataLocalBr())'), 'Pensão: a data-base deve usar automaticamente a data local do visitante.');
ok(paginaPensao.includes('Remover data preenchida') && paginaPensao.includes("setDataReferenciaTexto('')"), 'Pensão: o visitante deve conseguir remover a data-base sugerida.');
ok(!paginaPensao.includes('setDataAjuizamento'), 'Pensão: a interface não deve pedir uma segunda data para o mesmo marco da simulação inicial.');
ok(paginaPensao.includes('dataAjuizamento: dataReferencia'), 'Pensão: a data-base deve alimentar explicitamente o marco processual usado pelo motor.');
ok(paginaPensao.includes('IconeCadeado') && paginaPensao.includes('IconePatrimonio'), 'Pensão: as opções de rito devem ter ícones próprios.');
ok(paginaPensao.includes('inputMode="numeric"') && paginaPensao.includes('placeholder="dd/mm/aaaa"'), 'Pensão: a data-base deve aceitar digitação numérica no formato brasileiro, inclusive no celular.');
ok(paginaPensao.includes('pensao-data-nativa') && paginaPensao.includes('Abrir calendário da data-base'), 'Pensão: a data-base deve manter um seletor de calendário acessível.');
igual(mascararDataPensao('11082026'), '11/08/2026', 'Pensão: a máscara deve inserir as barras da data-base.');
igual(mascararDataPensao('11a08b2026'), '11/08/2026', 'Pensão: a máscara deve ignorar caracteres não numéricos.');
igual(dataPtParaIsoPensao('11/08/2026'), '2026-08-11', 'Pensão: a data brasileira deve ser convertida para o motor sem trocar dia e mês.');
igual(dataPtParaIsoPensao('31/02/2026'), '', 'Pensão: uma data inexistente deve ser recusada.');
ok(paginaPensao.includes('pensao-mes-selects') && paginaPensao.includes('<option value="">Mês</option>') && paginaPensao.includes('<option value="">Ano</option>'), 'Pensão: cada competência deve ter seletores separados de mês e ano.');
ok(paginaPensao.includes('Taxa Legal do Banco Central — automática'), 'Pensão: deve oferecer Taxa Legal automática sem presumir juros diferentes por rito.');
const fonteDadosPensao = readFileSync('src/lib/dadosPensao.ts', 'utf8');
ok(!fonteDadosPensao.includes('SALARIOS_MINIMOS_FALLBACK'), 'Pensão: salário mínimo não pode depender de tabela manual de contingência.');
ok(fonteDadosPensao.includes("cache: 'no-store'"), 'Pensão: APIs públicas devem ser consultadas sem cache persistente do navegador.');
ok(fonteDadosPensao.includes('URL_API_SELIC_DIARIA') && fonteDadosPensao.includes('URL_API_IPCA15'), 'Pensão: Taxa Legal deve ser formada por séries públicas oficiais.');

const mensagem = montarMensagemCalculadora({
  titulo: 'Calculadora de 13º salário 2026',
  total: 'R$ 2.751,40',
  dados: [{ rotulo: 'Salário bruto mensal', valor: 'R$ 3.000,00' }],
  memoria: [{ rotulo: 'INSS sobre o 13º', valor: '− R$ 248,60' }],
  observacoes: ['Resultado estimado.'],
});
ok(mensagem.includes('ASSUNTO: Calculadora de 13º salário 2026'), 'Mensagem deve identificar a calculadora.');
ok(mensagem.includes('RESULTADO ESTIMADO: R$ 2.751,40'), 'Mensagem deve levar o total calculado.');
ok(mensagem.includes('Salário bruto mensal: R$ 3.000,00'), 'Mensagem deve levar os dados informados.');
ok(mensagem.includes('INSS sobre o 13º: − R$ 248,60'), 'Mensagem deve levar a memória do cálculo.');

console.log(`Auditoria concluída: ${calculadoras.length} calculadoras, ${Object.keys(MOTORES).length + 2} motores e ${verificacoes} verificações aprovadas.`);
