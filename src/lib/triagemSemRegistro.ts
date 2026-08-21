/**
 * O questionário da campanha "trabalhou sem registro em carteira".
 *
 * Aqui não há React, DOM nem rede: só as perguntas, a leitura do que as
 * respostas significam e o texto que sai no WhatsApp. A tela apenas desenha o
 * que este arquivo decide — a ordem das perguntas muda sem tocar na interface.
 *
 * É a mesma arquitetura de `triagemContaEncerrada.ts`, e as diferenças entre
 * as duas são propositais. Vale entender por quê antes de "uniformizar":
 *
 * 1. ESTA TRIAGEM É LONGA, e a outra tem quatro perguntas. Lá o objetivo é
 *    volume de tráfego frio; aqui o objetivo é o oposto — separar quem tem
 *    caso de quem não tem ANTES de ocupar um atendente. Cada pergunta a mais
 *    custa volume e devolve fila limpa, e neste fluxo a fila limpa vale mais.
 *
 * 2. ESTA TRIAGEM DESCLASSIFICA, e a outra nunca desclassifica. Quem não passa
 *    não recebe botão de WhatsApp, não vira lead e não chega ao CRM: a tela
 *    final é o fim do caminho. É decisão expressa do responsável — o custo de
 *    atender um caso prescrito é maior que o de perder um contato duvidoso.
 *
 * 3. ESTA TRIAGEM PEDE NOME, WHATSAPP E CIDADE, e a outra não pede nada. Lá o
 *    contato chega junto no WhatsApp e perguntar antes seria cobrar dado
 *    pessoal para não usar. Aqui o dado é pedido DEPOIS da qualificação, nunca
 *    antes — e nunca a quem foi desclassificado.
 *
 * ------------------------------------------------------------------------
 * REGISTRO DE UMA DECISÃO QUE NÃO É DESCUIDO
 *
 * O texto das telas finais ("Seu caso possui elementos que podem justificar
 * uma análise trabalhista", "Falar com um advogado") foi definido pelo
 * responsável e é mais assertivo que o da campanha de conta encerrada, que se
 * mantém estritamente informativa por causa do Provimento 205/2021 do CFOAB —
 * que veda oferta de serviço, captação, promessa de resultado e estímulo à
 * litigância em conteúdo impulsionado.
 *
 * A escolha é do advogado responsável e fica registrada aqui para que ninguém
 * a "conserte" achando que foi engano. O que este arquivo faz para reduzir a
 * exposição: nenhuma tela afirma que a pessoa TEM direito, que vai receber ou
 * quanto; fala-se em elementos, análise e critérios de atendimento. Se um dia
 * a campanha for revista, é nesta seção que a decisão muda.
 */

export type Respostas = Record<string, string>;

export type Opcao = {
  valor: string;
  /** O que a pessoa lê no botão. */
  rotulo: string;
  /** Frase curta abaixo do rótulo, quando a opção precisa de contexto. */
  detalhe?: string;
};

/** Por que o roteiro parou aqui. Vira a tela final, sem botão nenhum. */
export type Corte = {
  /** O texto que a pessoa lê. Nunca "você não tem direito". */
  motivo: string;
  /** Marcador que explica o corte na conferência interna. */
  tag?: string;
};

export type Passo = {
  chave: string;
  pergunta: string;
  /** Linha de apoio, abaixo da pergunta. */
  ajuda?: string;
  tipo: 'opcoes' | 'multipla' | 'moeda';
  opcoes?: Opcao[];
  placeholder?: string;
  /** Como o campo aparece no resumo enviado ao escritório. */
  rotuloResumo: string;
  somenteQuando?: (respostas: Respostas) => boolean;
  validar?: (valor: string) => string | null;
  /**
   * Em `multipla`: a opção que apaga todas as outras ("Nenhuma dessas").
   * Sem ela, a pessoa marca "nenhuma" junto com três marcadores e o resumo
   * chega se contradizendo.
   */
  exclusiva?: string;
  /**
   * A resposta encerra o questionário aqui.
   *
   * Só é consultada quando o próprio passo já foi respondido — é isso que
   * impede o corte de uma pergunta lá na frente de apagar as do meio.
   */
  corta?: (respostas: Respostas) => Corte | null;
};

/** Em `multipla`, as escolhas viram uma string só. */
export const SEPARADOR = '|';

