/**
 * Tudo que muda de escritório para escritório está aqui. Nenhum componente
 * escreve telefone, endereço ou domínio na mão — se um dia o número do
 * WhatsApp mudar, muda só nesta linha e o site inteiro acompanha.
 */

export const SITE = {
  /** Sem barra no fim. Usado em canonical, sitemap.xml e og:url. */
  url: 'https://www.advcuiaba.com',
  nome: 'Pedro Montalvão Advocacia',
  nomeCurto: 'Pedro Montalvão',
  advogado: 'Pedro Montalvão',
  /**
   * PREENCHER antes de publicar: o Provimento 205/2021 da OAB exige o número
   * de inscrição no material de divulgação. Enquanto estiver vazio, o site
   * simplesmente não escreve "OAB/MT nº" em lugar nenhum.
   */
  oab: '',
  uf: 'MT',
  cidade: 'Cuiabá',
  email: 'pedro@advcuiaba.com',
  telefoneE164: '5565984046375',
  telefoneExibicao: '(65) 98404-6375',
  endereco: {
    logradouro: 'Rua Catorze, Quadra 70, nº 20',
    bairro: 'Pedra 90',
    cidade: 'Cuiabá',
    uf: 'MT',
    cep: '78099-070',
    pais: 'BR',
    latitude: -15.6885,
    longitude: -56.0546,
  },
  horario: 'Segunda a sexta, das 8h às 18h',
  fundacao: '2019',
} as const;

export const AREAS_ATENDIDAS = [
  'Cuiabá',
  'Várzea Grande',
  'Mato Grosso',
  'Brasil (atendimento online)',
] as const;

/** Monta o link do WhatsApp já com a mensagem pronta para o visitante enviar. */
export function linkWhatsApp(mensagem?: string): string {
  const texto = mensagem?.trim() || MENSAGEM_PADRAO;
  return `https://wa.me/${SITE.telefoneE164}?text=${encodeURIComponent(texto)}`;
}

export const MENSAGEM_PADRAO =
  'Olá. Encontrei o site Pedro Montalvão Advocacia e gostaria de receber informações sobre o atendimento jurídico.';

export function oabFormatada(): string {
  return SITE.oab ? `OAB/${SITE.uf} nº ${SITE.oab}` : `OAB/${SITE.uf}`;
}

export const ENDERECO_LINHA = `${SITE.endereco.logradouro}, ${SITE.endereco.bairro}, ${SITE.endereco.cidade} — ${SITE.endereco.uf}, CEP ${SITE.endereco.cep}`;
