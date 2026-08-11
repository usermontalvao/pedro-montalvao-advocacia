import {
  COMPETENCIA_MONETARIA_RMI,
  EXPECTATIVA_SOBREVIDA_2024,
  FATORES_ATUALIZACAO_RMI,
  SALARIO_MINIMO_RMI,
  TETO_RGPS_RMI,
  salarioMinimoNaCompetencia,
  tetoRgpsNaCompetencia,
} from './dadosRmiAposentadoria';

export type SexoPrevidenciario = 'feminino' | 'masculino';

export type TipoPeriodoPrevidenciario =
  | 'comum'
  | 'professor'
  | 'especial15'
  | 'especial20'
  | 'especial25'
  | 'rural'
  | 'pcd_leve'
  | 'pcd_moderada'
  | 'pcd_grave'
  | 'rpps_ctc';

export type PeriodoPrevidenciario = {
  id: string;
  sequenciaCnis?: number;
  inicio: string;
  fim: string;
  origem: string;
  tipo: TipoPeriodoPrevidenciario;
  incluir: boolean;
  contaCarencia: boolean;
  indicadores: string[];
  competenciasExcluidas?: string[];
  importado?: boolean;
};

export type RemuneracaoPrevidenciaria = {
  id: string;
  competencia: string;
  valor: number;
  origem: string;
  sequencia?: number;
  indicadores: string[];
  incluir: boolean;
  importado?: boolean;
};

export type EntradaAposentadoria = {
  nascimento: string;
  sexo: SexoPrevidenciario;
  dataReferencia: string;
  periodos: PeriodoPrevidenciario[];
  remuneracoes?: RemuneracaoPrevidenciaria[];
  atividadeFutura: TipoPeriodoPrevidenciario;
  salarioContribuicaoFuturo?: number;
};

export type StatusRegraAposentadoria = 'cumprido' | 'projetado' | 'direito_adquirido' | 'inaplicavel';

export type ResultadoRegraAposentadoria = {
  id: string;
  nome: string;
  grupo: 'Urbana' | 'Professor' | 'Especial' | 'Pessoa com deficiência' | 'Rural';
  status: StatusRegraAposentadoria;
  dataEstimada: string | null;
  resumo: string;
  requisitos: string[];
  fundamento: string;
  observacoes: string[];
  rmi?: CalculoRmiAposentadoria | null;
};

export type SalarioMemorialRmi = {
  competencia: string;
  nominal: number;
  nominalConsiderado: number;
  tetoCompetencia: number;
  quantidadeRemuneracoes: number;
  concomitante: boolean;
  limitadoAoTeto: boolean;
  fatorAtualizacao: number;
  atualizado: number;
  incluido: boolean;
  origem: string;
  indicadores: string[];
  projetado: boolean;
};

export type CalculoRmiAposentadoria = {
  disponivel: boolean;
  competenciaMonetaria: string;
  metodo: string;
  pbcInicio: string;
  pbcFim: string;
  salariosLocalizados: number;
  salariosUtilizados: number;
  divisor: number;
  somaAtualizada: number;
  mediaContributiva: number;
  salarioBeneficio: number;
  coeficiente: number;
  fatorPrevidenciario: number | null;
  rendaCalculada: number;
  rmiEstimada: number;
  pisoAplicado: boolean;
  tetoAplicado: boolean;
  descarteAplicado?: boolean;
  competenciasDescartadas?: number;
  tempoAposDescarteDias?: number;
  carenciaAposDescarte?: number;
  salarios: SalarioMemorialRmi[];
  alertas: string[];
};

export type MemorialPeriodoAposentadoria = {
  id: string;
  origem: string;
  inicio: string;
  fim: string;
  tipo: TipoPeriodoPrevidenciario;
  diasOriginais: number;
  fatorConversao: number;
  diasConvertidos: number;
  limiteConversao: string | null;
  carenciaMeses: number;
  indicadores: string[];
  incluido: boolean;
};

export type MemorialMarcoAposentadoria = {
  data: string;
  rotulo: string;
  tempoComumDias: number;
  carenciaMeses: number;
  idadeAnos: number;
};

export type ResultadoAposentadoria = {
  dataReferencia: string;
  tempoComumDias: number;
  tempoProfessorDias: number;
  tempoEspecial: Record<'15' | '20' | '25', number>;
  tempoPcdDias: number;
  tempoRuralDias: number;
  carenciaMeses: number;
  regras: ResultadoRegraAposentadoria[];
  memorialPeriodos: MemorialPeriodoAposentadoria[];
  memorialMarcos: MemorialMarcoAposentadoria[];
  alertas: string[];
};

/**
 * Escolhe, entre as regras já preenchidas na DER, a de maior RMI disponível.
 * Em caso de empate, privilegia a DIB mais antiga e preserva a ordem original
 * como último critério. Regras apenas projetadas nunca são tratadas como o
 * melhor benefício atual.
 */
export function selecionarMelhorBeneficioAtual(
  regras: ResultadoRegraAposentadoria[],
): ResultadoRegraAposentadoria | null {
  return regras.reduce<ResultadoRegraAposentadoria | null>((melhor, regra) => {
    const atual = regra.status === 'direito_adquirido' || regra.status === 'cumprido';
    if (!atual || !regra.rmi?.disponivel) return melhor;
    if (!melhor) return regra;

    const diferencaRmi = regra.rmi.rmiEstimada - (melhor.rmi?.rmiEstimada ?? 0);
    if (diferencaRmi > 0) return regra;
    if (diferencaRmi < 0) return melhor;

    return (regra.dataEstimada ?? '9999-12-31') < (melhor.dataEstimada ?? '9999-12-31')
      ? regra
      : melhor;
  }, null);
}

const DIA = 86_400_000;
const REFORMA = '2019-11-13';
const CORTE_EC20 = '1998-12-16';
const CORTE_LEI_9876 = '1999-11-29';
const CORTE_LEI_13846 = '2019-06-18';

type Intervalo = { inicio: number; fim: number };

function epoch(iso: string): number {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(ano, mes - 1, dia) / DIA);
}

function iso(diaEpoch: number): string {
  return new Date(diaEpoch * DIA).toISOString().slice(0, 10);
}

export function formatarIdadeCivil(nascimento: string, referencia: string): string {
  if (!nascimento || !referencia || referencia < nascimento) return '—';
  const [anoNascimento, mesNascimento, diaNascimento] = nascimento.split('-').map(Number);
  const [anoReferencia, mesReferencia, diaReferencia] = referencia.split('-').map(Number);
  let anos = anoReferencia - anoNascimento;
  let meses = mesReferencia - mesNascimento;
  let dias = diaReferencia - diaNascimento;
  if (dias < 0) {
    dias += new Date(Date.UTC(anoReferencia, mesReferencia - 1, 0)).getUTCDate();
    meses -= 1;
  }
  if (meses < 0) {
    meses += 12;
    anos -= 1;
  }
  return `${anos} ano(s), ${meses} mês(es) e ${dias} dia(s)`;
}

function adicionarMeses(dataIso: string, meses: number): string {
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  const base = new Date(Date.UTC(ano, mes - 1 + meses, 1));
  const ultimo = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
  base.setUTCDate(Math.min(dia, ultimo));
  return base.toISOString().slice(0, 10);
}

function limitarIntervalos(
  periodos: PeriodoPrevidenciario[],
  corte: string,
  filtro: (periodo: PeriodoPrevidenciario) => boolean = () => true,
): Intervalo[] {
  const limite = epoch(corte);
  return periodos
    .filter((periodo) => periodo.incluir && filtro(periodo) && periodo.inicio && periodo.fim)
    .flatMap((periodo) => {
      const inicio = epoch(periodo.inicio);
      const fim = Math.min(epoch(periodo.fim), limite);
      if (fim < inicio) return [];
      const excluidas = new Set(periodo.competenciasExcluidas ?? []);
      if (!excluidas.size) return [{ inicio, fim }];
      const intervalos: Intervalo[] = [];
      let cursor = inicio;
      for (const competencia of [...excluidas].sort()) {
        const inicioMes = epoch(`${competencia}-01`);
        const [ano, mes] = competencia.split('-').map(Number);
        const fimMes = epoch(new Date(Date.UTC(ano, mes, 0)).toISOString().slice(0, 10));
        if (fimMes < cursor || inicioMes > fim) continue;
        if (inicioMes > cursor) intervalos.push({ inicio: cursor, fim: Math.min(fim, inicioMes - 1) });
        cursor = Math.max(cursor, fimMes + 1);
      }
      if (cursor <= fim) intervalos.push({ inicio: cursor, fim });
      return intervalos;
    });
}

