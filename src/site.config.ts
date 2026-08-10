/**
 * Tudo que muda de escritório para escritório está aqui. Nenhum componente
 * escreve telefone, endereço ou domínio na mão — se um dia o número do
 * WhatsApp mudar, muda só nesta linha e o site inteiro acompanha.
 */

export const SITE = {
  /** Sem barra no fim. Usado em canonical, sitemap.xml e og:url. */
  url: 'https://pedromontalvao.com',
  nome: 'Pedro Montalvão Advocacia',
  nomeCurto: 'Pedro Montalvão',
  advogado: 'Pedro Rodrigues Montalvão Neto',
  oab: '30.021',
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
  formacao: 'Graduado em Direito pela UNIC, em Cuiabá',
  posGraduacao: 'Pós-graduado em Direito e Processo do Trabalho',
  instagram: 'https://www.instagram.com/adv.pedro.montalvao',
  linkedin: 'https://br.linkedin.com/in/advpedromontalvao',
  mapa: 'https://maps.app.goo.gl/uWVSZAzTUZKgoKfk9',
  mapaEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3842.245864772432!2d-55.95993312424261!3d-15.631890584986076!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x939da5aec28391a1%3A0x4403a597c4716904!2sPedro%20Montalv%C3%A3o%20Advocacia!5e0!3m2!1spt-BR!2sbr!4v1786330171105!5m2!1spt-BR!2sbr',
  fundacao: '2019',
} as const;

export const AREAS_ATENDIDAS = [
  'Cuiabá',
  'Várzea Grande',
  'Mato Grosso',
  'Brasil',
] as const;

/** Monta o link do WhatsApp já com a mensagem pronta para o visitante enviar. */
export function linkWhatsApp(mensagem?: string): string {
  const texto = mensagem?.trim() || MENSAGEM_PADRAO;
  return `https://wa.me/${SITE.telefoneE164}?text=${encodeURIComponent(texto)}`;
}

export const MENSAGEM_PADRAO =
  'Olá. Encontrei o site Pedro Montalvão Advocacia e gostaria de receber informações sobre o atendimento jurídico.';

export function oabFormatada(): string {
  return `OAB/${SITE.uf} ${SITE.oab}`;
}

export const ENDERECO_LINHA = `${SITE.endereco.logradouro}, ${SITE.endereco.bairro}, ${SITE.endereco.cidade} — ${SITE.endereco.uf}, CEP ${SITE.endereco.cep}`;
