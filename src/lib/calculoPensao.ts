import { FATORES_JEBR_MAIO_2026, type DadosPublicosPensao } from './dadosPensao';

export type RitoPensao = 'prisao' | 'expropriacao';
export type BasePensao = 'salario_minimo' | 'rendimentos' | 'valor_fixo';
export type CriterioJurosPensao = 'taxa_legal' | 'taxa_mensal' | 'sem_juros';

export type EntradaPensao = {
  rito: RitoPensao;
  tipoBase: BasePensao;
  valorBase: number;
  percentual: number;
  inicio: string;
  fim: string;
  dataReferencia: string;
  dataAjuizamento: string;
  diaVencimento: number;
  mesSubsequente: boolean;
  incluirDecimo: boolean;
  criterioJuros: CriterioJurosPensao | '';
  jurosMensal: number | null;
  valoresPagos?: Record<string, number>;
};

export type RitoAplicavelPensao = RitoPensao | 'fora';

export type ParcelaPensao = {
  chave: string;
  referencia: string;
  descricao: string;
  vencimento: string;
  base: number;
  percentual: number;
  devidoOriginal: number;
  pago: number;
  saldo: number;
  fatorCorrecao: number;
  corrigido: number;
  diasJuros: number;
  percentualJurosAcumulado: number;
  criterioJuros: CriterioJurosPensao | '';
  juros: number;
  total: number;
  ritoAplicavel: RitoAplicavelPensao;
};

export type ResumoRitoPensao = {
  parcelas: number;
  totalOriginal: number;
  totalPago: number;
  totalCorrigido: number;
  totalJuros: number;
  total: number;
};

export type ResultadoPensao = {
  parcelas: ParcelaPensao[];
  prisao: ResumoRitoPensao;
  expropriacao: ResumoRitoPensao;
  totalOriginal: number;
  totalPago: number;
  totalCorrigido: number;
  totalJuros: number;
  total: number;
  ultimoIpca?: string;
  ultimaTaxaLegal?: string;
  ipcaCompleto: boolean;
  taxaLegalCompleta: boolean;
};

export function mascararDataPensao(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

export function dataPtParaIsoPensao(valor: string): string {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  if (!partes) return '';
  const dia = Number(partes[1]);
  const mes = Number(partes[2]);
  const ano = Number(partes[3]);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) return '';
  return `${partes[3]}-${partes[2]}-${partes[1]}`;
}

const arredondar = (valor: number) => Math.round((valor + 1e-9) * 100) / 100;

function somarMes(chave: string, quantidade: number): string {
  const [ano, mes] = chave.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1 + quantidade, 1));
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function dataVencimentoPensao(referencia: string, dia: number, subsequente: boolean): string {
  if (!/^\d{4}-\d{2}$/.test(referencia) || !Number.isInteger(dia) || dia < 1 || dia > 31) return '';
  const competencia = somarMes(referencia, subsequente ? 1 : 0);
  const [ano, mes] = competencia.split('-').map(Number);
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return `${competencia}-${String(Math.min(Math.max(1, dia), ultimoDia)).padStart(2, '0')}`;
}

