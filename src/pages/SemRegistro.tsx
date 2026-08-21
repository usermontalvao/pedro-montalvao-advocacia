import { TriagemSemRegistro } from '../components/TriagemSemRegistro';

/**
 * Landing da campanha "trabalhou sem registro em carteira".
 *
 * Uma tela e nada mais. Sem cabeçalho do site, sem menu, sem seção de
 * convencimento abaixo: quem chega aqui veio de um anúncio que já explicou o
 * assunto, e qualquer outra coisa na tela é um caminho para não responder.
 *
 * NÃO HÁ CABEÇALHO, e a ausência é a decisão de projeto desta tela.
 *
 * Havia logo à esquerda e OAB à direita, ocupando os primeiros 59px do
 * aparelho e sendo a primeira coisa que o visitante lia — quando a primeira
 * coisa tem de ser a pergunta. Num formulário do gênero, tudo que emoldura
 * rouba da pergunta: o que fica é o texto sobre o branco.
 *
 * A identificação do escritório e a ressalva de conteúdo informativo, que a
 * publicidade da advocacia exige, continuam visíveis em toda tela — mudaram de
 * lugar, não sumiram: vivem no rodapé da triagem, em uma linha discreta.
 *
 * A moldura é a mesma de `/conta-encerrada/` (`.campanha`), mas com o tema
 * claro por cima (`.campanha--claro`). O roteiro e a casca mudam; o mecanismo
 * de uma pergunta por tela é o mesmo das duas campanhas.
 */
export function SemRegistro() {
  return (
    <div className="campanha campanha--claro">
      <div className="campanha__luz" aria-hidden />
      <MarcaDaCarteira />

      {/*
        O <h1> da página é o título da tela de abertura, dentro da triagem — é
        ele que sai no HTML do build e é ele que o rastreador lê.
      */}
      <TriagemSemRegistro />
    </div>
  );
}

/**
 * A carteira de trabalho com o campo de assinatura VAZIO.
 *
 * É o elemento gráfico da página, e a escolha do desenho é o argumento inteiro:
 * não é martelo, não é balança, não é o clichê que aproxima a peça do registro
 * de captação e que a própria Meta reprova em serviços jurídicos. É o objeto de
 * que a campanha trata — e, dentro dele, o retângulo tracejado onde deveria
 * estar o registro do empregador, em branco.
 *
 * Quem trabalhou sem carteira assinada reconhece essa página vazia antes de ler
 * o título. Quem nunca passou por isso não vê nada além de uma textura, que é
 * exatamente o que se quer de um elemento de fundo.
 *
 * Fica atrás de tudo, a 11% de opacidade, sangrando pelo canto: dá matéria ao
 * preto chapado sem disputar um milímetro de atenção com o texto. E é SVG
 * embutido — não custa nem uma requisição, num anúncio pago em que cada
 * milissegundo até a primeira pintura é clique comprado.
 */
function MarcaDaCarteira() {
  return (
    <svg
      className="campanha__carteira"
      viewBox="0 0 220 300"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      focusable="false"
    >
      {/* A capa. */}
      <rect x="12" y="12" width="196" height="276" rx="10" />
      <path d="M12 78h196" />
      {/* O brasão, reduzido ao círculo. */}
      <circle cx="110" cy="45" r="17" />

      {/* As linhas dos dados, com o comprimento irregular de um formulário. */}
      <path d="M40 108h140M40 132h96M40 156h124" strokeLinecap="round" />

      {/*
        O campo do empregador — tracejado e vazio. É aqui que mora o assunto:
        o retângulo em branco é a carteira que ninguém assinou.
      */}
      <rect x="40" y="188" width="140" height="72" rx="4" strokeDasharray="7 7" />
    </svg>
  );
}