function mesclar(intervalos: Intervalo[]): Intervalo[] {
  const ordenados = [...intervalos].sort((a, b) => a.inicio - b.inicio || a.fim - b.fim);
  const resultado: Intervalo[] = [];
  for (const atual of ordenados) {
    const anterior = resultado.at(-1);
    if (!anterior || atual.inicio > anterior.fim + 1) resultado.push({ ...atual });
    else anterior.fim = Math.max(anterior.fim, atual.fim);
  }
  return resultado;
}

function contarIntervalos(intervalos: Intervalo[]): number {
  return mesclar(intervalos).reduce((total, periodo) => total + periodo.fim - periodo.inicio + 1, 0);
}

function diasReais(periodos: PeriodoPrevidenciario[], corte: string): number {
  return contarIntervalos(limitarIntervalos(periodos, corte));
}

function diasDoTipo(
  periodos: PeriodoPrevidenciario[],
  corte: string,
  tipos: TipoPeriodoPrevidenciario[],
): number {
  return contarIntervalos(limitarIntervalos(periodos, corte, (periodo) => tipos.includes(periodo.tipo)));
}

export function fatorEspecialParaComum(tipo: TipoPeriodoPrevidenciario, sexo: SexoPrevidenciario): number {
  const alvo = sexo === 'feminino' ? 30 : 35;
  if (tipo === 'especial15') return alvo / 15;
  if (tipo === 'especial20') return alvo / 20;
  if (tipo === 'especial25') return alvo / 25;
  return 1;
}

/**
 * Tempo comum com a conversão do especial limitada a 13/11/2019.
 * A vedação posterior foi mantida pelo STF na ADI 6309.
 */
function diasComunsConvertidos(
  periodos: PeriodoPrevidenciario[],
  corte: string,
  sexo: SexoPrevidenciario,
): number {
  const reais = diasReais(periodos, corte);
  const corteConversao = corte < REFORMA ? corte : REFORMA;
  const adicionalPorDia = new Map<number, number>();
  for (const tipo of ['especial15', 'especial20', 'especial25'] as const) {
    const adicional = fatorEspecialParaComum(tipo, sexo) - 1;
    for (const intervalo of limitarIntervalos(periodos, corteConversao, (periodo) => periodo.tipo === tipo)) {
      for (let dia = intervalo.inicio; dia <= intervalo.fim; dia += 1) {
        adicionalPorDia.set(dia, Math.max(adicionalPorDia.get(dia) ?? 0, adicional));
      }
    }
  }
  const adicionais = [...adicionalPorDia.values()].reduce((total, adicional) => total + adicional, 0);
  return Math.round(reais + adicionais);
}

function diasEspecialEquivalente(
  periodos: PeriodoPrevidenciario[],
  corte: string,
  alvo: 15 | 20 | 25,
): number {
  return Math.round((['especial15', 'especial20', 'especial25'] as const).reduce((total, tipo) => {
    const origem = Number(tipo.slice(-2));
    return total + diasDoTipo(periodos, corte, [tipo]) * (alvo / origem);
  }, 0));
}

function diasPcdEquivalente(
  periodos: PeriodoPrevidenciario[],
  corte: string,
  sexo: SexoPrevidenciario,
  alvo: 'leve' | 'moderada' | 'grave',
): number {
  const requisitos = sexo === 'feminino'
    ? { leve: 28, moderada: 24, grave: 20 }
    : { leve: 33, moderada: 29, grave: 25 };
  return Math.round((['pcd_leve', 'pcd_moderada', 'pcd_grave'] as const).reduce((total, tipo) => {
    const origem = tipo.replace('pcd_', '') as keyof typeof requisitos;
    return total + diasDoTipo(periodos, corte, [tipo]) * (requisitos[alvo] / requisitos[origem]);
  }, 0));
}

function competenciasDeCarencia(periodos: PeriodoPrevidenciario[], corte: string): Set<string> {
  const limite = epoch(corte);
  const competencias = new Set<string>();
  for (const periodo of periodos.filter((item) => item.incluir && item.contaCarencia && item.inicio && item.fim)) {
    const excluidas = new Set(periodo.competenciasExcluidas ?? []);
    let cursor = new Date(epoch(periodo.inicio) * DIA);
    const fim = Math.min(epoch(periodo.fim), limite);
    while (Math.floor(cursor.getTime() / DIA) <= fim) {
      const competencia = cursor.toISOString().slice(0, 7);
      if (!excluidas.has(competencia)) competencias.add(competencia);
      cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
    }
  }
  return competencias;
}

function anosEmDias(anos: number): number {
  return Math.round(anos * 365);
}

function idadeFracionada(nascimento: string, data: string): number {
  return Math.max(0, (epoch(data) - epoch(nascimento)) / 365.2425);
}

function atingiuIdade(nascimento: string, data: string, meses: number): boolean {
  return data >= adicionarMeses(nascimento, meses);
}

function mesesEntreCompetencias(inicio: string, fim: string): number {
  const [anoI, mesI] = inicio.slice(0, 7).split('-').map(Number);
  const [anoF, mesF] = fim.slice(0, 7).split('-').map(Number);
  return Math.max(0, (anoF - anoI) * 12 + mesF - mesI);
}

export function formatarTempoPrevidenciario(dias: number): string {
  const inteiro = Math.max(0, Math.round(dias));
  const anos = Math.floor(inteiro / 365);
  const restoAno = inteiro - anos * 365;
  const meses = Math.max(0, Math.floor(restoAno / 30));
  const resto = Math.max(0, restoAno - meses * 30);
  return `${anos} ano(s), ${meses} mês(es) e ${resto} dia(s)`;
}

export function validarEntradaAposentadoria(entrada: EntradaAposentadoria): string[] {
  const erros: string[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entrada.nascimento)) erros.push('Informe a data de nascimento.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entrada.dataReferencia)) erros.push('Informe uma data de referência válida.');
  if (entrada.nascimento && entrada.dataReferencia && entrada.nascimento >= entrada.dataReferencia) {
    erros.push('A data de nascimento precisa ser anterior à data de referência.');
  }
  const incluidos = entrada.periodos.filter((periodo) => periodo.incluir);
  if (!incluidos.length) erros.push('Importe o CNIS ou adicione ao menos um período contributivo.');
  for (const periodo of incluidos) {
    if (!periodo.inicio || !periodo.fim) erros.push(`Complete as datas do período “${periodo.origem || 'sem identificação'}”.`);
    else if (periodo.fim < periodo.inicio) erros.push(`O fim do período “${periodo.origem || 'sem identificação'}” é anterior ao início.`);
  }
  return [...new Set(erros)];
}

type Metricas = {
  comum: number;
  professor: number;
  especial15: number;
  especial20: number;
  especial25: number;
  pcdLeve: number;
  pcdModerada: number;
  pcdGrave: number;
  pcdReal: number;
  rural: number;
  carencia: number;
};

function metricasAte(entrada: EntradaAposentadoria, data: string): Metricas {
  return {
    comum: diasComunsConvertidos(entrada.periodos, data, entrada.sexo),
    professor: diasDoTipo(entrada.periodos, data, ['professor']),
    especial15: diasEspecialEquivalente(entrada.periodos, data, 15),
    especial20: diasEspecialEquivalente(entrada.periodos, data, 20),
    especial25: diasEspecialEquivalente(entrada.periodos, data, 25),
    pcdLeve: diasPcdEquivalente(entrada.periodos, data, entrada.sexo, 'leve'),
    pcdModerada: diasPcdEquivalente(entrada.periodos, data, entrada.sexo, 'moderada'),
    pcdGrave: diasPcdEquivalente(entrada.periodos, data, entrada.sexo, 'grave'),
    pcdReal: diasDoTipo(entrada.periodos, data, ['pcd_leve', 'pcd_moderada', 'pcd_grave']),
    rural: diasDoTipo(entrada.periodos, data, ['rural']),
    carencia: competenciasDeCarencia(entrada.periodos, data).size,
  };
}

