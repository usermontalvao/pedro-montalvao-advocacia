/**
 * Cálculo estimativo de rescisão CLT parametrizado para 2026.
 *
 * A função é mantida sem dependências de React para que a regra possa ser
 * validada isoladamente e reutilizada por outras interfaces no futuro.
 */

export type TipoDesligamento = 'sem_justa_causa' | 'pedido_demissao' | 'acordo';
export type TipoAviso = 'indenizado' | 'trabalhado' | 'cumprido' | 'nao_cumprido';
export type NaturezaOutrasVerbas = 'remuneratoria' | 'indenizatoria';
export type MetodoSaldo = 'trinta' | 'calendario';

export type EntradaRescisao = {
  admissao: string;
  desligamento: string;
  salario: number;
  metodoSaldo: MetodoSaldo;
  tipoDesligamento: TipoDesligamento;
  tipoAviso: TipoAviso;
  feriasVencidas: number;
  adiantamentoDecimo: number;
  baseFgts: number;
  dependentes: number;
  outrasVerbas: number;
  naturezaOutrasVerbas: NaturezaOutrasVerbas;
  outrosDescontos: number;
};

export type LinhaCalculo = {
  chave: string;
  rotulo: string;
  valor: number;
  detalhe?: string;
};

export type ResultadoRescisao = {
  creditos: LinhaCalculo[];
  descontos: LinhaCalculo[];
  totalCreditos: number;
  totalDescontos: number;
  liquidoTrct: number;
  fgtsDepositoRescisorio: number;
  fgtsMulta: number;
  fgtsSaldoComDeposito: number;
  percentualMultaFgts: number;
  percentualSaqueFgts: number;
  diasSaldo: number;
  divisorSaldo: number;
  diasAviso: number;
  diasAvisoPagos: number;
  avosDecimo: number;
  avosFerias: number;
  dataProjetada: string;
  deducaoIrrfMensal: 'simplificada' | 'legal';
  deducaoIrrfDecimo: 'simplificada' | 'legal';
};

const UM_DIA = 86_400_000;

function arredondar(valor: number): number {
  // A margem neutraliza representações binárias como 121,57499999999999.
  return Math.round((valor + 1e-9) * 100) / 100;
}

