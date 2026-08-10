import assert from 'node:assert/strict';
import calculadoras from '../src/content/calculadoras.json';
import { calcularInss2026, calcularIrrf2026, calcularRescisao } from '../src/lib/calculoRescisao';
import { MOTORES, type MotorCalculadora, type ValoresCalculadora } from '../src/lib/calculosTrabalhistas';
import { montarMensagemCalculadora } from '../src/lib/mensagemCalculadora';

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
  vinculo_sem_registro: { salario: '3000', inicio: '2025-01-01', fim: '2026-01-01' },
  rescisao_domestico: { salario: '3000', admissao: '2020-01-01', desligamento: '2026-08-10' },
};

// Integridade editorial e ligação entre as páginas e os motores.
igual(calculadoras.length, 21, 'A biblioteca deve conter 21 calculadoras trabalhistas.');
igual(new Set(calculadoras.map((item) => item.slug)).size, 21, 'Os slugs precisam ser únicos.');
igual(new Set(calculadoras.map((item) => item.motor)).size, 21, 'Os identificadores de motor precisam ser únicos.');

for (const calculadora of calculadoras) {
  ok(calculadora.titulo.length >= 20, `${calculadora.slug}: título editorial muito curto.`);
  ok(calculadora.resumo.length >= 80, `${calculadora.slug}: descrição editorial muito curta.`);
  ok(calculadora.fonteUrl.startsWith('https://'), `${calculadora.slug}: fonte oficial sem HTTPS.`);
  igual(calculadora.atualizadoEm, '2026-08-10', `${calculadora.slug}: data de revisão inesperada.`);
  if (calculadora.motor !== 'rescisao') {
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
  baseFgts: 20_000,
  dependentes: 0,
  outrasVerbas: 0,
  naturezaOutrasVerbas: 'remuneratoria',
  outrosDescontos: 0,
});
igual(rescisao.diasAviso, 48, 'Rescisão: aviso proporcional de 48 dias.');
igual(rescisao.percentualMultaFgts, 0.4, 'Rescisão: multa de 40% na dispensa sem justa causa.');
ok(rescisao.liquidoTrct > 0, 'Rescisão: líquido deve ser positivo no cenário auditado.');
ok(rescisao.fgtsMulta > 8_000, 'Rescisão: multa deve considerar o saldo-base informado e o depósito rescisório.');

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

console.log(`Auditoria concluída: ${calculadoras.length} calculadoras, ${Object.keys(MOTORES).length + 1} motores e ${verificacoes} verificações aprovadas.`);