function criarProjetor(entrada: EntradaAposentadoria) {
  const base = metricasAte(entrada, entrada.dataReferencia);
  const carencias = competenciasDeCarencia(entrada.periodos, entrada.dataReferencia);
  const referencia = epoch(entrada.dataReferencia);
  const tipo = entrada.atividadeFutura;

  return (data: string): Metricas => {
    const futuros = Math.max(0, epoch(data) - referencia);
    const novasCompetencias = mesesEntreCompetencias(entrada.dataReferencia, data)
      + (carencias.has(entrada.dataReferencia.slice(0, 7)) ? 0 : 1);
    const especial = (alvo: 15 | 20 | 25) => {
      if (!tipo.startsWith('especial')) return 0;
      const origem = Number(tipo.slice(-2));
      return futuros * (alvo / origem);
    };
    const pcd = (alvo: 'leve' | 'moderada' | 'grave') => {
      if (!tipo.startsWith('pcd_')) return 0;
      const req = entrada.sexo === 'feminino'
        ? { leve: 28, moderada: 24, grave: 20 }
        : { leve: 33, moderada: 29, grave: 25 };
      const origem = tipo.replace('pcd_', '') as keyof typeof req;
      return futuros * (req[alvo] / req[origem]);
    };
    return {
      comum: base.comum + futuros,
      professor: base.professor + (tipo === 'professor' ? futuros : 0),
      especial15: base.especial15 + especial(15),
      especial20: base.especial20 + especial(20),
      especial25: base.especial25 + especial(25),
      pcdLeve: base.pcdLeve + pcd('leve'),
      pcdModerada: base.pcdModerada + pcd('moderada'),
      pcdGrave: base.pcdGrave + pcd('grave'),
      pcdReal: base.pcdReal + (tipo.startsWith('pcd_') ? futuros : 0),
      rural: base.rural + (tipo === 'rural' ? futuros : 0),
      carencia: base.carencia + Math.max(0, novasCompetencias),
    };
  };
}

type DefinicaoRegra = Omit<ResultadoRegraAposentadoria, 'status' | 'dataEstimada' | 'resumo'> & {
  aplicavel?: boolean;
  motivoInaplicavel?: string;
  atende: (data: string, metricas: Metricas) => boolean;
};

function projetarRegra(
  entrada: EntradaAposentadoria,
  regra: DefinicaoRegra,
  metricasProjetadas: ReturnType<typeof criarProjetor>,
): ResultadoRegraAposentadoria {
  if (regra.aplicavel === false) {
    return {
      ...regra,
      status: 'inaplicavel',
      dataEstimada: null,
      resumo: regra.motivoInaplicavel ?? 'Regra não aplicável aos dados classificados.',
    };
  }
  const inicio = epoch(entrada.dataReferencia);
  const limite = inicio + Math.round(55 * 365.2425);
  for (let cursor = inicio; cursor <= limite; cursor += 1) {
    const data = iso(cursor);
    if (regra.atende(data, metricasProjetadas(data))) {
      const status = cursor === inicio ? 'cumprido' : 'projetado';
      return {
        ...regra,
        status,
        dataEstimada: data,
        resumo: status === 'cumprido'
          ? 'Os requisitos matemáticos aparecem cumpridos na data de referência.'
          : 'Data projetada supondo contribuição contínua na atividade futura selecionada.',
      };
    }
  }
  return {
    ...regra,
    status: 'inaplicavel',
    dataEstimada: null,
    resumo: 'A atividade futura selecionada não permite projetar o requisito desta regra.',
  };
}

function resultadoAdquirido(
  regra: Omit<ResultadoRegraAposentadoria, 'status' | 'dataEstimada' | 'resumo'>,
  data: string,
): ResultadoRegraAposentadoria {
  return {
    ...regra,
    status: 'direito_adquirido',
    dataEstimada: data,
    resumo: 'Os dados informados indicam requisitos preenchidos até este marco legal.',
  };
}

function arredondarMoeda(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function mesAnterior(competencia: string): string {
  const [ano, mes] = competencia.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 2, 1)).toISOString().slice(0, 7);
}

function mesSeguinte(competencia: string): string {
  const [ano, mes] = competencia.split('-').map(Number);
  return new Date(Date.UTC(ano, mes, 1)).toISOString().slice(0, 7);
}

function mesesAte(inicio: string, fim: string): string[] {
  if (inicio > fim) return [];
  const meses: string[] = [];
  let cursor = inicio;
  while (cursor <= fim && meses.length < 1_200) {
    meses.push(cursor);
    cursor = mesSeguinte(cursor);
  }
  return meses;
}

function expectativaSobrevida(idade: number): number {
  const idadeInteira = Math.max(0, Math.min(89, Math.floor(idade)));
  return EXPECTATIVA_SOBREVIDA_2024[idadeInteira] ?? EXPECTATIVA_SOBREVIDA_2024[89];
}

function calcularFatorPrevidenciario(
  entrada: EntradaAposentadoria,
  data: string,
  tempoDias: number,
  professor: boolean,
): number {
  const idade = idadeFracionada(entrada.nascimento, data);
  let tempo = tempoDias / 365;
  if (professor) tempo += entrada.sexo === 'feminino' ? 10 : 5;
  else if (entrada.sexo === 'feminino') tempo += 5;
  const aliquota = 0.31;
  const sobrevida = expectativaSobrevida(idade);
  return (tempo * aliquota / sobrevida) * (1 + (idade + tempo * aliquota) / 100);
}

function metricasAposDescartarCompetencias(
  entrada: EntradaAposentadoria,
  data: string,
  competencias: Set<string>,
): Metricas {
  if (!competencias.size) return metricasAte(entrada, data);
  const periodos = entrada.periodos.map((periodo) => periodo.tipo === 'rpps_ctc'
    ? periodo
    : {
      ...periodo,
      competenciasExcluidas: [...new Set([...(periodo.competenciasExcluidas ?? []), ...competencias])],
    });
  return metricasAte({ ...entrada, periodos }, data);
}

type LinhaConsolidadaRmi = SalarioMemorialRmi & { valido: boolean };

