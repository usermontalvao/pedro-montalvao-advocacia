import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from '../lib/router';
import { registrar } from '../lib/leads';
import { linkWhatsApp, SITE } from '../site.config';
import { IconeWhatsApp } from './Icones';

type Etapa = 'identificacao' | 'assunto' | 'qualificacao' | 'consentimento' | 'conversa';
type Papel = 'user' | 'assistant';

type Mensagem = {
  id: string;
  papel: Papel;
  texto: string;
};

type RespostaFixa = {
  pergunta: string;
  resposta: string;
};

type PerguntaFixa = {
  id: string;
  pergunta: string;
  alternativas: string[];
};

type RadarTriagem = {
  status: string;
  indicadores: string[];
  pontosAtencao: string[];
  documentos: string[];
  termosPesquisa: string[];
};

type RespostaTriagem = {
  mensagem: string;
  alternativas?: string[];
  permitirTexto?: boolean;
  resumo: string;
  pronto: boolean;
  alerta?: string;
  radar?: Partial<RadarTriagem>;
};

const ASSUNTOS = [
  'Direito Trabalhista',
  'Direito Previdenciário',
  'Direito do Consumidor',
  'Direito de Família',
  'Outro assunto',
] as const;

const SITUACOES: Record<string, string[]> = {
  'Direito Trabalhista': [
    'Demissão ou verbas rescisórias',
    'Horas extras, jornada ou intervalo',
    'Trabalho sem registro',
    'Assédio ou discriminação',
    'Acidente ou doença relacionada ao trabalho',
    'Outro problema trabalhista',
  ],
  'Direito Previdenciário': [
    'Benefício negado',
    'Benefício suspenso ou cessado',
    'Aposentadoria ou revisão',
    'Auxílio por incapacidade',
    'BPC/LOAS',
    'Outro problema com o INSS',
  ],
  'Direito do Consumidor': [
    'Cobrança ou negativação',
    'Banco, cartão ou conta',
    'Produto ou serviço com problema',
    'Contrato ou cancelamento',
    'Fraude ou golpe',
    'Outro problema de consumo',
  ],
  'Direito de Família': [
    'Divórcio ou união estável',
    'Guarda ou convivência',
    'Pensão alimentícia',
    'Partilha de bens',
    'Inventário ou sucessão',
    'Outro problema familiar',
  ],
  'Outro assunto': [
    'Recebi uma cobrança ou notificação',
    'Tenho um contrato ou documento para analisar',
    'Existe processo ou audiência em andamento',
    'Preciso prevenir um problema',
    'Quero entender meus próximos passos',
    'Nenhuma das alternativas',
  ],
};

const PERGUNTAS_BASE: PerguntaFixa[] = [
  {
    id: 'quando',
    pergunta: 'Quando ocorreu o fato principal?',
    alternativas: ['Hoje ou há poucos dias', 'Nos últimos 30 dias', 'Entre 1 mês e 1 ano', 'Há mais de 1 ano', 'Ainda está acontecendo', 'Não sei informar'],
  },
  {
    id: 'provas',
    pergunta: 'O que você já tem para demonstrar o ocorrido?',
    alternativas: ['Documentos e conversas', 'Comprovantes ou registros digitais', 'Testemunhas', 'Tenho apenas parte das provas', 'Ainda não tenho provas', 'Não sei o que pode servir'],
  },
  {
    id: 'urgencia',
    pergunta: 'Existe alguma urgência agora?',
    alternativas: ['Prazo, audiência ou perícia próxima', 'Risco, bloqueio ou prejuízo em andamento', 'Recebi notificação ou intimação', 'Não conheço prazo urgente', 'Não tenho certeza'],
  },
  {
    id: 'objetivo',
    pergunta: 'O que você busca neste momento?',
    alternativas: ['Entender meus direitos', 'Responder prazo, processo ou notificação', 'Tentar uma solução sem processo', 'Avaliar uma medida judicial', 'Organizar documentos e próximos passos'],
  },
];

