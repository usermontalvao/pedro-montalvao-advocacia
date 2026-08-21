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
 *    E o corte é TUDO OU NADA, não uma soma. Os requisitos do art. 3º da CLT
 *    são cumulativos: faltando um só, não há vínculo a reconhecer. Por isso
 *    cada requisito corta no seu próprio passo e não existe nota do tipo
 *    "preencheu 4 de 5" — um número desses faria três requisitos e meio
 *    parecerem um caso fraco, quando na verdade são outro instituto jurídico.
 *    Ver `REQUISITOS`, mais abaixo, antes de mexer em qualquer um deles.
 *
 * 3. ESTA TRIAGEM TAMBÉM NÃO PEDE NOME NEM TELEFONE. Houve uma versão que
 *    pedia — nome, WhatsApp e cidade, num formulário na tela final — e ela foi
 *    removida em 20/08/2026 pelo mesmo motivo da outra campanha: quem toca no
 *    botão entra no WhatsApp no instante seguinte, e nome e número chegam
 *    junto, escritos pelo próprio aplicativo. Pedir antes é cobrar três campos
 *    para receber de novo o que já viria — e três campos no fim do funil é
 *    onde mais se desiste.
 *
 *    O que NÃO chega sozinho pelo WhatsApp é a cidade. Se um dia ela fizer
 *    falta no atendimento, o lugar dela é como pergunta do roteiro, entre as
 *    outras, e não como formulário depois do resultado.
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
  tipo: 'opcoes';
  opcoes?: Opcao[];
  /** Como o campo aparece no resumo enviado ao escritório. */
  rotuloResumo: string;
  somenteQuando?: (respostas: Respostas) => boolean;
  /**
   * A resposta encerra o questionário aqui.
   *
   * Só é consultada quando o próprio passo já foi respondido — é isso que
   * impede o corte de uma pergunta lá na frente de apagar as do meio.
   */
  corta?: (respostas: Respostas) => Corte | null;
};

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
    pergunta: 'Você podia mandar outra pessoa trabalhar no seu lugar quando quisesse?',
    ajuda: 'Sem precisar pedir para a empresa.',
    rotuloResumo: 'Podia mandar outra pessoa',
    /*
      A pergunta foi virada do avesso de propósito.

      Antes ela era "você trabalhava pessoalmente, SEM poder mandar outra
      pessoa?" — uma dupla negativa, em que "sim" queria dizer "não podia". É o
      tipo de frase que quem está com pressa lê pela metade e responde ao
      contrário. Perguntada de frente ("podia mandar outra pessoa?"), não há o
      que interpretar.

      A opção do meio é a que evita o erro caro. Substituir alguém COM
      autorização da empresa não afasta a pessoalidade — o que a afasta é poder
      trocar por conta própria, quando quiser. Sem esse degrau, quem já mandou
      um colega no seu lugar uma vez, avisando o patrão, responderia "sim" e
      seria desclassificado por engano.
    */
    opcoes: [
      { valor: 'livremente', rotulo: 'Sim, eu podia mandar quem eu quisesse' },
      { valor: 'com_autorizacao', rotulo: 'Só se a empresa autorizasse' },
      { valor: 'nao', rotulo: 'Não, tinha que ser eu' },
    ],
    corta: (respostas) =>
      respostas.pessoalidade === 'livremente'
        ? {
            motivo:
              'Quando o trabalho pode ser passado a outra pessoa, escolhida livremente por quem foi contratado, falta a pessoalidade — um dos requisitos que a CLT exige, em conjunto, para reconhecer vínculo de emprego.',
            tag: 'SEM_PESSOALIDADE',
          }
        : null,
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
    corta: (respostas) =>
      respostas.onerosidade === 'nao'
        ? {
            motivo:
              'A relação de emprego é onerosa: sem pagamento pelo trabalho, falta um dos requisitos que a CLT exige em conjunto.',
            tag: 'SEM_ONEROSIDADE',
          }
        : null,
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
    corta: (respostas) =>
      respostas.habitualidade === 'nao'
        ? {
            motivo:
              'Trabalho eventual, feito de forma isolada, não preenche a habitualidade — um dos requisitos que a CLT exige em conjunto para o vínculo de emprego.',
            tag: 'SEM_HABITUALIDADE',
          }
        : null,
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
    corta: (respostas) =>
      respostas.subordinacao === 'nao'
        ? {
            motivo:
              'Quem organiza o próprio trabalho, sem ordens nem controle sobre horário e forma de execução, trabalha de forma autônoma — falta a subordinação, um dos requisitos que a CLT exige em conjunto.',
            tag: 'SEM_SUBORDINACAO',
          }
        : null,
  },

  /*
    Os indícios do dia a dia, em três perguntas de resposta ÚNICA.

    Passaram por duas formas antes desta. Primeiro uma tela só, com onze
    caixas: mostrava de uma vez o tamanho do trabalho e exigia duas rolagens
    para achar o botão. Depois três telas de múltipla escolha, que resolveram o
    tamanho e criaram outro problema — no meio de um questionário em que toda
    pergunta anda sozinha ao toque, três telas seguidas passaram a exigir
    marcar e depois confirmar. O dedo que vinha em ritmo de um toque batia num
    "Continuar" que ninguém esperava.

    Resposta única resolve os dois: uma tela por tema, um toque, segue. O que
    se perde é a granularidade de saber exatamente quais indícios existiam; o
    que se ganha é que a pessoa chega ao fim. Cada alternativa nomeia os
    indícios que representa, então o resumo que chega ao escritório continua
    dizendo o que aconteceu — só não em forma de lista.

    A ordem das alternativas é sempre a mesma: mais indícios em cima, nenhum
    embaixo. É `PESO_INDICIOS`, adiante, que transforma isso em número.
  */
  {
    chave: 'rotina',
    tipo: 'opcoes',
    pergunta: 'Você tinha horário para cumprir?',
    rotuloResumo: 'Horário',
    opcoes: [
      { valor: 'fixo_com_ponto', rotulo: 'Sim, horário fixo e batia ponto' },
      { valor: 'com_horario', rotulo: 'Sim, tinha horário, mas sem bater ponto' },
      { valor: 'livre', rotulo: 'Não, eu escolhia quando trabalhar' },
    ],
  },
  {
    chave: 'chefia',
    tipo: 'opcoes',
    pergunta: 'Quem organizava o seu trabalho no dia a dia?',
    rotuloResumo: 'Organização do trabalho',
    opcoes: [
      { valor: 'chefe_direto', rotulo: 'Tinha um chefe ou supervisor direto' },
      { valor: 'instrucoes', rotulo: 'Recebia instruções da empresa, sem chefe fixo' },
      { valor: 'ninguem', rotulo: 'Ninguém, eu me organizava sozinho' },
    ],
  },
  {
    chave: 'estrutura',
    tipo: 'opcoes',
    pergunta: 'O local e as ferramentas eram da empresa?',
    rotuloResumo: 'Estrutura',
    opcoes: [
      {
        valor: 'tudo_da_empresa',
        rotulo: 'Sim, trabalhava lá e usava o que era deles',
        detalhe: 'Local, equipamentos e uniforme',
      },
      { valor: 'em_parte', rotulo: 'Em parte, alguma coisa era da empresa' },
      { valor: 'nada', rotulo: 'Não, era tudo meu' },
    ],
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
    tipo: 'opcoes',
    pergunta: 'Quanto você recebia por mês, mais ou menos?',
    ajuda: 'Uma faixa aproximada já serve.',
    rotuloResumo: 'Remuneração mensal',
    /*
      Faixas, e não um campo de digitar — pelo mesmo motivo do tempo de saída.

      Quem trabalhou sem registro não tem holerite para conferir, costuma ter
      recebido valores diferentes a cada mês e, num teclado de celular, digitar
      "1800" e ver "R$ 18,00" se formando é o tipo de atrito que faz fechar a
      aba. A faixa é o que a pessoa sabe de cabeça.

      É também o que fecha o roteiro: sem este campo, NENHUMA pergunta pede
      confirmação — todas as catorze andam sozinhas ao toque.

      Os valores são redondos de propósito. Ancorar no salário mínimo faria a
      pergunta envelhecer sozinha todo mês de janeiro, e ninguém lembraria de
      atualizar aqui.
    */
    opcoes: [
      { valor: 'ate_1600', rotulo: 'Até R$ 1.600' },
      { valor: '1600_a_2500', rotulo: 'De R$ 1.600 a R$ 2.500' },
      { valor: '2500_a_4000', rotulo: 'De R$ 2.500 a R$ 4.000' },
      { valor: '4000_a_7000', rotulo: 'De R$ 4.000 a R$ 7.000' },
      { valor: 'mais_7000', rotulo: 'Mais de R$ 7.000' },
      { valor: 'variava', rotulo: 'Variava muito de um mês para o outro' },
    ],
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
  return passo.opcoes?.find((opcao) => opcao.valor === valor)?.rotulo ?? valor;
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
  /** Quantos indícios do dia a dia a pessoa reconheceu. Descreve, não classifica. */
  marcadores: number;
};

