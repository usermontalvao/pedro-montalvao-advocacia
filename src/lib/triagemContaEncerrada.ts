/**
 * O questionário informativo da campanha "conta bloqueada ou encerrada".
 *
 * Aqui não há React, DOM nem rede: só as perguntas, a leitura do que as
 * respostas significam e o texto que sai no WhatsApp. A tela apenas desenha o
 * que este arquivo decide — a ordem das perguntas muda sem tocar na interface.
 *
 * Três decisões que valem mais que todas as outras:
 *
 * 1. QUATRO perguntas, e não uma a mais. Este é tráfego frio de anúncio: cada
 *    etapa a mais qualifica um pouco melhor e custa uma fatia do volume, e a
 *    conta só fecha até certo ponto. A triagem profunda — motivo, situação
 *    atual, prova, documentos, honorários — já existe e acontece inteira no
 *    atendimento do WhatsApp, com o playbook do agente. Repetir aqui o que o
 *    atendimento vai perguntar de novo é comprar clique para jogar fora.
 *
 * 2. Telefone e nome NÃO são perguntados. A pessoa entra no WhatsApp no passo
 *    seguinte, e os dois chegam junto. Pedir antes é cobrar dado pessoal para
 *    não usar.
 *
 * 3. O texto do MIOLO é informativo, e essa restrição vem antes de qualquer
 *    meta de conversão. O Provimento 205/2021 do CFOAB permite impulsionar
 *    conteúdo informativo, mas veda oferta de serviço, captação, promessa de
 *    resultado e estímulo à litigância. Por isso as quatro perguntas e a tela
 *    final descrevem o que as normas tratam, sem dizer a ninguém que tem
 *    direito a receber.
 *
 *    A ABERTURA é a exceção, e é uma exceção deliberada: "Veja se você tem
 *    direito à indenização" foi escolhida pelo advogado responsável em
 *    15/08/2026, ciente de que a expressão pode ser lida como afirmação de
 *    direito individual e estímulo ao litígio. A decisão é dele, não um
 *    descuido de quem escreveu o arquivo — e fica registrada aqui para que
 *    ninguém a "conserte" achando que foi engano.
 *
 *    Consequência a não perder de vista: a abertura promete uma resposta que a
 *    tela final não dá, porque a tela final continua informativa. Se um dia as
 *    duas tiverem de contar a mesma história, é aqui que se decide qual das
 *    duas muda.
 */

export type Respostas = Record<string, string>;

export type Opcao = {
  valor: string;
  /** O que a pessoa lê no botão. */
  rotulo: string;
  /** Frase curta abaixo do rótulo, quando a opção precisa de contexto. */
  detalhe?: string;
};

export type Passo = {
  chave: string;
  pergunta: string;
  /** Linha de apoio, abaixo da pergunta. */
  ajuda?: string;
  tipo: 'opcoes' | 'texto';
  opcoes?: Opcao[];
  /** Atalhos clicáveis para um campo de texto (as instituições mais citadas). */
  sugestoes?: string[];
  placeholder?: string;
  /** Como o campo aparece no resumo enviado ao escritório. */
  rotuloResumo: string;
  somenteQuando?: (respostas: Respostas) => boolean;
  validar?: (valor: string) => string | null;
};

/**
 * A tela de abertura.
 *
 * Ela diz de que assunto a página trata e o que o questionário faz — nada além
 * disso. Sem promessa, sem gratuidade e sem convite a processar ninguém. Além
 * de ser a exigência do provimento, é a única tela que sai pronta no HTML do
 * build: é ela que aparece no instante em que o anúncio abre.
 */
export const ABERTURA = {
  olho: 'Direito do Consumidor',
  titulo: 'Veja se você tem direito à indenização.',
  texto: 'Bloqueio sem aviso, encerramento do nada, dinheiro preso lá dentro.',
  botao: 'Iniciar',
  nota: '4 perguntas',
};

/* --------------------------------------------------------------- o roteiro */

export const PASSOS: Passo[] = [
  {
    chave: 'banco',
    tipo: 'texto',
    pergunta: 'De qual instituição era a conta?',
    ajuda: 'Toque em um dos nomes ou escreva o seu.',
    placeholder: 'Nome do banco',
    sugestoes: ['Nubank', 'Mercado Pago', 'PicPay', 'Banco Inter', 'C6 Bank', 'Caixa'],
    rotuloResumo: 'Banco',
    validar: (valor) => (valor.trim().length < 2 ? 'Informe o nome da instituição.' : null),
  },
  {
    chave: 'aviso',
    tipo: 'opcoes',
    pergunta: 'Houve comunicação do banco antes, com a conta ainda em funcionamento?',
    ajuda: 'Comunicação recebida depois da restrição não é comunicação prévia.',
    rotuloResumo: 'Comunicação prévia',
    opcoes: [
      { valor: 'sem_aviso', rotulo: 'Não houve comunicação', detalhe: 'Soube quando tentei usar' },
      { valor: 'avisou_depois', rotulo: 'A comunicação veio depois', detalhe: 'A conta já estava restrita' },
      { valor: 'avisou_antes', rotulo: 'Sim, veio antes' },
      { valor: 'nao_lembro', rotulo: 'Não lembro' },
    ],
  },
  {
    chave: 'saldo',
    tipo: 'opcoes',
    pergunta: 'Havia saldo na conta quando isso aconteceu?',
    rotuloResumo: 'Saldo em conta',
    opcoes: [
      { valor: 'sim', rotulo: 'Sim, havia saldo' },
      { valor: 'nao', rotulo: 'Não, estava zerada' },
      { valor: 'nao_sei', rotulo: 'Não consigo consultar o saldo' },
    ],
  },
  {
    chave: 'quando',
    tipo: 'opcoes',
    pergunta: 'Quando isso ocorreu?',
    rotuloResumo: 'Quando ocorreu',
    opcoes: [
      { valor: 'este_mes', rotulo: 'Neste mês' },
      { valor: 'ate_6_meses', rotulo: 'Nos últimos 6 meses' },
      { valor: 'ate_1_ano', rotulo: 'Entre 6 meses e 1 ano' },
      { valor: 'ate_5_anos', rotulo: 'Entre 1 e 5 anos' },
      { valor: 'mais_5_anos', rotulo: 'Há mais de 5 anos' },
    ],
  },
];