const RADAR_VAZIO: RadarTriagem = {
  status: '',
  indicadores: [],
  pontosAtencao: [],
  documentos: [],
  termosPesquisa: [],
};

function idMensagem(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

function limitarLista(valor: unknown, limite = 5): string[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, 180))
    .filter(Boolean)
    .slice(0, limite);
}

function normalizarRadar(valor?: Partial<RadarTriagem>): RadarTriagem {
  return {
    status: typeof valor?.status === 'string' ? valor.status.trim().slice(0, 120) : '',
    indicadores: limitarLista(valor?.indicadores),
    pontosAtencao: limitarLista(valor?.pontosAtencao),
    documentos: limitarLista(valor?.documentos),
    termosPesquisa: limitarLista(valor?.termosPesquisa, 4),
  };
}

function perguntasPara(assunto: string): PerguntaFixa[] {
  return [
    {
      id: 'situacao',
      pergunta: 'Qual situação mais se aproxima do que aconteceu?',
      alternativas: SITUACOES[assunto] || SITUACOES['Outro assunto'],
    },
    ...PERGUNTAS_BASE,
  ];
}

function resumoDasRespostas(respostas: RespostaFixa[]): string {
  return respostas.map(({ pergunta, resposta }) => `${pergunta} ${resposta}`).join('\n');
}

function textoDoRelato(mensagens: Mensagem[]): string {
  return mensagens
    .filter((mensagem) => mensagem.papel === 'user')
    .slice(1)
    .map((mensagem, indice) => `${indice + 1}. ${mensagem.texto}`)
    .join('\n')
    .slice(0, 2600);
}

function linhasDaLista(titulo: string, itens: string[], vazio = 'Nenhum item indicado'): string[] {
  return [titulo, ...(itens.length ? itens.map((item) => `- ${item}`) : [`- ${vazio}`])];
}

function fontesOficiais(assunto: string, termos: string[]): string[] {
  const consulta = encodeURIComponent(termos.join(' ').slice(0, 450));
  const fontes = assunto === 'Direito Trabalhista'
    ? [
        'TST — Pesquisa de jurisprudência: https://www.tst.jus.br/jurisprudencia',
        'STF — Jurisprudência: https://jurisprudencia.stf.jus.br/',
      ]
    : [
        `STJ — Pesquisa preparada: https://processo.stj.jus.br/SCON/jurisprudencia/toc.jsp?b=ACOR&livre=${consulta}`,
        'STF — Jurisprudência: https://jurisprudencia.stf.jus.br/',
      ];

  return fontes;
}