export function validarEntradaPensao(entrada: EntradaPensao): string[] {
  const problemas: string[] = [];
  if (!entrada.inicio) problemas.push('Informe o mês inicial.');
  if (!entrada.fim) problemas.push('Informe o mês final.');
  if (entrada.inicio && entrada.inicio < '2005-01') problemas.push('A tabela de referência disponível começa em janeiro de 2005.');
  if (entrada.inicio && entrada.fim && entrada.fim < entrada.inicio) problemas.push('O mês final precisa ser igual ou posterior ao inicial.');
  if (!entrada.dataReferencia) problemas.push('Informe a data de referência do cálculo.');
  if (entrada.dataReferencia && entrada.dataReferencia < '2026-05-01') {
    problemas.push('A data de referência não pode ser anterior a maio de 2026, que é a posição da tabela histórica utilizada.');
  }
  if (!Number.isInteger(entrada.diaVencimento) || entrada.diaVencimento < 1 || entrada.diaVencimento > 31) {
    problemas.push('Informe o dia de vencimento entre 1 e 31.');
  }
  if (entrada.rito === 'prisao' && !entrada.dataAjuizamento) problemas.push('Informe a data do ajuizamento para separar corretamente as parcelas do rito da prisão.');
  if (entrada.dataAjuizamento && entrada.dataReferencia && entrada.dataAjuizamento > entrada.dataReferencia) {
    problemas.push('A data do ajuizamento não pode ser posterior à data de referência do cálculo.');
  }
  if (!entrada.criterioJuros) problemas.push('Selecione o critério de juros previsto no título ou aplicável ao caso.');
  if (entrada.criterioJuros === 'taxa_mensal' && entrada.jurosMensal === null) {
    problemas.push('Informe a taxa mensal de juros determinada no título ou pelo juízo.');
  }
  if (entrada.tipoBase !== 'valor_fixo' && (entrada.percentual <= 0 || entrada.percentual > 100)) {
    problemas.push('Informe um percentual entre 0,01% e 100%.');
  }
  if (entrada.tipoBase !== 'salario_minimo' && entrada.valorBase <= 0) {
    problemas.push('Informe uma base de rendimentos ou um valor fixo maior que zero.');
  }
  if (entrada.inicio && entrada.fim && entrada.fim >= entrada.inicio && entrada.dataReferencia && entrada.diaVencimento >= 1) {
    const ultimoVencimento = dataVencimentoPensao(
      entrada.fim,
      entrada.diaVencimento,
      entrada.mesSubsequente,
    );
    if (entrada.dataReferencia < ultimoVencimento) {
      problemas.push(`A data de referência precisa ser igual ou posterior ao vencimento da última parcela (${ultimoVencimento.split('-').reverse().join('/')}).`);
    }
  }
  if (entrada.criterioJuros === 'taxa_legal' && entrada.inicio && entrada.diaVencimento >= 1) {
    const primeiroVencimento = dataVencimentoPensao(entrada.inicio, entrada.diaVencimento, entrada.mesSubsequente);
    if (primeiroVencimento && primeiroVencimento < '2024-08-30') {
      problemas.push('A Taxa Legal automática somente pode ser usada para mora iniciada a partir de 30/08/2024. Para períodos anteriores, selecione o critério determinado no título ou pelo juízo.');
    }
  }
  return problemas;
}

function mesAnterior(chave: string): string {
  return somarMes(chave, -1);
}

function fatorAteData(referencia: string, dados: DadosPublicosPensao, dataReferencia: string): number {
  const [ano, mes] = referencia.split('-');
  const fatorBase = referencia <= '2026-05'
    ? FATORES_JEBR_MAIO_2026[ano]?.[Number(mes) - 1]
    : 1;
  if (!fatorBase) return Number.NaN;

  const mesPagamento = dataReferencia.slice(0, 7);
  if (mesPagamento <= '2026-05') return fatorBase;

  const ultimoNecessario = mesAnterior(mesPagamento);
  const ultimoDisponivel = dados.ultimoIpca && dados.ultimoIpca < ultimoNecessario
    ? dados.ultimoIpca
    : ultimoNecessario;
  let inicioIpca = referencia <= '2026-05' ? '2026-05' : referencia;
  let fator = fatorBase;

  while (dados.ipcaViaApi && inicioIpca <= ultimoDisponivel) {
    const variacao = dados.ipcaMensal[inicioIpca];
    if (variacao !== undefined) fator *= 1 + variacao / 100;
    inicioIpca = somarMes(inicioIpca, 1);
  }
  return fator;
}