/* --------------------------------------------------------------- abertura */

/**
 * A tela de abertura.
 *
 * É a única que sai pronta no HTML do build: é ela que aparece no instante em
 * que o anúncio abre, antes de qualquer JavaScript. Por isso o `<h1>` da
 * página mora aqui, e não na página que envolve a triagem.
 */
export const ABERTURA = {
  olho: 'Direito do Trabalho',
  titulo: 'Trabalhou sem registro em carteira?',
  texto:
    'Responda algumas perguntas e veja se o seu caso pode ser analisado por um advogado trabalhista.',
  botao: 'Verificar meu caso',
  nota: 'Leva cerca de 2 minutos',
};

/* --------------------------------------------------------------- o roteiro */

export const PASSOS: Passo[] = [
  {
    chave: 'sem_registro',
    tipo: 'opcoes',
    pergunta: 'Você trabalhou sem registro em carteira?',
    rotuloResumo: 'Trabalhou sem registro',
    opcoes: [
      { valor: 'sim', rotulo: 'Sim' },
      { valor: 'nao', rotulo: 'Não' },
    ],
    corta: (respostas) =>
      respostas.sem_registro === 'nao'
        ? {
            motivo:
              'Este atendimento é destinado a pessoas que trabalharam sem registro em carteira.',
          }
        : null,
  },

  {
    chave: 'ainda_trabalha',
    tipo: 'opcoes',
    pergunta: 'Você ainda trabalha nessa empresa?',
    rotuloResumo: 'Ainda trabalha lá',
    opcoes: [
      { valor: 'sim', rotulo: 'Sim, ainda trabalho' },
      { valor: 'nao', rotulo: 'Não, já saí' },
    ],
  },

  {
    chave: 'tempo_saida',
    tipo: 'opcoes',
    pergunta: 'Há quanto tempo foi o seu último dia de trabalho?',
    ajuda: 'Uma faixa aproximada já serve.',
    rotuloResumo: 'Saiu há',
    // Contrato em curso não prescreve: a pergunta não faz sentido e não é feita.
    somenteQuando: (respostas) => respostas.ainda_trabalha === 'nao',
    /*
      Faixas, e não data exata.

      Quem trabalhou sem registro raramente lembra o dia — costuma haver aviso
      nenhum, rescisão nenhuma e papel nenhum para conferir. Um campo de data
      obriga essa pessoa a inventar um número ou a desistir da tela, e a data
      inventada ainda chegaria ao escritório com cara de informação exata.
      A faixa é o que ela realmente sabe, e é tudo de que a triagem precisa: a
      decisão aqui é binária — dentro ou fora dos dois anos.

      A data de verdade é levantada no atendimento, junto com o que a sustenta.
    */
    opcoes: [
      { valor: 'ate_3_meses', rotulo: 'Menos de 3 meses' },
      { valor: '3_a_6_meses', rotulo: 'De 3 a 6 meses' },
      { valor: '6_meses_a_1_ano', rotulo: 'De 6 meses a 1 ano' },
      { valor: '1_a_2_anos', rotulo: 'De 1 a 2 anos' },
      { valor: 'mais_2_anos', rotulo: 'Mais de 2 anos' },
      {
        valor: 'nao_sei',
        rotulo: 'Não tenho certeza',
        /*
          Esta opção existe para não errar o corte.

          Quem hesita entre "quase dois anos" e "um pouco mais" seria empurrado
          para uma das duas faixas, e uma delas encerra o atendimento sem
          apelação. Na dúvida o caso segue e vai para análise manual: perder
          uma hora conferindo custa menos do que desligar na cara de quem tinha
          prazo de sobra.
        */
        detalhe: 'Alguém do escritório confere com você',
      },
    ],
    /*
      A prescrição bienal do art. 7º, XXIX, da Constituição: extinto o
      contrato, a ação tem dois anos. O corte é só na faixa que a própria
      pessoa afirma estar fora — e a tela diz "aparentemente", porque
      interrupção, suspensão e afastamento são matéria de análise humana.
    */
    corta: (respostas) =>
      respostas.tempo_saida === 'mais_2_anos'
        ? {
            motivo:
              'Pelo período informado, aparentemente já transcorreram mais de 2 anos desde o término do trabalho, o que pode impedir o ajuizamento da ação trabalhista.',
            tag: 'PRESCRICAO_BIENAL',
          }
        : null,
  },

  {
    chave: 'empregador',
    tipo: 'opcoes',
    pergunta: 'Para quem você trabalhava?',
    ajuda: 'Se tiver dúvida, escolha a última opção.',
    rotuloResumo: 'Empregador',
    opcoes: [
      { valor: 'privada', rotulo: 'Empresa privada' },
      { valor: 'pessoa_fisica', rotulo: 'Pessoa física' },
      { valor: 'domestico', rotulo: 'Empregador doméstico', detalhe: 'Trabalho na casa de alguém' },
      { valor: 'adm_direta', rotulo: 'Prefeitura, Estado ou União' },
      { valor: 'autarquia', rotulo: 'Autarquia ou órgão público' },
      {
        valor: 'empresa_publica',
        rotulo: 'Empresa pública ou de economia mista',
        detalhe: 'Correios, Caixa, Banco do Brasil e semelhantes',
      },
      { valor: 'nao_sei', rotulo: 'Não sei informar' },
    ],
    /*
      Administração Pública direta e autarquia saem do fluxo automático: sem
      concurso não há vínculo de emprego a reconhecer (Súmula 363 do TST), e o
      que sobra é matéria de análise específica — não de triagem de anúncio.

      Empresa pública e sociedade de economia mista NÃO saem. São regidas pela
      CLT, e o que existe ali é discussão sobre a forma de contratação — que é
      exatamente o que a análise manual serve para separar.
    */
    corta: (respostas) =>
      respostas.empregador === 'adm_direta' || respostas.empregador === 'autarquia'
        ? {
            motivo:
              'Vínculos com a Administração Pública direta, autarquias e fundações públicas seguem regras próprias e não são analisados por este atendimento.',
            tag: 'ADMINISTRACAO_PUBLICA',
          }
        : null,
  },

  /*
    Os quatro requisitos do art. 3º da CLT, um por tela e em linguagem de quem
    trabalhou, não de quem estudou Direito. Ninguém responde "havia
    pessoalidade?" — responde "você podia mandar outra pessoa no seu lugar?".
  */
  {
    chave: 'pessoalidade',
    tipo: 'opcoes',
    pergunta: 'Você trabalhava pessoalmente, sem poder mandar outra pessoa no seu lugar?',
    rotuloResumo: 'Pessoalidade',
    opcoes: [
      { valor: 'sim', rotulo: 'Sim, tinha que ser eu' },
      { valor: 'nao', rotulo: 'Não, podia mandar outra pessoa' },
    ],
  },
  {
    chave: 'onerosidade',
    tipo: 'opcoes',
    pergunta: 'Você recebia pagamento pelo trabalho?',
    rotuloResumo: 'Pagamento',
    /*
      Três respostas, e não "sim/não".

      "Salário certo por semana ou por mês" era um dos onze marcadores da
      antiga pergunta de múltipla escolha, e ali ele ficava perdido no meio de
      uniforme e ferramenta. Aqui ele é o que de fato é: a forma do pagamento,
      que separa quem tinha valor combinado de quem era pago por produção — e
      essa distinção diz mais sobre vínculo do que qualquer caixinha marcada.

      Os dois primeiros valores contam como onerosidade presente; só 'nao'
      afasta o requisito.
    */
    opcoes: [
      { valor: 'salario_fixo', rotulo: 'Sim, um valor certo por semana ou por mês' },
      { valor: 'por_servico', rotulo: 'Sim, por serviço ou por produção' },
      { valor: 'nao', rotulo: 'Não recebia' },
    ],
  },
  {
    chave: 'habitualidade',
    tipo: 'opcoes',
    pergunta: 'Você trabalhava com frequência para essa pessoa ou empresa?',
    ajuda: 'Frequência é trabalhar de forma repetida, não um serviço isolado.',
    rotuloResumo: 'Frequência',
    opcoes: [
      { valor: 'sim', rotulo: 'Sim, era frequente' },
      { valor: 'nao', rotulo: 'Não, foi coisa pontual' },
    ],
  },
  {
    chave: 'subordinacao',
    tipo: 'opcoes',
    pergunta: 'Recebia ordens ou tinha que seguir horários, regras ou determinações de alguém?',
    rotuloResumo: 'Subordinação',
    opcoes: [
      { valor: 'sim', rotulo: 'Sim' },
      { valor: 'nao', rotulo: 'Não, eu decidia como e quando' },
    ],
  },

  /*
    Os marcadores do dia a dia, em três perguntas de três — e não em uma de
    onze.

    Uma tela com onze caixas quebra a promessa do formato: mostra de uma vez o
    tamanho do trabalho, obriga a rolar duas vezes só para achar o botão e é
    onde se desiste. Quebrada em três, cada tela é uma pergunta que a pessoa
    reconhece de imediato — horário, chefia, estrutura —, cabe sem rolagem e
    ainda melhora a resposta: agrupado por tema, ninguém deixa de marcar o que
    valia para si porque cansou de ler.

    A conta interna é a mesma: os três grupos somam no lugar do antigo campo
    único (ver `GRUPOS_MARCADORES`).
  */
  {
    chave: 'rotina',
    tipo: 'multipla',
    pergunta: 'Você tinha hora para trabalhar?',
    ajuda: 'Marque o que valia no seu caso.',
    rotuloResumo: 'Rotina',
    exclusiva: 'nenhuma',
    opcoes: [
      { valor: 'horario', rotulo: 'Tinha horário para entrar e sair' },
      { valor: 'ponto', rotulo: 'Batia ponto' },
      { valor: 'quase_todos_dias', rotulo: 'Trabalhava todos ou quase todos os dias' },
      { valor: 'nenhuma', rotulo: 'Nenhuma dessas' },
    ],
    validar: (valor) => (valor ? null : 'Marque uma opção para continuar.'),
  },
  {
    chave: 'chefia',
    tipo: 'multipla',
    pergunta: 'Alguém mandava no seu trabalho?',
    ajuda: 'Marque o que valia no seu caso.',
    rotuloResumo: 'Chefia',
    exclusiva: 'nenhuma',
    opcoes: [
      { valor: 'chefe', rotulo: 'Recebia ordens de chefe ou supervisor' },
      { valor: 'faltas', rotulo: 'Precisava justificar faltas' },
      { valor: 'metas', rotulo: 'Tinha metas para cumprir' },
      { valor: 'nenhuma', rotulo: 'Nenhuma dessas' },
    ],
    validar: (valor) => (valor ? null : 'Marque uma opção para continuar.'),
  },
  {
    chave: 'estrutura',
    tipo: 'multipla',
    pergunta: 'O que era da empresa?',
    ajuda: 'Marque o que valia no seu caso.',
    rotuloResumo: 'Estrutura',
    exclusiva: 'nenhuma',
    opcoes: [
      { valor: 'dentro', rotulo: 'Trabalhava dentro da empresa' },
      { valor: 'equipamentos', rotulo: 'Usava ferramentas ou equipamentos da empresa' },
      { valor: 'uniforme', rotulo: 'Usava uniforme' },
      { valor: 'nenhuma', rotulo: 'Nenhuma dessas' },
    ],
    validar: (valor) => (valor ? null : 'Marque uma opção para continuar.'),
  },

  {
    chave: 'pejotizacao',
    tipo: 'opcoes',
    pergunta: 'A empresa chegou a exigir que você abrisse MEI ou emitisse nota fiscal?',
    rotuloResumo: 'Exigiram MEI ou nota fiscal',
    opcoes: [
      { valor: 'sim', rotulo: 'Sim, exigiram' },
      { valor: 'nao', rotulo: 'Não' },
    ],
  },

  {
    chave: 'exclusividade',
    tipo: 'opcoes',
    pergunta: 'Você trabalhava principalmente para essa empresa ou atendia várias ao mesmo tempo?',
    rotuloResumo: 'Exclusividade',
    opcoes: [
      { valor: 'principal', rotulo: 'Principalmente para essa empresa' },
      { valor: 'varias', rotulo: 'Para várias empresas ou clientes' },
      { valor: 'nao_sei', rotulo: 'Não sei informar' },
    ],
  },

  {
    chave: 'duracao',
    tipo: 'opcoes',
    pergunta: 'Por quanto tempo você trabalhou sem registro?',
    rotuloResumo: 'Tempo sem registro',
    opcoes: [
      { valor: 'ate_1_mes', rotulo: 'Menos de 1 mês' },
      { valor: '1_a_3_meses', rotulo: 'De 1 a 3 meses' },
      { valor: '3_a_6_meses', rotulo: 'De 3 a 6 meses' },
      { valor: '6_meses_a_1_ano', rotulo: 'De 6 meses a 1 ano' },
      { valor: 'mais_1_ano', rotulo: 'Mais de 1 ano' },
    ],
  },

  {
    chave: 'remuneracao',
    tipo: 'moeda',
    pergunta: 'Qual era aproximadamente o seu salário ou remuneração mensal?',
    ajuda: 'Um valor aproximado já serve.',
    placeholder: 'R$ 0,00',
    rotuloResumo: 'Remuneração mensal',
    validar: (valor) =>
      centavosDaMoeda(valor) > 0 ? null : 'Informe um valor, mesmo que aproximado.',
  },

  {
    chave: 'termino',
    tipo: 'opcoes',
    pergunta: 'Como terminou o trabalho?',
    rotuloResumo: 'Como terminou',
    /*
      Quem acabou de dizer que ainda trabalha lá não é perguntado como terminou
      — a resposta já está no resumo, na pergunta 2. Perguntar de novo é o tipo
      de tela que faz a pessoa desconfiar de que ninguém leu o que ela respondeu.
    */
    somenteQuando: (respostas) => respostas.ainda_trabalha === 'nao',
    opcoes: [
      { valor: 'demitido', rotulo: 'Fui demitido' },
      { valor: 'pedi', rotulo: 'Pedi demissão' },
      {
        valor: 'rescisao_indireta',
        rotulo: 'Parei porque a empresa descumpria minhas condições de trabalho',
      },
      { valor: 'fechou', rotulo: 'A empresa fechou' },
      { valor: 'outro', rotulo: 'Outro motivo' },
    ],
  },
];

