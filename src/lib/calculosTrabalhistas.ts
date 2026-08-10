import { calcularInss2026, calcularIrrf2026, calcularRescisao } from './calculoRescisao';

export type ValoresCalculadora = Record<string, string>;

export type CampoCalculadora = {
  chave: string;
  rotulo: string;
  tipo: 'moeda' | 'numero' | 'select' | 'data' | 'hora' | 'checkbox';
  padrao?: string;
  placeholder?: string;
  ajuda?: string;
  minimo?: number;
  maximo?: number;
  passo?: number;
  obrigatorio?: boolean;
  opcoes?: Array<{ valor: string; rotulo: string }>;
  mostrarSe?: { chave: string; valor: string };
};

export type LinhaResultadoGenerico = {
  rotulo: string;
  valor: number | string;
  formato?: 'moeda' | 'numero' | 'texto' | 'duracao';
  detalhe?: string;
};

export type ResultadoGenerico = {
  tituloTotal: string;
  total: number;
  formatoTotal?: 'moeda' | 'numero' | 'texto' | 'duracao';
  linhas: LinhaResultadoGenerico[];
  notas: string[];
};

export type MotorCalculadora = {
  campos: CampoCalculadora[];
  validar?: (valores: ValoresCalculadora) => string[];
  calcular: (valores: ValoresCalculadora) => ResultadoGenerico;
};

const DIA = 86_400_000;

function arredondar(valor: number): number {
  return Math.round((valor + 1e-9) * 100) / 100;
}

function n(valores: ValoresCalculadora, chave: string): number {
  const valor = valores[chave] ?? '';
  const limpo = valor.replace(/\s|R\$/gi, '');
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? Math.max(0, numero) : 0;
}