function ipcaCompletoAteData(dataReferencia: string, dados: DadosPublicosPensao): boolean {
  const mesPagamento = dataReferencia.slice(0, 7);
  if (mesPagamento <= '2026-05') return true;
  const ultimoNecessario = mesAnterior(mesPagamento);
  let cursor = '2026-05';
  while (cursor <= ultimoNecessario) {
    if (dados.ipcaMensal[cursor] === undefined) return false;
    cursor = somarMes(cursor, 1);
  }
  return true;
}

function dataUtc(valor: string): Date {
  return new Date(`${valor}T00:00:00.000Z`);
}

function chaveMesData(data: Date): string {
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}`;
}

function calcularJurosProRata(
  vencimento: string,
  dataReferencia: string,
  criterio: CriterioJurosPensao | '',
  taxaMensal: number | null,
  dados: DadosPublicosPensao,
): { dias: number; percentual: number; completo: boolean } {
  if (!criterio || vencimento > dataReferencia) return { dias: 0, percentual: 0, completo: true };

  const cursorInicial = dataUtc(vencimento);
  const limiteInclusivo = dataUtc(dataReferencia);
  limiteInclusivo.setUTCDate(limiteInclusivo.getUTCDate() + 1);
  let cursor = cursorInicial;
  let percentual = 0;
  let completo = true;
  let diasTotais = 0;

  while (cursor < limiteInclusivo) {
    const ano = cursor.getUTCFullYear();
    const mes = cursor.getUTCMonth();
    const primeiroProximoMes = new Date(Date.UTC(ano, mes + 1, 1));
    const fimTrecho = primeiroProximoMes < limiteInclusivo ? primeiroProximoMes : limiteInclusivo;
    const diasTrecho = Math.round((fimTrecho.getTime() - cursor.getTime()) / 86_400_000);
    const diasMes = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
    const chave = chaveMesData(cursor);
    const taxa = criterio === 'sem_juros'
      ? 0
      : criterio === 'taxa_mensal'
        ? taxaMensal
        : dados.taxaLegalMensal[chave];

    if (taxa === null || taxa === undefined || !Number.isFinite(taxa)) completo = false;
    else percentual += taxa * (diasTrecho / diasMes);
    diasTotais += diasTrecho;
    cursor = fimTrecho;
  }

  return { dias: diasTotais, percentual: Number(percentual.toFixed(6)), completo };
}

function competencias(inicio: string, fim: string): string[] {
  const meses: string[] = [];
  let cursor = inicio;
  while (cursor <= fim && meses.length < 600) {
    meses.push(cursor);
    cursor = somarMes(cursor, 1);
  }
  return meses;
}

function resumirParcelas(parcelas: ParcelaPensao[]): ResumoRitoPensao {
  return {
    parcelas: parcelas.length,
    totalOriginal: arredondar(parcelas.reduce((total, parcela) => total + parcela.devidoOriginal, 0)),
    totalPago: arredondar(parcelas.reduce((total, parcela) => total + parcela.pago, 0)),
    totalCorrigido: arredondar(parcelas.reduce((total, parcela) => total + parcela.corrigido, 0)),
    totalJuros: arredondar(parcelas.reduce((total, parcela) => total + parcela.juros, 0)),
    total: arredondar(parcelas.reduce((total, parcela) => total + parcela.total, 0)),
  };
}

export function calcularPensao(entrada: EntradaPensao, dados: DadosPublicosPensao): ResultadoPensao {
  const parcelas: ParcelaPensao[] = [];

  for (const referencia of competencias(entrada.inicio, entrada.fim)) {
    const base = entrada.tipoBase === 'salario_minimo'
      ? dados.salariosMinimos[referencia]
      : entrada.valorBase;
    const valor = entrada.tipoBase === 'valor_fixo'
      ? entrada.valorBase
      : base * (entrada.percentual / 100);
    const obrigacoes = [
      { chave: referencia, descricao: referencia },
      ...(entrada.incluirDecimo && referencia.endsWith('-12')
        ? [{ chave: `${referencia}-13`, descricao: `13º salário ${referencia.slice(0, 4)}` }]
        : []),
    ];

    for (const obrigacao of obrigacoes) {
      const vencimento = dataVencimentoPensao(referencia, entrada.diaVencimento, entrada.mesSubsequente);
      const pago = Math.max(0, entrada.valoresPagos?.[obrigacao.chave] ?? 0);
      const saldo = arredondar(Math.max(0, valor - pago));
      const fatorCorrecao = fatorAteData(referencia, dados, entrada.dataReferencia);
      const corrigido = arredondar(saldo * fatorCorrecao);
      parcelas.push({
        chave: obrigacao.chave,
        referencia,
        descricao: obrigacao.descricao,
        vencimento,
        base: arredondar(base),
        percentual: entrada.tipoBase === 'valor_fixo' ? 100 : entrada.percentual,
        devidoOriginal: arredondar(valor),
        pago: arredondar(pago),
        saldo,
        fatorCorrecao,
        corrigido,
        diasJuros: 0,
        percentualJurosAcumulado: 0,
        criterioJuros: entrada.criterioJuros,
        juros: 0,
        total: corrigido,
        ritoAplicavel: 'fora',
      });
    }
  }

  const vencidas = parcelas
    .filter((parcela) => parcela.vencimento <= entrada.dataReferencia && parcela.saldo > 0)
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento));

  if (entrada.rito === 'prisao') {
    const vencidasNoAjuizamento = vencidas.filter((parcela) => parcela.vencimento <= entrada.dataAjuizamento);
    const posterioresAoAjuizamento = vencidas.filter((parcela) => parcela.vencimento > entrada.dataAjuizamento);
    const chavesPrisao = new Set([
      ...vencidasNoAjuizamento.slice(-3),
      ...posterioresAoAjuizamento,
    ].map((parcela) => parcela.chave));
    for (const parcela of vencidas) parcela.ritoAplicavel = chavesPrisao.has(parcela.chave) ? 'prisao' : 'expropriacao';
  } else {
    for (const parcela of vencidas) parcela.ritoAplicavel = 'expropriacao';
  }

  for (const parcela of parcelas) {
    if (parcela.ritoAplicavel === 'fora') continue;
    const jurosProRata = calcularJurosProRata(
      parcela.vencimento,
      entrada.dataReferencia,
      entrada.criterioJuros,
      entrada.jurosMensal,
      dados,
    );
    parcela.diasJuros = jurosProRata.dias;
    parcela.percentualJurosAcumulado = jurosProRata.percentual;
    parcela.juros = arredondar(parcela.corrigido * (jurosProRata.percentual / 100));
    parcela.total = arredondar(parcela.corrigido + parcela.juros);
  }

  const parcelasPrisao = parcelas.filter((parcela) => parcela.ritoAplicavel === 'prisao');
  const parcelasExpropriacao = parcelas.filter((parcela) => parcela.ritoAplicavel === 'expropriacao');
  const consideradas = [...parcelasExpropriacao, ...parcelasPrisao];
  const prisao = resumirParcelas(parcelasPrisao);
  const expropriacao = resumirParcelas(parcelasExpropriacao);
  const geral = resumirParcelas(consideradas);
  return {
    parcelas,
    prisao,
    expropriacao,
    totalOriginal: geral.totalOriginal,
    totalPago: geral.totalPago,
    totalCorrigido: geral.totalCorrigido,
    totalJuros: geral.totalJuros,
    total: geral.total,
    ultimoIpca: dados.ultimoIpca,
    ultimaTaxaLegal: dados.ultimaTaxaLegal,
    ipcaCompleto: ipcaCompletoAteData(entrada.dataReferencia, dados),
    taxaLegalCompleta: entrada.criterioJuros !== 'taxa_legal'
      || consideradas.every((parcela) => calcularJurosProRata(
        parcela.vencimento,
        entrada.dataReferencia,
        entrada.criterioJuros,
        entrada.jurosMensal,
        dados,
      ).completo),
  };
}
