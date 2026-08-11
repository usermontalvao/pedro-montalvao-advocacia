export const URL_FATORES_JEBR = 'https://gilbertomelo.com.br/pdf/JEBR0526N.pdf';
export const URL_API_SALARIO_MINIMO = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.1619/dados?formato=json&dataInicial=01/01/2005';
export const URL_API_IPCA = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=01/01/2005';
export const URL_API_SELIC_DIARIA = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados?formato=json&dataInicial=01/07/2024';
export const URL_API_IPCA15 = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.7478/dados?formato=json&dataInicial=01/07/2024';
export const URL_METODOLOGIA_TAXA_LEGAL = 'https://www3.bcb.gov.br/CALCIDADAO/publico/metodologiaCorrigirPelaTaxaLegal.do?method=metodologiaCorrigirPelaTaxaLegal';

/** Tabela uniforme da Justiça Estadual, não expurgada, para pagamento em maio/2026. */
export const FATORES_JEBR_MAIO_2026: Record<string, number[]> = {
  '2005': [3.1687840, 3.1508243, 3.1370214, 3.1142871, 3.0862026, 3.0647494, 3.0681243, 3.0672042, 3.0672042, 3.0626103, 3.0449496, 3.0285951],
  '2006': [3.0165290, 3.0051096, 2.9982137, 2.9901403, 2.9865565, 2.9826790, 2.9847683, 2.9814887, 2.9820851, 2.9773214, 2.9645737, 2.9521746],
  '2007': [2.9339839, 2.9196775, 2.9074661, 2.8947293, 2.8872225, 2.8797352, 2.8708356, 2.8616783, 2.8448934, 2.8377989, 2.8293110, 2.8171970],
  '2008': [2.7901327, 2.7710127, 2.7577754, 2.7437821, 2.7263336, 2.7004097, 2.6760575, 2.6606259, 2.6550503, 2.6510737, 2.6378842, 2.6278982],
  '2009': [2.6202994, 2.6036361, 2.5955898, 2.5904090, 2.5762396, 2.5608744, 2.5501637, 2.5443118, 2.5422780, 2.5382168, 2.5321397, 2.5228053],
  '2010': [2.5167651, 2.4948107, 2.4774685, 2.4600024, 2.4421746, 2.4317182, 2.4343960, 2.4361013, 2.4378078, 2.4247143, 2.4026103, 2.3781157],
  '2011': [2.3639321, 2.3419181, 2.3293396, 2.3140668, 2.2975246, 2.2845029, 2.2794881, 2.2794881, 2.2699543, 2.2597852, 2.2525770, 2.2398101],
  '2012': [2.2284450, 2.2171376, 2.2085244, 2.2045562, 2.1905367, 2.1785547, 2.1729051, 2.1636016, 2.1539090, 2.1404244, 2.1253345, 2.1139193],
  '2013': [2.0983912, 2.0792620, 2.0685058, 2.0561688, 2.0441085, 2.0369791, 2.0312915, 2.0339356, 2.0306865, 2.0252184, 2.0129395, 2.0021280],
  '2014': [1.9878157, 1.9753709, 1.9628089, 1.9468448, 1.9317769, 1.9202554, 1.9152757, 1.9127890, 1.9093522, 1.9000420, 1.8928492, 1.8828700],
  '2015': [1.8712681, 1.8439772, 1.8228324, 1.7957171, 1.7830574, 1.7655781, 1.7520871, 1.7419836, 1.7376395, 1.7288225, 1.7156122, 1.6967780],
  '2016': [1.6816432, 1.6566281, 1.6410383, 1.6338493, 1.6234592, 1.6077037, 1.6001828, 1.5900068, 1.5850930, 1.5838259, 1.5811380, 1.5800320],
  '2017': [1.5778230, 1.5712239, 1.5674620, 1.5624621, 1.5612131, 1.5556129, 1.5602938, 1.5576458, 1.5581133, 1.5584249, 1.5526800, 1.5498902],
  '2018': [1.5458710, 1.5423236, 1.5395524, 1.5384755, 1.5352515, 1.5286781, 1.5071262, 1.5033678, 1.5033678, 1.4988712, 1.4928996, 1.4966412],
  '2019': [1.4945488, 1.4891878, 1.4811893, 1.4698713, 1.4611047, 1.4589163, 1.4587705, 1.4573131, 1.4555665, 1.4562946, 1.4557123, 1.4478937],
  '2020': [1.4304423, 1.4277296, 1.4253066, 1.4227456, 1.4260255, 1.4295995, 1.4253235, 1.4190796, 1.4139892, 1.4017936, 1.3894277, 1.3763524],
  '2021': [1.3565468, 1.3528940, 1.3418905, 1.3304486, 1.3254120, 1.3128091, 1.3049792, 1.2918028, 1.2805341, 1.2653499, 1.2508402, 1.2404206],
  '2022': [1.2314312, 1.2232355, 1.2111243, 1.1907622, 1.1785058, 1.1732263, 1.1659971, 1.1730353, 1.1766830, 1.1804605, 1.1749383, 1.1704904],
  '2023': [1.1624694, 1.1571465, 1.1483045, 1.1410021, 1.1349867, 1.1309154, 1.1320475, 1.1330672, 1.1308056, 1.1295631, 1.1282092, 1.1270821],
  '2024': [1.1209171, 1.1145641, 1.1056087, 1.1035120, 1.0994440, 1.0944098, 1.0916806, 1.0888495, 1.0903761, 1.0855994, 1.0795539, 1.0753600],
  '2025': [1.0697971, 1.0680881, 1.0542771, 1.0484060, 1.0439172, 1.0412101, 1.0387171, 1.0360235, 1.0371643, 1.0322097, 1.0312816, 1.0294286],
  '2026': [1.0260427, 1.0226679, 1.0155590, 1.0067000, 1.0000000],
};

