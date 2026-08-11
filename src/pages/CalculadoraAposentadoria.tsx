import { useEffect, useId, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Faq, type Pergunta } from '../components/Faq';
import { IconeSeta, IconeWhatsApp } from '../components/Icones';
import { SecaoCta } from '../components/SecaoCta';
import { rolarAte } from '../components/movimento';
import {
  calcularAposentadoria,
  formatarIdadeCivil,
  formatarTempoPrevidenciario,
  selecionarMelhorBeneficioAtual,
  validarEntradaAposentadoria,
  type EntradaAposentadoria,
  type PeriodoPrevidenciario,
  type RemuneracaoPrevidenciaria,
  type ResultadoAposentadoria,
  type SexoPrevidenciario,
  type TipoPeriodoPrevidenciario,
} from '../lib/calculoAposentadoria';
import { importarCnisPdf } from '../lib/importarCnis';
import { montarMensagemCalculadora } from '../lib/mensagemCalculadora';
import { Link } from '../lib/router';
import { linkWhatsApp } from '../site.config';

export const FAQ_APOSENTADORIA: Pergunta[] = [
  {
    pergunta: 'O arquivo do CNIS é enviado para o escritório ou armazenado?',
    resposta: 'Não. A leitura acontece localmente no navegador. O PDF não é enviado ao servidor, não exige cadastro e deixa de existir para a ferramenta quando a página é fechada ou recarregada.',
  },
  {
    pergunta: 'A importação do CNIS elimina a conferência dos vínculos?',
    resposta: 'Não. O CNIS pode ter lacunas, indicadores, remunerações inferiores ao mínimo, vínculos concomitantes ou períodos que dependem de prova. A ferramenta organiza o extrato, mas a prova documental continua indispensável.',
  },
  {
    pergunta: 'A conversão do tempo especial anterior à reforma é calculada?',
    resposta: 'Sim. Para trabalho especial cumprido até 13/11/2019, o memorial aplica os fatores de conversão para 30 anos (mulher) ou 35 anos (homem). O período posterior à reforma não recebe conversão em tempo comum.',
  },
  {
    pergunta: 'Como a RMI é estimada?',
    resposta: 'As remunerações são consolidadas por competência, atualizadas até a base monetária da DIB pelos fatores oficiais do Ministério da Previdência e submetidas à fórmula de cada regra. Projeções posteriores à tabela oficial usam o salário de contribuição informado em valores reais de julho de 2026.',
  },
  {
    pergunta: 'O resultado substitui um cálculo do processo administrativo ou judicial?',
    resposta: 'Não. Indicadores, acertos do CNIS, tempo especial, rural, PCD, professor, CTC, salários ausentes, descarte de contribuições e documentos podem mudar o resultado. O relatório serve como memorial técnico preliminar e precisa de conferência profissional antes de embasar um pedido ou petição.',
  },
];

const TIPOS: Array<{ valor: TipoPeriodoPrevidenciario; rotulo: string }> = [
  { valor: 'comum', rotulo: 'Atividade comum' },
  { valor: 'professor', rotulo: 'Professor da educação básica' },
  { valor: 'especial25', rotulo: 'Especial — requisito de 25 anos' },
  { valor: 'especial20', rotulo: 'Especial — requisito de 20 anos' },
  { valor: 'especial15', rotulo: 'Especial — requisito de 15 anos' },
  { valor: 'rural', rotulo: 'Atividade rural comprovável' },
  { valor: 'pcd_leve', rotulo: 'PCD — grau leve' },
  { valor: 'pcd_moderada', rotulo: 'PCD — grau moderado' },
  { valor: 'pcd_grave', rotulo: 'PCD — grau grave' },
  { valor: 'rpps_ctc', rotulo: 'RPPS com CTC disponível' },
];

const ROTULO_TIPO = Object.fromEntries(TIPOS.map((tipo) => [tipo.valor, tipo.rotulo])) as Record<TipoPeriodoPrevidenciario, string>;

const dataHojeLocal = () => {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
};

const dataBr = (valor: string | null) => valor
  ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${valor}T00:00:00Z`))
  : 'Não projetada';

const competenciaBr = (valor: string) => `${valor.slice(5)}/${valor.slice(0, 4)}`;
const moeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
const percentual = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor);

function novoPeriodo(): PeriodoPrevidenciario {
  return {
    id: `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    inicio: '', fim: '', origem: 'Período informado manualmente', tipo: 'comum',
    incluir: true, contaCarencia: true, indicadores: [], competenciasExcluidas: [],
  };
}

function rotuloStatus(status: string): string {
  if (status === 'direito_adquirido') return 'Direito adquirido indicado';
  if (status === 'cumprido') return 'Requisitos indicados';
  if (status === 'projetado') return 'Projeção futura';
  return 'Não se enquadra nesta regra';
}

type IdentificacaoTela = { nome: string; nit: string; cpf: string };

