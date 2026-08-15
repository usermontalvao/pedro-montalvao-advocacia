import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  ABERTURA,
  avaliar,
  mensagemDoWhatsApp,
  passosVisiveis,
  progresso,
  proximoPasso,
  rotuloDaResposta,
  type Leitura,
  type Passo,
  type Respostas,
} from '../lib/triagemContaEncerrada';
import { evento, eventoProprio, origemDaVisita } from '../lib/pixelMeta';
import { registrar } from '../lib/leads';
import { SITE, linkWhatsApp } from '../site.config';
import { IconeWhatsApp } from './Icones';
import { Link } from '../lib/router';

/**
 * A triagem, uma pergunta por tela.
 *
 * O formato é o do Typeform, e não por moda: dez campos empilhados mostram de
 * cara o tamanho do trabalho e são abandonados no terceiro; dez telas com uma
 * pergunta cada nunca revelam o que falta, e por isso são respondidas até o
 * fim. A barra embaixo é a única pista do progresso — e ela anda rápido.
 *
 * O roteiro inteiro vive em `lib/triagemContaEncerrada`. Aqui só existe o
 * comportamento da tela: a transição entre perguntas, o teclado, a volta e a
 * conversa que sobrevive a um recarregamento.
 */

const CHAVE_RASCUNHO = 'pma:triagem-conta';
/** As letras dos atalhos, no computador. */
const LETRAS = 'ABCDEFGH';

type Tela = 'abertura' | 'perguntas';

export function TriagemContaEncerrada() {
  const [respostas, setRespostas] = useState<Respostas>({});
  const [tela, setTela] = useState<Tela>('abertura');
  const [rascunho, setRascunho] = useState('');
  const [erro, setErro] = useState('');
  const [recuando, setRecuando] = useState(false);
  const [origem] = useState(() => origemDaVisita());

  const campo = useRef<HTMLInputElement | null>(null);
  const montado = useRef(false);

  const passo = proximoPasso(respostas);
  const concluida = tela === 'perguntas' && passo === undefined;
  const leitura = useMemo(() => avaliar(respostas), [respostas]);
  const mensagem = useMemo(() => mensagemDoWhatsApp(respostas, origem), [respostas, origem]);

  const visiveis = passosVisiveis(respostas);
  const posicao = passo ? visiveis.findIndex((item) => item.chave === passo.chave) + 1 : visiveis.length;
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
    O campo de texto recebe o foco sozinho a cada pergunta nova — no computador
    a pessoa já sai digitando. No celular NÃO: abrir o teclado por conta própria
    tapa metade da tela e esconde a pergunta que acabou de aparecer.
  */
  useEffect(() => {
    if (!montado.current || !passo || passo.tipo !== 'texto') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    campo.current?.focus();
  }, [passo]);

  /* -------------------------------------------------------------- resposta */

  const responder = useCallback(
    (passoAtual: Passo, valor: string) => {
      const seguintes = { ...respostas, [passoAtual.chave]: valor };

      setErro('');
      setRascunho('');
      setRecuando(false);
      setRespostas(seguintes);

      const lugar = passosVisiveis(seguintes).findIndex((item) => item.chave === passoAtual.chave);
      eventoProprio('TriagemPasso', { passo: passoAtual.chave, posicao: lugar + 1 });

      if (proximoPasso(seguintes)) return;

      registrar({
        nome: '',
        telefone: '',
        email: '',
        area: 'Conta bancária bloqueada ou encerrada',
        mensagem: mensagemDoWhatsApp(seguintes, origem),
        origem: 'campanha conta encerrada',
      });

      evento('Lead', { content_name: 'Questionário conta bloqueada ou encerrada' });
    },
    [respostas, origem],
  );

  /** Desfaz a última resposta — a pessoa clicou rápido e se arrependeu. */
  const voltar = useCallback(() => {
    const respondidos = passosVisiveis(respostas).filter((item) => respostas[item.chave]);
    const ultimo = respondidos[respondidos.length - 1];

    setErro('');
    setRascunho('');
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

  function enviarTexto(submissao: FormEvent) {
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

  function aoAbrirWhatsApp() {
    evento('Contact', { content_name: 'Questionário conta bloqueada ou encerrada' });
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

      if (!passo) return;

      if (tecla.key === 'Escape') {
        tecla.preventDefault();
        voltar();
        return;
      }

      if (passo.tipo !== 'opcoes') return;

      const indice = LETRAS.indexOf(tecla.key.toUpperCase());
      const opcao = indice >= 0 ? passo.opcoes?.[indice] : undefined;
      if (opcao) {
        tecla.preventDefault();
        responder(passo, opcao.valor);
      }
    }

    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [tela, passo, responder, voltar]);

  /* ---------------------------------------------------------------- tela */

  const chave = tela === 'abertura' ? 'abertura' : concluida ? 'fim' : passo?.chave;

  return (
    <div className="tf">
      <div
        className="tf__tela"
        key={chave}
        data-recuando={recuando ? 'true' : 'false'}
      >
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
              <div className="tf__opcoes" role="group" aria-label={passo.pergunta}>
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
            ) : (
              <form className="tf__campo" onSubmit={enviarTexto} noValidate>
                {passo.sugestoes ? (
                  <div className="tf__sugestoes">
                    {passo.sugestoes.map((sugestao) => (
                      <button
                        key={sugestao}
                        type="button"
                        className="tf__sugestao"
                        onClick={() => responder(passo, sugestao)}
                      >
                        {sugestao}
                      </button>
                    ))}
                  </div>
                ) : null}

                <input
                  ref={campo}
                  value={rascunho}
                  placeholder={passo.placeholder}
                  autoComplete="off"
                  aria-label={passo.pergunta}
                  onChange={(alteracao) => {
                    setRascunho(alteracao.target.value);
                    if (erro) setErro('');
                  }}
                />

                <div className="tf__acao">
                  <button type="submit" className="tf__botao">
                    OK
                    <i aria-hidden>✓</i>
                  </button>
                  <span className="tf__dica tf__dica--teclado">
                    ou aperte <b>Enter ↵</b>
                  </span>
                </div>
              </form>
            )}

            {erro ? (
              <p className="tf__erro" role="alert">
                {erro}
              </p>
            ) : null}
          </div>
        ) : null}

        {concluida ? (
          <Fecho leitura={leitura} mensagem={mensagem} aoAbrir={aoAbrirWhatsApp} />
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
            Não constitui oferta de serviços, promessa de resultado nem consulta jurídica ·{' '}
            <Link para="/politica-de-privacidade/">privacidade</Link>
          </span>

          {tela === 'perguntas' && !concluida ? (
            <button type="button" className="tf__voltar" onClick={voltar}>
              ← voltar
            </button>
          ) : null}
        </div>
      </footer>
    </div>
  );
}