/* ----------------------------------------------------------- utilitários */

/** Só os passos que fazem sentido diante do que já foi respondido. */
export function passosVisiveis(respostas: Respostas): Passo[] {
  return PASSOS.filter((passo) => !passo.somenteQuando || passo.somenteQuando(respostas));
}

/** A próxima pergunta sem resposta — ou nada, quando o roteiro terminou. */
export function proximoPasso(respostas: Respostas): Passo | undefined {
  return passosVisiveis(respostas).find((passo) => !respostas[passo.chave]);
}

/** De 0 a 1 — o quanto do questionário já foi vencido. */
export function progresso(respostas: Respostas): number {
  const visiveis = passosVisiveis(respostas);
  const respondidos = visiveis.filter((passo) => respostas[passo.chave]).length;
  return visiveis.length === 0 ? 1 : respondidos / visiveis.length;
}

/** O rótulo que a pessoa viu, para repetir no resumo. */
export function rotuloDaResposta(passo: Passo, valor: string): string {
  if (passo.tipo !== 'opcoes') return valor;
  return passo.opcoes?.find((opcao) => opcao.valor === valor)?.rotulo ?? valor;
}

/* ------------------------------------------------------------- a leitura */

export type Leitura = {
  /**
   * Cada ponto é uma frase sobre O TEMA, nunca sobre o caso de quem respondeu.
   *
   * A diferença não é de estilo. "A comunicação prévia é tratada na regulação
   * do Banco Central" é informação, e informação pode ser impulsionada. "Você
   * tem direito porque não te avisaram" é parecer jurídico feito por uma
   * página de anúncio a quem nunca foi cliente — e é exatamente o que o
   * Provimento 205/2021 chama de captação.
   */
  pontos: string[];
  /** O que o escritório precisa saber antes de responder. Nunca vai à tela. */
  alertas: string[];
};

export function avaliar(respostas: Respostas): Leitura {
  const pontos: string[] = [];
  const alertas: string[] = [];

  if (respostas.aviso === 'sem_aviso' || respostas.aviso === 'avisou_depois') {
    pontos.push(
      'A comunicação prévia ao correntista, antes do encerramento, é tratada na regulação do Banco Central.',
    );
  }
  if (respostas.aviso === 'nao_lembro') {
    pontos.push('O registro da comunicação enviada ao correntista fica com a instituição.');
  }
  if (respostas.saldo === 'sim' || respostas.saldo === 'nao_sei') {
    pontos.push('A devolução do saldo remanescente também é tratada nessa regulação.');
  }
  if (respostas.quando === 'mais_5_anos') {
    pontos.push('Fatos antigos envolvem prazos que precisam ser verificados caso a caso.');
    alertas.push('Fato com mais de 5 anos: conferir prazo antes de responder.');
  } else {
    pontos.push('O dever de informação ao consumidor está no Código de Defesa do Consumidor.');
  }

  if (respostas.aviso === 'avisou_antes') {
    alertas.push('Relata comunicação prévia: confirmar se a conta ainda funcionava na época.');
  }

  return { pontos, alertas };
}

/* ------------------------------------------------- a mensagem do WhatsApp */

/** De onde o clique veio, quando o anúncio marcou o endereço. */
export type Origem = {
  campanha?: string;
  anuncio?: string;
};

/**
 * O texto que abre no WhatsApp.
 *
 * Escrito na primeira pessoa, porque é a própria pessoa que aperta "enviar". E
 * em linhas rotuladas de propósito: do outro lado há um atendimento que lê a
 * conversa e aproveita cada campo já respondido, em vez de perguntar tudo de
 * novo.
 */
export function mensagemDoWhatsApp(respostas: Respostas, origem: Origem = {}): string {
  const linhas: string[] = [
    'Olá. Respondi o questionário do site sobre encerramento ou bloqueio de conta bancária e gostaria de informações sobre o atendimento.',
    '',
  ];

  for (const passo of passosVisiveis(respostas)) {
    const valor = respostas[passo.chave];
    if (!valor) continue;
    linhas.push(`${passo.rotuloResumo}: ${rotuloDaResposta(passo, valor)}`);
  }

  const referencia = [origem.campanha, origem.anuncio].filter(Boolean).join(' / ');
  linhas.push('', referencia ? `(Questionário do site — ${referencia})` : '(Questionário do site)');

  return linhas.join('\n');
}
