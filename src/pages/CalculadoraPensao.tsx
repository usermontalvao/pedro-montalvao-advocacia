import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import { Faq, type Pergunta } from '../components/Faq';
import { IconeAgenda, IconeCadeado, IconePatrimonio, IconeSeta, IconeWhatsApp } from '../components/Icones';
import { SecaoCta } from '../components/SecaoCta';
import { calcularPensao, dataPtParaIsoPensao, dataVencimentoPensao, mascararDataPensao, validarEntradaPensao, type BasePensao, type CriterioJurosPensao, type EntradaPensao, type ParcelaPensao, type ResultadoPensao, type RitoPensao } from '../lib/calculoPensao';
import { caminhoDaCategoria, categoriaDaCalculadora } from '../lib/categoriasCalculadoras';
import { carregarDadosPublicosPensao, type DadosPublicosPensao, URL_API_IPCA, URL_API_IPCA15, URL_API_SALARIO_MINIMO, URL_API_SELIC_DIARIA, URL_FATORES_JEBR, URL_METODOLOGIA_TAXA_LEGAL } from '../lib/dadosPensao';
import { montarMensagemCalculadora } from '../lib/mensagemCalculadora';
import { Link } from '../lib/router';
import { linkWhatsApp, SITE } from '../site.config';

export const FAQ_PENSAO: Pergunta[] = [
  {
    pergunta: 'Quais parcelas podem fundamentar o rito da prisão civil?',
    resposta: 'Em regra, as três prestações anteriores ao ajuizamento e as que vencerem no curso do processo. Para simplificar a simulação inicial, a ferramenta usa a data-base informada também como marco do ajuizamento na divisão automática dos ritos.',
  },
  {
    pergunta: 'O que muda no rito da expropriação?',
    resposta: 'A cobrança busca patrimônio do devedor por medidas como penhora e expropriação. A calculadora inclui todas as parcelas selecionadas, mas prescrição, pagamentos, acordos e determinações do juízo podem alterar o período exigível.',
  },
  {
    pergunta: 'De onde vêm o salário mínimo e os índices?',
    resposta: 'O salário mínimo mensal e o IPCA são consultados nas APIs públicas do Banco Central. A correção parte da tabela uniforme para pagamento em maio de 2026 e, a partir de maio de 2026, é prolongada pelo IPCA até o mês anterior à data-base. Quando selecionada, a Taxa Legal é calculada com a Selic diária e o IPCA-15 oficiais.',
  },
  {
    pergunta: 'O relatório pode ser juntado ao processo?',
    resposta: 'Ele organiza uma memória estimativa, mas não substitui planilha homologada, contadoria judicial ou critérios determinados na decisão. Antes de protocolar, confira o título, vencimentos, índice, juros, pagamentos e regras do tribunal competente.',
  },
];

const moeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
const numero = (valor: string) => {
  const limpo = valor.replace(/\s|R\$/gi, '');
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  const convertido = Number(normalizado);
  return Number.isFinite(convertido) ? Math.max(0, convertido) : 0;
};
const mesBr = (valor: string) => {
  const [ano, mes] = valor.slice(0, 7).split('-');
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(Number(ano), Number(mes) - 1, 1)))
    .replace('.', '');
};
const dataBr = (valor: string) => valor.split('-').reverse().join('/');
const dataLocalBr = () => {
  const agora = new Date();
  return `${String(agora.getDate()).padStart(2, '0')}/${String(agora.getMonth() + 1).padStart(2, '0')}/${agora.getFullYear()}`;
};
const URL_CALCULADORA_PENSAO = `${SITE.url}/calculadoras/calculadora-pensao-alimenticia/`;
const rotuloCriterioJuros = (criterio: CriterioJurosPensao | '') => criterio === 'taxa_legal'
  ? 'Taxa Legal do Banco Central'
  : criterio === 'taxa_mensal'
    ? 'Taxa mensal definida no título'
    : criterio === 'sem_juros'
      ? 'Sem juros por determinação expressa'
      : '';

function TabelaParcelasPensao({ parcelas, prefixo, alterarPago }: {
  parcelas: ParcelaPensao[];
  prefixo: string;
  alterarPago: (chave: string, valor: string) => void;
}) {
  return <div className="pensao-tabela-wrap">
    <table className="pensao-tabela pensao-tabela--por-rito">
      <thead><tr><th>Parcela</th><th>Vencimento</th><th>Base</th><th>Devido</th><th>Pago</th><th>Fator</th><th>Corrigido</th><th>Juros</th><th>Total</th></tr></thead>
      <tbody>{parcelas.map((parcela) => <tr key={parcela.chave}>
        <th scope="row">{parcela.descricao}</th>
        <td>{dataBr(parcela.vencimento)}</td>
        <td>{moeda(parcela.base)}<small>{parcela.percentual}%</small></td>
        <td>{moeda(parcela.devidoOriginal)}</td>
        <td className="pensao-pago"><label className="sr-only" htmlFor={`${prefixo}-pago-${parcela.chave}`}>Valor pago em {parcela.descricao}</label><input id={`${prefixo}-pago-${parcela.chave}`} inputMode="decimal" defaultValue={parcela.pago || ''} placeholder="0,00" onBlur={(e) => alterarPago(parcela.chave, e.target.value)} /></td>
        <td>{parcela.fatorCorrecao.toFixed(7)}</td>
        <td>{moeda(parcela.corrigido)}</td>
        <td>{moeda(parcela.juros)}<small>{parcela.diasJuros} dia(s) · {parcela.percentualJurosAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}% pro rata</small></td>
        <td><strong>{moeda(parcela.total)}</strong></td>
      </tr>)}</tbody>
    </table>
  </div>;
}