export function CalculadoraAposentadoria() {
  const prefixo = useId();
  const [identificacao, setIdentificacao] = useState<IdentificacaoTela>({ nome: '', nit: '', cpf: '' });
  const [nascimento, setNascimento] = useState('');
  const [sexo, setSexo] = useState<SexoPrevidenciario>('masculino');
  const [dataReferencia, setDataReferencia] = useState('');
  const [atividadeFutura, setAtividadeFutura] = useState<TipoPeriodoPrevidenciario>('comum');
  const [salarioFuturo, setSalarioFuturo] = useState(1621);
  const [periodos, setPeriodos] = useState<PeriodoPrevidenciario[]>([]);
  const [remuneracoes, setRemuneracoes] = useState<RemuneracaoPrevidenciaria[]>([]);
  const [resultado, setResultado] = useState<ResultadoAposentadoria | null>(null);
  const [regraSelecionadaId, setRegraSelecionadaId] = useState('');
  const [etapa, setEtapa] = useState<'dados' | 'resultado'>('dados');
  const [erros, setErros] = useState<string[]>([]);
  const [avisosImportacao, setAvisosImportacao] = useState<string[]>([]);
  const [resumoImportacao, setResumoImportacao] = useState('');
  const [importando, setImportando] = useState(false);
  const [simulando, setSimulando] = useState(false);
  const [periodosConferidos, setPeriodosConferidos] = useState<Record<string, boolean>>({});
  const [remuneracoesConferidas, setRemuneracoesConferidas] = useState<Record<string, boolean>>({});

  useEffect(() => setDataReferencia(dataHojeLocal()), []);

  useEffect(() => {
    if (etapa !== 'resultado' || !resultado) return;
    const levarAoTopo = () => rolarAte(0, true);
    levarAoTopo();
    const quadro = window.requestAnimationFrame(levarAoTopo);
    return () => window.cancelAnimationFrame(quadro);
  }, [etapa, resultado]);

  const entrada = useMemo<EntradaAposentadoria>(() => ({
    nascimento, sexo, dataReferencia, atividadeFutura, periodos, remuneracoes,
    salarioContribuicaoFuturo: salarioFuturo,
  }), [atividadeFutura, dataReferencia, nascimento, periodos, remuneracoes, salarioFuturo, sexo]);
  const apontamentosPendentes = periodos.filter((periodo) => periodo.indicadores.length > 0 && !periodosConferidos[periodo.id]).length
    + remuneracoes.filter((remuneracao) => remuneracao.indicadores.length > 0 && !remuneracoesConferidas[remuneracao.id]).length;
  const conferenciaLiberada = apontamentosPendentes === 0;

  const regraSelecionada = useMemo(() => resultado?.regras.find((regra) => regra.id === regraSelecionadaId)
    ?? resultado?.regras.find((regra) => regra.dataEstimada)
    ?? null, [regraSelecionadaId, resultado]);

  const mensagemResultado = useMemo(() => {
    if (!resultado) return 'Olá, gostaria de conferir uma simulação de aposentadoria feita no site.';
    const melhores = resultado.regras.filter((regra) => regra.dataEstimada).slice(0, 5);
    return montarMensagemCalculadora({
      titulo: 'Simulador de aposentadoria e CNIS',
      total: regraSelecionada?.dataEstimada ? dataBr(regraSelecionada.dataEstimada) : 'Sem data projetada',
      dados: [
        { rotulo: 'Data de nascimento', valor: dataBr(nascimento) },
        { rotulo: 'Tempo de contribuição estimado', valor: formatarTempoPrevidenciario(resultado.tempoComumDias) },
        { rotulo: 'Carência estimada', valor: `${resultado.carenciaMeses} competências` },
        ...(regraSelecionada?.rmi?.disponivel ? [{ rotulo: 'RMI estimada', valor: moeda(regraSelecionada.rmi.rmiEstimada) }] : []),
      ],
      memoria: melhores.map((regra) => ({ rotulo: regra.nome, valor: dataBr(regra.dataEstimada) })),
      observacoes: ['O PDF do CNIS e os dados de identificação não são anexados nem enviados por esta mensagem.'],
    });
  }, [nascimento, regraSelecionada, resultado]);

  const invalidarResultado = () => {
    setResultado(null);
    setEtapa('dados');
  };

  const alterarPeriodo = <K extends keyof PeriodoPrevidenciario>(id: string, chave: K, valor: PeriodoPrevidenciario[K]) => {
    setPeriodos((atuais) => atuais.map((periodo) => periodo.id === id ? { ...periodo, [chave]: valor } : periodo));
    setPeriodosConferidos((atuais) => ({ ...atuais, [id]: false }));
    invalidarResultado();
  };

  const alterarRemuneracao = (id: string, alteracao: Partial<Pick<RemuneracaoPrevidenciaria, 'valor' | 'incluir'>>) => {
    const novas = remuneracoes.map((remuneracao) => remuneracao.id === id ? { ...remuneracao, ...alteracao } : remuneracao);
    setRemuneracoes(novas);
    setRemuneracoesConferidas((atuais) => ({ ...atuais, [id]: false }));
    setPeriodos((periodosAtuais) => periodosAtuais.map((periodo) => {
      if (!periodo.sequenciaCnis) return periodo;
      const excluidas = novas
        .filter((item) => item.sequencia === periodo.sequenciaCnis && !item.incluir)
        .map((item) => item.competencia);
      return { ...periodo, competenciasExcluidas: [...new Set(excluidas)] };
    }));
    invalidarResultado();
  };

  const importarArquivo = async (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!arquivo) return;
    setImportando(true);
    setErros([]);
    setPeriodosConferidos({});
    setRemuneracoesConferidas({});
    invalidarResultado();
    try {
      const importado = await importarCnisPdf(arquivo);
      setIdentificacao(importado.identificacao);
      setPeriodos(importado.periodos);
      setRemuneracoes(importado.remuneracoes);
      if (importado.nascimento) setNascimento(importado.nascimento);
      if (importado.sexo) setSexo(importado.sexo);
      setAvisosImportacao(importado.avisos);
      setResumoImportacao(`${importado.identificacao.nome || 'Titular não identificado'} · ${importado.paginas} página(s) · ${importado.periodos.length} relação(ões) · ${importado.competenciasEncontradas} competência(s).`);
    } catch (erro) {
      setErros([erro instanceof Error ? erro.message : 'Não foi possível ler o PDF do CNIS.']);
      setAvisosImportacao([]);
      setResumoImportacao('');
    } finally {
      setImportando(false);
    }
  };

  const calcular = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (simulando) return;
    const problemas = validarEntradaAposentadoria(entrada);
    if (!identificacao.nome.trim()) problemas.push('Informe o nome do titular para identificar o relatório.');
    if (apontamentosPendentes > 0) problemas.push(`Confirme os ${apontamentosPendentes} apontamento(s) destacado(s) em vermelho antes de simular.`);
    setErros([...new Set(problemas)]);
    if (problemas.length) {
      const primeiroApontamento = document.querySelector<HTMLElement>('[data-apontamento-pendente="true"]');
      if (primeiroApontamento) {
        const detalhes = primeiroApontamento.closest('details');
        if (detalhes) detalhes.open = true;
        primeiroApontamento.scrollIntoView({ behavior: 'smooth', block: 'center' });
        primeiroApontamento.focus({ preventScroll: true });
      } else {
        window.requestAnimationFrame(() => document.getElementById(`${prefixo}-erros`)?.focus());
      }
      return;
    }
    setSimulando(true);
    try {
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => resolve());
      }));
      const calculado = calcularAposentadoria(entrada);
      const primeira = selecionarMelhorBeneficioAtual(calculado.regras)
        ?? calculado.regras.find((regra) => regra.status === 'direito_adquirido' || regra.status === 'cumprido')
        ?? calculado.regras.find((regra) => regra.status === 'projetado');
      setResultado(calculado);
      setRegraSelecionadaId(primeira?.id ?? '');
      setEtapa('resultado');
    } catch {
      setErros(['Não foi possível concluir a simulação. Confira os dados e tente novamente.']);
    } finally {
      setSimulando(false);
    }
  };

  const limpar = () => {
    setIdentificacao({ nome: '', nit: '', cpf: '' });
    setNascimento(''); setSexo('masculino'); setDataReferencia(dataHojeLocal());
    setAtividadeFutura('comum'); setSalarioFuturo(1621); setPeriodos([]); setRemuneracoes([]);
    setResultado(null); setErros([]); setAvisosImportacao([]); setResumoImportacao(''); setEtapa('dados'); setPeriodosConferidos({}); setRemuneracoesConferidas({});
  };

  if (resultado && etapa === 'resultado') {
    const rmi = regraSelecionada?.rmi;
    const regrasAtuais = resultado.regras.filter((regra) => regra.status === 'direito_adquirido' || regra.status === 'cumprido');
    const possuiDireitoAtual = regrasAtuais.length > 0;
    const melhorBeneficio = selecionarMelhorBeneficioAtual(resultado.regras);
    const proximaRegra = resultado.regras.find((regra) => regra.status === 'projetado');
    return (
      <main className="aposentadoria-relatorio-modo">
        <div className="aposentadoria-relatorio-acoes envolucro">
          <button className="botao botao--contorno" type="button" onClick={() => setEtapa('dados')}>← Voltar e editar</button>
          <label className="calculadora-campo aposentadoria-regra-seletor">
            <span>Regra detalhada no memorial</span>
            <select value={regraSelecionada?.id ?? ''} onChange={(evento) => setRegraSelecionadaId(evento.target.value)}>
              {resultado.regras.filter((regra) => regra.dataEstimada).map((regra) => <option value={regra.id} key={regra.id}>{regra.nome} — {dataBr(regra.dataEstimada)}</option>)}
            </select>
          </label>
          <button className="botao botao--dourado" type="button" onClick={() => window.print()}>Imprimir / salvar em PDF</button>
        </div>

        <article className="aposentadoria-relatorio envolucro" id={`${prefixo}-resultado`} aria-live="polite">
          <header className="aposentadoria-relatorio__capa">
            <div><span>Memorial de cálculo previdenciário</span><h1>{identificacao.nome}</h1><p>Simulação elaborada em {dataBr(dataReferencia)} · RMI expressa na competência da DIB</p></div>
            <small>Relatório técnico preliminar</small>
          </header>

          <section className={`aposentadoria-direito-atual ${possuiDireitoAtual ? 'is-positivo' : 'is-negativo'}`} aria-label="Conclusão na data de referência">
            <div className="aposentadoria-direito-atual__icone" aria-hidden>{possuiDireitoAtual ? '✓' : '!'}</div>
            <div>
              <span>Conclusão na data de referência · {dataBr(dataReferencia)}</span>
              <h2>{possuiDireitoAtual ? 'Possui requisitos para aposentadoria atualmente' : 'Não possui requisitos para aposentadoria atualmente'}</h2>
              {possuiDireitoAtual ? (
                <p>Enquadramento matemático indicado em: <strong>{regrasAtuais.map((regra) => regra.nome).join('; ')}</strong>. A concessão depende da confirmação dos documentos, indicadores e períodos classificados.</p>
              ) : (
                <p>Na data de referência, a idade civil era <strong>{formatarIdadeCivil(nascimento, dataReferencia)}</strong>. Nenhuma das regras analisadas aparece preenchida nesta data com os dados conferidos.{proximaRegra ? <> A projeção mais próxima é <strong>{proximaRegra.nome}</strong>, em <strong>{dataBr(proximaRegra.dataEstimada)}</strong>, supondo contribuição contínua.</> : ' Não foi possível obter uma projeção futura com a atividade selecionada.'}</p>
              )}
            </div>
          </section>

          {melhorBeneficio?.rmi?.disponivel && (
            <section className="aposentadoria-melhor-beneficio" aria-label="Melhor benefício estimado na data de referência">
              <div>
                <span>Melhor benefício estimado na DER</span>
                <h2>{melhorBeneficio.nome}</h2>
                <p>Maior RMI calculada entre as {regrasAtuais.length} regra(s) com requisitos preenchidos na data de referência.</p>
              </div>
              <div className="aposentadoria-melhor-beneficio__valor">
                <small>RMI estimada</small>
                <strong>{moeda(melhorBeneficio.rmi.rmiEstimada)}</strong>
                <span>DIB calculada: {dataBr(melhorBeneficio.dataEstimada)}</span>
              </div>
            </section>
          )}

          <aside className="aposentadoria-disclaimer aposentadoria-disclaimer--relatorio" role="note">
            <strong>Aviso importante</strong>
            <p>Este relatório apresenta apenas uma breve simulação previdenciária, elaborada com os dados informados e classificados na ferramenta. Não constitui parecer jurídico, não garante a concessão do benefício e não dispensa a análise individualizada de um advogado.</p>
          </aside>

          <section className="aposentadoria-relatorio__secao">
            <div className="aposentadoria-relatorio__titulo"><span>01</span><div><h2>Identificação e premissas</h2><p>Dados lidos localmente do extrato e premissas selecionadas para a projeção.</p></div></div>
            <dl className="aposentadoria-identificacao">
              <div><dt>Segurado</dt><dd>{identificacao.nome}</dd></div>
              <div><dt>Nascimento</dt><dd>{dataBr(nascimento)}</dd></div>
              <div><dt>Idade na data de referência</dt><dd>{formatarIdadeCivil(nascimento, dataReferencia)}</dd></div>
              <div><dt>Sexo previdenciário</dt><dd>{sexo === 'feminino' ? 'Feminino' : 'Masculino'}</dd></div>
              <div><dt>Data de referência</dt><dd>{dataBr(dataReferencia)}</dd></div>
              {identificacao.nit && <div><dt>NIT</dt><dd>{identificacao.nit}</dd></div>}
              {identificacao.cpf && <div><dt>CPF</dt><dd>{identificacao.cpf}</dd></div>}
              <div><dt>Atividade futura</dt><dd>{ROTULO_TIPO[atividadeFutura]}</dd></div>
              <div><dt>Contribuição futura</dt><dd>{moeda(salarioFuturo)} por mês</dd></div>
            </dl>
          </section>

          <section className="aposentadoria-relatorio__secao">
            <div className="aposentadoria-relatorio__titulo"><span>02</span><div><h2>Síntese do tempo apurado</h2><p>Períodos concomitantes foram contados uma única vez; a conversão especial encerra em 13/11/2019.</p></div></div>
            <aside className="aposentadoria-concomitancia" role="note"><strong>Critérios de tempo, concomitância e descarte</strong><p><b>Tempo e carência:</b> uma única contagem por período ou competência. <b>RMI:</b> remunerações válidas do mesmo mês são somadas e limitadas ao teto histórico. Nas regras pós-reforma elegíveis, o sistema compara o descarte das menores contribuições sem utilizar o tempo correspondente.</p></aside>
            <div className="aposentadoria-resumo">
              <div><span>Tempo de contribuição</span><strong>{formatarTempoPrevidenciario(resultado.tempoComumDias)}</strong></div>
              <div><span>Carência</span><strong>{resultado.carenciaMeses} competências</strong></div>
              <div><span>Tempo especial equivalente a 25</span><strong>{formatarTempoPrevidenciario(resultado.tempoEspecial['25'])}</strong></div>
              <div><span>Relações analisadas</span><strong>{resultado.memorialPeriodos.length}</strong></div>
            </div>
            <div className="aposentadoria-tabela-wrap"><table className="aposentadoria-tabela aposentadoria-tabela--compacta"><thead><tr><th>Marco</th><th>Idade civil</th><th>Tempo de contribuição</th><th>Carência</th></tr></thead><tbody>{resultado.memorialMarcos.map((marco) => <tr key={`${marco.data}-${marco.rotulo}`}><td><strong>{marco.rotulo}</strong><small>{dataBr(marco.data)}</small></td><td>{formatarIdadeCivil(nascimento, marco.data)}</td><td>{formatarTempoPrevidenciario(marco.tempoComumDias)}</td><td>{marco.carenciaMeses}</td></tr>)}</tbody></table></div>
          </section>

          <section className="aposentadoria-relatorio__secao">
            <div className="aposentadoria-relatorio__titulo"><span>03</span><div><h2>Comparativo das regras</h2><p>Verde indica requisito preenchido; amarelo, projeção futura; vermelho, regra não aplicável aos dados informados.</p></div></div>
            <div className="aposentadoria-tabela-wrap"><table className="aposentadoria-tabela aposentadoria-tabela--regras"><thead><tr><th>Regra</th><th>Situação</th><th>Data</th><th>RMI estimada</th></tr></thead><tbody>{resultado.regras.map((regra) => {
              const classes = [
                `is-status-${regra.status}`,
                regra.id === regraSelecionada?.id ? 'is-selecionada' : '',
                regra.id === melhorBeneficio?.id ? 'is-melhor-beneficio' : '',
              ].filter(Boolean).join(' ');
              return <tr className={classes} key={regra.id}><td><strong>{regra.nome}</strong><small>{regra.fundamento}</small></td><td><span className={`aposentadoria-status aposentadoria-status--${regra.status}`}>{rotuloStatus(regra.status)}</span>{regra.id === melhorBeneficio?.id && <small className="aposentadoria-status__melhor">Melhor RMI atual</small>}</td><td>{dataBr(regra.dataEstimada)}</td><td><strong>{regra.rmi?.disponivel ? moeda(regra.rmi.rmiEstimada) : 'Não calculada'}</strong></td></tr>;
            })}</tbody></table></div>
          </section>

          {regraSelecionada && (
            <section className="aposentadoria-relatorio__secao aposentadoria-memorial-rmi">
              <div className="aposentadoria-relatorio__titulo"><span>04</span><div><h2>Memorial da regra selecionada</h2><p>{regraSelecionada.nome} · data calculada: {dataBr(regraSelecionada.dataEstimada)}</p></div></div>
              <div className="aposentadoria-regra-destaque"><div><span>{regraSelecionada.grupo}</span><h3>{regraSelecionada.nome}</h3><p>{regraSelecionada.resumo}</p></div><strong>{rmi?.disponivel ? moeda(rmi.rmiEstimada) : 'RMI indisponível'}</strong></div>
              <div className="aposentadoria-memorial-grade">
                <div><span>PBC</span><strong>{rmi ? `${competenciaBr(rmi.pbcInicio)} a ${competenciaBr(rmi.pbcFim)}` : '—'}</strong></div>
                <div><span>Base monetária da RMI</span><strong>{rmi ? competenciaBr(rmi.competenciaMonetaria) : '—'}</strong></div>
                <div><span>Salários utilizados</span><strong>{rmi ? `${rmi.salariosUtilizados} de ${rmi.salariosLocalizados}` : '—'}</strong></div>
                <div><span>Soma atualizada</span><strong>{rmi?.disponivel ? moeda(rmi.somaAtualizada) : '—'}</strong></div>
                <div><span>Divisor</span><strong>{rmi?.divisor || '—'}</strong></div>
                <div><span>Média contributiva</span><strong>{rmi?.disponivel ? moeda(rmi.mediaContributiva) : '—'}</strong></div>
                <div><span>Salário de benefício</span><strong>{rmi?.disponivel ? moeda(rmi.salarioBeneficio) : '—'}</strong></div>
                <div><span>Coeficiente</span><strong>{rmi?.disponivel ? percentual(rmi.coeficiente) : '—'}</strong></div>
                <div><span>Fator previdenciário</span><strong>{rmi?.fatorPrevidenciario ? rmi.fatorPrevidenciario.toFixed(6) : 'Não aplicado'}</strong></div>
                {rmi?.descarteAplicado && <div><span>Descarte seletivo</span><strong>{rmi.competenciasDescartadas} competência(s)</strong></div>}
                {rmi?.descarteAplicado && <div><span>Tempo utilizado após descarte</span><strong>{formatarTempoPrevidenciario(rmi.tempoAposDescarteDias ?? 0)}</strong><small>{rmi.carenciaAposDescarte} competências de carência</small></div>}
              </div>
              {rmi && <div className="aposentadoria-formula"><strong>Fórmula aplicada</strong><p>{rmi.metodo}</p><p>Renda matemática: {moeda(rmi.rendaCalculada)}. RMI após piso/teto: <strong>{moeda(rmi.rmiEstimada)}</strong>{rmi.pisoAplicado ? ' (piso aplicado)' : ''}{rmi.tetoAplicado ? ' (teto aplicado)' : ''}.</p></div>}
              <h3>Requisitos da regra</h3><ul className="aposentadoria-lista-requisitos">{regraSelecionada.requisitos.map((requisito) => <li key={requisito}>{requisito}</li>)}</ul>
            </section>
          )}

          <section className="aposentadoria-relatorio__secao aposentadoria-quebra-pagina">
            <div className="aposentadoria-relatorio__titulo"><span>05</span><div><h2>Memória dos períodos e conversões</h2><p>O fator superior a 1 aparece apenas nos períodos classificados como especiais.</p></div></div>
            <div className="aposentadoria-tabela-wrap"><table className="aposentadoria-tabela"><thead><tr><th>#</th><th>Origem e período</th><th>Classificação</th><th>Tempo original</th><th>Fator</th><th>Tempo convertido</th><th>Carência</th></tr></thead><tbody>{resultado.memorialPeriodos.map((periodo, indice) => <tr className={!periodo.incluido ? 'is-excluida' : ''} key={periodo.id}><td>{indice + 1}</td><td><strong>{periodo.origem}</strong><small>{dataBr(periodo.inicio)} a {dataBr(periodo.fim)}{periodo.indicadores.length ? ` · ${periodo.indicadores.join(', ')}` : ''}</small></td><td>{ROTULO_TIPO[periodo.tipo]}</td><td>{formatarTempoPrevidenciario(periodo.diasOriginais)}</td><td>{periodo.fatorConversao.toFixed(2)}{periodo.limiteConversao && <small>até 13/11/2019</small>}</td><td>{formatarTempoPrevidenciario(periodo.diasConvertidos)}</td><td>{periodo.carenciaMeses}</td></tr>)}</tbody></table></div>
            <div className="aposentadoria-fatores"><strong>Conversão especial em comum até 13/11/2019</strong><span>Mulher: 15→2,00 · 20→1,50 · 25→1,20</span><span>Homem: 15→2,33 · 20→1,75 · 25→1,40</span></div>
          </section>

          {rmi && rmi.salarios.length > 0 && (
            <section className="aposentadoria-relatorio__secao aposentadoria-quebra-pagina">
              <div className="aposentadoria-relatorio__titulo"><span>06</span><div><h2>Relação dos salários de contribuição</h2><p>Consolidação mensal, atualização oficial e indicação do que entrou na média da regra selecionada.</p></div></div>
              <div className="aposentadoria-tabela-wrap"><table className="aposentadoria-tabela aposentadoria-tabela--salarios"><thead><tr><th>Competência</th><th>Origem</th><th>Nominal</th><th>Fator</th><th>Atualizado</th><th>Situação</th></tr></thead><tbody>{rmi.salarios.map((salario) => <tr className={!salario.incluido ? 'is-excluida' : ''} key={`${salario.competencia}-${salario.origem}`}><td>{competenciaBr(salario.competencia)}</td><td>{salario.origem}{salario.concomitante && <small className="aposentadoria-concomitante-marca">{salario.quantidadeRemuneracoes} remunerações somadas</small>}<small>{salario.indicadores.join(', ')}</small></td><td>{moeda(salario.nominal)}{salario.limitadoAoTeto && <small>Base considerada: {moeda(salario.nominalConsiderado)} · teto da competência: {moeda(salario.tetoCompetencia)}</small>}</td><td>{salario.fatorAtualizacao ? salario.fatorAtualizacao.toFixed(6) : '—'}</td><td>{salario.atualizado ? moeda(salario.atualizado) : '—'}</td><td>{salario.incluido ? 'Incluído' : salario.projetado ? 'Projetado' : 'Excluído/descartado'}</td></tr>)}</tbody></table></div>
            </section>
          )}

          <section className="aposentadoria-relatorio__secao aposentadoria-relatorio__fecho">
            <div className="aposentadoria-relatorio__titulo"><span>07</span><div><h2>Ressalvas e fontes</h2><p>Pontos que precisam ser enfrentados antes de usar o cálculo em requerimento ou petição.</p></div></div>
            <div className="aposentadoria-ressalvas">{[...resultado.alertas, ...(rmi?.alertas ?? [])].map((alerta) => <p key={alerta}>{alerta}</p>)}</div>
            <p><strong>Fontes normativas principais:</strong> Lei 8.213/1991, especialmente art. 32; Lei 9.876/1999; Lei 13.846/2019; LC 142/2013; EC 20/1998; EC 103/2019; Decreto 3.048/1999; IN PRES/INSS 128/2022; Tema 1.070/STJ; Portaria MPS nº 1.092/2026; Tábua Completa de Mortalidade IBGE 2024; ADI 6309/STF.</p>
            <div className="aposentadoria-declaracao"><strong>Natureza do documento</strong><p>Simulação matemática automatizada, baseada nos dados classificados pelo usuário. Não certifica atividade especial, deficiência, labor rural, magistério, validade de CTC, acerto de indicadores ou autenticidade documental. Nas regras de idade pós-reforma implementadas, o descarte seletivo somente é aplicado quando aumenta a RMI e preserva os requisitos mínimos, retirando também o tempo correspondente. A RMI é expressa nos valores da respectiva DIB indicada no memorial e não inclui revisão administrativa, reajuste posterior do benefício, otimizações não indicadas, teses judiciais ou efeitos financeiros retroativos.</p></div>
          </section>
          <footer className="aposentadoria-relatorio__rodape"><span>Pedro Montalvão Advocacia · simulador gratuito</span><span>{identificacao.nome} · {dataBr(dataReferencia)}</span></footer>
        </article>
      </main>
    );
  }

  return (
    <>
      <section className="heroi calculadora-heroi aposentadoria-heroi">
        <div className="heroi__luz" aria-hidden />
        <div className="envolucro calculadora-pagina__largura"><div className="artigo-cabeca">
          <nav className="migalhas" aria-label="Você está em"><Link para="/">Início</Link><span aria-hidden>/</span><Link para="/calculadoras/">Calculadoras</Link><span aria-hidden>/</span><Link para="/calculadoras/previdenciario/">Previdenciário</Link><span aria-hidden>/</span><span>Aposentadoria</span></nav>
          <span className="olho">Planejamento previdenciário · versão jurídica de agosto de 2026</span>
          <h1>Simulador de aposentadoria com CNIS e RMI</h1>
          <p className="chamada">Importe o extrato, confira vínculos e remunerações e gere um memorial completo em uma tela própria, pronto para imprimir.</p>
          <div className="calculadora-etiquetas"><span>Leitura local do PDF</span><span>Conversão especial</span><span>RMI por regra</span><span>Relatório imprimível</span></div>
        </div></div>
      </section>

      <section className="secao calculadora-area aposentadoria-configuracao">
        <div className="envolucro aposentadoria-largura calculadora-pagina__largura">
          <div className="aposentadoria-configuracao__cabeca"><div><span className="olho">Mesa de conferência</span><h2>Prepare os dados antes de calcular</h2><p>O resultado abrirá em outra tela. Nada do CNIS sai do navegador.</p></div><div className="aposentadoria-etapas"><span className="is-ativa">1 · Importar</span><span>2 · Conferir</span><span>3 · Relatório</span></div></div>
          <form className="aposentadoria-formulario" onSubmit={calcular} noValidate aria-busy={simulando}>
            <fieldset className="calculadora-passo aposentadoria-painel aposentadoria-upload">
              <legend>Importação do CNIS</legend>
              <div className="aposentadoria-upload__grade"><div><h3>Extrato Previdenciário completo</h3><p>Use “Relações Previdenciárias e Remunerações”. O leitor reconhece páginas rotacionadas, nome, nascimento, relações, competências, valores e indicadores.</p><label className="botao botao--dourado aposentadoria-upload__botao">{importando ? 'Lendo o documento…' : 'Selecionar PDF do CNIS'}<input type="file" accept="application/pdf,.pdf" onChange={importarArquivo} disabled={importando} /></label></div><div className="aposentadoria-privacidade"><strong>Privacidade por arquitetura</strong><p>O PDF é aberto somente nesta aba. CPF, NIT, vínculos e salários não são enviados nem armazenados.</p></div></div>
              {resumoImportacao && <p className="aposentadoria-importacao-ok"><strong>Importação concluída</strong><span>{resumoImportacao}</span></p>}
              {avisosImportacao.length > 0 && <ul className="aposentadoria-avisos">{avisosImportacao.map((aviso) => <li key={aviso}>{aviso}</li>)}</ul>}
            </fieldset>

            <fieldset className="calculadora-passo aposentadoria-painel">
              <legend>Identificação e projeção</legend>
              <div className="calculadora-grade aposentadoria-dados-grade">
                <div className="calculadora-campo aposentadoria-campo-largo"><label htmlFor={`${prefixo}-nome`}>Nome do titular</label><input id={`${prefixo}-nome`} value={identificacao.nome} onChange={(e) => { setIdentificacao((atual) => ({ ...atual, nome: e.target.value })); invalidarResultado(); }} placeholder="Nome completo" required /></div>
                <div className="calculadora-campo"><label htmlFor={`${prefixo}-nascimento`}>Data de nascimento</label><input id={`${prefixo}-nascimento`} type="date" value={nascimento} onChange={(e) => { setNascimento(e.target.value); invalidarResultado(); }} required /></div>
                <div className="calculadora-campo"><label htmlFor={`${prefixo}-sexo`}>Sexo previdenciário</label><select id={`${prefixo}-sexo`} value={sexo} onChange={(e) => { setSexo(e.target.value as SexoPrevidenciario); invalidarResultado(); }}><option value="feminino">Feminino</option><option value="masculino">Masculino</option></select></div>
                <div className="calculadora-campo"><label htmlFor={`${prefixo}-referencia`}>Data de referência / DER</label><input id={`${prefixo}-referencia`} type="date" value={dataReferencia} onChange={(e) => { setDataReferencia(e.target.value); invalidarResultado(); }} required /></div>
                <div className="calculadora-campo"><label htmlFor={`${prefixo}-futura`}>Atividade futura</label><select id={`${prefixo}-futura`} value={atividadeFutura} onChange={(e) => { setAtividadeFutura(e.target.value as TipoPeriodoPrevidenciario); invalidarResultado(); }}>{TIPOS.filter((tipo) => tipo.valor !== 'rpps_ctc').map((tipo) => <option value={tipo.valor} key={tipo.valor}>{tipo.rotulo}</option>)}</select></div>
                <div className="calculadora-campo"><label htmlFor={`${prefixo}-salario-futuro`}>Salário de contribuição futuro</label><input id={`${prefixo}-salario-futuro`} type="number" min="0" step="0.01" value={salarioFuturo} onChange={(e) => { setSalarioFuturo(Number(e.target.value)); invalidarResultado(); }} /><small>Valor real mensal na base de julho/2026.</small></div>
              </div>
            </fieldset>

            <fieldset className="calculadora-passo aposentadoria-painel aposentadoria-periodos">
              <legend>Relações previdenciárias</legend>
              <div className="aposentadoria-painel__intro"><div><h3>{periodos.length || 'Nenhum'} período(s) para conferência</h3><p>Todos os períodos importados vêm incluídos por padrão. Os alertas não os desmarcam: confira e exclua manualmente o que não puder ser comprovado. Classifique especial, professor, rural, PCD ou CTC apenas quando houver prova.</p></div><button className="botao botao--contorno" type="button" onClick={() => { setPeriodos((atuais) => [...atuais, novoPeriodo()]); invalidarResultado(); }}>Adicionar período</button></div>
              <div className="aposentadoria-periodos__lista">{periodos.map((periodo, indice) => {
                const temApontamento = periodo.indicadores.length > 0;
                const apontamentoConferido = Boolean(periodosConferidos[periodo.id]);
                return <article className={`aposentadoria-periodo${periodo.incluir ? '' : ' aposentadoria-periodo--excluido'}${temApontamento ? ' aposentadoria-periodo--apontamento' : ''}`} key={periodo.id}>
                  <div className="aposentadoria-periodo__cabeca"><div><span>#{indice + 1}</span><input className="aposentadoria-periodo__titulo" aria-label={`Origem do período ${indice + 1}`} title="Origem do vínculo" placeholder="Origem do vínculo" value={periodo.origem} onChange={(e) => alterarPeriodo(periodo.id, 'origem', e.target.value)} /></div><label className="aposentadoria-chave"><input type="checkbox" checked={periodo.incluir} onChange={(e) => alterarPeriodo(periodo.id, 'incluir', e.target.checked)} /><span>Incluir</span></label></div>
                  <div className="aposentadoria-periodo__grade"><div className="calculadora-campo"><label>Início</label><input type="date" value={periodo.inicio} onChange={(e) => alterarPeriodo(periodo.id, 'inicio', e.target.value)} /></div><div className="calculadora-campo"><label>Fim</label><input type="date" value={periodo.fim} onChange={(e) => alterarPeriodo(periodo.id, 'fim', e.target.value)} /></div><div className="calculadora-campo"><label>Classificação</label><select value={periodo.tipo} onChange={(e) => alterarPeriodo(periodo.id, 'tipo', e.target.value as TipoPeriodoPrevidenciario)}>{TIPOS.map((tipo) => <option value={tipo.valor} key={tipo.valor}>{tipo.rotulo}</option>)}</select></div></div>
                  {temApontamento && <div className={`aposentadoria-apontamento-local${apontamentoConferido ? ' is-confirmado' : ''}`} role="alert" tabIndex={-1} data-apontamento-pendente={apontamentoConferido ? undefined : 'true'}><div><strong>{apontamentoConferido ? '✓ Apontamento conferido' : '⚠ Conferência obrigatória'}</strong><p>Indicadores: {periodo.indicadores.join(', ')}. Revise a inclusão, a carência e a classificação deste período.</p></div><label><input type="checkbox" checked={apontamentoConferido} onChange={(evento) => setPeriodosConferidos((atuais) => ({ ...atuais, [periodo.id]: evento.target.checked }))} /><span>Conferi este apontamento</span></label></div>}
                  <div className="aposentadoria-periodo__rodape"><label><input type="checkbox" checked={periodo.contaCarencia} onChange={(e) => alterarPeriodo(periodo.id, 'contaCarencia', e.target.checked)} /> Conta para carência</label>{periodo.competenciasExcluidas?.length ? <span>{periodo.competenciasExcluidas.length} competência(s) desconsiderada(s)</span> : null}<button type="button" onClick={() => { setPeriodos((atuais) => atuais.filter((item) => item.id !== periodo.id)); invalidarResultado(); }}>Remover</button></div>
                </article>;
              })}</div>
            </fieldset>

            <fieldset className="calculadora-passo aposentadoria-painel aposentadoria-remuneracoes">
              <legend>Remunerações e RMI</legend>
              <div className="aposentadoria-painel__intro"><div><h3>{remuneracoes.length} lançamento(s) importado(s)</h3><p>Atividades concomitantes serão somadas por competência. Indicadores de bloqueio ou valor inferior ao mínimo vêm desmarcados.</p></div><span className="aposentadoria-contador">{remuneracoes.filter((item) => !item.incluir).length} pendente(s)</span></div>
              <details className="aposentadoria-remuneracoes__detalhes" open={remuneracoes.some((item) => !item.incluir || item.indicadores.length > 0)}><summary>Conferir salários por competência</summary><div className="aposentadoria-tabela-wrap"><table className="aposentadoria-tabela aposentadoria-tabela--edicao"><thead><tr><th>Usar</th><th>Competência</th><th>Origem</th><th>Valor</th><th>Indicadores e conferência</th></tr></thead><tbody>{remuneracoes.map((remuneracao) => {
                const temApontamento = remuneracao.indicadores.length > 0;
                const apontamentoConferido = Boolean(remuneracoesConferidas[remuneracao.id]);
                return <tr className={`${!remuneracao.incluir ? 'is-excluida ' : ''}${temApontamento ? 'is-apontamento' : ''}`.trim()} key={remuneracao.id}><td><input aria-label={`Incluir ${competenciaBr(remuneracao.competencia)}`} type="checkbox" checked={remuneracao.incluir} onChange={(e) => alterarRemuneracao(remuneracao.id, { incluir: e.target.checked })} /></td><td>{competenciaBr(remuneracao.competencia)}</td><td>{remuneracao.origem}</td><td><input aria-label={`Valor de ${competenciaBr(remuneracao.competencia)}`} type="number" min="0" step="0.01" value={remuneracao.valor} onChange={(e) => alterarRemuneracao(remuneracao.id, { valor: Number(e.target.value) })} /></td><td>{temApontamento ? <div className="aposentadoria-apontamento-tabela" role="alert" tabIndex={-1} data-apontamento-pendente={apontamentoConferido ? undefined : 'true'}><strong>{remuneracao.indicadores.join(', ')}</strong><label><input type="checkbox" checked={apontamentoConferido} onChange={(evento) => setRemuneracoesConferidas((atuais) => ({ ...atuais, [remuneracao.id]: evento.target.checked }))} /> Conferido</label></div> : '—'}</td></tr>;
              })}</tbody></table></div></details>
            </fieldset>

            {erros.length > 0 && <div className="calculadora-erros" id={`${prefixo}-erros`} role="alert" tabIndex={-1}><strong>Revise os dados</strong><ul>{erros.map((erro) => <li key={erro}>{erro}</li>)}</ul></div>}
            <aside className="aposentadoria-disclaimer" role="note"><strong>Breve simulação</strong><p>O resultado é uma estimativa automatizada e não dispensa a análise individualizada de um advogado. Documentos, indicadores do CNIS e enquadramentos jurídicos podem alterar o direito e a RMI.</p></aside>
            <div className="aposentadoria-calcular"><div><strong>{simulando ? 'Calculando regras e RMI…' : conferenciaLiberada ? 'O cálculo será aberto em uma tela própria.' : `${apontamentosPendentes} apontamento(s) ainda aguardam conferência.`}</strong><p>{simulando ? 'Consolidando períodos, salários e cenários previdenciários.' : conferenciaLiberada ? 'Você poderá escolher a regra detalhada, revisar o memorial e imprimir ou salvar em PDF.' : 'Ao clicar em Simular, você será levado ao primeiro checkbox vermelho ainda pendente.'}</p></div><div><button className={`botao botao--dourado aposentadoria-simular${simulando ? ' is-simulando' : ''}`} type="submit" disabled={simulando || importando} aria-busy={simulando}>{simulando ? <><span className="aposentadoria-simular__spinner" aria-hidden="true" /> Simulando…</> : <>Simular <IconeSeta tamanho={15} /></>}</button><button className="botao botao--contorno" type="button" onClick={limpar} disabled={simulando}>Limpar tudo</button></div></div>
          </form>
        </div>
      </section>

      <section className="secao"><div className="envolucro calculadora-conteudo aposentadoria-largura calculadora-pagina__largura"><span className="olho">Critérios abertos</span><h2>Um simulador para conferência, não uma caixa-preta.</h2><div className="grade grade--3 calculadora-explicacoes"><article className="cartao"><h3>Tempo e conversão</h3><p>Deconcomita os períodos e mostra o fator especial por vínculo, limitado à reforma.</p></article><article className="cartao"><h3>Salários e RMI</h3><p>Consolida competências, corrige salários e abre média, divisor, coeficiente e fator previdenciário.</p></article><article className="cartao"><h3>Relatório profissional</h3><p>Organiza identificação, marcos, regras, vínculos, salários, alertas e fundamentos para impressão.</p></article></div><p className="calculadora-fonte">Fontes: <a href="https://www.gov.br/inss/pt-br/direitos-e-deveres/aposentadorias/regras-de-aposentadorias" target="_blank" rel="noopener noreferrer">regras oficiais de aposentadoria do INSS</a>, <a href="https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc103.htm" target="_blank" rel="noopener noreferrer">EC 103/2019</a>, <a href="https://www.planalto.gov.br/ccivil_03/leis/l8213compilado.htm" target="_blank" rel="noopener noreferrer">Lei 8.213/1991</a>, <a href="https://www.gov.br/previdencia/pt-br/assuntos/previdencia-social/legislacao/indice-de-atualizacao-das-contribuicoes-para-calculo-do-salario-de-beneficio" target="_blank" rel="noopener noreferrer">fatores oficiais de atualização</a> e <a href="https://www.ibge.gov.br/estatisticas/sociais/populacao/9126-tabuascompletas-de-mortalidade" target="_blank" rel="noopener noreferrer">tábua de mortalidade do IBGE</a>.</p></div></section>
      <section className="secao secao--creme"><div className="envolucro aposentadoria-largura calculadora-pagina__largura"><div className="cabeca-secao"><span className="olho">Perguntas frequentes</span><h2>Limites que precisam ficar visíveis</h2></div><Faq perguntas={FAQ_APOSENTADORIA} idPrefixo="faq-aposentadoria" /><p className="calculadora-links-internos">Veja também as calculadoras de <Link para="/calculadoras/calculadora-salario-liquido/">salário líquido</Link>, <Link para="/calculadoras/calculadora-decimo-terceiro/">13º salário</Link>, <Link para="/calculadoras/calculadora-ferias/">férias</Link>, <Link para="/calculadoras/calculadora-fgts/">FGTS</Link> e <Link para="/calculadoras/calculadora-rescisao-trabalhista/">rescisão trabalhista</Link>.</p></div></section>
      <SecaoCta olho="Conferência documental" titulo="O memorial organiza o cálculo; os documentos sustentam o direito." texto="Use o relatório para localizar lacunas e comparar cenários antes do protocolo." botao="Falar com um especialista" mensagem={mensagemResultado} />
    </>
  );
}