function salariosParaRmi(
  entrada: EntradaAposentadoria,
  dataBeneficio: string,
): { linhas: LinhaConsolidadaRmi[]; alertas: string[]; pbcFim: string } {
  const pbcFim = mesAnterior(dataBeneficio.slice(0, 7));
  const competenciaBaseFatores = pbcFim < COMPETENCIA_MONETARIA_RMI ? pbcFim : COMPETENCIA_MONETARIA_RMI;
  const fatorBase = FATORES_ATUALIZACAO_RMI[competenciaBaseFatores] ?? 1;
  const grupos = new Map<string, RemuneracaoPrevidenciaria[]>();
  const alertas: string[] = [];
  let remuneracoesRppsIgnoradas = 0;
  let remuneracoesDePeriodosExcluidos = 0;
  const origemComparavel = (origem: string) => origem.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  for (const remuneracao of entrada.remuneracoes ?? []) {
    if (remuneracao.competencia < '1994-07' || remuneracao.competencia > pbcFim) continue;
    const periodoRelacionado = entrada.periodos.find((periodo) => (periodo.sequenciaCnis && remuneracao.sequencia
      ? periodo.sequenciaCnis === remuneracao.sequencia
      : origemComparavel(periodo.origem) === origemComparavel(remuneracao.origem)));
    if (periodoRelacionado && !periodoRelacionado.incluir) {
      remuneracoesDePeriodosExcluidos += 1;
      continue;
    }
    const pertenceAContagemReciproca = entrada.periodos.some((periodo) => periodo.incluir && periodo.tipo === 'rpps_ctc'
      && (periodo.sequenciaCnis && remuneracao.sequencia
        ? periodo.sequenciaCnis === remuneracao.sequencia
        : origemComparavel(periodo.origem) === origemComparavel(remuneracao.origem)));
    if (pertenceAContagemReciproca) {
      remuneracoesRppsIgnoradas += 1;
      continue;
    }
    grupos.set(remuneracao.competencia, [...(grupos.get(remuneracao.competencia) ?? []), remuneracao]);
  }
  if (remuneracoesRppsIgnoradas > 0) {
    alertas.push(`${remuneracoesRppsIgnoradas} remuneração(ões) vinculada(s) a período RPPS/CTC foram excluídas da RMI do RGPS. A CTC pode repercutir no tempo, mas não autoriza somar remuneração de regime próprio à média do INSS.`);
  }
  if (remuneracoesDePeriodosExcluidos > 0) {
    alertas.push(`${remuneracoesDePeriodosExcluidos} remuneração(ões) pertencente(s) a relações desmarcadas foram retiradas do PBC.`);
  }

  if (dataBeneficio > entrada.dataReferencia && (entrada.salarioContribuicaoFuturo ?? 0) > 0) {
    const primeiraFutura = mesSeguinte(entrada.dataReferencia.slice(0, 7));
    for (const competencia of mesesAte(primeiraFutura, pbcFim)) {
      if (grupos.has(competencia)) continue;
      grupos.set(competencia, [{
        id: `projetada-${competencia}`,
        competencia,
        valor: entrada.salarioContribuicaoFuturo ?? SALARIO_MINIMO_RMI,
        origem: 'Contribuição futura projetada',
        indicadores: [],
        incluir: true,
      }]);
    }
  }

  const linhas = [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([competencia, itens]) => {
    const nominalTotal = itens.reduce((total, item) => total + item.valor, 0);
    const itensValidos = itens.filter((item) => item.incluir);
    const nominalValido = itensValidos.reduce((total, item) => total + item.valor, 0);
    const tetoCompetencia = tetoRgpsNaCompetencia(competencia);
    const nominalConsiderado = Math.min(nominalValido, tetoCompetencia);
    const origensValidas = new Set(itensValidos.map((item) => item.origem));
    const fatorAteBaseAtual = FATORES_ATUALIZACAO_RMI[competencia] ?? (competencia >= COMPETENCIA_MONETARIA_RMI ? 1 : Number.NaN);
    const fator = Number.isFinite(fatorAteBaseAtual) ? fatorAteBaseAtual / fatorBase : Number.NaN;
    const valido = nominalValido > 0 && Number.isFinite(fator);
    if (!Number.isFinite(fator)) alertas.push(`Não há fator oficial incorporado para ${competencia}.`);
    const atualizado = valido ? nominalConsiderado * fator : 0;
    return {
      competencia,
      nominal: arredondarMoeda(nominalTotal),
      nominalConsiderado: arredondarMoeda(nominalConsiderado),
      tetoCompetencia,
      quantidadeRemuneracoes: itensValidos.length,
      concomitante: origensValidas.size > 1,
      limitadoAoTeto: nominalValido > tetoCompetencia,
      fatorAtualizacao: Number.isFinite(fator) ? fator : 0,
      atualizado: arredondarMoeda(atualizado),
      incluido: valido,
      valido,
      origem: [...new Set(itens.map((item) => item.origem))].join(' + '),
      indicadores: [...new Set(itens.flatMap((item) => item.indicadores))],
      projetado: itens.every((item) => item.id.startsWith('projetada-')),
    };
  });
  if (linhas.some((linha) => linha.concomitante)) {
    alertas.push('Atividades concomitantes: as remunerações válidas foram somadas em cada competência, limitadas ao teto histórico do RGPS e depois atualizadas monetariamente. O tempo e a carência permaneceram únicos.');
  }
  if (linhas.some((linha) => linha.limitadoAoTeto)) {
    alertas.push('Em competências cuja soma das remunerações superou o limite máximo, o excedente foi retirado antes da atualização monetária.');
  }
  return { linhas, alertas, pbcFim };
}

function tipoRmiDaRegra(regra: ResultadoRegraAposentadoria):
  | 'pre80_fator' | 'pre80_integral' | 'pre80_idade' | 'pre80_proporcional'
  | 'pos60' | 'pos_fator' | 'pos_integral' | 'pcd_tempo' | 'pcd_idade' | 'rural' {
  if (regra.id === 'direito_adquirido_tempo' || regra.id === 'professor_adquirido') return 'pre80_fator';
  if (regra.id === 'direito_adquirido_8696' || regra.id.startsWith('especial') && regra.id.endsWith('_adquirido')) return 'pre80_integral';
  if (regra.id === 'direito_adquirido_idade') return 'pre80_idade';
  if (regra.id === 'direito_adquirido_proporcional') return 'pre80_proporcional';
  if (regra.id === 'pedagio50') return 'pos_fator';
  if (regra.id === 'pedagio100' || regra.id === 'professor_pedagio100') return 'pos_integral';
  if (regra.id.startsWith('pcd_') && regra.id !== 'pcd_idade') return 'pcd_tempo';
  if (regra.id === 'pcd_idade') return 'pcd_idade';
  if (regra.id === 'rural_idade') return 'rural';
  return 'pos60';
}