const MESES_PENSAO = [
  ['01', 'Janeiro'], ['02', 'Fevereiro'], ['03', 'Março'], ['04', 'Abril'],
  ['05', 'Maio'], ['06', 'Junho'], ['07', 'Julho'], ['08', 'Agosto'],
  ['09', 'Setembro'], ['10', 'Outubro'], ['11', 'Novembro'], ['12', 'Dezembro'],
] as const;
const ANOS_PENSAO = Array.from(
  { length: new Date().getFullYear() - 2004 },
  (_, indice) => String(new Date().getFullYear() - indice),
);

function CampoMesPensao({ id, rotulo, mes, ano, alterarMes, alterarAno }: {
  id: string;
  rotulo: string;
  mes: string;
  ano: string;
  alterarMes: (valor: string) => void;
  alterarAno: (valor: string) => void;
}) {
  return <div className="calculadora-campo">
    <span className="calculadora-campo__rotulo" id={`${id}-rotulo`}>{rotulo}</span>
    <div className="pensao-mes-selects" role="group" aria-labelledby={`${id}-rotulo`}>
      <select aria-label={`${rotulo}: mês`} value={mes} onChange={(e) => alterarMes(e.target.value)}>
        <option value="">Mês</option>
        {MESES_PENSAO.map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}
      </select>
      <select aria-label={`${rotulo}: ano`} value={ano} onChange={(e) => alterarAno(e.target.value)}>
        <option value="">Ano</option>
        {ANOS_PENSAO.map((valor) => <option key={valor} value={valor}>{valor}</option>)}
      </select>
    </div>
    <small>Selecione o mês e o ano separadamente.</small>
  </div>;
}