/* ------------------------------------------------------------ utilitários */

/**
 * Só os passos que fazem sentido diante do que já foi respondido.
 *
 * O corte entra aqui e não numa checagem separada: quando um passo respondido
 * corta, a lista termina nele. Como `proximoPasso` procura nesta lista, o
 * questionário se encerra sozinho — sem nenhum `if` na tela.
 */
export function passosVisiveis(respostas: Respostas): Passo[] {
  const visiveis: Passo[] = [];

  for (const passo of PASSOS) {
    if (passo.somenteQuando && !passo.somenteQuando(respostas)) continue;
    visiveis.push(passo);
    if (respostas[passo.chave] && passo.corta?.(respostas)) break;
  }

  return visiveis;
}

/** O corte que encerrou o questionário — ou nada, se ele seguiu até o fim. */
export function corteAtingido(respostas: Respostas): Corte | null {
  for (const passo of passosVisiveis(respostas)) {
    if (!respostas[passo.chave]) return null;
    const corte = passo.corta?.(respostas);
    if (corte) return corte;
  }
  return null;
}

/** A próxima pergunta sem resposta — ou nada, quando o roteiro terminou. */
export function proximoPasso(respostas: Respostas): Passo | undefined {
  return passosVisiveis(respostas).find((passo) => !respostas[passo.chave]);
}