function calcularRmiDaRegra(
  entrada: EntradaAposentadoria,
  regra: ResultadoRegraAposentadoria,
): CalculoRmiAposentadoria | null {
  if (!regra.dataEstimada || regra.status === 'inaplicavel') return null;
  const data = regra.dataEstimada;
  const tipo = tipoRmiDaRegra(regra);
  const competenciaDib = data.slice(0, 7);
  const competenciaMonetaria = competenciaDib <= COMPETENCIA_MONETARIA_RMI ? competenciaDib : COMPETENCIA_MONETARIA_RMI;
  const pisoNaDib = salarioMinimoNaCompetencia(competenciaMonetaria);
  const tetoNaDib = tetoRgpsNaCompetencia(competenciaMonetaria);
  let metricas = data > entrada.dataReferencia
    ? criarProjetor(entrada)(data)
    : metricasAte(entrada, data);
  if (tipo === 'rural') {
    return {
      disponivel: true, competenciaMonetaria,
      metodo: 'Segurado especial rural sem contribuição facultativa: renda no piso previdenciário.',
      pbcInicio: '1994-07', pbcFim: mesAnterior(data.slice(0, 7)), salariosLocalizados: 0,
      salariosUtilizados: 0, divisor: 0, somaAtualizada: 0, mediaContributiva: pisoNaDib,
      salarioBeneficio: pisoNaDib, coeficiente: 1, fatorPrevidenciario: null,
      rendaCalculada: pisoNaDib, rmiEstimada: pisoNaDib,
      pisoAplicado: true, tetoAplicado: false, salarios: [],
      alertas: ['Se houver contribuições facultativas do segurado especial, compare também o cálculo pela média contributiva.'],
    };
  }

  const { linhas, alertas, pbcFim } = salariosParaRmi(entrada, data);
  const validas = linhas.filter((linha) => linha.valido);
  const possuiConcomitancia = linhas.some((linha) => linha.concomitante);
  if (possuiConcomitancia && data < CORTE_LEI_9876) {
    return {
      disponivel: false, competenciaMonetaria,
      metodo: 'RMI não automatizada: DIB anterior à Lei 9.876/1999 com atividades concomitantes exige a apuração da atividade principal e das atividades secundárias pela redação histórica do art. 32 da Lei 8.213/1991.',
      pbcInicio: '1994-07', pbcFim, salariosLocalizados: validas.length, salariosUtilizados: 0,
      divisor: 0, somaAtualizada: 0, mediaContributiva: 0, salarioBeneficio: 0,
      coeficiente: 0, fatorPrevidenciario: null, rendaCalculada: 0, rmiEstimada: 0,
      pisoAplicado: false, tetoAplicado: false, salarios: linhas,
      alertas: [...new Set([...alertas, 'Não use a soma simples para DIB anterior a 29/11/1999. Faça o cálculo histórico de múltiplas atividades com separação entre atividade principal e secundárias.'])],
    };
  }
  if (possuiConcomitancia && data < CORTE_LEI_13846) {
    alertas.push('Para DIB entre 29/11/1999 e 17/06/2019, a soma das contribuições concomitantes foi aplicada conforme a tese vinculante do Tema 1.070/STJ.');
  }
  const metodoOitenta = ['pre80_fator', 'pre80_integral', 'pre80_idade', 'pre80_proporcional', 'pcd_tempo', 'pcd_idade'].includes(tipo);
  const quantidadeOitenta = Math.max(1, Math.ceil(validas.length * 0.8));
  let selecionadas = metodoOitenta
    ? [...validas].sort((a, b) => b.atualizado - a.atualizado).slice(0, quantidadeOitenta)
    : validas;
  let competenciasDescartadas = new Set<string>();
  let descarteComparado = false;
  const filiadoAntesJulho1994 = entrada.periodos.some((periodo) => periodo.incluir && periodo.inicio < '1994-07-01');

  if (tipo === 'pos60' && data <= entrada.dataReferencia
    && (regra.id === 'idade_transicao' || regra.id === 'programada') && validas.length > 1) {
    descarteComparado = true;
    const minimoAnos = regra.id === 'idade_transicao' || entrada.sexo === 'feminino'
      || entrada.periodos.some((periodo) => periodo.incluir && periodo.inicio <= REFORMA)
      ? 15
      : 20;
    const ordenadasParaDescarte = [...validas].sort((a, b) => a.atualizado - b.atualizado || a.competencia.localeCompare(b.competencia));
    const divisorMinimo = filiadoAntesJulho1994 && data >= '2022-05-05' ? 108 : 0;
    const avaliar = (salarios: LinhaConsolidadaRmi[], metricasCandidatas: Metricas) => {
      const divisorCandidato = Math.max(salarios.length, divisorMinimo);
      if (!divisorCandidato) return 0;
      const mediaCandidata = salarios.reduce((total, salario) => total + salario.atualizado, 0) / divisorCandidato;
      const limiteCoeficiente = entrada.sexo === 'feminino' ? 15 : 20;
      const coeficienteCandidato = 0.6 + Math.max(0, Math.floor(metricasCandidatas.comum / 365 - limiteCoeficiente)) * 0.02;
      return Math.min(tetoNaDib, Math.max(pisoNaDib, mediaCandidata * coeficienteCandidato));
    };
    let melhorRenda = avaliar(validas, metricas);
    let melhorSalarios = validas;
    let melhoresMetricas = metricas;
    const candidatasDescartadas = new Set<string>();
    for (const candidata of ordenadasParaDescarte) {
      candidatasDescartadas.add(candidata.competencia);
      const metricasCandidatas = metricasAposDescartarCompetencias(entrada, data, candidatasDescartadas);
      if (metricasCandidatas.comum < anosEmDias(minimoAnos) || metricasCandidatas.carencia < 180) break;
      const restantes = validas.filter((salario) => !candidatasDescartadas.has(salario.competencia));
      const rendaCandidata = avaliar(restantes, metricasCandidatas);
      if (rendaCandidata > melhorRenda + 0.005) {
        melhorRenda = rendaCandidata;
        melhorSalarios = restantes;
        melhoresMetricas = metricasCandidatas;
        competenciasDescartadas = new Set(candidatasDescartadas);
      }
    }
    selecionadas = melhorSalarios;
    metricas = melhoresMetricas;
    if (competenciasDescartadas.size) {
      alertas.push(`Aplicado o descarte seletivo do art. 26, § 6º, da EC 103/2019: ${competenciasDescartadas.size} competência(s) de menor contribuição foram excluídas da média e do tempo utilizado nesta regra.`);
    }
  }
  const chavesSelecionadas = new Set(selecionadas.map((linha) => linha.competencia));
  for (const linha of linhas) linha.incluido = linha.valido && chavesSelecionadas.has(linha.competencia);

  let divisor = selecionadas.length;
  if (metodoOitenta && filiadoAntesJulho1994) {
    divisor = Math.max(divisor, Math.ceil(mesesEntreCompetencias('1994-07-01', `${pbcFim}-01`) * 0.6));
    alertas.push('Aplicado o divisor mínimo da regra de transição da Lei 9.876/1999 ao filiado anterior a julho de 1994.');
  } else if (!metodoOitenta && filiadoAntesJulho1994 && data >= '2022-05-05') {
    divisor = Math.max(divisor, 108);
    alertas.push('Aplicado o divisor mínimo de 108 meses da Lei 14.331/2022.');
  }

  const soma = selecionadas.reduce((total, linha) => total + linha.atualizado, 0);
  if (!selecionadas.length || divisor <= 0) {
    return {
      disponivel: false, competenciaMonetaria,
      metodo: 'RMI não calculada por ausência de salários de contribuição válidos no PBC.',
      pbcInicio: '1994-07', pbcFim, salariosLocalizados: linhas.length, salariosUtilizados: 0,
      divisor: 0, somaAtualizada: 0, mediaContributiva: 0, salarioBeneficio: 0,
      coeficiente: 0, fatorPrevidenciario: null, rendaCalculada: 0, rmiEstimada: 0,
      pisoAplicado: false, tetoAplicado: false, salarios: linhas,
      alertas: [...new Set([...alertas, 'Inclua ou confira as remunerações do CNIS para estimar a RMI.'])],
    };
  }

  const media = soma / divisor;
  const professor = regra.grupo === 'Professor';
  const fatorCalculado = calcularFatorPrevidenciario(entrada, data, professor ? metricas.professor : metricas.comum, professor);
  let fator: number | null = null;
  let coeficiente = 1;
  let metodo = '';

  if (tipo === 'pre80_fator' || tipo === 'pos_fator') {
    fator = fatorCalculado;
    coeficiente = fator;
    metodo = tipo === 'pos_fator'
      ? 'Média de 100% dos salários, multiplicada pelo fator previdenciário (pedágio de 50%).'
      : 'Média dos 80% maiores salários, multiplicada pelo fator previdenciário.';
  } else if (tipo === 'pre80_idade' || tipo === 'pcd_idade') {
    coeficiente = Math.min(1, 0.7 + Math.floor(metricas.carencia / 12) * 0.01);
    fator = fatorCalculado > 1 ? fatorCalculado : null;
    if (fator) coeficiente *= fator;
    metodo = 'Média dos 80% maiores salários × 70% + 1% por grupo de 12 contribuições; fator apenas se favorável.';
  } else if (tipo === 'pre80_proporcional') {
    const base = entrada.sexo === 'feminino' ? 25 : 30;
    coeficiente = Math.min(1, 0.7 + Math.max(0, Math.floor(metricas.comum / 365 - base)) * 0.05);
    fator = fatorCalculado;
    coeficiente *= fator;
    metodo = 'Média dos 80% maiores salários × coeficiente proporcional da EC 20/1998 × fator previdenciário.';
  } else if (tipo === 'pcd_tempo') {
    fator = fatorCalculado > 1 ? fatorCalculado : null;
    coeficiente = fator ?? 1;
    metodo = '100% da média dos 80% maiores salários; fator previdenciário somente se favorável.';
  } else if (tipo === 'pos60') {
    const anos = metricas.comum / 365;
    const limite = entrada.sexo === 'feminino' || regra.id.includes('especial15') ? 15 : 20;
    coeficiente = 0.6 + Math.max(0, Math.floor(anos - limite)) * 0.02;
    metodo = `Média de 100% dos salários × 60% + 2% por ano completo acima de ${limite} anos.`;
  } else {
    metodo = metodoOitenta ? '100% da média dos 80% maiores salários.' : '100% da média de todos os salários.';
  }

  const salarioBeneficio = tipo === 'pre80_fator' ? media * (fator ?? 1) : media;
  const rendaCalculada = tipo === 'pre80_fator' ? salarioBeneficio : media * coeficiente;
  const rmi = Math.min(tetoNaDib, Math.max(pisoNaDib, rendaCalculada));
  if ((entrada.remuneracoes ?? []).length && validas.length < metricas.carencia * 0.8) {
    alertas.push('Há lacunas relevantes entre a carência apurada e as remunerações localizadas; confira salários ausentes no CNIS.');
  }
  if (data > entrada.dataReferencia) {
    alertas.push(`Projeção futura em valores reais de ${COMPETENCIA_MONETARIA_RMI}, usando contribuição mensal de R$ ${(entrada.salarioContribuicaoFuturo ?? SALARIO_MINIMO_RMI).toFixed(2)}.`);
  }
  if (descarteComparado && !competenciasDescartadas.size) {
    alertas.push('O descarte seletivo do art. 26, § 6º, da EC 103/2019 foi comparado, mas não aumentou a RMI desta regra ou retiraria tempo/carência necessários.');
  }

  return {
    disponivel: true,
    competenciaMonetaria,
    metodo,
    pbcInicio: '1994-07',
    pbcFim,
    salariosLocalizados: validas.length,
    salariosUtilizados: selecionadas.length,
    divisor,
    somaAtualizada: arredondarMoeda(soma),
    mediaContributiva: arredondarMoeda(media),
    salarioBeneficio: arredondarMoeda(salarioBeneficio),
    coeficiente,
    fatorPrevidenciario: fator,
    rendaCalculada: arredondarMoeda(rendaCalculada),
    rmiEstimada: arredondarMoeda(rmi),
    pisoAplicado: rendaCalculada < pisoNaDib,
    tetoAplicado: rendaCalculada > tetoNaDib,
    descarteAplicado: competenciasDescartadas.size > 0,
    competenciasDescartadas: competenciasDescartadas.size,
    tempoAposDescarteDias: metricas.comum,
    carenciaAposDescarte: metricas.carencia,
    salarios: linhas,
    alertas: [...new Set(alertas)],
  };
}