function data(valor: string): Date {
  const [ano, mes, dia] = valor.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

function iso(valor: Date): string {
  return valor.toISOString().slice(0, 10);
}

function adicionarMeses(valor: Date, meses: number): Date {
  const copia = new Date(valor);
  const diaOriginal = copia.getUTCDate();
  copia.setUTCDate(1);
  copia.setUTCMonth(copia.getUTCMonth() + meses);
  const ultimo = new Date(Date.UTC(copia.getUTCFullYear(), copia.getUTCMonth() + 1, 0)).getUTCDate();
  copia.setUTCDate(Math.min(diaOriginal, ultimo));
  return copia;
}

function diasEntre(inicio: Date, fim: Date): number {
  return Math.max(0, Math.floor((fim.getTime() - inicio.getTime()) / DIA));
}

function mesesEquivalentes(inicio: Date, fim: Date): number {
  if (fim <= inicio) return 0;
  let cursor = new Date(inicio);
  let mesesCompletos = 0;
  while (mesesCompletos < 1_200) {
    const proximo = adicionarMeses(cursor, 1);
    if (proximo > fim) break;
    cursor = proximo;
    mesesCompletos += 1;
  }
  return mesesCompletos + diasEntre(cursor, fim) / 30.4375;
}

function anosCompletos(inicio: Date, fim: Date): number {
  let anos = fim.getUTCFullYear() - inicio.getUTCFullYear();
  const aniversario = new Date(Date.UTC(
    fim.getUTCFullYear(),
    inicio.getUTCMonth(),
    Math.min(
      inicio.getUTCDate(),
      new Date(Date.UTC(fim.getUTCFullYear(), inicio.getUTCMonth() + 1, 0)).getUTCDate(),
    ),
  ));
  if (aniversario > fim) anos -= 1;
  return Math.max(0, anos);
}

function divisorPorJornada(jornada: number): number {
  return jornada * 5;
}

function minutosDoHorario(valor: string): number {
  const correspondencia = /^(\d{2}):(\d{2})$/.exec(valor);
  if (!correspondencia) return Number.NaN;
  const horas = Number(correspondencia[1]);
  const minutos = Number(correspondencia[2]);
  if (horas > 23 || minutos > 59) return Number.NaN;
  return horas * 60 + minutos;
}

function periodoDaJornada(valores: ValoresCalculadora) {
  const entrada = minutosDoHorario(valores.entrada ?? '');
  const saidaOriginal = minutosDoHorario(valores.saida ?? '');
  const saida = saidaOriginal <= entrada ? saidaOriginal + 24 * 60 : saidaOriginal;
  let intervaloInicio = minutosDoHorario(valores.intervaloInicio ?? '');
  let intervaloFim = minutosDoHorario(valores.intervaloFim ?? '');

  if (Number.isFinite(intervaloInicio) && intervaloInicio < entrada) intervaloInicio += 24 * 60;
  if (Number.isFinite(intervaloFim) && intervaloFim <= intervaloInicio) intervaloFim += 24 * 60;

  return { entrada, saida, intervaloInicio, intervaloFim };
}

function reflexos(valorHabitual: number) {
  const decimo = arredondar(valorHabitual / 12);
  const ferias = arredondar((valorHabitual / 12) * (4 / 3));
  const fgts = arredondar((valorHabitual + decimo) * 0.08);
  return { decimo, ferias, fgts };
}

const jornada: CampoCalculadora = {
  chave: 'jornada',
  rotulo: 'Jornada semanal',
  tipo: 'select',
  padrao: '44',
  opcoes: [
    { valor: '44', rotulo: '44 horas — divisor 220' },
    { valor: '40', rotulo: '40 horas — divisor 200' },
    { valor: '36', rotulo: '36 horas — divisor 180' },
    { valor: '30', rotulo: '30 horas — divisor 150' },
  ],
};

const salario: CampoCalculadora = {
  chave: 'salario',
  rotulo: 'Salário bruto mensal',
  tipo: 'moeda',
  placeholder: '0,00',
  obrigatorio: true,
};

function resultadoAdicional(
  tituloTotal: string,
  adicionalMensal: number,
  meses: number,
  linhaBase: LinhaResultadoGenerico[],
): ResultadoGenerico {
  const totalPeriodo = arredondar(adicionalMensal * meses);
  const decimo = arredondar((adicionalMensal * meses) / 12);
  const ferias = arredondar(((adicionalMensal * meses) / 12) * (4 / 3));
  const fgts = arredondar((totalPeriodo + decimo) * 0.08);
  return {
    tituloTotal,
    total: arredondar(totalPeriodo + decimo + ferias + fgts),
    linhas: [
      ...linhaBase,
      { rotulo: 'Adicional no período', valor: totalPeriodo },
      { rotulo: 'Reflexo estimado no 13º', valor: decimo },
      { rotulo: 'Reflexo estimado em férias + 1/3', valor: ferias },
      { rotulo: 'FGTS estimado', valor: fgts },
    ],
    notas: ['Reflexos são provisões matemáticas e dependem de habitualidade e do período efetivamente reconhecido.'],
  };
}

export const MOTORES: Record<string, MotorCalculadora> = {
  horas_extras: {
    campos: [
      salario,
      jornada,
      { chave: 'horas50', rotulo: 'Horas extras a 50%', tipo: 'numero', padrao: '0', minimo: 0, passo: 0.25 },
      { chave: 'horas100', rotulo: 'Horas extras a 100%', tipo: 'numero', padrao: '0', minimo: 0, passo: 0.25 },
      { chave: 'horasOutras', rotulo: 'Horas com outro adicional', tipo: 'numero', padrao: '0', minimo: 0, passo: 0.25 },
      { chave: 'percentual', rotulo: 'Outro adicional (%)', tipo: 'numero', padrao: '60', minimo: 0, maximo: 300, passo: 1 },
      { chave: 'diasUteis', rotulo: 'Dias úteis trabalhados', tipo: 'numero', padrao: '25', minimo: 1, maximo: 31, passo: 1 },
      { chave: 'repousos', rotulo: 'Domingos e feriados', tipo: 'numero', padrao: '5', minimo: 0, maximo: 15, passo: 1 },
    ],
    calcular(valores) {
      const base = n(valores, 'salario');
      const divisor = divisorPorJornada(n(valores, 'jornada'));
      const hora = base / divisor;
      const h50 = arredondar(hora * 1.5 * n(valores, 'horas50'));
      const h100 = arredondar(hora * 2 * n(valores, 'horas100'));
      const outras = arredondar(hora * (1 + n(valores, 'percentual') / 100) * n(valores, 'horasOutras'));
      const extras = arredondar(h50 + h100 + outras);
      const dsr = n(valores, 'diasUteis') > 0
        ? arredondar((extras / n(valores, 'diasUteis')) * n(valores, 'repousos'))
        : 0;
      const habitual = extras + dsr;
      const prov = reflexos(habitual);
      return {
        tituloTotal: 'Total mensal com DSR',
        total: habitual,
        linhas: [
          { rotulo: 'Valor da hora normal', valor: arredondar(hora) },
          { rotulo: 'Horas extras a 50%', valor: h50 },
          { rotulo: 'Horas extras a 100%', valor: h100 },
          { rotulo: `Horas extras a ${n(valores, 'percentual')}%`, valor: outras },
          { rotulo: 'DSR sobre horas extras', valor: dsr },
          { rotulo: 'Provisão mensal de 13º', valor: prov.decimo },
          { rotulo: 'Provisão mensal de férias + 1/3', valor: prov.ferias },
          { rotulo: 'FGTS estimado sobre o mês e 13º', valor: prov.fgts },
        ],
        notas: ['O total principal mostra horas extras e DSR do período; reflexos aparecem separadamente.'],
      };
    },
  },

  horas_trabalhadas: {
    campos: [
      { chave: 'entrada', rotulo: 'Entrada', tipo: 'hora', padrao: '08:00', obrigatorio: true },
      { chave: 'saida', rotulo: 'Saída', tipo: 'hora', padrao: '18:00', obrigatorio: true },
      {
        chave: 'intervaloInicio', rotulo: 'Início do intervalo', tipo: 'hora', padrao: '12:00',
        obrigatorio: true, mostrarSe: { chave: 'semIntervalo', valor: 'nao' },
      },
      {
        chave: 'intervaloFim', rotulo: 'Fim do intervalo', tipo: 'hora', padrao: '13:00',
        obrigatorio: true, mostrarSe: { chave: 'semIntervalo', valor: 'nao' },
      },
      { chave: 'semIntervalo', rotulo: 'Sem intervalo', tipo: 'checkbox', padrao: 'nao', ajuda: 'Marque somente quando a jornada não teve pausa.' },
      { chave: 'diasSemana', rotulo: 'Dias com esta jornada na semana', tipo: 'numero', padrao: '5', minimo: 1, maximo: 7, passo: 1, obrigatorio: true },
      jornada,
      { chave: 'salario', rotulo: 'Salário mensal (opcional)', tipo: 'moeda', padrao: '0,00', ajuda: 'Preencha para estimar o valor das horas excedentes.' },
      { chave: 'adicional', rotulo: 'Adicional da hora extra (%)', tipo: 'numero', padrao: '50', minimo: 0, maximo: 300, passo: 1 },
    ],
    validar(valores) {
      const problemas: string[] = [];
      const periodo = periodoDaJornada(valores);
      if (Number.isFinite(periodo.entrada) && Number.isFinite(periodo.saida) && periodo.saida - periodo.entrada >= 24 * 60) {
        problemas.push('Entrada e saída não podem ser iguais.');
      }
      if (valores.semIntervalo !== 'sim'
        && [periodo.entrada, periodo.saida, periodo.intervaloInicio, periodo.intervaloFim].every(Number.isFinite)
        && (periodo.intervaloInicio < periodo.entrada
          || periodo.intervaloFim > periodo.saida
          || periodo.intervaloFim <= periodo.intervaloInicio)) {
        problemas.push('O intervalo precisa estar completamente dentro do período entre entrada e saída.');
      }
      return problemas;
    },
    calcular(valores) {
      const periodo = periodoDaJornada(valores);
      const minutosBrutos = Math.max(0, periodo.saida - periodo.entrada);
      const minutosIntervalo = valores.semIntervalo === 'sim'
        ? 0
        : Math.max(0, periodo.intervaloFim - periodo.intervaloInicio);
      const minutosDia = Math.max(0, minutosBrutos - minutosIntervalo);
      const diasSemana = n(valores, 'diasSemana');
      const minutosSemana = minutosDia * diasSemana;
      const limiteSemanal = n(valores, 'jornada') * 60;
      const minutosRegulares = Math.min(minutosSemana, limiteSemanal);
      const minutosExtras = Math.max(0, minutosSemana - limiteSemanal);
      const valorHora = n(valores, 'salario') / divisorPorJornada(n(valores, 'jornada'));
      const valorExtraSemanal = arredondar((minutosExtras / 60) * valorHora * (1 + n(valores, 'adicional') / 100));
      const valorExtraMensal = arredondar(valorExtraSemanal * (52 / 12));

      const linhasFinanceiras: LinhaResultadoGenerico[] = n(valores, 'salario') > 0
        ? [
            { rotulo: 'Valor da hora normal', valor: arredondar(valorHora) },
            { rotulo: `Horas excedentes com adicional de ${n(valores, 'adicional')}% — semana`, valor: valorExtraSemanal },
            { rotulo: 'Projeção mensal das horas excedentes', valor: valorExtraMensal },
          ]
        : [];

      return {
        tituloTotal: 'Horas trabalhadas na semana',
        total: arredondar(minutosSemana / 60),
        formatoTotal: 'duracao',
        linhas: [
          { rotulo: 'Período entre entrada e saída', valor: minutosBrutos / 60, formato: 'duracao' },
          { rotulo: 'Intervalo descontado', valor: minutosIntervalo / 60, formato: 'duracao' },
          { rotulo: 'Jornada líquida por dia', valor: minutosDia / 60, formato: 'duracao' },
          { rotulo: `Total em ${diasSemana} dia${diasSemana === 1 ? '' : 's'}`, valor: minutosSemana / 60, formato: 'duracao' },
          { rotulo: 'Horas dentro da jornada semanal', valor: minutosRegulares / 60, formato: 'duracao' },
          { rotulo: `Horas acima de ${n(valores, 'jornada')} semanais`, valor: minutosExtras / 60, formato: 'duracao' },
          ...linhasFinanceiras,
        ],
        notas: [
          minutosExtras > 0
            ? `A jornada informada ultrapassa o limite semanal em ${Math.round(minutosExtras)} minutos.`
            : 'A jornada informada não ultrapassa o limite semanal selecionado.',
          'Horas acima da 8ª diária, regimes de compensação, banco de horas, escalas e normas coletivas podem mudar a quantidade juridicamente devida.',
          'A projeção financeira considera apenas o excedente semanal e não inclui DSR nem reflexos em férias, 13º e FGTS.',
        ],
      };
    },
  },

  salario_liquido: {
    campos: [
      salario,
      { chave: 'dependentes', rotulo: 'Dependentes para IRRF', tipo: 'numero', padrao: '0', minimo: 0, maximo: 20, passo: 1 },
      { chave: 'vale', rotulo: 'Valor mensal do vale-transporte utilizado', tipo: 'moeda', padrao: '0,00', ajuda: 'O desconto fica limitado a 6% do salário.' },
      { chave: 'outros', rotulo: 'Outros descontos', tipo: 'moeda', padrao: '0,00' },
    ],
    calcular(valores) {
      const bruto = n(valores, 'salario');
      const inss = calcularInss2026(bruto);
      const ir = calcularIrrf2026(bruto, inss, n(valores, 'dependentes'));
      const vt = arredondar(Math.min(n(valores, 'vale'), bruto * 0.06));
      const outros = n(valores, 'outros');
      const liquido = arredondar(Math.max(0, bruto - inss - ir.valor - vt - outros));
      return {
        tituloTotal: 'Salário líquido estimado',
        total: liquido,
        linhas: [
          { rotulo: 'Salário bruto', valor: bruto },
          { rotulo: 'INSS progressivo', valor: -inss },
          { rotulo: 'IRRF', valor: -ir.valor, detalhe: `Dedução ${ir.deducao === 'simplificada' ? 'simplificada' : 'legal'}` },
          { rotulo: 'Vale-transporte', valor: -vt },
          { rotulo: 'Outros descontos', valor: -outros },
        ],
        notas: ['Valores negativos representam descontos. Múltiplos vínculos podem alterar o INSS.'],
      };
    },
  },

  ferias: {
    campos: [
      salario,
      { chave: 'medias', rotulo: 'Médias de adicionais e variáveis', tipo: 'moeda', padrao: '0,00' },
      {
        chave: 'diasDireito', rotulo: 'Dias de férias de direito', tipo: 'select', padrao: '30',
        opcoes: [30, 24, 18, 12].map((valor) => ({ valor: String(valor), rotulo: `${valor} dias` })),
      },
      {
        chave: 'vender', rotulo: 'Converter 1/3 em abono', tipo: 'select', padrao: 'nao',
        opcoes: [{ valor: 'nao', rotulo: 'Não' }, { valor: 'sim', rotulo: 'Sim' }],
      },
      { chave: 'dependentes', rotulo: 'Dependentes para IRRF', tipo: 'numero', padrao: '0', minimo: 0, maximo: 20, passo: 1 },
    ],
    calcular(valores) {
      const base = n(valores, 'salario') + n(valores, 'medias');
      const dias = n(valores, 'diasDireito');
      const diasVendidos = valores.vender === 'sim' ? Math.floor(dias / 3) : 0;
      const diasGozados = dias - diasVendidos;
      const feriasGozadas = arredondar((base / 30) * diasGozados);
      const abono = arredondar((base / 30) * diasVendidos);
      const terco = arredondar(((feriasGozadas + abono) / 3));
      const tercoAbono = arredondar(abono / 3);
      // O terço total já contém o terço do abono. A base tributável exclui abono e seu terço.
      const tercoTributavel = arredondar(terco - tercoAbono);
      const baseTributavel = feriasGozadas + tercoTributavel;
      const inss = calcularInss2026(baseTributavel);
      const ir = calcularIrrf2026(baseTributavel, inss, n(valores, 'dependentes'));
      const total = arredondar(feriasGozadas + abono + terco - inss - ir.valor);
      return {
        tituloTotal: 'Valor líquido estimado das férias',
        total,
        linhas: [
          { rotulo: `Remuneração de ${diasGozados} dias de gozo`, valor: feriasGozadas },
          { rotulo: `Abono de ${diasVendidos} dias`, valor: abono },
          { rotulo: 'Adicional constitucional de 1/3', valor: terco },
          { rotulo: 'INSS estimado', valor: -inss },
          { rotulo: 'IRRF estimado', valor: -ir.valor },
        ],
        notas: ['O abono pecuniário e seu terço são demonstrados fora da base tributável desta estimativa.'],
      };
    },
  },

  decimo_terceiro: {
    campos: [
      salario,
      { chave: 'medias', rotulo: 'Médias de adicionais e variáveis', tipo: 'moeda', padrao: '0,00' },
      { chave: 'avos', rotulo: 'Meses com pelo menos 15 dias', tipo: 'numero', padrao: '12', minimo: 1, maximo: 12, passo: 1 },
      { chave: 'adiantamento', rotulo: 'Primeira parcela já recebida', tipo: 'moeda', padrao: '0,00' },
      { chave: 'dependentes', rotulo: 'Dependentes para IRRF', tipo: 'numero', padrao: '0', minimo: 0, maximo: 20, passo: 1 },
    ],
    calcular(valores) {
      const bruto = arredondar(((n(valores, 'salario') + n(valores, 'medias')) / 12) * n(valores, 'avos'));
      const inss = calcularInss2026(bruto);
      const ir = calcularIrrf2026(bruto, inss, n(valores, 'dependentes'));
      const adiantamento = n(valores, 'adiantamento');
      const saldo = arredondar(Math.max(0, bruto - inss - ir.valor - adiantamento));
      return {
        tituloTotal: 'Saldo líquido estimado',
        total: saldo,
        linhas: [
          { rotulo: `13º bruto — ${n(valores, 'avos')}/12 avos`, valor: bruto },
          { rotulo: 'INSS sobre o 13º', valor: -inss },
          { rotulo: 'IRRF sobre o 13º', valor: -ir.valor },
          { rotulo: 'Adiantamento informado', valor: -adiantamento },
        ],
        notas: ['INSS e IRRF do 13º são calculados separadamente da remuneração mensal.'],
      };
    },
  },

  fgts: {
    campos: [
      salario,
      { chave: 'variaveis', rotulo: 'Outras verbas mensais com FGTS', tipo: 'moeda', padrao: '0,00' },
      { chave: 'meses', rotulo: 'Meses do período', tipo: 'numero', padrao: '12', minimo: 1, maximo: 600, passo: 1 },
      {
        chave: 'categoria', rotulo: 'Categoria', tipo: 'select', padrao: '8',
        opcoes: [{ valor: '8', rotulo: 'Empregado em geral — 8%' }, { valor: '2', rotulo: 'Aprendiz — 2%' }],
      },
      {
        chave: 'decimo', rotulo: 'Incluir FGTS sobre 13º proporcional', tipo: 'select', padrao: 'sim',
        opcoes: [{ valor: 'sim', rotulo: 'Sim' }, { valor: 'nao', rotulo: 'Não' }],
      },
      { chave: 'saldoAnterior', rotulo: 'Base anterior para fins rescisórios', tipo: 'moeda', padrao: '0,00' },
      {
        chave: 'multa', rotulo: 'Multa rescisória', tipo: 'select', padrao: '0',
        opcoes: [{ valor: '0', rotulo: 'Sem multa' }, { valor: '40', rotulo: '40% — sem justa causa' }, { valor: '20', rotulo: '20% — acordo' }],
      },
    ],
    calcular(valores) {
      const remuneracao = n(valores, 'salario') + n(valores, 'variaveis');
      const meses = n(valores, 'meses');
      const aliquota = n(valores, 'categoria') / 100;
      const mensais = arredondar(remuneracao * meses * aliquota);
      const decimo = valores.decimo === 'sim' ? arredondar((remuneracao * meses / 12) * aliquota) : 0;
      const novos = arredondar(mensais + decimo);
      const base = arredondar(n(valores, 'saldoAnterior') + novos);
      const multa = arredondar(base * n(valores, 'multa') / 100);
      return {
        tituloTotal: 'FGTS e multa estimados',
        total: arredondar(base + multa),
        linhas: [
          { rotulo: 'Depósitos mensais estimados', valor: mensais },
          { rotulo: 'FGTS sobre 13º proporcional', valor: decimo },
          { rotulo: 'Base acumulada informada + novos depósitos', valor: base },
          { rotulo: `Multa de ${n(valores, 'multa')}%`, valor: multa },
        ],
        notas: ['O total é vinculado à conta FGTS; não corresponde a pagamento líquido feito diretamente no TRCT.'],
      };
    },
  },

  aviso_previo: {
    campos: [
      salario,
      { chave: 'admissao', rotulo: 'Data de admissão', tipo: 'data', obrigatorio: true },
      { chave: 'desligamento', rotulo: 'Data da comunicação', tipo: 'data', obrigatorio: true },
      {
        chave: 'modalidade', rotulo: 'Modalidade', tipo: 'select', padrao: 'sem',
        opcoes: [
          { valor: 'sem', rotulo: 'Dispensa sem justa causa' },
          { valor: 'acordo', rotulo: 'Rescisão por acordo' },
          { valor: 'pedido', rotulo: 'Pedido de demissão sem cumprimento' },
        ],
      },
    ],
    calcular(valores) {
      const completos = anosCompletos(data(valores.admissao), data(valores.desligamento));
      const dias = Math.min(90, 30 + completos * 3);
      const modalidade = valores.modalidade;
      const diasPagos = modalidade === 'acordo' ? dias / 2 : modalidade === 'pedido' ? 30 : dias;
      const valor = arredondar((n(valores, 'salario') / 30) * diasPagos);
      const projecao = adicionarMeses(data(valores.desligamento), 0);
      projecao.setUTCDate(projecao.getUTCDate() + Math.ceil(diasPagos));
      return {
        tituloTotal: modalidade === 'pedido' ? 'Desconto potencial do aviso' : 'Valor estimado do aviso',
        total: valor,
        linhas: [
          { rotulo: 'Anos completos', valor: completos, formato: 'numero' },
          { rotulo: 'Aviso proporcional', valor: `${dias} dias`, formato: 'texto' },
          { rotulo: modalidade === 'acordo' ? 'Dias pagos pela metade' : 'Dias considerados no valor', valor: `${diasPagos} dias`, formato: 'texto' },
          { rotulo: 'Projeção estimada', valor: iso(projecao), formato: 'texto' },
        ],
        notas: [modalidade === 'pedido' ? 'No pedido de demissão, a estimativa de desconto foi limitada a 30 dias.' : 'A projeção pode gerar avos adicionais de férias e 13º.'],
      };
    },
  },

  adicional_noturno: {
    campos: [
      salario,
      jornada,
      { chave: 'horas', rotulo: 'Horas noturnas de relógio no mês', tipo: 'numero', padrao: '0', minimo: 0, maximo: 400, passo: 0.25 },
      { chave: 'percentual', rotulo: 'Adicional noturno (%)', tipo: 'numero', padrao: '20', minimo: 20, maximo: 100, passo: 1 },
      {
        chave: 'reduzida', rotulo: 'Aplicar hora reduzida urbana', tipo: 'select', padrao: 'sim',
        opcoes: [{ valor: 'sim', rotulo: 'Sim — 52min30s' }, { valor: 'nao', rotulo: 'Não' }],
      },
    ],
    calcular(valores) {
      const divisor = divisorPorJornada(n(valores, 'jornada'));
      const hora = n(valores, 'salario') / divisor;
      const horasRelogio = n(valores, 'horas');
      const horasComputadas = valores.reduzida === 'sim' ? horasRelogio * (60 / 52.5) : horasRelogio;
      const adicional = arredondar(hora * horasComputadas * n(valores, 'percentual') / 100);
      const prov = reflexos(adicional);
      return {
        tituloTotal: 'Adicional noturno mensal',
        total: adicional,
        linhas: [
          { rotulo: 'Valor da hora normal', valor: arredondar(hora) },
          { rotulo: 'Horas noturnas computadas', valor: arredondar(horasComputadas), formato: 'numero' },
          { rotulo: 'Provisão mensal de 13º', valor: prov.decimo },
          { rotulo: 'Provisão mensal de férias + 1/3', valor: prov.ferias },
          { rotulo: 'FGTS estimado', valor: prov.fgts },
        ],
        notas: ['Para trabalhador urbano, o período noturno legal é, em regra, das 22h às 5h.'],
      };
    },
  },

  insalubridade: {
    campos: [
      { ...salario, chave: 'base', rotulo: 'Base de cálculo informada', padrao: '1.621,00', ajuda: 'O salário mínimo de 2026 é sugerido; norma coletiva ou decisão pode alterar a base.' },
      {
        chave: 'grau', rotulo: 'Grau de insalubridade', tipo: 'select', padrao: '20',
        opcoes: [{ valor: '10', rotulo: 'Mínimo — 10%' }, { valor: '20', rotulo: 'Médio — 20%' }, { valor: '40', rotulo: 'Máximo — 40%' }],
      },
      { chave: 'meses', rotulo: 'Meses no período', tipo: 'numero', padrao: '12', minimo: 1, maximo: 600, passo: 1 },
    ],
    calcular(valores) {
      const mensal = arredondar(n(valores, 'base') * n(valores, 'grau') / 100);
      return resultadoAdicional('Adicional e reflexos estimados', mensal, n(valores, 'meses'), [
        { rotulo: 'Adicional mensal', valor: mensal },
      ]);
    },
  },

  periculosidade: {
    campos: [
      { ...salario, rotulo: 'Salário-base sem outros adicionais' },
      { chave: 'meses', rotulo: 'Meses no período', tipo: 'numero', padrao: '12', minimo: 1, maximo: 600, passo: 1 },
    ],
    calcular(valores) {
      const mensal = arredondar(n(valores, 'salario') * 0.3);
      return resultadoAdicional('Adicional e reflexos estimados', mensal, n(valores, 'meses'), [
        { rotulo: 'Adicional mensal de 30%', valor: mensal },
      ]);
    },
  },

  inss_irrf: {
    campos: [
      { ...salario, rotulo: 'Rendimento tributável mensal' },
      { chave: 'dependentes', rotulo: 'Dependentes para IRRF', tipo: 'numero', padrao: '0', minimo: 0, maximo: 20, passo: 1 },
    ],
    calcular(valores) {
      const bruto = n(valores, 'salario');
      const inss = calcularInss2026(bruto);
      const ir = calcularIrrf2026(bruto, inss, n(valores, 'dependentes'));
      return {
        tituloTotal: 'Valor após INSS e IRRF',
        total: arredondar(bruto - inss - ir.valor),
        linhas: [
          { rotulo: 'Rendimento informado', valor: bruto },
          { rotulo: 'INSS progressivo', valor: -inss },
          { rotulo: 'IRRF com redução de 2026', valor: -ir.valor },
          { rotulo: 'Dedução escolhida para IRRF', valor: ir.deducao === 'simplificada' ? 'Simplificada — R$ 607,20' : 'Legal — INSS e dependentes', formato: 'texto' },
        ],
        notas: ['A redução do IRRF de 2026 zera o imposto em rendimentos tributáveis de até R$ 5.000,00, observada a apuração oficial.'],
      };
    },
  },

  seguro_desemprego: {
    campos: [
      { chave: 'salario1', rotulo: 'Último salário', tipo: 'moeda', obrigatorio: true },
      { chave: 'salario2', rotulo: 'Penúltimo salário', tipo: 'moeda', padrao: '0,00' },
      { chave: 'salario3', rotulo: 'Antepenúltimo salário', tipo: 'moeda', padrao: '0,00' },
      {
        chave: 'solicitacao', rotulo: 'Número da solicitação', tipo: 'select', padrao: '1',
        opcoes: [{ valor: '1', rotulo: 'Primeira' }, { valor: '2', rotulo: 'Segunda' }, { valor: '3', rotulo: 'Terceira ou posterior' }],
      },
      { chave: 'meses', rotulo: 'Meses trabalhados nos últimos 36 meses', tipo: 'numero', padrao: '12', minimo: 0, maximo: 36, passo: 1 },
    ],
    calcular(valores) {
      const salarios = ['salario1', 'salario2', 'salario3'].map((chave) => n(valores, chave)).filter((valor) => valor > 0);
      const media = salarios.reduce((soma, valor) => soma + valor, 0) / Math.max(1, salarios.length);
      let parcela = media <= 2_222.17
        ? media * 0.8
        : media <= 3_703.99
          ? (media - 2_222.17) * 0.5 + 1_777.74
          : 2_518.65;
      parcela = arredondar(Math.min(2_518.65, Math.max(1_621, parcela)));
      const meses = n(valores, 'meses');
      const solicitacao = n(valores, 'solicitacao');
      let quantidade = 0;
      if (solicitacao === 1) quantidade = meses >= 24 ? 5 : meses >= 12 ? 4 : 0;
      else if (solicitacao === 2) quantidade = meses >= 24 ? 5 : meses >= 12 ? 4 : meses >= 9 ? 3 : 0;
      else quantidade = meses >= 24 ? 5 : meses >= 12 ? 4 : meses >= 6 ? 3 : 0;
      return {
        tituloTotal: 'Total potencial do benefício',
        total: arredondar(parcela * quantidade),
        linhas: [
          { rotulo: 'Salário médio considerado', valor: arredondar(media) },
          { rotulo: 'Valor estimado da parcela', valor: parcela },
          { rotulo: 'Quantidade provável', valor: `${quantidade} parcela${quantidade === 1 ? '' : 's'}`, formato: 'texto' },
        ],
        notas: [quantidade === 0 ? 'Os meses informados não atingem o requisito mínimo da solicitação selecionada.' : 'A aprovação depende da conferência de todos os requisitos pelo Ministério do Trabalho e Emprego.'],
      };
    },
  },

  intervalo_intrajornada: {
    campos: [
      salario,
      jornada,
      { chave: 'minutos', rotulo: 'Minutos de intervalo não concedidos por dia', tipo: 'numero', padrao: '60', minimo: 1, maximo: 240, passo: 1 },
      { chave: 'dias', rotulo: 'Dias com supressão', tipo: 'numero', padrao: '22', minimo: 1, maximo: 2000, passo: 1 },
      { chave: 'adicional', rotulo: 'Adicional (%)', tipo: 'numero', padrao: '50', minimo: 50, maximo: 300, passo: 1 },
    ],
    calcular(valores) {
      const hora = n(valores, 'salario') / divisorPorJornada(n(valores, 'jornada'));
      const horas = (n(valores, 'minutos') / 60) * n(valores, 'dias');
      const total = arredondar(hora * horas * (1 + n(valores, 'adicional') / 100));
      return {
        tituloTotal: 'Indenização estimada do intervalo',
        total,
        linhas: [
          { rotulo: 'Valor da hora normal', valor: arredondar(hora) },
          { rotulo: 'Horas suprimidas no período', valor: arredondar(horas), formato: 'numero' },
          { rotulo: 'Adicional aplicado', valor: `${n(valores, 'adicional')}%`, formato: 'texto' },
        ],
        notas: ['Regra estimada para fatos posteriores a 11/11/2017, com natureza indenizatória e pagamento apenas do período suprimido.'],
      };
    },
  },

  banco_horas: {
    campos: [
      salario,
      jornada,
      { chave: 'positivas', rotulo: 'Horas positivas', tipo: 'numero', padrao: '0', minimo: 0, maximo: 5000, passo: 0.25 },
      { chave: 'negativas', rotulo: 'Horas negativas', tipo: 'numero', padrao: '0', minimo: 0, maximo: 5000, passo: 0.25 },
      { chave: 'adicional', rotulo: 'Adicional para pagamento (%)', tipo: 'numero', padrao: '50', minimo: 0, maximo: 300, passo: 1 },
    ],
    calcular(valores) {
      const saldo = n(valores, 'positivas') - n(valores, 'negativas');
      const hora = n(valores, 'salario') / divisorPorJornada(n(valores, 'jornada'));
      const pagamento = saldo > 0 ? arredondar(saldo * hora * (1 + n(valores, 'adicional') / 100)) : 0;
      return {
        tituloTotal: 'Pagamento estimado do saldo positivo',
        total: pagamento,
        linhas: [
          { rotulo: 'Valor da hora normal', valor: arredondar(hora) },
          { rotulo: 'Saldo final', valor: `${arredondar(saldo)} hora${Math.abs(saldo) === 1 ? '' : 's'}`, formato: 'texto' },
          { rotulo: 'Adicional informado', valor: `${n(valores, 'adicional')}%`, formato: 'texto' },
        ],
        notas: [saldo < 0 ? 'Há saldo negativo. A possibilidade de desconto depende do acordo, da modalidade de desligamento e das regras aplicáveis.' : 'Saldo positivo não compensado pode ser pago conforme a remuneração vigente na data da rescisão.'],
      };
    },
  },

  salario_dias: {
    campos: [
      salario,
      { chave: 'dias', rotulo: 'Dias trabalhados', tipo: 'numero', padrao: '15', minimo: 1, maximo: 31, passo: 1 },
      {
        chave: 'divisor', rotulo: 'Divisor', tipo: 'select', padrao: '30',
        opcoes: [
          { valor: '30', rotulo: '30 dias — convenção mensal' },
          { valor: '31', rotulo: '31 dias — calendário' },
          { valor: '29', rotulo: '29 dias — fevereiro bissexto' },
          { valor: '28', rotulo: '28 dias — fevereiro' },
        ],
      },
      { chave: 'dependentes', rotulo: 'Dependentes para IRRF', tipo: 'numero', padrao: '0', minimo: 0, maximo: 20, passo: 1 },
    ],
    calcular(valores) {
      const divisor = n(valores, 'divisor');
      const dias = Math.min(n(valores, 'dias'), divisor);
      const bruto = arredondar((n(valores, 'salario') / divisor) * dias);
      const inss = calcularInss2026(bruto);
      const ir = calcularIrrf2026(bruto, inss, n(valores, 'dependentes'));
      return {
        tituloTotal: 'Salário líquido proporcional',
        total: arredondar(bruto - inss - ir.valor),
        linhas: [
          { rotulo: `Salário bruto — ${dias} dias`, valor: bruto },
          { rotulo: 'INSS', valor: -inss },
          { rotulo: 'IRRF', valor: -ir.valor },
        ],
        notas: [`Foi usado o divisor ${divisor}. Benefícios e outros descontos não estão incluídos.`],
      };
    },
  },

  comissoes_dsr: {
    campos: [
      { chave: 'comissoes', rotulo: 'Comissões do período', tipo: 'moeda', obrigatorio: true },
      { chave: 'diasUteis', rotulo: 'Dias úteis efetivamente trabalhados', tipo: 'numero', padrao: '25', minimo: 1, maximo: 31, passo: 1 },
      { chave: 'repousos', rotulo: 'Domingos e feriados', tipo: 'numero', padrao: '5', minimo: 0, maximo: 15, passo: 1 },
    ],
    calcular(valores) {
      const comissoes = n(valores, 'comissoes');
      const dsr = arredondar((comissoes / Math.max(1, n(valores, 'diasUteis'))) * n(valores, 'repousos'));
      const habitual = comissoes + dsr;
      const prov = reflexos(habitual);
      return {
        tituloTotal: 'Comissões com DSR',
        total: arredondar(habitual),
        linhas: [
          { rotulo: 'Comissões informadas', valor: comissoes },
          { rotulo: 'DSR sobre comissões', valor: dsr },
          { rotulo: 'Provisão mensal de 13º', valor: prov.decimo },
          { rotulo: 'Provisão mensal de férias + 1/3', valor: prov.ferias },
          { rotulo: 'FGTS estimado', valor: prov.fgts },
        ],
        notas: ['Informe feriados locais e dias úteis do período real para melhorar a estimativa.'],
      };
    },
  },

  estabilidade_gestante: {
    campos: [
      salario,
      { chave: 'medias', rotulo: 'Médias mensais habituais', tipo: 'moeda', padrao: '0,00' },
      { chave: 'dispensa', rotulo: 'Data da dispensa', tipo: 'data', obrigatorio: true },
      { chave: 'parto', rotulo: 'Data do parto ou data provável', tipo: 'data', obrigatorio: true },
    ],
    calcular(valores) {
      const fim = adicionarMeses(data(valores.parto), 5);
      const meses = mesesEquivalentes(data(valores.dispensa), fim);
      const base = n(valores, 'salario') + n(valores, 'medias');
      const salarios = arredondar(base * meses);
      const decimo = arredondar(base * meses / 12);
      const ferias = arredondar((base * meses / 12) * (4 / 3));
      const fgts = arredondar((salarios + decimo) * 0.08);
      return {
        tituloTotal: 'Cenário de indenização substitutiva',
        total: arredondar(salarios + decimo + ferias + fgts),
        linhas: [
          { rotulo: 'Fim estimado da estabilidade', valor: iso(fim), formato: 'texto' },
          { rotulo: 'Meses equivalentes restantes', valor: arredondar(meses), formato: 'numero' },
          { rotulo: 'Salários do período', valor: salarios },
          { rotulo: '13º proporcional estimado', valor: decimo },
          { rotulo: 'Férias + 1/3 estimadas', valor: ferias },
          { rotulo: 'FGTS estimado', valor: fgts },
        ],
        notas: ['A prioridade jurídica pode ser reintegração, e não indenização. A data provável do parto deve ser substituída pela real quando conhecida.'],
      };
    },
  },

  estabilidade_acidente: {
    campos: [
      salario,
      { chave: 'medias', rotulo: 'Médias mensais habituais', tipo: 'moeda', padrao: '0,00' },
      { chave: 'cessacao', rotulo: 'Data de cessação do benefício acidentário', tipo: 'data', obrigatorio: true },
      { chave: 'dispensa', rotulo: 'Data da dispensa', tipo: 'data', obrigatorio: true },
    ],
    calcular(valores) {
      const fim = adicionarMeses(data(valores.cessacao), 12);
      const meses = mesesEquivalentes(data(valores.dispensa), fim);
      const base = n(valores, 'salario') + n(valores, 'medias');
      const salarios = arredondar(base * meses);
      const decimo = arredondar(base * meses / 12);
      const ferias = arredondar((base * meses / 12) * (4 / 3));
      const fgts = arredondar((salarios + decimo) * 0.08);
      return {
        tituloTotal: 'Cenário de indenização substitutiva',
        total: arredondar(salarios + decimo + ferias + fgts),
        linhas: [
          { rotulo: 'Fim estimado da estabilidade', valor: iso(fim), formato: 'texto' },
          { rotulo: 'Meses equivalentes restantes', valor: arredondar(meses), formato: 'numero' },
          { rotulo: 'Salários do período', valor: salarios },
          { rotulo: '13º proporcional estimado', valor: decimo },
          { rotulo: 'Férias + 1/3 estimadas', valor: ferias },
          { rotulo: 'FGTS estimado', valor: fgts },
        ],
        notas: ['A garantia legal pressupõe o enquadramento acidentário e pode gerar discussão sobre reintegração ou indenização.'],
      };
    },
  },

  vinculo_sem_registro: {
    campos: [
      salario,
      { chave: 'inicio', rotulo: 'Início do período', tipo: 'data', obrigatorio: true },
      { chave: 'fim', rotulo: 'Fim do período', tipo: 'data', obrigatorio: true },
      {
        chave: 'salariosPagos', rotulo: 'Os salários mensais foram pagos?', tipo: 'select', padrao: 'sim',
        opcoes: [{ valor: 'sim', rotulo: 'Sim' }, { valor: 'nao', rotulo: 'Não' }],
      },
    ],
    calcular(valores) {
      const meses = mesesEquivalentes(data(valores.inicio), data(valores.fim));
      const base = n(valores, 'salario');
      const salarios = valores.salariosPagos === 'nao' ? arredondar(base * meses) : 0;
      const decimo = arredondar(base * meses / 12);
      const ferias = arredondar((base * meses / 12) * (4 / 3));
      const fgts = arredondar((base * meses + decimo) * 0.08);
      return {
        tituloTotal: 'Parcelas básicas estimadas',
        total: arredondar(salarios + decimo + ferias + fgts),
        linhas: [
          { rotulo: 'Meses equivalentes', valor: arredondar(meses), formato: 'numero' },
          { rotulo: 'Salários não pagos', valor: salarios },
          { rotulo: '13º estimado', valor: decimo },
          { rotulo: 'Férias + 1/3 estimadas', valor: ferias },
          { rotulo: 'FGTS estimado', valor: fgts },
        ],
        notas: ['O resultado não reconhece vínculo e não inclui aviso, multa do FGTS, horas extras, descontos previdenciários ou prescrição.'],
      };
    },
  },

  rescisao_domestico: {
    campos: [
      salario,
      { chave: 'admissao', rotulo: 'Data de admissão', tipo: 'data', obrigatorio: true },
      { chave: 'desligamento', rotulo: 'Data de desligamento em 2026', tipo: 'data', obrigatorio: true },
      {
        chave: 'modalidade', rotulo: 'Modalidade', tipo: 'select', padrao: 'sem',
        opcoes: [
          { valor: 'sem', rotulo: 'Dispensa sem justa causa' },
          { valor: 'pedido', rotulo: 'Pedido de demissão' },
          { valor: 'acordo', rotulo: 'Rescisão por acordo' },
        ],
      },
      { chave: 'feriasVencidas', rotulo: 'Períodos de férias vencidas', tipo: 'numero', padrao: '0', minimo: 0, maximo: 3, passo: 1 },
      { chave: 'reserva32', rotulo: 'Reserva indenizatória de 3,2% acumulada', tipo: 'moeda', padrao: '0,00' },
    ],
    calcular(valores) {
      const tipo = valores.modalidade === 'pedido' ? 'pedido_demissao' : valores.modalidade === 'acordo' ? 'acordo' : 'sem_justa_causa';
      const aviso = tipo === 'pedido_demissao' ? 'cumprido' : 'indenizado';
      const r = calcularRescisao({
        admissao: valores.admissao,
        desligamento: valores.desligamento,
        salario: n(valores, 'salario'),
        metodoSaldo: 'trinta',
        tipoDesligamento: tipo,
        tipoAviso: aviso,
        feriasVencidas: n(valores, 'feriasVencidas'),
        adiantamentoDecimo: 0,
        baseFgts: 0,
        dependentes: 0,
        outrasVerbas: 0,
        naturezaOutrasVerbas: 'remuneratoria',
        outrosDescontos: 0,
      });
      const reserva = n(valores, 'reserva32');
      const liberada = tipo === 'sem_justa_causa' ? reserva : tipo === 'acordo' ? reserva / 2 : 0;
      return {
        tituloTotal: 'Líquido estimado do TRCT doméstico',
        total: r.liquidoTrct,
        linhas: [
          ...r.creditos.map((linha) => ({ rotulo: linha.rotulo, valor: linha.valor, detalhe: linha.detalhe })),
          ...r.descontos.map((linha) => ({ rotulo: linha.rotulo, valor: -linha.valor, detalhe: linha.detalhe })),
          { rotulo: 'FGTS rescisório de 8%', valor: r.fgtsDepositoRescisorio },
          { rotulo: 'Reserva de 3,2% potencialmente liberada', valor: arredondar(liberada) },
        ],
        notas: ['FGTS e reserva de 3,2% são vinculados e não foram somados ao líquido do TRCT.', 'O eSocial Doméstico deve ser usado para o desligamento oficial.'],
      };
    },
  },
};