/**
 * Os requisitos do art. 3º da CLT — e a regra é TODOS OU NENHUM.
 *
 * "Empregado é toda pessoa física que prestar serviços de natureza não
 * eventual a empregador, sob a dependência deste e mediante salário." São
 * requisitos cumulativos: faltando um, não há vínculo a reconhecer — e é por
 * isso que cada um deles corta o questionário no próprio passo, em vez de
 * descontar pontos de um total.
 *
 * Não existe, e não deve voltar a existir, nota do tipo "preencheu 4 de 5".
 * Um número assim sugere que três requisitos e meio ainda valem alguma coisa,
 * e não valem: sem subordinação o caso não é fraco, é outro instituto.
 *
 * Sobre o requisito "ser pessoa física": ele é atendido por definição neste
 * fluxo — quem responde é a própria pessoa que trabalhou. Ter aberto MEI ou
 * emitido nota fiscal NÃO o afasta; é exatamente a hipótese de pejotização,
 * que segue para análise manual, não para o corte.
 *
 * Esta lista continua existindo depois de os cortes terem sido criados porque
 * é ela que escreve, na tela final e no resumo, quais requisitos apareceram.
 * Se um dia um corte for removido daqui, a lista sozinha não desclassifica
 * ninguém — os dois lugares precisam andar juntos.
 */
