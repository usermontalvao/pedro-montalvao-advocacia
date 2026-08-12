import type {
  PeriodoPrevidenciario,
  RemuneracaoPrevidenciaria,
  SexoPrevidenciario,
} from './calculoAposentadoria';
import PdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?worker';

export type IdentificacaoCnis = {
  nome: string;
  nit: string;
  cpf: string;
};

export type ResultadoImportacaoCnis = {
  identificacao: IdentificacaoCnis;
  periodos: PeriodoPrevidenciario[];
  remuneracoes: RemuneracaoPrevidenciaria[];
  nascimento: string;
  sexo: SexoPrevidenciario | '';
  paginas: number;
  competenciasEncontradas: number;
  avisos: string[];
};

export type LinhaPdf = {
  texto: string;
  pagina: number;
  y: number;
  partes?: Array<{ texto: string; x: number }>;
};

const INDICADORES_CONHECIDOS = [
  'PREC-MENOR-MIN', 'PSC-MEN-SM-EC103', 'IREC-LC123', 'IREC-FBR', 'IREM-ACD',
  'PREM-EXT', 'PREM-BLOQ-EC103', 'PEXT', 'PEND', 'PVIN-IRREG', 'PRPPS',
  'IREM-PARC', 'IREM-INDPEND', 'PREC-FACULTCONC',
];

const INDICADOR_REGIME_PUBLICO_PENDENTE = 'POSSIVEL-RPPS';

const INDICADORES_QUE_BLOQUEIAM_REMUNERACAO = new Set([
  'PREC-MENOR-MIN', 'PSC-MEN-SM-EC103', 'PREM-BLOQ-EC103',
  'PVIN-IRREG', 'PRPPS',
]);

function dataIso(data: string): string {
  const [dia, mes, ano] = data.split('/');
  return `${ano}-${mes}-${dia}`;
}

function competenciaIso(competencia: string): string {
  return `${competencia.slice(3)}-${competencia.slice(0, 2)}`;
}

function fimDaCompetencia(competencia: string): string {
  const [mes, ano] = competencia.split('/').map(Number);
  return new Date(Date.UTC(ano, mes, 0)).toISOString().slice(0, 10);
}

function valorBr(texto: string): number {
  return Number(texto.replace(/\./g, '').replace(',', '.'));
}