/**
 * De 0 a 1 — o quanto do questionário já foi vencido.
 *
 * A conta é contra a lista VISÍVEL, que muda de tamanho conforme as respostas.
 * Ela nunca anda para trás porque um passo condicional só entra na lista no
 * mesmo instante em que o passo que o liberou passa a contar como respondido:
 * o numerador e o denominador crescem juntos. E quando um corte encerra o
 * roteiro a barra vai a 100%, que é a verdade — não há mais pergunta.
 */
export function progresso(respostas: Respostas): number {
  const visiveis = passosVisiveis(respostas);
  const respondidos = visiveis.filter((passo) => respostas[passo.chave]).length;
  return visiveis.length === 0 ? 1 : respondidos / visiveis.length;
}

/** O rótulo que a pessoa viu, para repetir no resumo. */
export function rotuloDaResposta(passo: Passo, valor: string): string {
  if (passo.tipo === 'multipla') {
    return valor
      .split(SEPARADOR)
      .map((item) => passo.opcoes?.find((opcao) => opcao.valor === item)?.rotulo ?? item)
      .join(', ');
  }
  if (passo.tipo !== 'opcoes') return valor;
  return passo.opcoes?.find((opcao) => opcao.valor === valor)?.rotulo ?? valor;
}

/* ------------------------------------------------------------------ moeda */