function dataUtc(valor: string): Date {
  const [ano, mes, dia] = valor.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

function chaveData(data: Date): string {
  return data.toISOString().slice(0, 10);
}

function adicionarDias(data: Date, dias: number): Date {
  const copia = new Date(data);
  copia.setUTCDate(copia.getUTCDate() + dias);
  return copia;
}

function diasInclusivos(inicio: Date, fim: Date): number {
  return Math.floor((fim.getTime() - inicio.getTime()) / UM_DIA) + 1;
}

function diasNoMes(ano: number, mesZero: number): number {
  return new Date(Date.UTC(ano, mesZero + 1, 0)).getUTCDate();
}

function dataSegura(ano: number, mesZero: number, dia: number): Date {
  return new Date(Date.UTC(ano, mesZero, Math.min(dia, diasNoMes(ano, mesZero))));
}

function adicionarMes(data: Date): Date {
  return dataSegura(data.getUTCFullYear(), data.getUTCMonth() + 1, data.getUTCDate());
}

function anosCompletos(inicio: Date, fim: Date): number {
  let anos = fim.getUTCFullYear() - inicio.getUTCFullYear();
  const aniversario = dataSegura(
    fim.getUTCFullYear(),
    inicio.getUTCMonth(),
    inicio.getUTCDate(),
  );
  if (aniversario > fim) anos -= 1;
  return Math.max(0, anos);
}

/** Conta meses civis com 15 dias ou mais de vínculo, regra usada no 13º. */
function avosNoAno(inicio: Date, fim: Date): number {
  const ano = fim.getUTCFullYear();
  let avos = 0;

  for (let mes = 0; mes < 12; mes += 1) {
    const primeiro = new Date(Date.UTC(ano, mes, 1));
    const ultimo = new Date(Date.UTC(ano, mes, diasNoMes(ano, mes)));
    const comeco = inicio > primeiro ? inicio : primeiro;
    const termino = fim < ultimo ? fim : ultimo;
    if (termino >= comeco && diasInclusivos(comeco, termino) >= 15) avos += 1;
  }

  return avos;
}

/** Conta os avos desde o último aniversário do contrato. */
function avosPeriodoAquisitivo(admissao: Date, fim: Date): number {
  let inicioPeriodo = dataSegura(
    fim.getUTCFullYear(),
    admissao.getUTCMonth(),
    admissao.getUTCDate(),
  );
  if (inicioPeriodo > fim) {
    inicioPeriodo = dataSegura(
      fim.getUTCFullYear() - 1,
      admissao.getUTCMonth(),
      admissao.getUTCDate(),
    );
  }
  if (inicioPeriodo < admissao) inicioPeriodo = admissao;

  let cursor = inicioPeriodo;
  let avos = 0;
  while (avos < 12) {
    const proximo = adicionarMes(cursor);
    // Um mês aquisitivo completo termina no dia anterior ao próximo marco.
    if (adicionarDias(proximo, -1) <= fim) {
      avos += 1;
      cursor = proximo;
      continue;
    }
    if (diasInclusivos(cursor, fim) >= 15) avos += 1;
    break;
  }
  return Math.min(12, avos);
}

/** INSS progressivo de empregado, empregado doméstico e avulso em 2026. */
export function calcularInss2026(base: number): number {
  const faixas = [
    { teto: 1_621, aliquota: 0.075 },
    { teto: 2_902.84, aliquota: 0.09 },
    { teto: 4_354.27, aliquota: 0.12 },
    { teto: 8_475.55, aliquota: 0.14 },
  ];

  let anterior = 0;
  let contribuicao = 0;
  const limitada = Math.max(0, Math.min(base, faixas.at(-1)!.teto));
  for (const faixa of faixas) {
    const parcela = Math.max(0, Math.min(limitada, faixa.teto) - anterior);
    contribuicao += parcela * faixa.aliquota;
    anterior = faixa.teto;
    if (limitada <= faixa.teto) break;
  }
  return arredondar(contribuicao);
}

type ResultadoIrrf = { valor: number; deducao: 'simplificada' | 'legal' };

/** IRRF mensal de 2026, incluindo a redução instituída pela Lei 15.270/2025. */
export function calcularIrrf2026(
  rendimentoTributavel: number,
  inss: number,
  dependentes: number,
): ResultadoIrrf {
  if (rendimentoTributavel <= 0) return { valor: 0, deducao: 'legal' };

  const deducaoLegal = inss + Math.max(0, dependentes) * 189.59;
  const deducaoSimplificada = 607.2;
  const usaSimplificada = deducaoSimplificada > deducaoLegal;
  const base = Math.max(
    0,
    rendimentoTributavel - (usaSimplificada ? deducaoSimplificada : deducaoLegal),
  );

  let imposto = 0;
  if (base > 4_664.68) imposto = base * 0.275 - 908.73;
  else if (base > 3_751.05) imposto = base * 0.225 - 675.49;
  else if (base > 2_826.65) imposto = base * 0.15 - 394.16;
  else if (base > 2_428.8) imposto = base * 0.075 - 182.16;

  imposto = Math.max(0, imposto);

  // A redução usa o rendimento tributável, e não a base após as deduções.
  if (rendimentoTributavel <= 5_000) imposto = 0;
  else if (rendimentoTributavel <= 7_350) {
    const reducao = Math.max(0, 978.62 - 0.133145 * rendimentoTributavel);
    imposto = Math.max(0, imposto - reducao);
  }

  return {
    valor: arredondar(imposto),
    deducao: usaSimplificada ? 'simplificada' : 'legal',
  };
}

export function calcularRescisao(entrada: EntradaRescisao): ResultadoRescisao {
  const admissao = dataUtc(entrada.admissao);
  const desligamento = dataUtc(entrada.desligamento);
  const salario = Math.max(0, entrada.salario);
  const completos = anosCompletos(admissao, desligamento);
  const diasAviso = Math.min(90, 30 + completos * 3);

  let diasAvisoPagos = 0;
  if (entrada.tipoAviso === 'indenizado') {
    diasAvisoPagos =
      entrada.tipoDesligamento === 'acordo' ? diasAviso / 2 : diasAviso;
  }

  const dataProjetada = adicionarDias(desligamento, Math.ceil(diasAvisoPagos));
  const inicioMes = new Date(
    Date.UTC(desligamento.getUTCFullYear(), desligamento.getUTCMonth(), 1),
  );
  const inicioEfetivo = admissao > inicioMes ? admissao : inicioMes;
  const diasEfetivamenteTrabalhados = diasInclusivos(inicioEfetivo, desligamento);
  const divisorSaldo =
    entrada.metodoSaldo === 'trinta'
      ? 30
      : diasNoMes(desligamento.getUTCFullYear(), desligamento.getUTCMonth());
  const diasSaldo =
    entrada.metodoSaldo === 'trinta'
      ? Math.min(30, diasEfetivamenteTrabalhados)
      : diasEfetivamenteTrabalhados;

  const saldoSalario = arredondar((salario / divisorSaldo) * diasSaldo);
  const avisoIndenizado = arredondar((salario / 30) * diasAvisoPagos);
  const avosDecimo = avosNoAno(admissao, dataProjetada);
  const decimo = arredondar((salario / 12) * avosDecimo);
  const avosFerias = avosPeriodoAquisitivo(admissao, dataProjetada);
  const feriasProporcionais = arredondar((salario / 12) * avosFerias);
  const feriasVencidas = arredondar(salario * Math.max(0, entrada.feriasVencidas));
  const tercoFerias = arredondar((feriasProporcionais + feriasVencidas) / 3);

  const outrasVerbas = Math.max(0, entrada.outrasVerbas);
  const outrasRemuneratorias =
    entrada.naturezaOutrasVerbas === 'remuneratoria' ? outrasVerbas : 0;

  const creditos: LinhaCalculo[] = [
    {
      chave: 'saldo',
      rotulo: 'Saldo de salário',
      valor: saldoSalario,
      detalhe: `${diasSaldo} dia${diasSaldo === 1 ? '' : 's'} ÷ ${divisorSaldo}`,
    },
    ...(avisoIndenizado > 0
      ? [{
          chave: 'aviso',
          rotulo: entrada.tipoDesligamento === 'acordo'
            ? 'Metade do aviso-prévio indenizado'
            : 'Aviso-prévio indenizado',
          valor: avisoIndenizado,
          detalhe: `${diasAvisoPagos} de ${diasAviso} dias`,
        }]
      : []),
    {
      chave: 'decimo',
      rotulo: '13º salário proporcional',
      valor: decimo,
      detalhe: `${avosDecimo}/12 avos`,
    },
    ...(feriasVencidas > 0
      ? [{
          chave: 'ferias-vencidas',
          rotulo: 'Férias vencidas',
          valor: feriasVencidas,
          detalhe: `${entrada.feriasVencidas} período${entrada.feriasVencidas === 1 ? '' : 's'}`,
        }]
      : []),
    {
      chave: 'ferias-proporcionais',
      rotulo: 'Férias proporcionais',
      valor: feriasProporcionais,
      detalhe: `${avosFerias}/12 avos`,
    },
    {
      chave: 'terco-ferias',
      rotulo: 'Adicional de 1/3 das férias',
      valor: tercoFerias,
    },
    ...(outrasVerbas > 0
      ? [{
          chave: 'outras-verbas',
          rotulo: entrada.naturezaOutrasVerbas === 'remuneratoria'
            ? 'Outras verbas remuneratórias'
            : 'Outras verbas indenizatórias',
          valor: outrasVerbas,
        }]
      : []),
  ];

  const baseMensal = saldoSalario + outrasRemuneratorias;
  const inssMensal = calcularInss2026(baseMensal);
  const inssDecimo = calcularInss2026(decimo);
  const irrfMensal = calcularIrrf2026(baseMensal, inssMensal, entrada.dependentes);
  const irrfDecimo = calcularIrrf2026(decimo, inssDecimo, entrada.dependentes);
  const descontoAviso =
    entrada.tipoDesligamento === 'pedido_demissao' && entrada.tipoAviso === 'nao_cumprido'
      ? salario
      : 0;

  const descontos: LinhaCalculo[] = [
    ...(inssMensal > 0
      ? [{ chave: 'inss-mensal', rotulo: 'INSS sobre verbas mensais', valor: inssMensal }]
      : []),
    ...(inssDecimo > 0
      ? [{ chave: 'inss-decimo', rotulo: 'INSS sobre o 13º salário', valor: inssDecimo }]
      : []),
    ...(irrfMensal.valor > 0
      ? [{ chave: 'irrf-mensal', rotulo: 'IRRF sobre verbas mensais', valor: irrfMensal.valor }]
      : []),
    ...(irrfDecimo.valor > 0
      ? [{ chave: 'irrf-decimo', rotulo: 'IRRF sobre o 13º salário', valor: irrfDecimo.valor }]
      : []),
    ...(entrada.adiantamentoDecimo > 0
      ? [{
          chave: 'adiantamento-decimo',
          rotulo: '13º salário já adiantado',
          valor: entrada.adiantamentoDecimo,
        }]
      : []),
    ...(descontoAviso > 0
      ? [{
          chave: 'aviso-nao-cumprido',
          rotulo: 'Aviso-prévio não cumprido',
          valor: descontoAviso,
          detalhe: 'estimativa limitada a 30 dias',
        }]
      : []),
    ...(entrada.outrosDescontos > 0
      ? [{ chave: 'outros-descontos', rotulo: 'Outros descontos informados', valor: entrada.outrosDescontos }]
      : []),
  ];

  const totalCreditos = arredondar(creditos.reduce((total, item) => total + item.valor, 0));
  const totalDescontos = arredondar(descontos.reduce((total, item) => total + item.valor, 0));
  const liquidoTrct = arredondar(Math.max(0, totalCreditos - totalDescontos));

  const baseFgtsRescisorio = saldoSalario + avisoIndenizado + decimo + outrasRemuneratorias;
  const fgtsDepositoRescisorio = arredondar(baseFgtsRescisorio * 0.08);
  const percentualMultaFgts =
    entrada.tipoDesligamento === 'sem_justa_causa'
      ? 0.4
      : entrada.tipoDesligamento === 'acordo'
        ? 0.2
        : 0;
  const fgtsSaldoComDeposito = arredondar(Math.max(0, entrada.baseFgts) + fgtsDepositoRescisorio);
  const fgtsMulta = arredondar(fgtsSaldoComDeposito * percentualMultaFgts);

  return {
    creditos,
    descontos,
    totalCreditos,
    totalDescontos,
    liquidoTrct,
    fgtsDepositoRescisorio,
    fgtsMulta,
    fgtsSaldoComDeposito,
    percentualMultaFgts,
    percentualSaqueFgts:
      entrada.tipoDesligamento === 'sem_justa_causa'
        ? 1
        : entrada.tipoDesligamento === 'acordo'
          ? 0.8
          : 0,
    diasSaldo,
    divisorSaldo,
    diasAviso,
    diasAvisoPagos,
    avosDecimo,
    avosFerias,
    dataProjetada: chaveData(dataProjetada),
    deducaoIrrfMensal: irrfMensal.deducao,
    deducaoIrrfDecimo: irrfDecimo.deducao,
  };
}