function indicadoresNaLinha(texto: string): string[] {
  const normalizado = texto.toUpperCase();
  return INDICADORES_CONHECIDOS.filter((indicador) => {
    const escapado = indicador.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|[^A-Z0-9-])${escapado}(?=$|[^A-Z0-9-])`).test(normalizado);
  });
}

function limparOrigem(texto: string, titular = ''): string {
  const limpa = texto
    .replace(/^\s*\d+\s+/, '')
    .replace(/\b\d{3}\.\d{5}\.\d{2}[-–]\d\b/g, '')
    .replace(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}[-–]\d{2}\b/g, '')
    .replace(/\b\d{2}\/\d{2}\/\d{4}\b/g, '')
    .replace(/\b\d{2}\/\d{4}\b/g, '')
    .replace(/\b(?:Empregado ou Agente|Empregado|Contribuinte Individual|Facultativo|Segurado Especial|Benefício)\b/gi, '')
    .replace(/\b(?:Trabalhador|Vínculo|Público|RECOLHIMENTO|ATIVO|CESSADO)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[-–\s]+|[-–\s]+$/g, '')
    .trim();
  return limpa.slice(0, 140) || titular || 'Vínculo importado do CNIS';
}

function origemPossivelmentePublica(origem: string): boolean {
  return /\b(?:MUNICIPIO|PREFEITURA|ESTADO DE|GOVERNO DO|CAMARA MUNICIPAL|ASSEMBLEIA LEGISLATIVA|TRIBUNAL DE|AUTARQUIA MUNICIPAL)\b/i
    .test(origem.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
}

function remuneracoesDaLinha(
  texto: string,
  pagina: number,
  sequencia: number | undefined,
  origem: string,
  indicadoresExternos: string[][] = [],
): RemuneracaoPrevidenciaria[] {
  const marcadores = [...texto.matchAll(/\b(0[1-9]|1[0-2])\/(19\d{2}|20\d{2})\b/g)];
  return marcadores.flatMap((marcador, indice) => {
    const inicio = (marcador.index ?? 0) + marcador[0].length;
    const fim = marcadores[indice + 1]?.index ?? texto.length;
    const trecho = texto.slice(inicio, fim).trim();
    const valor = trecho.match(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b/)?.[0];
    if (!valor) return [];
    const indicadores = [...new Set([...indicadoresNaLinha(trecho), ...(indicadoresExternos[indice] ?? [])])];
    return [{
      id: `cnis-r-${pagina}-${sequencia ?? 's'}-${marcador[0]}-${indice}`,
      competencia: competenciaIso(marcador[0]),
      valor: valorBr(valor),
      origem,
      sequencia,
      indicadores,
      incluir: !indicadores.some((item) => INDICADORES_QUE_BLOQUEIAM_REMUNERACAO.has(item)),
      importado: true,
    }];
  });
}

function indicadoresProximos(linhas: LinhaPdf[], indice: number): string[][] {
  const linha = linhas[indice];
  const competencias = (linha.partes ?? []).filter((parte) => /^(0[1-9]|1[0-2])\/(19\d{2}|20\d{2})$/.test(parte.texto));
  if (!competencias.length) return [];
  const proximas = linhas.filter((candidata) => candidata.pagina === linha.pagina && Math.abs(candidata.y - linha.y) <= 8);
  return competencias.map((competencia, posicao) => {
    const inicio = competencia.x + 95;
    const fim = competencias[posicao + 1]?.x ?? Number.POSITIVE_INFINITY;
    const texto = proximas.flatMap((candidata) => candidata.partes ?? [])
      .filter((parte) => parte.x >= inicio && parte.x < fim)
      .map((parte) => parte.texto)
      .join(' ')
      .replace(/-\s+/g, '-')
      .replace(/\s+/g, ' ');
    return indicadoresNaLinha(texto);
  });
}

type VinculoLido = {
  sequencia: number;
  periodo: PeriodoPrevidenciario;
};

function vinculoDoBloco(texto: string, pagina: number, titular: string): VinculoLido | null {
  const inicioRegistro = texto.search(/(?:^|\s)\d+\s+\d{3}\.\d{5}\.\d{2}[-–]\d\b/);
  const registro = inicioRegistro >= 0 ? texto.slice(inicioRegistro).trim() : texto.trim();
  const sequencia = Number(registro.match(/^\s*(\d+)\s+/)?.[1]);
  if (!Number.isFinite(sequencia)) return null;
  const datas = [...registro.matchAll(/\b(\d{2}\/\d{2}\/\d{4})\b/g)].map((item) => item[1]);
  if (!datas.length) return null;
  const inicio = dataIso(datas[0]);
  if (Number(inicio.slice(0, 4)) < 1940) return null;
  const contexto = registro.replace(/\s+/g, ' ').trim();
  const origem = limparOrigem(contexto, titular);
  const rppsExplicito = /RPPS|SERVIDOR P[ÚU]BLICO/i.test(contexto);
  const regimePublicoPendente = !rppsExplicito && origemPossivelmentePublica(origem);
  const indicadores = [...new Set([
    ...indicadoresNaLinha(contexto),
    ...(regimePublicoPendente ? [INDICADOR_REGIME_PUBLICO_PENDENTE] : []),
  ])];
  return {
    sequencia,
    periodo: {
      id: `cnis-v-${pagina}-${sequencia}`,
      sequenciaCnis: sequencia,
      inicio,
      fim: datas[1] ? dataIso(datas[1]) : '',
      origem,
      tipo: rppsExplicito ? 'rpps_ctc' : 'comum',
      incluir: true,
      contaCarencia: true,
      indicadores,
      competenciasExcluidas: [],
      importado: true,
    },
  };
}

function consolidarPeriodos(periodos: PeriodoPrevidenciario[]): PeriodoPrevidenciario[] {
  const unicos = new Map<string, PeriodoPrevidenciario>();
  for (const periodo of periodos) {
    const chave = periodo.sequenciaCnis ? `seq-${periodo.sequenciaCnis}` : `${periodo.inicio}|${periodo.fim}|${periodo.origem}`;
    const existente = unicos.get(chave);
    if (existente) {
      existente.indicadores = [...new Set([...existente.indicadores, ...periodo.indicadores])];
      existente.competenciasExcluidas = [...new Set([
        ...(existente.competenciasExcluidas ?? []),
        ...(periodo.competenciasExcluidas ?? []),
      ])];
      if (!existente.fim && periodo.fim) existente.fim = periodo.fim;
    } else unicos.set(chave, { ...periodo });
  }
  return [...unicos.values()].sort((a, b) => a.inicio.localeCompare(b.inicio) || a.fim.localeCompare(b.fim));
}

export function interpretarTextoCnis(linhas: LinhaPdf[], paginas: number): ResultadoImportacaoCnis {
  const textoTotal = linhas.map((linha) => linha.texto).join('\n');
  const textoLinear = textoTotal.replace(/\s+/g, ' ');
  const nascimentoBr = textoLinear.match(/(?:Data\s+de\s+nascimento|Nascimento)\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1] ?? '';
  const sexoTexto = textoLinear.match(/Sexo\s*:?\s*(Masculino|Feminino|M|F)\b/i)?.[1]?.toLowerCase() ?? '';
  const sexo: SexoPrevidenciario | '' = sexoTexto.startsWith('m') ? 'masculino' : sexoTexto.startsWith('f') ? 'feminino' : '';
  const linhaNome = linhas.find((linha) => /\bNome\s*:/i.test(linha.texto) && !/Nome\s+da\s+m[ãa]e/i.test(linha.texto));
  const nome = linhaNome?.texto.match(/\bNome\s*:\s*(.+)$/i)?.[1]?.trim() ?? '';
  const nit = textoLinear.match(/\bNIT\s*:\s*([\d.\-]+)/i)?.[1] ?? '';
  const cpf = textoLinear.match(/\bCPF\s*:\s*([\d.\-]+)/i)?.[1] ?? '';
  const identificacao = { nome, nit, cpf };
  const periodos: PeriodoPrevidenciario[] = [];
  const remuneracoes: RemuneracaoPrevidenciaria[] = [];
  const porSequencia = new Map<number, PeriodoPrevidenciario>();
  let vinculoAtual: VinculoLido | null = null;
  let emRemuneracoes = false;

  for (let indice = 0; indice < linhas.length; indice += 1) {
    const linha = linhas[indice];
    const texto = linha.texto.replace(/\s+/g, ' ').trim();
    if (!texto) continue;

    if (/\bSeq\.\s+NIT\b.*\bOrigem do Vínculo\b/i.test(texto)) {
      emRemuneracoes = false;
      const partes: string[] = [];
      let cursor = indice + 1;
      for (; cursor < linhas.length && linhas[cursor].pagina === linha.pagina; cursor += 1) {
        const seguinte = linhas[cursor].texto.replace(/\s+/g, ' ').trim();
        if (/^(?:Remunerações|Indicadores:)|\bSeq\.\s+NIT\b|O INSS poderá rever/i.test(seguinte)) break;
        if (seguinte) partes.push(seguinte);
      }
      const lido = vinculoDoBloco(partes.join(' '), linha.pagina, nome);
      if (lido) {
        vinculoAtual = lido;
        periodos.push(lido.periodo);
        porSequencia.set(lido.sequencia, lido.periodo);
      }
      indice = Math.max(indice, cursor - 1);
      continue;
    }

    if (/^Remunerações\b/i.test(texto)) {
      emRemuneracoes = true;
      continue;
    }
    if (/^(?:Valores Consolidados|Legenda de Indicadores)/i.test(texto)) {
      emRemuneracoes = false;
      continue;
    }
    if (/^Indicadores\s*:/i.test(texto) && vinculoAtual) {
      const indicadores = indicadoresNaLinha(texto);
      vinculoAtual.periodo.indicadores = [...new Set([...vinculoAtual.periodo.indicadores, ...indicadores])];
      continue;
    }
    if (emRemuneracoes && /\b(0[1-9]|1[0-2])\/(19\d{2}|20\d{2})\b/.test(texto)) {
      remuneracoes.push(...remuneracoesDaLinha(
        texto,
        linha.pagina,
        vinculoAtual?.sequencia,
        vinculoAtual?.periodo.origem || nome || 'Contribuição importada do CNIS',
        indicadoresProximos(linhas, indice),
      ));
    }
  }

  // Compatibilidade com extratos textuais simples e com testes sem cabeçalhos de tabela.
  if (!periodos.length) {
    for (let indice = 0; indice < linhas.length; indice += 1) {
      const texto = linhas[indice].texto.replace(/\s+/g, ' ').trim();
      if (/Data de nascimento|Data Emissão|Data de emissão/i.test(texto)) continue;
      const lido = vinculoDoBloco(texto, linhas[indice].pagina, nome);
      if (lido && lido.periodo.fim) {
        periodos.push(lido.periodo);
        porSequencia.set(lido.sequencia, lido.periodo);
        continue;
      }
      const extras = remuneracoesDaLinha(texto, linhas[indice].pagina, undefined, nome || 'Contribuição importada do CNIS');
      remuneracoes.push(...extras);
    }
  }

  const porCompetencia = new Map<string, RemuneracaoPrevidenciaria>();
  for (const remuneracao of remuneracoes) {
    const chave = `${remuneracao.sequencia ?? 'sem'}|${remuneracao.competencia}|${remuneracao.valor}`;
    const existente = porCompetencia.get(chave);
    if (existente) existente.indicadores = [...new Set([...existente.indicadores, ...remuneracao.indicadores])];
    else porCompetencia.set(chave, { ...remuneracao });
  }
  const remuneracoesUnicas = [...porCompetencia.values()].sort((a, b) => a.competencia.localeCompare(b.competencia));

  for (const periodo of periodos) {
    const doVinculo = remuneracoesUnicas.filter((item) => item.sequencia === periodo.sequenciaCnis);
    if (!periodo.fim) {
      const ultima = doVinculo.at(-1)?.competencia;
      periodo.fim = ultima ? fimDaCompetencia(`${ultima.slice(5)}/${ultima.slice(0, 4)}`) : periodo.inicio;
    }
    periodo.competenciasExcluidas = [...new Set(doVinculo.filter((item) => !item.incluir).map((item) => item.competencia))];
  }

  // Competências avulsas que não pertencem a nenhum vínculo também entram na linha do tempo.
  const avulsas = remuneracoesUnicas.filter((item) => item.sequencia === undefined);
  for (const remuneracao of avulsas) {
    const competenciaBr = `${remuneracao.competencia.slice(5)}/${remuneracao.competencia.slice(0, 4)}`;
    periodos.push({
      id: `cnis-c-${remuneracao.id}`,
      inicio: `${remuneracao.competencia}-01`,
      fim: fimDaCompetencia(competenciaBr),
      origem: remuneracao.origem || nome || 'Contribuição importada do CNIS',
      tipo: 'comum',
      incluir: remuneracao.incluir,
      contaCarencia: remuneracao.incluir,
      indicadores: remuneracao.indicadores,
      competenciasExcluidas: remuneracao.incluir ? [] : [remuneracao.competencia],
      importado: true,
    });
  }

  const consolidados = consolidarPeriodos(periodos);
  const competencias = new Set(remuneracoesUnicas.map((item) => item.competencia));
  const avisos: string[] = [];
  if (!consolidados.length) avisos.push('Nenhum vínculo ou competência foi reconhecido automaticamente. Adicione os períodos manualmente.');
  if (!nome) avisos.push('O nome do titular não foi localizado no PDF. Informe-o manualmente.');
  if (!nascimentoBr) avisos.push('A data de nascimento não foi localizada no PDF. Informe-a manualmente.');
  if (!sexo) avisos.push('O CNIS não informa o sexo previdenciário. Selecione-o manualmente.');
  if (remuneracoesUnicas.some((item) => !item.incluir)) {
    avisos.push('Há remunerações com indicador de pendência. Elas foram desconsideradas até conferência, complementação ou ajuste.');
  }
  if (consolidados.some((periodo) => periodo.tipo === 'rpps_ctc')) {
    avisos.push('Períodos de RPPS somente devem permanecer incluídos se houver CTC válida e não utilizada em outro regime.');
  }
  if (consolidados.some((periodo) => periodo.indicadores.includes(INDICADOR_REGIME_PUBLICO_PENDENTE))) {
    avisos.push('Há vínculo com ente público e regime previdenciário não identificado. Ele foi incluído por padrão como atividade comum e pode alterar significativamente o resultado. Confirme a filiação ao RGPS; se for RPPS, classifique como CTC somente com certidão válida ou desmarque o período.');
  }
  if (consolidados.some((periodo) => periodo.indicadores.includes('PVIN-IRREG') || periodo.indicadores.includes('PRPPS'))) {
    avisos.push('Há relação com indicador de irregularidade ou regime próprio. Ela foi incluída por padrão, mas precisa de conferência antes de utilizar o resultado em requerimento ou petição.');
  }
  if (consolidados.some((periodo) => periodo.indicadores.includes('PEXT'))) {
    avisos.push('Há vínculo(s) com indicador PEXT. Eles foram incluídos na simulação, mas a extemporaneidade deve ser conferida e comprovada na análise documental.');
  }
  if (consolidados.some((periodo) => periodo.indicadores.includes('IREM-INDPEND'))) {
    avisos.push('Há vínculo(s) com IREM-INDPEND. O indicador foi mantido como ressalva; somente competências com pendência específica permanecem desconsideradas.');
  }

  return {
    identificacao,
    periodos: consolidados,
    remuneracoes: remuneracoesUnicas,
    nascimento: nascimentoBr ? dataIso(nascimentoBr) : '',
    sexo,
    paginas,
    competenciasEncontradas: competencias.size,
    avisos,
  };
}

export async function importarCnisPdf(arquivo: File): Promise<ResultadoImportacaoCnis> {
  if (arquivo.type !== 'application/pdf' && !arquivo.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Selecione o extrato CNIS em formato PDF.');
  }
  if (arquivo.size > 20 * 1024 * 1024) throw new Error('O PDF deve ter no máximo 20 MB.');
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();
  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const documento = await pdfjs.getDocument({ data: bytes }).promise;
  const linhas: LinhaPdf[] = [];

  for (let numero = 1; numero <= documento.numPages; numero += 1) {
    const pagina = await documento.getPage(numero);
    const viewport = pagina.getViewport({ scale: 1 });
    const conteudo = await pagina.getTextContent();
    const itens = conteudo.items
      .filter((item): item is typeof item & { str: string; transform: number[] } => 'str' in item && 'transform' in item)
      .map((item) => {
        const transformada = pdfjs.Util.transform(viewport.transform, item.transform);
        return { texto: item.str, x: transformada[4], y: Math.round(transformada[5] * 2) / 2 };
      })
      .sort((a, b) => a.y - b.y || a.x - b.x);
    const porLinha = new Map<number, typeof itens>();
    for (const item of itens) porLinha.set(item.y, [...(porLinha.get(item.y) ?? []), item]);
    for (const [y, partes] of porLinha) {
      linhas.push({
        pagina: numero,
        y,
        texto: partes.sort((a, b) => a.x - b.x).map((parte) => parte.texto).join(' ').replace(/\s+/g, ' ').trim(),
        partes: partes.map((parte) => ({ texto: parte.texto, x: parte.x })),
      });
    }
  }
  return interpretarTextoCnis(linhas, documento.numPages);
}