/** O que o campo monetário guarda por trás do texto formatado. */
export function centavosDaMoeda(valor: string): number {
  const digitos = valor.replace(/\D/g, '');
  return digitos ? Number(digitos) : 0;
}

/**
 * Máscara de digitação, da direita para a esquerda.
 *
 * O campo não tem separador para a pessoa acertar: ela digita `180000` e lê
 * `R$ 1.800,00` se formando. É o formato que erra menos no celular, onde o
 * teclado numérico não tem vírgula garantida.
 */
export function moedaDeDigitos(bruto: string): string {
  const digitos = bruto.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 11);
  if (!digitos) return '';
  return (Number(digitos) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/* --------------------------------------------------------------- a leitura */

export type Desfecho = 'qualificado' | 'analise_manual' | 'desclassificado';

export type Leitura = {
  desfecho: Desfecho;
  /** Só quando desclassificado: o texto da tela final. */
  motivo?: string;
  /** Marcadores que acompanham o lead até o CRM. */
  tags: string[];
  /** As frases da tela final. Vazio quando desclassificado. */
  pontos: string[];
  /** O que o escritório precisa saber antes de responder. */
  alertas: string[];
  /** 0 a 100 — serve para ordenar a fila, nunca para decidir sozinho. */
  pontuacao: number;
};

/**
 * Os quatro requisitos do art. 3º da CLT e como cada um se lê nas respostas.
 *
 * `presente` existe porque `onerosidade` deixou de ser sim/não: as duas formas
 * de pagamento contam, e só "não recebia" afasta o requisito. Sem o predicado,
 * quem era pago por produção apareceria como se nunca tivesse recebido nada.
 */
const REQUISITOS: { chave: string; nome: string; presente: (valor: string) => boolean }[] = [
  { chave: 'pessoalidade', nome: 'pessoalidade', presente: (valor) => valor === 'sim' },
  { chave: 'onerosidade', nome: 'onerosidade', presente: (valor) => valor !== 'nao' },
  { chave: 'habitualidade', nome: 'habitualidade', presente: (valor) => valor === 'sim' },
  { chave: 'subordinacao', nome: 'subordinação', presente: (valor) => valor === 'sim' },
];

/** As três perguntas que somam marcadores do dia a dia. */
export const GRUPOS_MARCADORES = ['rotina', 'chefia', 'estrutura'] as const;

/** Quantos marcadores de vínculo a pessoa reconheceu, somando os três grupos. */
export function contarMarcadores(respostas: Respostas): number {
  const dosGrupos = GRUPOS_MARCADORES.flatMap((chave) =>
    (respostas[chave] ?? '').split(SEPARADOR).filter((item) => item && item !== 'nenhuma'),
  ).length;

  // O salário certo por semana ou por mês era um dos marcadores antes de virar
  // resposta da pergunta de pagamento. Ele continua contando.
  return dosGrupos + (respostas.onerosidade === 'salario_fixo' ? 1 : 0);
}

const PESO_DURACAO: Record<string, number> = {
  ate_1_mes: 0,
  '1_a_3_meses': 3,
  '3_a_6_meses': 5,
  '6_meses_a_1_ano': 8,
  mais_1_ano: 10,
};

/**
 * A pontuação, e o que ela NÃO é.
 *
 * Ela ordena a fila do atendimento — quem responder com mais marcadores de
 * vínculo aparece antes. Ela não classifica: o desfecho abaixo é decidido por
 * regras nomeadas, uma a uma, e nunca por um número passar de um limiar. Um
 * caso de 40 pontos pode ser excelente com um documento na mão, e nenhuma
 * planilha sabe disso.
 */
function pontuar(respostas: Respostas): number {
  const requisitos =
    REQUISITOS.filter(({ chave, presente }) => respostas[chave] && presente(respostas[chave]))
      .length * 15;

  const tratamento = Math.min(contarMarcadores(respostas) * 3, 30);

  const duracao = PESO_DURACAO[respostas.duracao ?? ''] ?? 0;

  return Math.min(requisitos + tratamento + duracao, 100);
}

/**
 * O desfecho.
 *
 * Três saídas, e a ordem entre elas importa: o corte vence tudo, a análise
 * manual vence a qualificação, e só sobra "qualificado" quando nenhuma dúvida
 * foi levantada. Errar para o lado da análise manual custa um atendimento;
 * errar para o lado da qualificação custa uma expectativa criada.
 */
export function avaliar(respostas: Respostas): Leitura {
  const tags = ['SEM_REGISTRO'];
  const alertas: string[] = [];
  const pontos: string[] = [];

  const corte = corteAtingido(respostas);
  if (corte) {
    if (corte.tag) tags.push(corte.tag);
    tags.push('DESCLASSIFICADO');
    return { desfecho: 'desclassificado', motivo: corte.motivo, tags, pontos: [], alertas, pontuacao: 0 };
  }

  const pontuacao = pontuar(respostas);
  const duvidas: string[] = [];

  const faltantes = REQUISITOS.filter(
    ({ chave, presente }) => respostas[chave] && !presente(respostas[chave]),
  );
  if (faltantes.length > 0) {
    duvidas.push(
      `Respostas incompatíveis com vínculo: ${faltantes.map((item) => item.nome).join(', ')}.`,
    );
  }

  if (respostas.empregador === 'empresa_publica') {
    duvidas.push('Empresa pública ou sociedade de economia mista: verificar exigência de concurso.');
  }
  if (respostas.empregador === 'nao_sei') {
    duvidas.push('A pessoa não sabe identificar o empregador.');
  }
  if (respostas.tempo_saida === 'nao_sei') {
    duvidas.push('Não soube dizer há quanto tempo saiu: levantar a data antes de qualquer prazo.');
  }
  if (respostas.pejotizacao === 'sim') {
    tags.push('POSSIVEL_PEJOTIZACAO');
    duvidas.push('Exigiram MEI ou nota fiscal: possível pejotização.');
  }
  if (respostas.exclusividade === 'varias') {
    duvidas.push('Atendia várias empresas ao mesmo tempo.');
  }
  if (respostas.exclusividade === 'nao_sei') {
    duvidas.push('Não soube dizer se havia outros clientes.');
  }

  /*
    Zero marcadores nos três grupos é sinal de que a relação não se parece com
    emprego — mas pode ser também alguém que respondeu depressa. Vai para
    análise manual, e não para o corte.
  */
  const respondeuOsGrupos = GRUPOS_MARCADORES.every((chave) => respostas[chave]);
  if (respondeuOsGrupos && contarMarcadores(respostas) === 0) {
    duvidas.push('Não marcou nenhum indício de como era tratado no dia a dia.');
  }

  /*
    A quinquenal fica guardada e não é explicada durante o formulário: em regra
    os créditos alcançam os cinco anos anteriores ao ajuizamento, ainda que o
    contrato tenha durado mais. É informação de atendimento, não de triagem —
    dizer isso a quem está respondendo a nona pergunta só encurta a conversa.
  */
  if (respostas.duracao === 'mais_1_ano') {
    alertas.push(
      'Em regra os créditos trabalhistas alcançam os 5 anos anteriores ao ajuizamento (prescrição quinquenal).',
    );
  }
  if (respostas.ainda_trabalha === 'sim') {
    alertas.push('Contrato em curso: não corre a prescrição bienal.');
  }
  /*
    Um a dois anos passa na triagem e ainda assim é o caso mais urgente da
    fila: a faixa termina exatamente onde a prescrição bienal começa. Fica como
    alerta, e não como dúvida, porque mandar para análise manual atrasaria
    justamente quem tem menos tempo.
  */
  if (respostas.tempo_saida === '1_a_2_anos') {
    alertas.push('PRAZO CURTO: saiu há 1 a 2 anos — conferir a data exata antes de tudo.');
  }
  if (respostas.termino === 'rescisao_indireta') {
    alertas.push('Relata descumprimento pelo empregador: avaliar rescisão indireta.');
  }
  if (respostas.termino === 'fechou') {
    alertas.push('Empresa fechada: conferir sócios e sucessão antes de ajuizar.');
  }

  alertas.push(...duvidas);

  const presentes = REQUISITOS.filter(
    ({ chave, presente }) => respostas[chave] && presente(respostas[chave]),
  );
  if (presentes.length > 0) {
    pontos.push(
      `Você indicou ${presentes.map((item) => item.nome).join(', ')} na relação de trabalho.`,
    );
  }
  if (respostas.ainda_trabalha === 'sim') {
    pontos.push('O trabalho continua, e por isso o prazo para reclamar ainda não começou a correr.');
  } else if (respostas.tempo_saida && respostas.tempo_saida !== 'nao_sei') {
    pontos.push('O período informado está dentro do prazo de 2 anos para ajuizar a reclamação.');
  }
  if (respostas.pejotizacao === 'sim') {
    pontos.push('Exigir MEI ou nota fiscal não afasta, por si só, a análise do vínculo.');
  }

  if (duvidas.length > 0) {
    tags.push('ANALISE_MANUAL');
    return { desfecho: 'analise_manual', tags, pontos, alertas, pontuacao };
  }

  tags.push('QUALIFICADO');
  return { desfecho: 'qualificado', tags, pontos, alertas, pontuacao };
}

/* ----------------------------------------------------------- telas finais */

export const FECHOS = {
  qualificado: {
    selo: 'Respostas registradas',
    titulo: 'Seu caso possui elementos que podem justificar uma análise trabalhista.',
    botao: 'Falar com um advogado',
  },
  analise_manual: {
    selo: 'Respostas registradas',
    titulo: 'Precisamos analisar algumas informações adicionais do seu caso.',
    botao: 'Enviar para análise',
  },
  desclassificado: {
    selo: 'Obrigado por responder',
    titulo: 'Pelas informações apresentadas, este caso não se enquadra atualmente nos critérios deste atendimento.',
  },
} as const;

/* --------------------------------------------------------------- o contato */

export type Contato = {
  nome: string;
  telefone: string;
  cidade: string;
};

export const CONTATO_VAZIO: Contato = { nome: '', telefone: '', cidade: '' };

/** `(65) 98404-6375`, montado enquanto se digita. */
export function telefoneFormatado(bruto: string): string {
  const digitos = bruto.replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

/** O que impede o envio, campo a campo. Vazio quando está tudo certo. */
export function conferirContato(contato: Contato): Partial<Record<keyof Contato, string>> {
  const problemas: Partial<Record<keyof Contato, string>> = {};

  if (contato.nome.trim().length < 3) problemas.nome = 'Informe o seu nome completo.';

  const digitos = contato.telefone.replace(/\D/g, '');
  if (digitos.length < 10 || digitos.length > 11) {
    problemas.telefone = 'Informe o WhatsApp com DDD.';
  }

  if (contato.cidade.trim().length < 3) problemas.cidade = 'Informe a cidade e o estado.';

  return problemas;
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
 *
 * O bloco final é o que o CRM lê — marcadores, pontuação e observações. Ele
 * fica visível para quem envia, e é assim de propósito: nada ali envergonha a
 * pessoa, e um resumo escondido em campo invisível seria dado coletado sem
 * ela ver.
 */
export function mensagemDoWhatsApp(
  respostas: Respostas,
  leitura: Leitura,
  contato: Contato = CONTATO_VAZIO,
  origem: Origem = {},
): string {
  const linhas: string[] = [
    'Olá. Respondi o questionário do site sobre trabalho sem registro em carteira e gostaria de falar sobre o meu caso.',
    '',
  ];

  if (contato.nome.trim()) linhas.push(`Nome: ${contato.nome.trim()}`);
  if (contato.cidade.trim()) linhas.push(`Cidade/UF: ${contato.cidade.trim()}`);
  if (contato.telefone.trim()) linhas.push(`WhatsApp: ${contato.telefone.trim()}`);
  if (linhas.length > 2) linhas.push('');

  for (const passo of passosVisiveis(respostas)) {
    const valor = respostas[passo.chave];
    if (!valor) continue;
    linhas.push(`${passo.rotuloResumo}: ${rotuloDaResposta(passo, valor)}`);
  }

  const referencia = [origem.campanha, origem.anuncio].filter(Boolean).join(' / ');

  linhas.push(
    '',
    '--- uso interno do escritório ---',
    `Triagem: ${leitura.tags.join(', ')}`,
    `Pontuação: ${leitura.pontuacao}/100`,
  );

  for (const alerta of leitura.alertas) linhas.push(`- ${alerta}`);

  linhas.push(
    '',
    referencia ? `(Questionário do site — ${referencia})` : '(Questionário do site)',
  );

  return linhas.join('\n');
}