const REQUISITOS: { chave: string; nome: string; presente: (valor: string) => boolean }[] = [
  { chave: 'pessoalidade', nome: 'pessoalidade', presente: (valor) => valor !== 'livremente' },
  { chave: 'onerosidade', nome: 'onerosidade', presente: (valor) => valor !== 'nao' },
  { chave: 'habitualidade', nome: 'habitualidade', presente: (valor) => valor === 'sim' },
  { chave: 'subordinacao', nome: 'subordinação', presente: (valor) => valor === 'sim' },
];

/** As três perguntas de indício do dia a dia. */
export const GRUPOS_MARCADORES = ['rotina', 'chefia', 'estrutura'] as const;

/**
 * Quanto cada resposta pesa como indício de vínculo: 2, 1 ou 0.
 *
 * Isto NÃO é a nota que foi banida daqui. Aquela decidia — dizia se o caso
 * valia ou não pelo total de pontos. Esta só descreve, e o desfecho nem a
 * consulta: os requisitos do art. 3º já cortaram antes, um a um, e o que sobra
 * é o escritório saber se chega uma conversa com muito ou pouco indício antes
 * de abrir o WhatsApp. O único lugar em que o número muda alguma coisa é o
 * zero, que é contradição pura e vai para análise manual.
 */
const PESO_INDICIOS: Record<string, number> = {
  fixo_com_ponto: 2,
  com_horario: 1,
  livre: 0,
  chefe_direto: 2,
  instrucoes: 1,
  ninguem: 0,
  tudo_da_empresa: 2,
  em_parte: 1,
  nada: 0,
};