export function CalculadoraPensao() {
  const categoria = categoriaDaCalculadora({ categoria: 'Direito de Família' });
  const prefixo = useId();
  const [rito, setRito] = useState<RitoPensao>('prisao');
  const [tipoBase, setTipoBase] = useState<BasePensao>('salario_minimo');
  const [valorBase, setValorBase] = useState('');
  const [percentual, setPercentual] = useState('30');
  const [inicioMes, setInicioMes] = useState('');
  const [inicioAno, setInicioAno] = useState('');
  const [fimMes, setFimMes] = useState('');
  const [fimAno, setFimAno] = useState('');
  const [dataReferenciaTexto, setDataReferenciaTexto] = useState('');
  const [diaVencimento, setDiaVencimento] = useState('');
  const [mesSubsequente, setMesSubsequente] = useState(false);
  const [incluirDecimo, setIncluirDecimo] = useState(false);
  const [criterioJuros, setCriterioJuros] = useState<CriterioJurosPensao | ''>('');
  const [jurosMensal, setJurosMensal] = useState('');
  const [pagos, setPagos] = useState<Record<string, number>>({});
  const [dados, setDados] = useState<DadosPublicosPensao | null>(null);
  const [resultado, setResultado] = useState<ResultadoPensao | null>(null);
  const [erros, setErros] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setDataReferenciaTexto(dataLocalBr());
  }, []);

  useEffect(() => {
    let ativo = true;
    carregarDadosPublicosPensao().then((carregados) => {
      if (ativo) setDados(carregados);
    }).finally(() => {
      if (ativo) setCarregando(false);
    });
    return () => { ativo = false; };
  }, []);

  const inicio = useMemo(() => inicioMes && inicioAno ? `${inicioAno}-${inicioMes}` : '', [inicioAno, inicioMes]);
  const fim = useMemo(() => fimMes && fimAno ? `${fimAno}-${fimMes}` : '', [fimAno, fimMes]);
  const dataReferencia = useMemo(() => dataPtParaIsoPensao(dataReferenciaTexto), [dataReferenciaTexto]);
  const entrada = useMemo<EntradaPensao>(() => ({
    rito,
    tipoBase,
    valorBase: numero(valorBase),
    percentual: numero(percentual),
    inicio,
    fim,
    dataReferencia,
    dataAjuizamento: dataReferencia,
    diaVencimento: Number(diaVencimento),
    mesSubsequente,
    incluirDecimo,
    criterioJuros,
    jurosMensal: jurosMensal.trim() ? numero(jurosMensal) : null,
    valoresPagos: pagos,
  }), [criterioJuros, dataReferencia, diaVencimento, fim, incluirDecimo, inicio, jurosMensal, mesSubsequente, pagos, percentual, rito, tipoBase, valorBase]);
  const ultimoVencimento = useMemo(
    () => dataVencimentoPensao(fim, Number(diaVencimento), mesSubsequente),
    [diaVencimento, fim, mesSubsequente],
  );
  const dataMinimaReferencia = ultimoVencimento && ultimoVencimento > '2026-05-01'
    ? ultimoVencimento
    : '2026-05-01';

  const calcular = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    let problemas = validarEntradaPensao(entrada);
    if ((inicioMes || inicioAno) && !inicio) {
      problemas = problemas.filter((problema) => problema !== 'Informe o mês inicial.');
      problemas.unshift('Selecione o mês e o ano iniciais.');
    }
    if ((fimMes || fimAno) && !fim) {
      problemas = problemas.filter((problema) => problema !== 'Informe o mês final.');
      problemas.unshift('Selecione o mês e o ano finais.');
    }
    if (dataReferenciaTexto && !dataReferencia) {
      problemas = problemas.filter((problema) => problema !== 'Informe a data de referência do cálculo.');
      problemas.unshift('Informe uma data-base válida no formato dd/mm/aaaa.');
    }
    if (!dados) problemas.push('Os dados públicos ainda estão sendo carregados. Tente novamente em instantes.');
    if (dados && entrada.tipoBase === 'salario_minimo' && !dados.salarioViaApi) {
      problemas.push('A API pública do Banco Central não respondeu com o salário mínimo. O cálculo foi interrompido para não usar valor desatualizado.');
    }
    if (dados && entrada.dataReferencia && entrada.dataReferencia.slice(0, 7) > '2026-05' && !dados.ipcaViaApi) {
      problemas.push('A API pública do IPCA/IBGE não respondeu. O cálculo foi interrompido para não estimar a atualização com índice manual ou incompleto.');
    }
    if (dados && entrada.criterioJuros === 'taxa_legal' && !dados.taxaLegalViaApi) {
      problemas.push('As APIs necessárias para a Taxa Legal não responderam. O cálculo foi interrompido para não usar taxa manual ou incompleta.');
    }
    setErros(problemas);
    if (problemas.length || !dados) {
      setResultado(null);
      document.getElementById(`${prefixo}-erros`)?.focus();
      return;
    }
    const calculado = calcularPensao(entrada, dados);
    if (calculado.parcelas.some((parcela) => !Number.isFinite(parcela.base))) {
      setErros(['A API do Banco Central não retornou o salário mínimo de uma das competências informadas.']);
      setResultado(null);
      return;
    }
    if (calculado.parcelas.some((parcela) => !Number.isFinite(parcela.total))) {
      setErros(['Não há fator de correção disponível para uma das competências informadas.']);
      setResultado(null);
      return;
    }
    if (!calculado.ipcaCompleto) {
      setErros(['O IPCA necessário para atualizar integralmente até a data-base ainda não está disponível na API do Banco Central. Escolha uma data-base compatível com o último índice publicado.']);
      setResultado(null);
      return;
    }
    if (!calculado.taxaLegalCompleta) {
      setErros(['A Taxa Legal necessária para todo o período ainda não está disponível nas séries oficiais. Escolha uma data-base compatível ou outro critério expressamente previsto no título.']);
      setResultado(null);
      return;
    }
    setResultado(calculado);
    requestAnimationFrame(() => document.getElementById('relatorio-pensao')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const alterarPago = (chave: string, valor: string) => {
    const novos = { ...pagos, [chave]: numero(valor) };
    setPagos(novos);
    if (dados && resultado) setResultado(calcularPensao({ ...entrada, valoresPagos: novos }, dados));
  };

  const imprimirRelatorio = () => {
    const tituloOriginal = document.title;
    const restaurarTitulo = () => { document.title = tituloOriginal; };
    document.title = '';
    window.addEventListener('afterprint', restaurarTitulo, { once: true });
    window.print();
    window.setTimeout(restaurarTitulo, 1_000);
  };

  const mensagem = resultado ? montarMensagemCalculadora({
    titulo: 'Calculadora de pensão alimentícia — prisão e expropriação',
    total: moeda(resultado.total),
    dados: [
      { rotulo: 'Rito', valor: rito === 'prisao' && resultado.expropriacao.parcelas > 0 ? 'Prisão civil + expropriação' : rito === 'prisao' ? 'Prisão civil' : 'Expropriação' },
      { rotulo: 'Período', valor: `${mesBr(inicio)} a ${mesBr(fim)}` },
      { rotulo: 'Data de referência', valor: dataBr(dataReferencia) },
      ...(rito === 'prisao' ? [{ rotulo: 'Data-base e marco processual', valor: dataBr(dataReferencia) }] : []),
      { rotulo: 'Critério de juros', valor: rotuloCriterioJuros(criterioJuros) },
    ],
    memoria: [
      ...(resultado.prisao.parcelas ? [{ rotulo: `Subtotal prisão civil (${resultado.prisao.parcelas} parcelas)`, valor: moeda(resultado.prisao.total) }] : []),
      ...(resultado.expropriacao.parcelas ? [{ rotulo: `Subtotal expropriação (${resultado.expropriacao.parcelas} parcelas)`, valor: moeda(resultado.expropriacao.total) }] : []),
      ...resultado.parcelas.filter((parcela) => parcela.ritoAplicavel !== 'fora').map((parcela) => ({ rotulo: `${parcela.descricao} · ${parcela.ritoAplicavel === 'prisao' ? 'prisão' : 'expropriação'}`, valor: moeda(parcela.total) })),
    ],
    observacoes: [
      'Memória estimativa; confira o título judicial e os critérios do juízo competente.',
      `Calculadora: ${URL_CALCULADORA_PENSAO}`,
      'Dados automáticos: salário mínimo, IPCA e, quando selecionada, Taxa Legal calculada com séries oficiais do Banco Central.',
    ],
  }) : '';

  return (
    <div className="pensao-pagina">
      <section className="heroi calculadora-heroi">
        <div className="heroi__luz" aria-hidden />
        <div className="envolucro">
          <div className="calculadora-heroi__conteudo">
            <nav className="migalhas" aria-label="Você está em">
              <Link para="/">Início</Link><span aria-hidden>/</span><Link para="/calculadoras/">Calculadoras</Link><span aria-hidden>/</span>{categoria && <><Link para={caminhoDaCategoria(categoria)}>{categoria.nome}</Link><span aria-hidden>/</span></>}<span>Pensão alimentícia</span>
            </nav>
            <span className="olho">Cálculo de alimentos em atraso · memória por parcela</span>
            <h1>Calculadora de pensão alimentícia: prisão e expropriação</h1>
            <p className="chamada">Transforme meses em uma memória conferível: base de cálculo, valor pago, correção, juros, parcelas que entram no rito e relatório pronto para imprimir.</p>
            <div className="calculadora-etiquetas" aria-label="Características da ferramenta">
              <span>Prisão civil</span><span>Expropriação</span><span>APIs públicas</span><span>Relatório detalhado</span>
            </div>
          </div>
        </div>
      </section>

      <section className="secao calculadora-area">
        <div className="envolucro calculadora-layout calculadora-pagina__largura">
          <form className="calculadora-formulario calculadora-formulario--generica" onSubmit={calcular} noValidate>
            <fieldset className="calculadora-passo">
              <legend>1. Escolha o rito</legend>
              <div className="calculadora-radios pensao-ritos">
                <label><input type="radio" name="rito" checked={rito === 'prisao'} onChange={() => { setRito('prisao'); setResultado(null); }} /><div className="pensao-rito-icone"><IconeCadeado tamanho={24} /></div><span><strong>Prisão civil + separação patrimonial</strong><small>Separa as três prestações anteriores à data-base e envia as mais antigas para o cálculo patrimonial.</small></span></label>
                <label><input type="radio" name="rito" checked={rito === 'expropriacao'} onChange={() => { setRito('expropriacao'); setResultado(null); }} /><div className="pensao-rito-icone"><IconePatrimonio tamanho={24} /></div><span><strong>Expropriação</strong><small>Inclui todo o período escolhido para projetar a cobrança patrimonial.</small></span></label>
              </div>
            </fieldset>

            <fieldset className="calculadora-passo">
              <legend>2. Defina a pensão</legend>
              <div className="calculadora-grade">
                <div className="calculadora-campo"><label htmlFor={`${prefixo}-base`}>Base prevista no título</label><select id={`${prefixo}-base`} value={tipoBase} onChange={(e) => { setTipoBase(e.target.value as BasePensao); setResultado(null); }}><option value="salario_minimo">Percentual do salário mínimo</option><option value="rendimentos">Percentual dos rendimentos</option><option value="valor_fixo">Valor fixo mensal</option></select></div>
                {tipoBase !== 'salario_minimo' && <div className="calculadora-campo"><label htmlFor={`${prefixo}-valor`}>{tipoBase === 'valor_fixo' ? 'Valor fixo mensal' : 'Rendimentos mensais'}</label><input id={`${prefixo}-valor`} inputMode="decimal" value={valorBase} onChange={(e) => { setValorBase(e.target.value); setResultado(null); }} placeholder="Ex.: 3.500,00" /></div>}
                {tipoBase !== 'valor_fixo' && <div className="calculadora-campo"><label htmlFor={`${prefixo}-percentual`}>Percentual da pensão (%)</label><input id={`${prefixo}-percentual`} type="number" min="0.01" max="100" step="0.01" value={percentual} onChange={(e) => { setPercentual(e.target.value); setResultado(null); }} /></div>}
                <div className="calculadora-campo calculadora-campo--checkbox"><label htmlFor={`${prefixo}-decimo`}><input id={`${prefixo}-decimo`} type="checkbox" checked={incluirDecimo} onChange={(e) => { setIncluirDecimo(e.target.checked); setResultado(null); }} /><span>Incluir parcela sobre o 13º salário</span></label><small>Marque somente quando o título ou acordo abranger o 13º.</small></div>
              </div>
            </fieldset>

            <fieldset className="calculadora-passo">
              <legend>3. Informe período, vencimento e juros</legend>
              <div className="calculadora-grade">
                <CampoMesPensao id={`${prefixo}-inicio`} rotulo="Mês inicial" mes={inicioMes} ano={inicioAno} alterarMes={(valor) => { setInicioMes(valor); setResultado(null); }} alterarAno={(valor) => { setInicioAno(valor); setResultado(null); }} />
                <CampoMesPensao id={`${prefixo}-fim`} rotulo="Mês final" mes={fimMes} ano={fimAno} alterarMes={(valor) => { setFimMes(valor); setResultado(null); }} alterarAno={(valor) => { setFimAno(valor); setResultado(null); }} />
                <div className="calculadora-campo">
                  <label htmlFor={`${prefixo}-referencia`}>Data-base do cálculo</label>
                  <div className="pensao-data-hibrida">
                    <input
                      id={`${prefixo}-referencia`}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={10}
                      placeholder="dd/mm/aaaa"
                      value={dataReferenciaTexto}
                      aria-describedby={`${prefixo}-referencia-ajuda`}
                      aria-invalid={dataReferenciaTexto.length === 10 && !dataReferencia ? true : undefined}
                      onChange={(e) => { setDataReferenciaTexto(mascararDataPensao(e.target.value)); setResultado(null); }}
                    />
                    <span className="pensao-data-calendario" aria-hidden="true"><IconeAgenda tamanho={21} /></span>
                    <input
                      className="pensao-data-nativa"
                      type="date"
                      min={dataMinimaReferencia}
                      value={dataReferencia}
                      aria-label="Abrir calendário da data-base"
                      onChange={(e) => { setDataReferenciaTexto(e.target.value ? dataBr(e.target.value) : ''); setResultado(null); }}
                    />
                  </div>
                  <small id={`${prefixo}-referencia-ajuda`}>{rito === 'prisao' ? 'Atualiza a dívida e também funciona como marco do ajuizamento para dividir automaticamente os ritos.' : 'Data até a qual a dívida será atualizada.'} A data local é preenchida automaticamente; você pode editar, escolher no calendário ou remover.</small>
                  {dataReferenciaTexto && <button className="pensao-data-remover" type="button" onClick={() => { setDataReferenciaTexto(''); setResultado(null); }}>Remover data preenchida</button>}
                </div>
                <div className="calculadora-campo"><label htmlFor={`${prefixo}-dia`}>Dia do vencimento</label><input id={`${prefixo}-dia`} type="number" min="1" max="31" value={diaVencimento} onChange={(e) => { setDiaVencimento(e.target.value); setResultado(null); }} /></div>
                <div className="calculadora-campo calculadora-campo--checkbox"><label htmlFor={`${prefixo}-subsequente`}><input id={`${prefixo}-subsequente`} type="checkbox" checked={mesSubsequente} onChange={(e) => { setMesSubsequente(e.target.checked); setResultado(null); }} /><span>Vencimento no mês seguinte</span></label><small>Use quando a prestação da competência vence no mês subsequente.</small></div>
                <div className="calculadora-campo"><label htmlFor={`${prefixo}-criterio-juros`}>Critério de juros</label><select id={`${prefixo}-criterio-juros`} value={criterioJuros} onChange={(e) => { setCriterioJuros(e.target.value as CriterioJurosPensao | ''); setResultado(null); }}><option value="">Selecione conforme o título</option><option value="taxa_legal">Taxa Legal do Banco Central — automática</option><option value="taxa_mensal">Taxa mensal definida no título ou pelo juízo</option><option value="sem_juros">Sem juros por determinação expressa</option></select><small>O mesmo critério é aplicado a todas as parcelas, independentemente do rito.</small></div>
                {criterioJuros === 'taxa_mensal' && <div className="calculadora-campo"><label htmlFor={`${prefixo}-juros`}>Taxa de juros simples (% ao mês)</label><input id={`${prefixo}-juros`} type="number" min="0" max="10" step="0.000001" value={jurosMensal} onChange={(e) => { setJurosMensal(e.target.value); setResultado(null); }} placeholder="Ex.: 1" /><small>Calculada proporcionalmente pelos dias corridos de cada mês.</small></div>}
              </div>
            </fieldset>

            <div className="pensao-dados-status" role="status">
              <strong>{carregando ? 'Consultando APIs públicas…' : dados?.salarioViaApi && dados?.ipcaViaApi ? 'APIs públicas consultadas com sucesso.' : 'Uma das APIs públicas não respondeu.'}</strong>
              {!carregando && dados && <span>Salário mínimo: {dados.salarioViaApi ? 'SGS 1619' : 'indisponível'} · IPCA/IBGE: {dados.ipcaViaApi && dados.ultimoIpca ? `SGS 433 até ${mesBr(dados.ultimoIpca)}` : 'indisponível'} · Taxa Legal: {dados.taxaLegalViaApi && dados.ultimaTaxaLegal ? `calculada até ${mesBr(dados.ultimaTaxaLegal)}` : 'indisponível'}.</span>}
            </div>

            {erros.length > 0 && <div className="calculadora-erros" id={`${prefixo}-erros`} role="alert" tabIndex={-1}><strong>Revise os dados:</strong><ul>{erros.map((erro) => <li key={erro}>{erro}</li>)}</ul></div>}
            <div className="calculadora-acoes"><button className="botao botao--dourado" type="submit" disabled={carregando}>Calcular pensão em atraso</button><button className="botao botao--contorno" type="button" onClick={() => { setPagos({}); setResultado(null); setErros([]); }}>Limpar resultado</button></div>
          </form>
        </div>
      </section>

      {resultado && <section className="secao secao--creme resultado-secao relatorio-pensao" id="relatorio-pensao" aria-live="polite">
        <div className="envolucro calculadora-pagina__largura">
          <div className="pensao-relatorio-marca">
            <img src="/midia/logo-horizontal.png" alt="Pedro Montalvão Advocacia" width="383" height="73" />
            <div className="pensao-relatorio-identificacao">
              <strong>Memória de cálculo de pensão alimentícia</strong>
              <a href={URL_CALCULADORA_PENSAO}>{URL_CALCULADORA_PENSAO.replace('https://', '')}</a>
            </div>
          </div>

          <header className="pensao-relatorio-cabeca">
            <div>
              <span className="olho">Relatório estimativo</span>
              <h2>Memória de cálculo — {rito === 'prisao' && resultado.expropriacao.parcelas > 0 ? 'prisão civil + expropriação' : rito === 'prisao' ? 'rito da prisão civil' : 'rito da expropriação'}</h2>
              <p>Período de {mesBr(inicio)} a {mesBr(fim)} · posição em {dataBr(dataReferencia)}{rito === 'prisao' ? ' · mesma data usada como marco processual' : ''}.</p>
            </div>
            <div className="resultado-total">
              <span>Total geral da dívida</span>
              <strong>{moeda(resultado.total)}</strong>
              <small>{resultado.prisao.parcelas + resultado.expropriacao.parcelas} parcela(s) considerada(s)</small>
            </div>
          </header>

          {rito === 'prisao' && resultado.expropriacao.parcelas > 0 && <div className="calculadora-alerta resultado-aviso">
            <strong>Divisão automática concluída.</strong>
            <p>Com base na data-base de {dataBr(dataReferencia)}, o rito da prisão reúne as três prestações anteriores. As {resultado.expropriacao.parcelas} mais antigas ficaram, sem sobreposição, no cálculo patrimonial.</p>
          </div>}

          <div className="pensao-fontes-dados">
            <strong>Fontes dos índices e dos valores</strong>
            <ul>
              <li><a href={URL_API_SALARIO_MINIMO} target="_blank" rel="noopener noreferrer">Salário mínimo · API pública SGS 1619 do Banco Central</a><span>{dados?.salarioViaApi ? 'consulta automática realizada' : 'consulta indisponível'}</span></li>
              <li><a href={URL_API_IPCA} target="_blank" rel="noopener noreferrer">IPCA/IBGE · API pública SGS 433 do Banco Central</a><span>{dados?.ipcaViaApi && dados.ultimoIpca ? `consulta automática até ${mesBr(dados.ultimoIpca)}` : 'consulta indisponível'}</span></li>
              <li><a href={URL_FATORES_JEBR} target="_blank" rel="noopener noreferrer">Fator histórico · Tabela Uniforme JEBR 05/2026</a><span>documento-base; meses posteriores são atualizados automaticamente pela API do IPCA</span></li>
              {criterioJuros === 'taxa_legal' && <li><a href={URL_METODOLOGIA_TAXA_LEGAL} target="_blank" rel="noopener noreferrer">Taxa Legal · metodologia oficial do Banco Central</a><span>cálculo automático com Selic diária SGS 11 e IPCA-15 SGS 7478 até {resultado.ultimaTaxaLegal ? mesBr(resultado.ultimaTaxaLegal) : 'a última competência disponível'}</span></li>}
              {criterioJuros === 'taxa_legal' && <li><a href={URL_API_SELIC_DIARIA} target="_blank" rel="noopener noreferrer">Selic diária · API pública SGS 11 do Banco Central</a><span>fator mensal calculado com todas as observações diárias disponíveis</span></li>}
              {criterioJuros === 'taxa_legal' && <li><a href={URL_API_IPCA15} target="_blank" rel="noopener noreferrer">IPCA-15 · API pública SGS 7478 do Banco Central</a><span>componente oficial de dedução da Taxa Legal</span></li>}
            </ul>
          </div>

          <div className="pensao-resumo">
            <div><span>Valor original</span><strong>{moeda(resultado.totalOriginal)}</strong></div>
            <div><span>Pagamentos abatidos</span><strong>− {moeda(resultado.totalPago)}</strong></div>
            <div><span>Saldo corrigido</span><strong>{moeda(resultado.totalCorrigido)}</strong></div>
            <div><span>Juros</span><strong>{moeda(resultado.totalJuros)}</strong></div>
          </div>

          <div className="pensao-memorias-separadas">
            {resultado.prisao.parcelas > 0 && <section className="pensao-memoria-rito pensao-memoria-rito--prisao">
              <header>
                <div><span>Cálculo 1</span><h3>Rito da prisão civil</h3><p>Até três prestações anteriores ao ajuizamento e as vencidas durante o processo.</p></div>
                <div className="pensao-memoria-subtotal"><span>Subtotal da prisão</span><strong>{moeda(resultado.prisao.total)}</strong><small>{resultado.prisao.parcelas} parcela(s)</small></div>
              </header>
              <TabelaParcelasPensao parcelas={resultado.parcelas.filter((parcela) => parcela.ritoAplicavel === 'prisao')} prefixo={prefixo} alterarPago={alterarPago} />
            </section>}

            {resultado.expropriacao.parcelas > 0 && <section className="pensao-memoria-rito pensao-memoria-rito--expropriacao">
              <header>
                <div><span>Cálculo {resultado.prisao.parcelas > 0 ? '2' : '1'}</span><h3>Rito da expropriação</h3><p>{rito === 'prisao' ? 'Parcelas anteriores ao recorte da prisão, sem sobreposição e conforme a data do ajuizamento.' : 'Todo o período vencido selecionado para a cobrança patrimonial.'}</p></div>
                <div className="pensao-memoria-subtotal"><span>Subtotal da expropriação</span><strong>{moeda(resultado.expropriacao.total)}</strong><small>{resultado.expropriacao.parcelas} parcela(s)</small></div>
              </header>
              <TabelaParcelasPensao parcelas={resultado.parcelas.filter((parcela) => parcela.ritoAplicavel === 'expropriacao')} prefixo={prefixo} alterarPago={alterarPago} />
            </section>}

            {resultado.parcelas.some((parcela) => parcela.ritoAplicavel === 'fora') && <section className="pensao-memoria-rito pensao-memoria-rito--fora">
              <header><div><span>Conferência</span><h3>Parcelas sem saldo exigível</h3><p>Obrigações integralmente pagas ou fora do saldo na data-base.</p></div></header>
              <TabelaParcelasPensao parcelas={resultado.parcelas.filter((parcela) => parcela.ritoAplicavel === 'fora')} prefixo={prefixo} alterarPago={alterarPago} />
            </section>}
          </div>

          <div className="pensao-metodologia">
            <h3>Critérios usados neste relatório</h3>
            <ul>
              <li>Fator-base histórico da Tabela Uniforme da Justiça Estadual não expurgada, posição para pagamento em maio/2026, com acesso ao PDF original acima.</li>
              <li>A partir de maio/2026, atualização automática com o IPCA/IBGE obtido na API pública SGS 433 do Banco Central, limitada ao mês anterior à data-base. O primeiro índice de prolongamento é o IPCA de maio/2026.</li>
              <li>Salário mínimo histórico obtido exclusivamente na API pública SGS 1619 do Banco Central; se a API não responder, o cálculo com essa base é bloqueado.</li>
              {rito === 'prisao' && <li>A data-base de {dataBr(dataReferencia)} também foi usada como marco processual para separar as três prestações do bloco da prisão.</li>}
              <li>Juros: {rotuloCriterioJuros(criterioJuros)}{criterioJuros === 'taxa_mensal' ? ` de ${numero(jurosMensal).toLocaleString('pt-BR')}% ao mês` : ''}, aplicados igualmente aos dois ritos e calculados pro rata pelos dias corridos de cada mês, incluindo vencimento e data-base.</li>
              {criterioJuros === 'taxa_legal' && <li>Taxa Legal calculada automaticamente com Selic diária SGS 11 e IPCA-15 SGS 7478, observadas as casas decimais previstas na Resolução CMN 5.171/2024.</li>}
            </ul>
          </div>

          <p className="pensao-impressao-dica">O arquivo é preparado em A4 com margens próprias e sem o cabeçalho automático de data, título e endereço.</p>
          <div className="calculadora-acoes pensao-relatorio-acoes"><button className="botao botao--dourado" type="button" onClick={imprimirRelatorio}>Imprimir ou salvar relatório em PDF</button><a className="botao botao--zap" href={linkWhatsApp(mensagem)} target="_blank" rel="noopener noreferrer"><IconeWhatsApp tamanho={17} />Enviar resultado para análise</a></div>
        </div>
      </section>}

      <section className="secao calculadora-conteudo">
        <div className="envolucro calculadora-pagina__largura">
          <article className="artigo">
            <span className="olho">A conta precisa explicar o caminho</span>
            <h2>Não basta chegar a um total: cada parcela precisa sobreviver à conferência.</h2>
            <p>Uma execução de alimentos pode mudar por um único detalhe: o mês correto, a base fixada na sentença, a data de vencimento, um pagamento parcial ou o rito escolhido. Por isso esta calculadora não entrega apenas um número grande. Ela abre a dívida linha por linha e mostra exatamente de onde veio o resultado.</p>
            <h2>Prisão civil e expropriação não são a mesma cobrança</h2>
            <p>No rito da prisão, a coerção pessoal se relaciona às três prestações anteriores ao ajuizamento e às que vencem durante o processo. Nesta simulação inicial, a data-base também funciona como marco do ajuizamento para deixar o preenchimento direto. Já a expropriação busca a satisfação patrimonial e pode alcançar parcelas mais antigas, observados o título, os pagamentos, a prescrição e as decisões do juízo.</p>
            <h2>Como os dados públicos entram no cálculo</h2>
            <p>O salário mínimo é lido mês a mês na API gratuita do Banco Central. A atualização monetária parte da tabela para pagamento em maio de 2026 e é prolongada, a partir do IPCA de maio, até o mês anterior à data-base. Os juros não mudam por causa do rito: o usuário precisa selecionar o critério do título, e a opção Taxa Legal usa automaticamente Selic diária e IPCA-15.</p>
            <p className="calculadora-fonte">Fontes: <a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm" target="_blank" rel="noopener noreferrer">CPC, art. 528</a> · <a href="https://scon.stj.jus.br/SCON/sumstj/toc.jsp?livre=%22309%22.num." target="_blank" rel="noopener noreferrer">Súmula 309 do STJ</a> · <a href={URL_FATORES_JEBR} target="_blank" rel="noopener noreferrer">Tabela JEBR 05/2026</a> · <a href={URL_API_SALARIO_MINIMO} target="_blank" rel="noopener noreferrer">SGS 1619</a> · <a href={URL_API_IPCA} target="_blank" rel="noopener noreferrer">SGS 433</a> · <a href={URL_API_SELIC_DIARIA} target="_blank" rel="noopener noreferrer">SGS 11</a> · <a href={URL_API_IPCA15} target="_blank" rel="noopener noreferrer">SGS 7478</a> · <a href={URL_METODOLOGIA_TAXA_LEGAL} target="_blank" rel="noopener noreferrer">metodologia da Taxa Legal</a>.</p>
            <p className="calculadora-links-internos">Veja também as calculadoras de <Link para="/calculadoras/calculadora-salario-liquido/">salário líquido</Link>, <Link para="/calculadoras/calculadora-decimo-terceiro/">13º salário</Link>, <Link para="/calculadoras/calculadora-fgts/">FGTS</Link>, <Link para="/calculadoras/calculadora-rescisao-trabalhista/">rescisão</Link> e <Link para="/calculadoras/">todas as ferramentas</Link>.</p>
          </article>
        </div>
      </section>

      <section className="secao secao--creme"><div className="envolucro calculadora-faq calculadora-pagina__largura"><div><span className="olho">Perguntas frequentes</span><h2>Antes de usar o relatório</h2><p className="chamada">Critérios gerais para conferir a simulação com o título judicial.</p></div><Faq perguntas={FAQ_PENSAO} idPrefixo="pensao" /></div></section>
      <SecaoCta olho="Conferência jurídica" titulo="Uma planilha forte começa no título certo." texto="Envie a decisão, o acordo, os comprovantes de pagamento e as datas. O atendimento confere o período, o rito e os critérios antes de qualquer medida." botao="Falar sobre o cálculo" mensagem={mensagem || 'Olá, quero conferir um cálculo de pensão alimentícia em atraso.'} microcopy="O relatório é estimativo e não promete resultado processual." />
      <section className="secao secao--fina"><div className="envolucro calculadora-relacionadas calculadora-pagina__largura">{categoria && <Link para={caminhoDaCategoria(categoria)}>Calculadoras de família <IconeSeta tamanho={14} /></Link>}<Link para="/calculadoras/">Todas as calculadoras <IconeSeta tamanho={14} /></Link><Link para="/advogado-familia-cuiaba/">Direito de Família <IconeSeta tamanho={14} /></Link></div></section>
    </div>
  );
}
