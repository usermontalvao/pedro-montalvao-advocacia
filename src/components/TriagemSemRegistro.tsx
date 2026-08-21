import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  ABERTURA,
  FECHOS,
  SEPARADOR,
  avaliar,
  centavosDaMoeda,
  mensagemDoWhatsApp,
  moedaDeDigitos,
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
  const [rascunho, setRascunho] = useState('');
  const [marcadas, setMarcadas] = useState<string[]>([]);
  const [erro, setErro] = useState('');
  const [recuando, setRecuando] = useState(false);
  const [origem] = useState(() => origemDaVisita());

  const campo = useRef<HTMLInputElement | null>(null);
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

  /*
    O campo recebe o foco sozinho a cada pergunta nova — no computador a pessoa
    já sai digitando. No celular NÃO: abrir o teclado por conta própria tapa
    metade da tela e esconde a pergunta que acabou de aparecer.
  */
  useEffect(() => {
    if (!montado.current || !passo || passo.tipo !== 'moeda') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    campo.current?.focus();
  }, [passo]);

  /* -------------------------------------------------------------- resposta */

  const responder = useCallback(
    (passoAtual: Passo, valor: string) => {
      const seguintes = { ...respostas, [passoAtual.chave]: valor };

      setErro('');
      setRascunho('');
      setMarcadas([]);
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

    setErro('');
    setRascunho('');
    setMarcadas([]);
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

  /** Marca e desmarca na pergunta de múltipla escolha. */
  function alternar(passoAtual: Passo, valor: string) {
    if (erro) setErro('');

    if (valor === passoAtual.exclusiva) {
      setMarcadas((atuais) => (atuais.includes(valor) ? [] : [valor]));
      return;
    }

    setMarcadas((atuais) => {
      const semExclusiva = atuais.filter((item) => item !== passoAtual.exclusiva);
      return semExclusiva.includes(valor)
        ? semExclusiva.filter((item) => item !== valor)
        : [...semExclusiva, valor];
    });
  }

  function enviarMultipla() {
    if (!passo) return;
    // A ordem do roteiro, e não a ordem dos toques: o resumo sai sempre igual.
    const escolhidas = (passo.opcoes ?? [])
      .filter((opcao) => marcadas.includes(opcao.valor))
      .map((opcao) => opcao.valor);

    const problema = passo.validar?.(escolhidas.join(SEPARADOR)) ?? null;
    if (problema) {
      setErro(problema);
      return;
    }
    responder(passo, escolhidas.join(SEPARADOR));
  }

  function enviarCampo(submissao: FormEvent) {
    submissao.preventDefault();
    if (!passo) return;

    const valor = rascunho.trim();
    const problema = passo.validar?.(valor) ?? null;
    if (problema) {
      setErro(problema);
      campo.current?.focus();
      return;
    }
    responder(passo, valor);
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

      if (passo.tipo === 'opcoes') {
        tecla.preventDefault();
        responder(passo, opcao.valor);
        return;
      }

      if (passo.tipo === 'multipla') {
        tecla.preventDefault();
        alternar(passo, opcao.valor);
      }
    }

    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [tela, passo, marcadas, responder, voltar]);

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
              </button>
              <span className="tf__dica">{ABERTURA.nota}</span>
            </div>
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

            {passo.tipo === 'opcoes' ? (
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
            ) : null}

            {passo.tipo === 'multipla' ? (
              <>
                <div
                  className="tf__opcoes"
                  data-denso={(passo.opcoes?.length ?? 0) > 6}
                  role="group"
                  aria-label={passo.pergunta}
                >
                  {passo.opcoes?.map((opcao, indice) => {
                    const marcada = marcadas.includes(opcao.valor);
                    return (
                      <button
                        key={opcao.valor}
                        type="button"
                        className={`tf__opcao ${marcada ? 'tf__opcao--marcada' : ''}`.trim()}
                        aria-pressed={marcada}
                        onClick={() => alternar(passo, opcao.valor)}
                      >
                        <span className="tf__letra" aria-hidden>
                          {marcada ? '✓' : LETRAS[indice]}
                        </span>
                        <span className="tf__rotulo">{opcao.rotulo}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="tf__acao">
                  <button type="button" className="tf__botao" onClick={enviarMultipla}>
                    Continuar
                    <i aria-hidden>✓</i>
                  </button>
                  <span className="tf__dica">
                    {marcadas.length > 0
                      ? `${marcadas.length} marcada${marcadas.length > 1 ? 's' : ''}`
                      : 'Pode marcar mais de uma'}
                  </span>
                </div>
              </>
            ) : null}

            {passo.tipo === 'moeda' ? (
              <form className="tf__campo" onSubmit={enviarCampo} noValidate>
                <input
                  ref={campo}
                  /*
                    `inputMode` e não `type="number"`: o texto no campo é a
                    máscara já formada ("R$ 1.800,00"), que um campo numérico
                    recusaria. O teclado do celular continua sendo o numérico.
                  */
                  inputMode="numeric"
                  value={rascunho}
                  placeholder={passo.placeholder}
                  autoComplete="off"
                  aria-label={passo.pergunta}
                  onChange={(alteracao) => {
                    setRascunho(moedaDeDigitos(alteracao.target.value));
                    if (erro) setErro('');
                  }}
                />

                <div className="tf__acao">
                  <button type="submit" className="tf__botao" disabled={centavosDaMoeda(rascunho) === 0}>
                    OK
                    <i aria-hidden>✓</i>
                  </button>
                  <span className="tf__dica tf__dica--teclado">
                    ou aperte <b>Enter ↵</b>
                  </span>
                </div>
              </form>
            ) : null}

            {erro ? (
              <p className="tf__erro" role="alert">
                {erro}
              </p>
            ) : null}
          </div>
        ) : null}

        {concluida ? (
          <Fecho leitura={leitura} mensagem={mensagem} aoAbrir={limparRascunho} />
        ) : null}
      </div>

      <footer className="tf__pe">
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
          */}
          <span className="tf__legal">
            {SITE.nome} · OAB/{SITE.uf} {SITE.oab} · conteúdo informativo (Prov. 205/2021 CFOAB).
            A triagem não substitui a análise de um advogado nem antecipa resultado ·{' '}
            <Link para="/politica-de-privacidade/">privacidade</Link>
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
