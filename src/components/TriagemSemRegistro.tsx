import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ABERTURA,
  FECHOS,
  avaliar,
  mensagemDoWhatsApp,
  passosVisiveis,
  progresso,
  proximoPasso,
  type Leitura,
  type Passo,
  type Respostas,
} from '../lib/triagemSemRegistro';
import { evento, eventoProprio, origemDaVisita } from '../lib/pixelMeta';
import { registrar } from '../lib/leads';
import { SITE, linkWhatsApp } from '../site.config';
import { IconeWhatsApp } from './Icones';
import { Link } from '../lib/router';

/**
 * A triagem de trabalho sem registro, uma pergunta por tela.
 *
 * O formato é o mesmo de `TriagemContaEncerrada`, e por isso divide o CSS
 * (`.tf`): dez campos empilhados mostram de cara o tamanho do trabalho e são
 * abandonados no terceiro; dez telas com uma pergunta cada nunca revelam o que
 * falta, e por isso são respondidas até o fim. A barra embaixo é a única pista
 * do progresso — e ela anda rápido.
 *
 * O roteiro inteiro vive em `lib/triagemSemRegistro`. Aqui só existe o
 * comportamento da tela.
 *
 * NÃO EXISTE CAMPO DE DIGITAR em lugar nenhum deste fluxo, e isso é regra, não
 * acaso. Passaram por aqui um campo de data, um de dinheiro e um formulário de
 * contato; todos saíram. Toda pergunta é uma escolha que avança sozinha ao
 * toque — quem responde no celular nunca vê o teclado subir, e não há um único
 * botão de "confirmar" para procurar. Data e salário viraram faixas; nome e
 * telefone chegam com a própria conversa do WhatsApp.
 *
 * A diferença que mais importa em relação à outra triagem: ESTA DESCLASSIFICA.
 * Quando o desfecho é `desclassificado` a tela final não tem botão de WhatsApp,
 * não chama `registrar()` e não dispara `Lead`. O caminho acaba ali — a única
 * coisa que continua disponível é o "voltar", para quem tocou na opção errada.
 */

const CHAVE_RASCUNHO = 'pma:triagem-sem-registro';
/** As letras dos atalhos, no computador. */
const LETRAS = 'ABCDEFGHIJK';

type Tela = 'abertura' | 'perguntas';