/** De 0 a 7 — o quanto o dia a dia relatado se parece com emprego. */
export function contarMarcadores(respostas: Respostas): number {
  const dosGrupos = GRUPOS_MARCADORES.reduce(
    (total, chave) => total + (PESO_INDICIOS[respostas[chave] ?? ''] ?? 0),
    0,
  );

  // O salário certo por semana ou por mês também é indício, e vem da pergunta
  // de pagamento — que já existia antes destas três.
  return dosGrupos + (respostas.onerosidade === 'salario_fixo' ? 1 : 0);
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
    return {
      desfecho: 'desclassificado',
      motivo: corte.motivo,
      tags,
      pontos: [],
      alertas,
      marcadores: 0,
    };
  }

  const marcadores = contarMarcadores(respostas);
  const duvidas: string[] = [];

  /*
    Chegar aqui já significa que os quatro requisitos apareceram: cada um deles
    corta o questionário no próprio passo quando falta. Esta conferência existe
    como rede — se um dia um `corta` for removido por engano, o caso não passa
    calado como qualificado.
  */
  const faltantes = REQUISITOS.filter(
    ({ chave, presente }) => respostas[chave] && !presente(respostas[chave]),
  );
  if (faltantes.length > 0) {
    tags.push('DESCLASSIFICADO');
    return {
      desfecho: 'desclassificado',
      motivo:
        'Os requisitos do vínculo de emprego precisam aparecer em conjunto, e pelas suas respostas um deles não está presente.',
      tags,
      pontos: [],
      alertas: [`Requisito ausente sem corte no passo: ${faltantes.map((i) => i.nome).join(', ')}.`],
      marcadores: 0,
    };
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

  /*
    Só é possível chegar aqui com os quatro presentes, então a frase é sempre a
    mesma — e é escrita assim, no conjunto, porque é assim que a lei exige.
  */
  pontos.push(
    'Pelas suas respostas aparecem, juntos, os quatro elementos que a CLT exige: pessoalidade, pagamento, habitualidade e subordinação.',
  );
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
    return { desfecho: 'analise_manual', tags, pontos, alertas, marcadores };
  }

  tags.push('QUALIFICADO');
  return { desfecho: 'qualificado', tags, pontos, alertas, marcadores };
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
 * O bloco final é o que o CRM lê — marcadores, requisitos e observações. Ele
 * fica visível para quem envia, e é assim de propósito: nada ali envergonha a
 * pessoa, e um resumo escondido em campo invisível seria dado coletado sem
 * ela ver.
 *
 * Nome e telefone não aparecem porque não são perguntados: o WhatsApp os
 * entrega junto com a conversa. Ver a decisão 3 no topo deste arquivo.
 */
export function mensagemDoWhatsApp(
  respostas: Respostas,
  leitura: Leitura,
  origem: Origem = {},
): string {
  const linhas: string[] = [
    'Olá. Respondi o questionário do site sobre trabalho sem registro em carteira e gostaria de falar sobre o meu caso.',
    '',
  ];

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
    'Requisitos do art. 3º da CLT: os quatro presentes.',
    `Indícios do dia a dia marcados: ${leitura.marcadores}.`,
  );

  for (const alerta of leitura.alertas) linhas.push(`- ${alerta}`);

  linhas.push(
    '',
    referencia ? `(Questionário do site — ${referencia})` : '(Questionário do site)',
  );

  return linhas.join('\n');
}