/**
 * A tela final.
 *
 * Ela NÃO dá parecer. Não diz que o caso é bom, que há direito a receber nem
 * que vale processar: diz o que a pessoa respondeu, aponta em que normas o
 * assunto é tratado e oferece um canal de contato. É essa fronteira que separa
 * conteúdo informativo — que o Provimento 205/2021 deixa impulsionar — de
 * oferta de serviço e captação, que ele veda.
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
  return (
    <div className="tf__bloco tf__bloco--fim">
      <span className="tf__selo">Respostas registradas</span>

      <h2 className="tf__titulo tf__titulo--fim">
        É disto que as normas tratam.
      </h2>

      <p className="tf__apoio">
        Este questionário é informativo. Ele não analisa o seu caso, não afirma que há direito a
        receber e não substitui a orientação de um advogado.
      </p>

      {leitura.pontos.length > 0 ? (
        <ul className="tf__pontos">
          {leitura.pontos.map((ponto) => (
            <li key={ponto}>{ponto}</li>
          ))}
        </ul>
      ) : null}

      <a
        className="tf__zap"
        href={linkWhatsApp(mensagem)}
        target="_blank"
        rel="noopener noreferrer"
        data-cta="questionario-conta-encerrada"
        onClick={aoAbrir}
      >
        <IconeWhatsApp tamanho={20} />
        Falar com o escritório
      </a>

      <span className="tf__dica">
        O WhatsApp abre com as suas respostas já escritas. Você confere antes de enviar.
      </span>
    </div>
  );
}