export function TriagemSemRegistro() {
  const [respostas, setRespostas] = useState<Respostas>({});
  const [tela, setTela] = useState<Tela>('abertura');
  const [recuando, setRecuando] = useState(false);
  const [origem] = useState(() => origemDaVisita());

  const montado = useRef(false);

  const passo = proximoPasso(respostas);
  const concluida = tela === 'perguntas' && passo === undefined;
  const leitura = useMemo(() => avaliar(respostas), [respostas]);
  const mensagem = useMemo(
    () => mensagemDoWhatsApp(respostas, leitura, origem),
    [respostas, leitura, origem],
  );

  const visiveis = passosVisiveis(respostas);
  const posicao = passo
    ? visiveis.findIndex((item) => item.chave === passo.chave) + 1
    : visiveis.length;
  const avanco = tela === 'abertura' ? 0 : Math.round(progresso(respostas) * 100);

  /* ------------------------------------------------ retomada e persistência */

  useEffect(() => {
    montado.current = true;
    try {
      const salvo = window.localStorage.getItem(CHAVE_RASCUNHO);
      if (!salvo) return;
      const dados = JSON.parse(salvo) as Respostas;
      if (!dados || typeof dados !== 'object' || Object.keys(dados).length === 0) return;
      setRespostas(dados);
      setTela('perguntas');
    } catch {
      // Modo anônimo ou dado corrompido: a triagem simplesmente recomeça.
    }
  }, []);

  useEffect(() => {
    if (!montado.current || Object.keys(respostas).length === 0) return;
    try {
      window.localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(respostas));
    } catch {
      // Sem armazenamento a triagem continua; só não sobrevive ao recarregar.
    }
  }, [respostas]);

  /* -------------------------------------------------------------- resposta */

  const responder = useCallback(
    (passoAtual: Passo, valor: string) => {
      const seguintes = { ...respostas, [passoAtual.chave]: valor };

      setRecuando(false);
      setRespostas(seguintes);

      const lugar = passosVisiveis(seguintes).findIndex((item) => item.chave === passoAtual.chave);
      eventoProprio('TriagemPasso', { passo: passoAtual.chave, posicao: lugar + 1 });

      if (proximoPasso(seguintes)) return;

      /*
        O questionário acabou. Quem foi desclassificado NÃO vira conversão: sem
        `Lead`, sem lead gravado e, na tela, sem botão. Só o desfecho é medido,
        para que a campanha saiba quantos cliques comprou fora do público.
      */
      const leituraFinal = avaliar(seguintes);
      eventoProprio('TriagemFim', { desfecho: leituraFinal.desfecho });
      if (leituraFinal.desfecho === 'desclassificado') return;

      /*
        O lead é gravado aqui, e não no clique do WhatsApp: quem respondeu tudo
        e não chegou a tocar no verde é justamente o registro que interessa
        conferir depois. `Contact` continua sendo medido no clique, pelo
        `RastreamentoMeta`, que escuta todo link do WhatsApp do escritório.
      */
      registrar({
        nome: '',
        telefone: '',
        email: '',
        area: 'Trabalho sem registro em carteira',
        mensagem: mensagemDoWhatsApp(seguintes, leituraFinal, origem),
        origem: `campanha sem registro · ${leituraFinal.tags.join(' ')}`,
      });

      evento('Lead', { content_name: 'Questionário trabalho sem registro' });
    },
    [respostas, origem],
  );

  /** Desfaz a última resposta — a pessoa clicou rápido e se arrependeu. */
  const voltar = useCallback(() => {
    const respondidos = passosVisiveis(respostas).filter((item) => respostas[item.chave]);
    const ultimo = respondidos[respondidos.length - 1];

    setRecuando(true);

    if (!ultimo) {
      setTela('abertura');
      return;
    }

    const seguintes = { ...respostas };
    delete seguintes[ultimo.chave];
    setRespostas(seguintes);
  }, [respostas]);

  function comecar() {
    setRecuando(false);
    setTela('perguntas');
    eventoProprio('TriagemInicio');
  }

  function limparRascunho() {
    try {
      window.localStorage.removeItem(CHAVE_RASCUNHO);
    } catch {
      // Sem armazenamento não há rascunho para limpar.
    }
  }

  /* ------------------------------------------------------------- teclado */

  useEffect(() => {
    function aoTeclar(tecla: KeyboardEvent) {
      if (tecla.metaKey || tecla.ctrlKey || tecla.altKey) return;

      if (tela === 'abertura') {
        if (tecla.key === 'Enter') comecar();
        return;
      }

      if (tecla.key === 'Escape') {
        tecla.preventDefault();
        voltar();
        return;
      }

      if (!passo) return;

      const indice = LETRAS.indexOf(tecla.key.toUpperCase());
      const opcao = indice >= 0 ? passo.opcoes?.[indice] : undefined;
      if (!opcao) return;

      tecla.preventDefault();
      responder(passo, opcao.valor);
    }

    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [tela, passo, responder, voltar]);

  /* ---------------------------------------------------------------- tela */

  const chave = tela === 'abertura' ? 'abertura' : concluida ? 'fim' : passo?.chave;
  const negado = concluida && leitura.desfecho === 'desclassificado';

  return (
    <div className="tf">
      <div className="tf__tela" key={chave} data-recuando={recuando ? 'true' : 'false'}>
        {tela === 'abertura' ? (
          <div className="tf__bloco">
            <span className="tf__olho">{ABERTURA.olho}</span>
            <h1 className="tf__titulo">{ABERTURA.titulo}</h1>
            <p className="tf__apoio">{ABERTURA.texto}</p>

            <div className="tf__acao">
              <button type="button" className="tf__botao" onClick={comecar} data-cta="triagem-comecar">
                {ABERTURA.botao}
                {/*
                  O tempo entra DENTRO do botão. Ele era uma linha cinza
                  embaixo, e é o argumento que mais derruba objeção numa
                  landing de anúncio: o dedo que hesita quer saber em quanto
                  tempo isso acaba, não depois de clicar.
                */}
                <em>{ABERTURA.tempo}</em>
              </button>
            </div>

            {/*
              As três garantias, que só existem porque os campos saíram. Cada
              uma corresponde a algo que esta página deixou de pedir — e é o
              que a distingue de toda landing jurídica que abre um formulário
              de sete campos antes de dizer qualquer coisa.
            */}
            <ul className="tf__garantias">
              {ABERTURA.garantias.map((garantia) => (
                <li key={garantia}>{garantia}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {tela === 'perguntas' && passo ? (
          <div className="tf__bloco">
            <span className="tf__numero">
              {posicao}
              <i aria-hidden>→</i>
            </span>

            <h2 className="tf__pergunta">{passo.pergunta}</h2>
            {passo.ajuda ? <p className="tf__apoio">{passo.ajuda}</p> : null}

            <div
              className="tf__opcoes"
              data-denso={(passo.opcoes?.length ?? 0) > 6}
              role="group"
              aria-label={passo.pergunta}
            >
              {passo.opcoes?.map((opcao, indice) => (
                <button
                  key={opcao.valor}
                  type="button"
                  className="tf__opcao"
                  onClick={() => responder(passo, opcao.valor)}
                >
                  <span className="tf__letra" aria-hidden>
                    {LETRAS[indice]}
                  </span>
                  <span className="tf__rotulo">
                    {opcao.rotulo}
                    {opcao.detalhe ? <small>{opcao.detalhe}</small> : null}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {concluida ? (
          <Fecho leitura={leitura} mensagem={mensagem} aoAbrir={limparRascunho} />
        ) : null}
      </div>

      <footer className="tf__pe tf__pe--enxuto">
        <div
          className="tf__barra"
          role="progressbar"
          aria-valuenow={avanco}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Andamento da triagem"
        >
          <i style={{ width: `${avanco}%` }} />
        </div>

        <div className="tf__pe-linha">
          {/*
            A identificação e a ressalva ficam em toda tela, não só no fim: a
            página é impulsionada, e o Provimento 205/2021 pede que o caráter
            informativo seja visível — não escondido atrás de mais um clique.

            Por isso este rodapé encolheu em vez de sair. Ele chegou a ocupar
            9% da altura do celular, com quatro linhas de letra miúda logo
            abaixo do botão verde — e nada aqui precisa dessa presença. O texto
            foi cortado ao osso do que a norma pede (quem é o escritório, o
            número da OAB, o caráter informativo e a ausência de promessa de
            resultado); o resto era repetição do que a própria tela já diz.
          */}
          <span className="tf__legal">
            {SITE.nome} · OAB/{SITE.uf} {SITE.oab} · conteúdo informativo, sem promessa de
            resultado · <Link para="/politica-de-privacidade/">privacidade</Link>
          </span>

          {/*
            O voltar continua de pé na tela de recusa. Um toque errado na
            primeira pergunta não pode ser um beco sem saída — e é justamente
            na primeira pergunta que o toque errado desclassifica.
          */}
          {tela === 'perguntas' && (!concluida || negado) ? (
            <button type="button" className="tf__voltar" onClick={voltar}>
              ← voltar
            </button>
          ) : null}
        </div>
      </footer>
    </div>
  );
}

/* ============================================================== o fecho */

/**
 * A tela final, nas três saídas.
 *
 * `desclassificado` é a saída que define o fluxo: sem botão e sem nada indo
 * para o CRM. Ela também não usa linguagem de negativa de direito — diz que o
 * caso não se enquadra NOS CRITÉRIOS DESTE ATENDIMENTO, que é o que de fato
 * foi apurado. "Você não tem direito" seria parecer jurídico dado por um
 * formulário a quem nunca foi cliente.
 *
 * Nas outras duas é o resultado e UM botão, que já abre a conversa com todas
 * as respostas escritas. Houve, entre 20/08/2026 e o mesmo dia, uma versão com
 * formulário de nome, WhatsApp e cidade antes do botão: três campos no ponto
 * mais caro do funil para receber o que o WhatsApp entrega sozinho no segundo
 * seguinte.
 */
function Fecho({
  leitura,
  mensagem,
  aoAbrir,
}: {
  leitura: Leitura;
  mensagem: string;
  aoAbrir: () => void;
}) {
  if (leitura.desfecho === 'desclassificado') {
    const recusa = FECHOS.desclassificado;
    return (
      <div className="tf__bloco tf__bloco--fim tf__bloco--negado">
        <span className="tf__selo tf__selo--neutro">{recusa.selo}</span>
        <h2 className="tf__titulo tf__titulo--fim">{recusa.titulo}</h2>
        {leitura.motivo ? <p className="tf__apoio">{leitura.motivo}</p> : null}
        <p className="tf__nota">
          Se você respondeu alguma pergunta por engano, use o “voltar” aqui embaixo para corrigir.
        </p>
      </div>
    );
  }

  const fecho = FECHOS[leitura.desfecho];

  return (
    <div className="tf__bloco tf__bloco--fim">
      <span className="tf__selo">{fecho.selo}</span>
      <h2 className="tf__titulo tf__titulo--fim">{fecho.titulo}</h2>

      {leitura.pontos.length > 0 ? (
        <ul className="tf__pontos">
          {leitura.pontos.map((ponto) => (
            <li key={ponto}>{ponto}</li>
          ))}
        </ul>
      ) : null}

      {/*
        Um <a> de verdade, e não um botão que chama `window.open`: o link abre
        no toque, sem passar por bloqueador de pop-up, e no celular o próprio
        sistema entrega a conversa ao aplicativo instalado.
      */}
      <a
        className="tf__zap tf__zap--pulsa"
        href={linkWhatsApp(mensagem)}
        target="_blank"
        rel="noopener noreferrer"
        data-cta="questionario-sem-registro"
        onClick={aoAbrir}
      >
        <IconeWhatsApp tamanho={20} />
        {fecho.botao}
      </a>

      <span className="tf__dica">
        O WhatsApp abre com o resumo das suas respostas já escrito. Você confere antes de enviar.
      </span>
    </div>
  );
}
