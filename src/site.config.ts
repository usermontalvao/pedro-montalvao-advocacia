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

/**
 * Todos os números oficiais do escritório, em ordem de importância.
 *
 * A página de alerta de golpe depende desta lista para responder "este número é
 * do escritório?" — e é o único lugar do site em que o código diz "pode
 * confiar". Linha nova do escritório entra AQUI, e em nenhum outro lugar: se
 * ela ficar de fora, o conferidor vai chamar de golpe um número verdadeiro, e
 * um cliente atendido de verdade passa a desconfiar do escritório.
 *
 * `telefoneE164` continua sendo a linha principal — é dela que saem os links de
 * WhatsApp do site inteiro e os dados estruturados.
 */
export const TELEFONES_OFICIAIS = [
  {
    e164: '5565984046375',
    exibicao: '(65) 98404-6375',
    rotulo: 'WhatsApp e telefone',
    whatsapp: true,
    /*
      `publico` decide se a linha aparece escrita na página; a conferência vale
      para todas, publicadas ou não. Uma linha interna que o escritório usa para
      ligar precisa ser reconhecida quando o cliente digita o número que viu no
      visor — sem que a página a ofereça como canal de entrada.
    */
    publico: true,
  },
  {
    e164: '556596260463',
    exibicao: '(65) 9626-0463',
    rotulo: 'Telefone adicional',
    whatsapp: false,
    publico: true,
  },
] as const;

/**
 * O nome de usuário do WhatsApp — a identidade que não depende do número.
 *
 * O WhatsApp passou a permitir encontrar e ser encontrado por nome de usuário,
 * e é assim que muita gente vai chegar ao escritório sem nunca digitar treze
 * dígitos. Ele entra aqui pelo mesmo motivo dos telefones: o conferidor precisa
 * responder por ele também, senão sobra um canal oficial que a página não sabe
 * reconhecer — e um perfil parecido (`adv.pedromontalvao`, `adv.pedro.montalvao1`)
 * passaria sem contestação.
 *
 * Escrito sem `@` e em minúsculas, que é a forma canônica com que a comparação
 * é feita.
 */
export const USUARIO_WHATSAPP = 'adv.pedro.montalvao';

export type TelefoneOficial = (typeof TELEFONES_OFICIAIS)[number];

/** As linhas que a página divulga como canal de contato. */
export const TELEFONES_PUBLICOS = TELEFONES_OFICIAIS.filter((numero) => numero.publico);

/**
 * Os endereços de internet do escritório — os dois, e mais nenhum.
 *
 * O e-mail oficial é `@advcuiaba.com`, e o site responde nos dois domínios.
 * Quem confere um endereço parecido (`pedromontalvao.com.br`, `adv-cuiaba…`)
 * precisa encontrar aqui a lista fechada do que é verdadeiro.
 */
export const DOMINIOS_OFICIAIS = ['pedromontalvao.com', 'advcuiaba.com'] as const;

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