export type DadosPublicosPensao = {
  salariosMinimos: Record<string, number>;
  ipcaMensal: Record<string, number>;
  taxaLegalMensal: Record<string, number>;
  salarioViaApi: boolean;
  ipcaViaApi: boolean;
  taxaLegalViaApi: boolean;
  ultimoIpca?: string;
  ultimaTaxaLegal?: string;
};

type ItemSerieBcb = { data: string; valor: string };

const chaveMesBcb = (data: string) => {
  const [, mes, ano] = data.split('/');
  return ano && mes ? `${ano}-${mes}` : '';
};

const numeroBcb = (valor: string) => Number(valor.replace(',', '.'));

function somarMes(chave: string, quantidade: number): string {
  const [ano, mes] = chave.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1 + quantidade, 1));
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function calcularTaxasLegaisBcb(selicDiaria: ItemSerieBcb[], ipca15: ItemSerieBcb[]): Record<string, number> {
  const fatoresSelic: Record<string, number> = {};
  for (const item of selicDiaria) {
    const chave = chaveMesBcb(item.data);
    const taxaDiaria = numeroBcb(item.valor);
    if (!chave || !Number.isFinite(taxaDiaria)) continue;
    fatoresSelic[chave] = (fatoresSelic[chave] ?? 1) * (1 + taxaDiaria / 100);
  }

  const taxas: Record<string, number> = {};
  for (const item of ipca15) {
    const mesAnterior = chaveMesBcb(item.data);
    const variacao = numeroBcb(item.valor);
    const fatorSelicBruto = fatoresSelic[mesAnterior];
    if (!mesAnterior || !Number.isFinite(variacao) || !fatorSelicBruto) continue;

    // Resolução CMN 5.171/2024: Fator Selic com 8 casas, Fator IPCA com 4
    // e Taxa Legal mensal final com 6 casas decimais.
    const fatorSelic = Number(fatorSelicBruto.toFixed(8));
    const fatorIpca = Number((1 + variacao / 100).toFixed(4));
    const taxaLegal = Math.max((fatorSelic / fatorIpca - 1) * 100, 0);
    taxas[somarMes(mesAnterior, 1)] = Number(taxaLegal.toFixed(6));
  }
  return taxas;
}

export async function carregarDadosPublicosPensao(): Promise<DadosPublicosPensao> {
  const salariosMinimos: Record<string, number> = {};
  const ipcaMensal: Record<string, number> = {};
  let taxaLegalMensal: Record<string, number> = {};
  let salarioViaApi = false;
  let ipcaViaApi = false;
  let taxaLegalViaApi = false;

  const [salarios, ipca, selicDiaria, ipca15] = await Promise.allSettled([
    fetch(URL_API_SALARIO_MINIMO, { cache: 'no-store' }).then((resposta) => {
      if (!resposta.ok) throw new Error('BCB indisponível');
      return resposta.json() as Promise<ItemSerieBcb[]>;
    }),
    fetch(URL_API_IPCA, { cache: 'no-store' }).then((resposta) => {
      if (!resposta.ok) throw new Error('IPCA indisponível');
      return resposta.json() as Promise<ItemSerieBcb[]>;
    }),
    fetch(URL_API_SELIC_DIARIA, { cache: 'no-store' }).then((resposta) => {
      if (!resposta.ok) throw new Error('Selic diária indisponível');
      return resposta.json() as Promise<ItemSerieBcb[]>;
    }),
    fetch(URL_API_IPCA15, { cache: 'no-store' }).then((resposta) => {
      if (!resposta.ok) throw new Error('IPCA-15 indisponível');
      return resposta.json() as Promise<ItemSerieBcb[]>;
    }),
  ]);

  if (salarios.status === 'fulfilled') {
    for (const item of salarios.value) {
      const chave = chaveMesBcb(item.data);
      const valor = numeroBcb(item.valor);
      if (chave && Number.isFinite(valor)) salariosMinimos[chave] = valor;
    }
    salarioViaApi = true;
  }

  if (ipca.status === 'fulfilled') {
    for (const item of ipca.value) {
      const chave = chaveMesBcb(item.data);
      const valor = numeroBcb(item.valor);
      if (chave && Number.isFinite(valor)) ipcaMensal[chave] = valor;
    }
    ipcaViaApi = Object.keys(ipcaMensal).length > 0;
  }

  if (selicDiaria.status === 'fulfilled' && ipca15.status === 'fulfilled') {
    taxaLegalMensal = calcularTaxasLegaisBcb(selicDiaria.value, ipca15.value);
    taxaLegalViaApi = Object.keys(taxaLegalMensal).length > 0;
  }

  return {
    salariosMinimos,
    ipcaMensal,
    taxaLegalMensal,
    salarioViaApi,
    ipcaViaApi,
    taxaLegalViaApi,
    ultimoIpca: Object.keys(ipcaMensal).sort().at(-1),
    ultimaTaxaLegal: Object.keys(taxaLegalMensal).sort().at(-1),
  };
}