export function PreTriagemFlutuante({
  artigoTitulo,
  artigoSlug,
  categoria,
}: {
  artigoTitulo: string;
  artigoSlug: string;
  categoria: string;
}) {
  const prefixo = useId();
  const primeiroCampo = useRef<HTMLInputElement>(null);
  const fimDaConversa = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const [etapa, setEtapa] = useState<Etapa>('identificacao');
  const [aceito, setAceito] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [assunto, setAssunto] = useState('');
  const [indiceFixo, setIndiceFixo] = useState(0);
  const [respostasFixas, setRespostasFixas] = useState<RespostaFixa[]>([]);
  const [rascunho, setRascunho] = useState('');
  const [mostrarTexto, setMostrarTexto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [alternativasIA, setAlternativasIA] = useState<string[]>([]);
  const [permitirTexto, setPermitirTexto] = useState(true);
  const [resumo, setResumo] = useState('');
  const [radar, setRadar] = useState<RadarTriagem>(RADAR_VAZIO);
  const [pronto, setPronto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const perguntasFixas = useMemo(() => perguntasPara(assunto), [assunto]);
  const perguntaAtual = perguntasFixas[indiceFixo];
  const progresso = etapa === 'qualificacao'
    ? Math.round(((indiceFixo + 1) / perguntasFixas.length) * 100)
    : etapa === 'consentimento' || etapa === 'conversa' ? 100 : 0;

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAberto(false);
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto]);

  useEffect(() => {
    if (aberto && etapa === 'identificacao') primeiroCampo.current?.focus();
  }, [aberto, etapa]);

  useEffect(() => {
    fimDaConversa.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [alternativasIA, carregando, mensagens, pronto]);

  const mensagemWhatsApp = useMemo(() => {
    const pagina = `${SITE.url}/artigos/${artigoSlug}/`;
    const relato = textoDoRelato(mensagens);
    const termos = radar.termosPesquisa;
    return [
      'PRÉ-ATENDIMENTO ORGANIZADO PELO SITE',
      '',
      `Nome: ${nome.trim()}`,
      `Telefone informado: ${telefone}`,
      `Área: ${assunto || categoria}`,
      `Artigo de origem: ${artigoTitulo}`,
      `Página: ${pagina}`,
      '',
      'QUALIFICAÇÃO INICIAL',
      ...respostasFixas.map(({ pergunta, resposta }) => `- ${pergunta} ${resposta}`),
      '',
      'RESPOSTAS COMPLEMENTARES',
      relato || '- Não houve resposta complementar.',
      '',
      'RESUMO AUTOMATIZADO',
      resumo || 'Resumo ainda não concluído.',
      '',
      'RADAR PARA CONFERÊNCIA HUMANA',
      `Status: ${radar.status || 'Conferência necessária'}`,
      ...linhasDaLista('Indicadores factuais:', radar.indicadores),
      ...linhasDaLista('Pontos de atenção:', radar.pontosAtencao),
      ...linhasDaLista('Documentos a conferir:', radar.documentos),
      '',
      ...linhasDaLista('TERMOS SUGERIDOS PARA PESQUISA JURISPRUDENCIAL:', termos, 'Definir após conferir os fatos'),
      'FONTES OFICIAIS PARA PESQUISA:',
      ...fontesOficiais(assunto, termos),
      '',
      'Observação: conteúdo organizado por IA. A pesquisa de precedentes, os fatos, documentos, prazos e qualquer conclusão jurídica dependem de conferência humana do advogado.',
    ].join('\n').slice(0, 7200);
  }, [artigoSlug, artigoTitulo, assunto, categoria, mensagens, nome, radar, respostasFixas, resumo, telefone]);

  function abrirWhatsApp() {
    registrar({
      nome: nome.trim(),
      telefone,
      email: '',
      area: assunto || categoria,
      mensagem: mensagemWhatsApp,
      origem: `qualificação do artigo: ${artigoTitulo}`,
    });
  }

  function validarIdentificacao(evento: FormEvent) {
    evento.preventDefault();
    if (nome.trim().length < 2) return setErro('Informe seu nome.');
    if (telefone.replace(/\D/g, '').length < 10) return setErro('Informe um telefone com DDD.');
    setErro('');
    setEtapa('assunto');
  }

  function escolherAssunto(valor: string) {
    setAssunto(valor);
    setIndiceFixo(0);
    setRespostasFixas([]);
    setEtapa('qualificacao');
  }

  function responderPerguntaFixa(resposta: string) {
    if (!perguntaAtual) return;
    const atualizadas = [...respostasFixas, { pergunta: perguntaAtual.pergunta, resposta }];
    setRespostasFixas(atualizadas);
    if (indiceFixo + 1 >= perguntasFixas.length) {
      setEtapa('consentimento');
    } else {
      setIndiceFixo((indice) => indice + 1);
    }
  }

  async function consultarIA(conversaAtualizada: Mensagem[]) {
    setMensagens(conversaAtualizada);
    setAlternativasIA([]);
    setMostrarTexto(false);
    setErro('');
    setCarregando(true);

    const controlador = new AbortController();
    const limite = window.setTimeout(() => controlador.abort(), 28_000);

    try {
      const resposta = await fetch('/api/pre-triagem.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        signal: controlador.signal,
        body: JSON.stringify({
          assunto,
          artigo: artigoTitulo,
          mensagens: conversaAtualizada.map((mensagem) => ({
            role: mensagem.papel,
            content: mensagem.texto,
          })),
        }),
      });

      if (!resposta.ok) throw new Error('Falha na organização automatizada');
      const dados = await resposta.json() as RespostaTriagem;
      if (!dados.mensagem) throw new Error('Resposta vazia');

      setMensagens((atuais) => [
        ...atuais,
        {
          id: idMensagem(),
          papel: 'assistant',
          texto: [dados.alerta, dados.mensagem].filter(Boolean).join('\n\n'),
        },
      ]);
      const opcoesRecebidas = limitarLista(dados.alternativas, 5);
      setAlternativasIA(opcoesRecebidas);
      setPermitirTexto(dados.permitirTexto !== false || opcoesRecebidas.length === 0);
      if (dados.resumo) setResumo(dados.resumo.slice(0, 1800));
      const radarRecebido = normalizarRadar(dados.radar);
      if (dados.radar) setRadar(radarRecebido);

      const totalRespostas = conversaAtualizada.filter((mensagem) => mensagem.papel === 'user').length - 1;
      if (dados.pronto || totalRespostas >= 4) {
        if (!radarRecebido.status) {
          setRadar({
            ...radarRecebido,
            status: 'Faltam informações relevantes',
            pontosAtencao: radarRecebido.pontosAtencao.length
              ? radarRecebido.pontosAtencao
              : ['Conferir detalhes, documentos e prazos diretamente no atendimento.'],
          });
        }
        setPronto(true);
      }
    } catch {
      setMensagens((atuais) => [
        ...atuais,
        {
          id: idMensagem(),
          papel: 'assistant',
          texto: 'A organização automatizada está momentaneamente indisponível. O que você já respondeu está pronto para seguir pelo WhatsApp.',
        },
      ]);
      setRadar({
        ...RADAR_VAZIO,
        status: 'Conferência humana necessária',
        pontosAtencao: ['Complementar os fatos e verificar eventual prazo diretamente no atendimento.'],
      });
      setPronto(true);
    } finally {
      window.clearTimeout(limite);
      setCarregando(false);
    }
  }

  function iniciarIA() {
    if (!aceito || carregando) return;
    const contextoFixo: Mensagem = {
      id: idMensagem(),
      papel: 'user',
      texto: `RESPOSTAS DA QUALIFICAÇÃO FIXA\nÁrea: ${assunto}\n${resumoDasRespostas(respostasFixas)}`,
    };
    setEtapa('conversa');
    void consultarIA([contextoFixo]);
  }

  function responderIA(texto: string) {
    const resposta = texto.trim();
    if (resposta.length < 2 || carregando) return;
    const conversaAtualizada = [
      ...mensagens,
      { id: idMensagem(), papel: 'user' as const, texto: resposta },
    ];
    setRascunho('');
    void consultarIA(conversaAtualizada);
  }

  function enviarTexto(evento: FormEvent) {
    evento.preventDefault();
    if (rascunho.trim().length < 8) return setErro('Conte um pouco mais para continuarmos.');
    responderIA(rascunho);
  }

  const linkFinal = linkWhatsApp(mensagemWhatsApp);

  return (
    <aside className="triagem-widget" aria-label="Qualificação inicial do escritório">
      {!aberto ? (
        <button className="triagem-convite" type="button" onClick={() => setAberto(true)}>
          <span className="triagem-convite__balao">
            <strong>Ficou com alguma dúvida?</strong>
            <span>Responda algumas perguntas e fale conosco.</span>
          </span>
          <span className="triagem-avatar triagem-avatar--grande" aria-hidden>
            <img src="/midia/retrato-institucional-720.webp" alt="" width={82} height={82} />
            <i />
          </span>
        </button>
      ) : (
        <section className="triagem-painel" role="dialog" aria-modal="false" aria-labelledby={`${prefixo}-titulo`}>
          <header className="triagem-painel__cabeca">
            <span className="triagem-avatar" aria-hidden>
              <img src="/midia/retrato-institucional-720.webp" alt="" width={52} height={52} />
              <i />
            </span>
            <span>
              <strong id={`${prefixo}-titulo`}>Atendimento inicial</strong>
              <small>Pedro Montalvão Advocacia</small>
            </span>
            <button type="button" onClick={() => setAberto(false)} aria-label="Fechar atendimento">×</button>
          </header>

          {progresso > 0 && etapa !== 'conversa' && (
            <div className="triagem-progresso" aria-label={`Qualificação ${progresso}% concluída`}>
              <span style={{ width: `${progresso}%` }} />
            </div>
          )}

          <div className="triagem-painel__corpo">
            {etapa === 'identificacao' && (
              <form className="triagem-etapa" onSubmit={validarIdentificacao} noValidate>
                <span className="triagem-mensagem triagem-mensagem--assistente">
                  Olá! Para começar, como podemos identificar seu contato?
                </span>
                <div className="triagem-formulario">
                  <label htmlFor={`${prefixo}-nome`}>Nome</label>
                  <input
                    ref={primeiroCampo}
                    id={`${prefixo}-nome`}
                    autoComplete="name"
                    value={nome}
                    onChange={(evento) => { setNome(evento.target.value); setErro(''); }}
                    placeholder="Como devemos chamar você"
                  />
                  <label htmlFor={`${prefixo}-telefone`}>WhatsApp ou telefone</label>
                  <input
                    id={`${prefixo}-telefone`}
                    inputMode="tel"
                    autoComplete="tel"
                    value={telefone}
                    onChange={(evento) => { setTelefone(formatarTelefone(evento.target.value)); setErro(''); }}
                    placeholder="(00) 00000-0000"
                  />
                  {erro && <p className="triagem-erro" role="alert">{erro}</p>}
                  <button className="botao botao--dourado" type="submit">Continuar <span aria-hidden>→</span></button>
                  <small>Seu nome e telefone não são enviados à inteligência artificial.</small>
                </div>
              </form>
            )}

            {etapa === 'assunto' && (
              <div className="triagem-etapa">
                <span className="triagem-mensagem triagem-mensagem--assistente">
                  Obrigado, {nome.trim().split(/\s+/)[0]}. Qual área mais se aproxima do seu caso?
                </span>
                <div className="triagem-opcoes">
                  {ASSUNTOS.map((item) => (
                    <button type="button" key={item} onClick={() => escolherAssunto(item)}>
                      {item}<span aria-hidden>→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {etapa === 'qualificacao' && perguntaAtual && (
              <div className="triagem-etapa">
                <div className="triagem-etapa__meta">
                  <span>Etapa {indiceFixo + 1} de {perguntasFixas.length}</span>
                  <button type="button" onClick={() => setEtapa('assunto')}>Trocar área</button>
                </div>
                <span className="triagem-mensagem triagem-mensagem--assistente">{perguntaAtual.pergunta}</span>
                <div className="triagem-opcoes triagem-opcoes--compactas">
                  {perguntaAtual.alternativas.map((alternativa) => (
                    <button type="button" key={alternativa} onClick={() => responderPerguntaFixa(alternativa)}>
                      {alternativa}<span aria-hidden>→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {etapa === 'consentimento' && (
              <div className="triagem-etapa">
                <span className="triagem-mensagem triagem-mensagem--assistente">
                  Perfeito. Agora podemos fazer perguntas específicas sobre o seu cenário.
                </span>
                <div className="triagem-resumo-fixo">
                  <strong>O que já foi organizado</strong>
                  <ul>
                    {respostasFixas.map(({ resposta }) => <li key={resposta}>{resposta}</li>)}
                  </ul>
                </div>
                <div className="triagem-consentimento-final">
                  <strong>Continuar com o assistente</strong>
                  <p>
                    Suas respostas serão processadas para gerar perguntas complementares e um resumo para conferência do advogado. Não envie senhas, dados bancários ou documentos completos.
                  </p>
                  <label className="triagem-consentimento">
                    <input type="checkbox" checked={aceito} onChange={(evento) => setAceito(evento.target.checked)} />
                    <span>
                      Li a <Link para="/politica-de-privacidade/">Política de Privacidade</Link> e autorizo o processamento destas respostas.
                    </span>
                  </label>
                  <button className="botao botao--dourado" type="button" disabled={!aceito || carregando} onClick={iniciarIA}>
                    Organizar meu caso <span aria-hidden>→</span>
                  </button>
                  <small>A ferramenta não emite parecer nem substitui a análise profissional.</small>
                </div>
              </div>
            )}

            {etapa === 'conversa' && (
              <div className="triagem-etapa triagem-etapa--conversa">
                <div className="triagem-mensagens" aria-live="polite">
                  {mensagens.slice(1).map((mensagem) => (
                    <span
                      className={`triagem-mensagem triagem-mensagem--${mensagem.papel === 'user' ? 'visitante' : 'assistente'}`}
                      key={mensagem.id}
                    >
                      {mensagem.texto}
                    </span>
                  ))}
                  {carregando && (
                    <span className="triagem-digitando" aria-label="Assistente preparando as alternativas">
                      <i /><i /><i />
                    </span>
                  )}
                  <div ref={fimDaConversa} />
                </div>

                {pronto ? (
                  <div className="triagem-final">
                    <span className="triagem-final__selo">Pronto para conferência</span>
                    <strong>Seu atendimento já chega organizado.</strong>
                    <p>As respostas, o resumo, os pontos de atenção e os termos de pesquisa seguirão juntos.</p>
                    {radar.status && (
                      <div className="triagem-radar">
                        <b>{radar.status}</b>
                        {radar.indicadores.slice(0, 3).map((item) => <span key={item}>✓ {item}</span>)}
                        {radar.pontosAtencao.slice(0, 2).map((item) => <span key={item}>! {item}</span>)}
                      </div>
                    )}
                    <a
                      className="botao botao--zap"
                      href={linkFinal}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={abrirWhatsApp}
                      data-cta="pre-triagem-whatsapp"
                    >
                      <IconeWhatsApp tamanho={18} /> Falar com o advogado
                    </a>
                    <small>O WhatsApp abrirá com as informações preenchidas. Confira antes de enviar.</small>
                  </div>
                ) : (
                  <div className="triagem-resposta-ia">
                    {!carregando && alternativasIA.length > 0 && (
                      <div className="triagem-opcoes triagem-opcoes--ia">
                        {alternativasIA.map((alternativa) => (
                          <button type="button" key={alternativa} onClick={() => responderIA(alternativa)}>
                            {alternativa}<span aria-hidden>→</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {!carregando && permitirTexto && !mostrarTexto && (
                      <button className="triagem-outra" type="button" onClick={() => setMostrarTexto(true)}>
                        Minha resposta é diferente
                      </button>
                    )}

                    {!carregando && permitirTexto && (mostrarTexto || alternativasIA.length === 0) && (
                      <form className="triagem-envio" onSubmit={enviarTexto}>
                        <label className="sr-only" htmlFor={`${prefixo}-relato`}>Responder ao assistente</label>
                        <textarea
                          id={`${prefixo}-relato`}
                          value={rascunho}
                          onChange={(evento) => { setRascunho(evento.target.value.slice(0, 1600)); setErro(''); }}
                          placeholder="Escreva apenas o necessário..."
                          rows={3}
                        />
                        {erro && <p className="triagem-erro" role="alert">{erro}</p>}
                        <button className="botao botao--dourado" type="submit">Enviar resposta</button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </aside>
  );
}