function montarMemorialPeriodos(entrada: EntradaAposentadoria): MemorialPeriodoAposentadoria[] {
  return entrada.periodos.map((periodo) => {
    const diasOriginais = periodo.incluir ? contarIntervalos(limitarIntervalos([periodo], entrada.dataReferencia)) : 0;
    const especial = periodo.tipo.startsWith('especial');
    const fator = especial ? fatorEspecialParaComum(periodo.tipo, entrada.sexo) : 1;
    const diasAntesReforma = especial && periodo.incluir
      ? contarIntervalos(limitarIntervalos([periodo], entrada.dataReferencia < REFORMA ? entrada.dataReferencia : REFORMA))
      : 0;
    const diasConvertidos = Math.round(diasOriginais + diasAntesReforma * (fator - 1));
    return {
      id: periodo.id,
      origem: periodo.origem,
      inicio: periodo.inicio,
      fim: periodo.fim,
      tipo: periodo.tipo,
      diasOriginais,
      fatorConversao: fator,
      diasConvertidos,
      limiteConversao: especial ? REFORMA : null,
      carenciaMeses: competenciasDeCarencia([periodo], entrada.dataReferencia).size,
      indicadores: periodo.indicadores,
      incluido: periodo.incluir,
    };
  });
}

export function calcularAposentadoria(entrada: EntradaAposentadoria): ResultadoAposentadoria {
  const atual = metricasAte(entrada, entrada.dataReferencia);
  const naReforma = metricasAte(entrada, REFORMA);
  const naEc20 = metricasAte(entrada, CORTE_EC20);
  const projetar = criarProjetor(entrada);
  const mulher = entrada.sexo === 'feminino';
  const filiadoAntesReforma = entrada.periodos.some((periodo) => periodo.incluir && periodo.inicio <= REFORMA);
  const filiadoAntesEc20 = entrada.periodos.some((periodo) => periodo.incluir && periodo.inicio <= CORTE_EC20);
  const alvoComum = mulher ? 30 : 35;
  const alvoProfessor = mulher ? 25 : 30;
  const mesesIdadeProgramada = (mulher ? 62 : 65) * 12;
  const temProfessor = atual.professor > 0 || entrada.atividadeFutura === 'professor';
  const temEspecial = atual.especial25 > 0 || entrada.atividadeFutura.startsWith('especial');
  const temPcd = atual.pcdReal > 0 || entrada.atividadeFutura.startsWith('pcd_');
  const temRural = atual.rural > 0 || entrada.atividadeFutura === 'rural';
  const regras: ResultadoRegraAposentadoria[] = [];
  const primeiroPeriodo = entrada.periodos.filter((periodo) => periodo.incluir).map((periodo) => periodo.inicio).sort()[0] ?? entrada.nascimento;
  const localizarDireitoAteReforma = (
    atende: (data: string, metricas: Metricas) => boolean,
    inicio = primeiroPeriodo,
  ): string => {
    for (let cursor = epoch(inicio); cursor <= epoch(REFORMA); cursor += 1) {
      const data = iso(cursor);
      if (atende(data, metricasAte(entrada, data))) return data;
    }
    return REFORMA;
  };

  if (naReforma.comum >= anosEmDias(alvoComum) && naReforma.carencia >= 180) {
    const dataDireitoTempo = localizarDireitoAteReforma((_data, m) => m.comum >= anosEmDias(alvoComum) && m.carencia >= 180);
    regras.push(resultadoAdquirido({
      id: 'direito_adquirido_tempo', nome: 'Direito adquirido por tempo de contribuição', grupo: 'Urbana',
      requisitos: [`${alvoComum} anos de contribuição até 13/11/2019`, '180 meses de carência'],
      fundamento: 'Lei 8.213/1991 e art. 3º da EC 103/2019',
      observacoes: ['O valor pode sofrer fator previdenciário, salvo regra de pontos mais favorável.'],
    }, dataDireitoTempo));

    const pontosAntigos = idadeFracionada(entrada.nascimento, REFORMA) + naReforma.comum / 365.2425;
    if (pontosAntigos >= (mulher ? 86 : 96)) {
      const dataDireitoPontos = localizarDireitoAteReforma((data, m) => {
        const exigidos = data < '2018-12-31' ? (mulher ? 85 : 95) : (mulher ? 86 : 96);
        return m.comum >= anosEmDias(alvoComum)
          && m.carencia >= 180
          && idadeFracionada(entrada.nascimento, data) + m.comum / 365.2425 >= exigidos;
      }, '2015-06-18');
      regras.push(resultadoAdquirido({
        id: 'direito_adquirido_8696', nome: 'Direito adquirido pela fórmula 86/96 progressiva', grupo: 'Urbana',
        requisitos: [`${alvoComum} anos de contribuição`, `${mulher ? 86 : 96} pontos em 2019`, '180 meses de carência'],
        fundamento: 'Art. 29-C da Lei 8.213/1991 e art. 3º da EC 103/2019',
        observacoes: ['A fórmula afasta o fator previdenciário na apuração do valor, quando preenchidos os requisitos.'],
      }, dataDireitoPontos));
    }
  }

  if (atingiuIdade(entrada.nascimento, REFORMA, (mulher ? 60 : 65) * 12)
    && naReforma.comum >= anosEmDias(15) && naReforma.carencia >= 180) {
    const dataDireitoIdade = localizarDireitoAteReforma((data, m) => atingiuIdade(entrada.nascimento, data, (mulher ? 60 : 65) * 12)
      && m.comum >= anosEmDias(15) && m.carencia >= 180);
    regras.push(resultadoAdquirido({
      id: 'direito_adquirido_idade', nome: 'Direito adquirido à aposentadoria por idade urbana', grupo: 'Urbana',
      requisitos: [`${mulher ? 60 : 65} anos de idade até 13/11/2019`, '15 anos de contribuição', '180 meses de carência'],
      fundamento: 'Art. 48 da Lei 8.213/1991 e art. 3º da EC 103/2019',
      observacoes: [],
    }, dataDireitoIdade));
  }

  if (filiadoAntesEc20) {
    const alvoProporcional = mulher ? 25 : 30;
    const pedagio = Math.max(0, anosEmDias(alvoProporcional) - naEc20.comum) * 0.4;
    const idadeMin = mulher ? 48 : 53;
    if (naReforma.comum >= anosEmDias(alvoProporcional) + pedagio
      && atingiuIdade(entrada.nascimento, REFORMA, idadeMin * 12)
      && naReforma.carencia >= 180) {
      const dataDireitoProporcional = localizarDireitoAteReforma((data, m) => m.comum >= anosEmDias(alvoProporcional) + pedagio
        && atingiuIdade(entrada.nascimento, data, idadeMin * 12) && m.carencia >= 180, CORTE_EC20);
      regras.push(resultadoAdquirido({
        id: 'direito_adquirido_proporcional', nome: 'Direito adquirido à aposentadoria proporcional', grupo: 'Urbana',
        requisitos: [`${idadeMin} anos de idade`, `${alvoProporcional} anos + pedágio de 40% apurado em 16/12/1998`, '180 meses de carência'],
        fundamento: 'Art. 9º da EC 20/1998 e art. 3º da EC 103/2019',
        observacoes: ['A renda proporcional e o fator previdenciário precisam ser comparados com as demais regras.'],
      }, dataDireitoProporcional));
    }
  }

  const definicoes: DefinicaoRegra[] = [
    {
      id: 'idade_transicao', nome: 'Aposentadoria por idade - transição', grupo: 'Urbana',
      aplicavel: filiadoAntesReforma,
      motivoInaplicavel: 'Exige filiação ao RGPS até 13/11/2019.',
      requisitos: [`${mulher ? 62 : 65} anos de idade`, '15 anos de contribuição', '180 meses de carência'],
      fundamento: 'Art. 18 da EC 103/2019', observacoes: [],
      atende: (data, m) => atingiuIdade(entrada.nascimento, data, mesesIdadeProgramada)
        && m.comum >= anosEmDias(15) && m.carencia >= 180,
    },
    {
      id: 'pontos', nome: 'Regra de transição por pontos', grupo: 'Urbana',
      aplicavel: filiadoAntesReforma,
      motivoInaplicavel: 'Exige filiação ao RGPS até 13/11/2019.',
      requisitos: [`${alvoComum} anos de contribuição`, 'Pontuação progressiva (idade + contribuição)', '180 meses de carência'],
      fundamento: 'Art. 15 da EC 103/2019', observacoes: ['Em 2026, exige 93 pontos para mulher e 103 para homem.'],
      atende: (data, m) => {
        const pontos = Math.min(mulher ? 100 : 105, (mulher ? 86 : 96) + (Number(data.slice(0, 4)) - 2019));
        return m.comum >= anosEmDias(alvoComum) && idadeFracionada(entrada.nascimento, data) + m.comum / 365.2425 >= pontos && m.carencia >= 180;
      },
    },
    {
      id: 'idade_progressiva', nome: 'Regra de transição por idade progressiva', grupo: 'Urbana',
      aplicavel: filiadoAntesReforma, motivoInaplicavel: 'Exige filiação ao RGPS até 13/11/2019.',
      requisitos: [`${alvoComum} anos de contribuição`, 'Idade mínima progressiva', '180 meses de carência'],
      fundamento: 'Art. 16 da EC 103/2019', observacoes: ['Em 2026, exige 59 anos e 6 meses para mulher e 64 anos e 6 meses para homem.'],
      atende: (data, m) => {
        const meses = Math.min((mulher ? 62 : 65) * 12, (mulher ? 56 : 61) * 12 + Math.max(0, Number(data.slice(0, 4)) - 2019) * 6);
        return m.comum >= anosEmDias(alvoComum) && atingiuIdade(entrada.nascimento, data, meses) && m.carencia >= 180;
      },
    },
    {
      id: 'pedagio50', nome: 'Regra de transição com pedágio de 50%', grupo: 'Urbana',
      aplicavel: filiadoAntesReforma && naReforma.comum > anosEmDias(mulher ? 28 : 33),
      motivoInaplicavel: `Em 13/11/2019 era necessário ter mais de ${mulher ? 28 : 33} anos de contribuição.`,
      requisitos: [`${alvoComum} anos + 50% do tempo que faltava em 13/11/2019`, '180 meses de carência'],
      fundamento: 'Art. 17 da EC 103/2019', observacoes: ['A renda usa a média multiplicada pelo fator previdenciário.'],
      atende: (_data, m) => m.comum >= anosEmDias(alvoComum) + Math.max(0, anosEmDias(alvoComum) - naReforma.comum) * 0.5 && m.carencia >= 180,
    },
    {
      id: 'pedagio100', nome: 'Regra de transição com pedágio de 100%', grupo: 'Urbana',
      aplicavel: filiadoAntesReforma, motivoInaplicavel: 'Exige filiação ao RGPS até 13/11/2019.',
      requisitos: [`${mulher ? 57 : 60} anos de idade`, `${alvoComum} anos + 100% do tempo que faltava em 13/11/2019`, '180 meses de carência'],
      fundamento: 'Art. 20 da EC 103/2019', observacoes: ['A renda corresponde a 100% da média contributiva, respeitados os limites legais.'],
      atende: (data, m) => atingiuIdade(entrada.nascimento, data, (mulher ? 57 : 60) * 12)
        && m.comum >= anosEmDias(alvoComum) + Math.max(0, anosEmDias(alvoComum) - naReforma.comum)
        && m.carencia >= 180,
    },
    {
      id: 'programada', nome: 'Aposentadoria programada', grupo: 'Urbana',
      requisitos: [`${mulher ? 62 : 65} anos de idade`, `${mulher || filiadoAntesReforma ? 15 : 20} anos de contribuição`, '180 meses de carência'],
      fundamento: 'Art. 19 da EC 103/2019', observacoes: [],
      atende: (data, m) => atingiuIdade(entrada.nascimento, data, mesesIdadeProgramada)
        && m.comum >= anosEmDias(mulher || filiadoAntesReforma ? 15 : 20) && m.carencia >= 180,
    },
  ];

  if (temProfessor) {
    if (naReforma.professor >= anosEmDias(alvoProfessor) && naReforma.carencia >= 180) {
      const dataProfessor = localizarDireitoAteReforma((_data, m) => m.professor >= anosEmDias(alvoProfessor) && m.carencia >= 180);
      regras.push(resultadoAdquirido({
        id: 'professor_adquirido', nome: 'Professor - direito adquirido', grupo: 'Professor',
        requisitos: [`${alvoProfessor} anos exclusivamente em magistério na educação básica`, '180 meses de carência'],
        fundamento: 'Art. 201, § 8º, da Constituição e art. 3º da EC 103/2019', observacoes: [],
      }, dataProfessor));
    }
    definicoes.push(
      {
        id: 'professor_pontos', nome: 'Professor - transição por pontos', grupo: 'Professor', aplicavel: filiadoAntesReforma,
        requisitos: [`${alvoProfessor} anos de magistério`, 'Pontuação progressiva', '180 meses de carência'],
        fundamento: 'Art. 15, § 3º, da EC 103/2019', observacoes: [],
        atende: (data, m) => {
          const pontos = Math.min(mulher ? 92 : 100, (mulher ? 81 : 91) + (Number(data.slice(0, 4)) - 2019));
          return m.professor >= anosEmDias(alvoProfessor) && idadeFracionada(entrada.nascimento, data) + m.professor / 365.2425 >= pontos && m.carencia >= 180;
        },
      },
      {
        id: 'professor_idade', nome: 'Professor - transição por idade progressiva', grupo: 'Professor', aplicavel: filiadoAntesReforma,
        requisitos: [`${alvoProfessor} anos de magistério`, 'Idade progressiva', '180 meses de carência'],
        fundamento: 'Art. 16, § 2º, da EC 103/2019', observacoes: [],
        atende: (data, m) => {
          const meses = Math.min((mulher ? 57 : 60) * 12, (mulher ? 51 : 56) * 12 + Math.max(0, Number(data.slice(0, 4)) - 2019) * 6);
          return m.professor >= anosEmDias(alvoProfessor) && atingiuIdade(entrada.nascimento, data, meses) && m.carencia >= 180;
        },
      },
      {
        id: 'professor_pedagio100', nome: 'Professor - pedágio de 100%', grupo: 'Professor', aplicavel: filiadoAntesReforma,
        requisitos: [`${mulher ? 52 : 55} anos de idade`, `${alvoProfessor} anos + pedágio integral`, '180 meses de carência'],
        fundamento: 'Art. 20, § 1º, da EC 103/2019', observacoes: [],
        atende: (data, m) => atingiuIdade(entrada.nascimento, data, (mulher ? 52 : 55) * 12)
          && m.professor >= anosEmDias(alvoProfessor) + Math.max(0, anosEmDias(alvoProfessor) - naReforma.professor)
          && m.carencia >= 180,
      },
      {
        id: 'professor_programada', nome: 'Professor - regra programada', grupo: 'Professor',
        requisitos: [`${mulher ? 57 : 60} anos de idade`, '25 anos exclusivamente em magistério na educação básica', '180 meses de carência'],
        fundamento: 'Art. 19, § 1º, II, da EC 103/2019', observacoes: [],
        atende: (data, m) => atingiuIdade(entrada.nascimento, data, (mulher ? 57 : 60) * 12)
          && m.professor >= anosEmDias(25) && m.carencia >= 180,
      },
    );
  }

  if (temEspecial) {
    const cenarios = [15, 20, 25] as const;
    for (const alvo of cenarios) {
      const chave = `especial${alvo}` as const;
      if (naReforma[chave] >= anosEmDias(alvo) && naReforma.carencia >= 180) {
        const dataEspecial = localizarDireitoAteReforma((_data, m) => m[chave] >= anosEmDias(alvo) && m.carencia >= 180);
        regras.push(resultadoAdquirido({
          id: `especial${alvo}_adquirido`, nome: `Especial de ${alvo} anos - direito adquirido`, grupo: 'Especial',
          requisitos: [`${alvo} anos de exposição efetiva`, '180 meses de carência'],
          fundamento: 'Arts. 57 e 58 da Lei 8.213/1991 e art. 3º da EC 103/2019',
          observacoes: ['O reconhecimento depende de PPP/LTCAT e enquadramento técnico do período.'],
        }, dataEspecial));
      }
      definicoes.push(
        {
          id: `especial${alvo}_transicao`, nome: `Especial de ${alvo} anos - transição por pontos`, grupo: 'Especial',
          aplicavel: filiadoAntesReforma, requisitos: [`${alvo} anos de exposição`, `${alvo === 15 ? 66 : alvo === 20 ? 76 : 86} pontos`, '180 meses de carência'],
          fundamento: 'Art. 21 da EC 103/2019', observacoes: ['Os pontos somam idade e todo o tempo de contribuição, não apenas o especial.'],
          atende: (data, m) => m[chave] >= anosEmDias(alvo)
            && idadeFracionada(entrada.nascimento, data) + m.comum / 365.2425 >= (alvo === 15 ? 66 : alvo === 20 ? 76 : 86)
            && m.carencia >= 180,
        },
        {
          id: `especial${alvo}_permanente`, nome: `Especial de ${alvo} anos - regra pós-ADI 6309`, grupo: 'Especial',
          requisitos: [`${alvo} anos de exposição efetiva`, '180 meses de carência', 'Sem idade mínima após a ADI 6309'],
          fundamento: 'Art. 19, § 1º, I, da EC 103/2019, com a ADI 6309/STF (junho de 2026)',
          observacoes: ['A vedação de conversão do tempo especial posterior a 13/11/2019 foi mantida.', 'O enquadramento depende de PPP/LTCAT.'],
          atende: (_data, m) => m[chave] >= anosEmDias(alvo) && m.carencia >= 180,
        },
      );
    }
  }

  if (temPcd) {
    const reqPcd = mulher ? { leve: 28, moderada: 24, grave: 20 } : { leve: 33, moderada: 29, grave: 25 };
    for (const grau of ['grave', 'moderada', 'leve'] as const) {
      const chave = grau === 'leve' ? 'pcdLeve' : grau === 'moderada' ? 'pcdModerada' : 'pcdGrave';
      definicoes.push({
        id: `pcd_${grau}`, nome: `Pessoa com deficiência - grau ${grau}`, grupo: 'Pessoa com deficiência',
        requisitos: [`${reqPcd[grau]} anos equivalentes conforme o grau`, '180 meses de carência'],
        fundamento: 'Lei Complementar 142/2013', observacoes: ['A data de início e o grau dependem de avaliação biopsicossocial do INSS.'],
        atende: (_data, m) => m[chave] >= anosEmDias(reqPcd[grau]) && m.carencia >= 180,
      });
    }
    definicoes.push({
      id: 'pcd_idade', nome: 'Pessoa com deficiência - aposentadoria por idade', grupo: 'Pessoa com deficiência',
      requisitos: [`${mulher ? 55 : 60} anos de idade`, '15 anos na condição de pessoa com deficiência', '180 meses de carência'],
      fundamento: 'Art. 3º, IV, da Lei Complementar 142/2013', observacoes: ['A deficiência e o período são confirmados em avaliação do INSS.'],
      atende: (data, m) => atingiuIdade(entrada.nascimento, data, (mulher ? 55 : 60) * 12)
        && m.pcdReal >= anosEmDias(15) && m.carencia >= 180,
    });
  }

  if (temRural) {
    definicoes.push({
      id: 'rural_idade', nome: 'Aposentadoria rural por idade', grupo: 'Rural',
      requisitos: [`${mulher ? 55 : 60} anos de idade`, '180 meses de atividade rural comprovada'],
      fundamento: 'Arts. 39, 48 e 142 da Lei 8.213/1991',
      observacoes: ['O CNIS não substitui autodeclaração rural nem início de prova material.'],
      atende: (data, m) => atingiuIdade(entrada.nascimento, data, (mulher ? 55 : 60) * 12)
        && m.rural >= anosEmDias(15),
    });
  }

  regras.push(...definicoes.map((regra) => projetarRegra(entrada, regra, projetar)));
  for (const regra of regras) regra.rmi = calcularRmiDaRegra(entrada, regra);
  const ordemStatus: Record<StatusRegraAposentadoria, number> = { direito_adquirido: 0, cumprido: 1, projetado: 2, inaplicavel: 3 };
  regras.sort((a, b) => ordemStatus[a.status] - ordemStatus[b.status]
    || (a.dataEstimada ?? '9999').localeCompare(b.dataEstimada ?? '9999')
    || a.nome.localeCompare(b.nome));

  const alertas = entrada.periodos.flatMap((periodo) => {
    if (!periodo.incluir || !periodo.indicadores.length) return [];
    if (periodo.indicadores.includes('POSSIVEL-RPPS')) {
      return [`ATENÇÃO: ${periodo.origem} foi incluído como atividade comum, mas o regime previdenciário não foi identificado. O tempo e a carência desse vínculo estão alterando o resultado; confirme RGPS ou CTC antes de utilizar a simulação.`];
    }
    return [`${periodo.origem}: confira os indicadores ${periodo.indicadores.join(', ')}.`];
  });
  if (entrada.periodos.some((periodo) => periodo.incluir && periodo.tipo.startsWith('especial'))) {
    alertas.push('Período especial foi classificado manualmente. Confirme agente, intensidade, técnica de medição, EPI e PPP/LTCAT.');
  }
  if (entrada.periodos.some((periodo) => periodo.incluir && periodo.tipo.startsWith('pcd_'))) {
    alertas.push('O grau e a duração da deficiência somente são confirmados pela avaliação biopsicossocial do INSS.');
  }
  if (!(entrada.remuneracoes ?? []).length) {
    alertas.push('A RMI depende das remunerações por competência. Sem elas, o relatório mostra apenas tempo, carência e regras de acesso.');
  }

  const marcos: Array<{ data: string; rotulo: string }> = [
    { data: CORTE_EC20, rotulo: 'EC 20/1998' },
    { data: CORTE_LEI_9876, rotulo: 'Lei 9.876/1999' },
    { data: REFORMA, rotulo: 'EC 103/2019' },
    { data: entrada.dataReferencia, rotulo: 'Data de referência' },
  ];
  const memorialMarcos = marcos.map((marco) => {
    const metricas = metricasAte(entrada, marco.data);
    return {
      ...marco,
      tempoComumDias: metricas.comum,
      carenciaMeses: metricas.carencia,
      idadeAnos: Math.max(0, idadeFracionada(entrada.nascimento, marco.data)),
    };
  });

  return {
    dataReferencia: entrada.dataReferencia,
    tempoComumDias: atual.comum,
    tempoProfessorDias: atual.professor,
    tempoEspecial: { '15': atual.especial15, '20': atual.especial20, '25': atual.especial25 },
    tempoPcdDias: atual.pcdReal,
    tempoRuralDias: atual.rural,
    carenciaMeses: atual.carencia,
    regras,
    memorialPeriodos: montarMemorialPeriodos(entrada),
    memorialMarcos,
    alertas: [...new Set(alertas)],
  };
}
