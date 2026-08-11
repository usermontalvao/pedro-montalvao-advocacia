import { useId, useState, type FormEvent } from 'react';
import { Faq, type Pergunta } from '../components/Faq';
import { IconeSeta, IconeWhatsApp } from '../components/Icones';
import { Revelar } from '../components/Revelar';
import { SecaoCta } from '../components/SecaoCta';
import calculadoras from '../content/calculadoras.json';
import {
  CATEGORIAS_EM_PREPARO,
  CATEGORIAS_PUBLICADAS,
  caminhoDaCategoria,
  calculadorasDaCategoria,
  categoriaDaCalculadora,
} from '../lib/categoriasCalculadoras';
import {
  calcularRescisao,
  type EntradaRescisao,
  type NaturezaOutrasVerbas,
  type ResultadoRescisao,
  type TipoAviso,
  type TipoDesligamento,
} from '../lib/calculoRescisao';
import { montarMensagemCalculadora } from '../lib/mensagemCalculadora';
import { Link } from '../lib/router';
import { linkWhatsApp } from '../site.config';

export const FAQ_RESCISAO: Pergunta[] = [
  {
    pergunta: 'Como calcular a rescisão trabalhista?',
    resposta:
      'Informe as datas do vínculo, o salário, a forma de desligamento e o aviso-prévio. A ferramenta estima as parcelas mais comuns e aplica as tabelas progressivas de INSS e IRRF em vigor. Convenção coletiva, médias variáveis, faltas e dados reais da folha podem alterar o resultado.',
  },
  {
    pergunta: 'Quem pede demissão recebe a multa de 40% do FGTS?',
    resposta:
      'Em regra, não. No pedido de demissão não há multa rescisória de 40% nem saque do FGTS por esse motivo. Também pode existir desconto do aviso-prévio não cumprido, conforme as circunstâncias do desligamento.',
  },
  {
    pergunta: 'A rescisão por acordo paga multa sobre o FGTS?',
    resposta:
      'Sim. Na extinção por acordo prevista na CLT, a indenização sobre o FGTS é, em regra, de 20%, e a movimentação por esse motivo fica limitada a 80% do saldo. O aviso indenizado é pago pela metade; as demais verbas são pagas integralmente.',
  },
  {
    pergunta: 'O aviso-prévio indenizado entra no cálculo?',
    resposta:
      'Sim. Na dispensa sem justa causa, o aviso pode ser de 30 dias, com acréscimo de 3 dias por ano completo de serviço, até 90 dias. Sua projeção também pode influenciar os avos de férias e 13º salário.',
  },
  {
    pergunta: 'Férias proporcionais entram na rescisão?',
    resposta:
      'Nas três modalidades disponíveis nesta calculadora — dispensa sem justa causa, pedido de demissão e acordo — são estimadas férias proporcionais acrescidas de um terço. Períodos vencidos podem ser informados separadamente.',
  },
  {
    pergunta: 'O FGTS aparece no valor líquido da rescisão?',
    resposta:
      'Não. O depósito rescisório e a multa são valores vinculados à conta do FGTS, por isso aparecem separados do líquido estimado do TRCT. A possibilidade de saque depende do motivo do desligamento e da modalidade de saque escolhida pelo trabalhador.',
  },
  {
    pergunta: 'O resultado substitui o cálculo do departamento pessoal?',
    resposta:
      'Não. A ferramenta é educacional e estimativa. O cálculo oficial depende da folha, do eSocial, do histórico do FGTS, da convenção coletiva e dos documentos do vínculo. Confira sempre o TRCT e os comprovantes emitidos pelo empregador.',
  },
  {
    pergunta: 'A calculadora serve para empregado doméstico?',
    resposta:
      'Esta primeira versão foi desenhada para contratos CLT em geral. Embora várias verbas sejam semelhantes, o emprego doméstico possui recolhimentos e particularidades próprias. O resultado não deve ser usado como conferência definitiva dessa categoria.',
  },
];

function moeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

function dataBr(valor: string): string {
  const [ano, mes, dia] = valor.split('-');
  return `${dia}/${mes}/${ano}`;
}

function numeroMoeda(valor: string): number {
  const limpo = valor.replace(/\s|R\$/gi, '');
  if (!limpo) return 0;
  const normalizado = limpo.includes(',')
    ? limpo.replace(/\./g, '').replace(',', '.')
    : limpo;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? Math.max(0, numero) : 0;
}

function exibirMoedaNoCampo(valor: string): string {
  if (!valor.trim()) return '';
  return numeroMoeda(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function OpcoesAviso({
  id,
  tipo,
  valor,
  aoMudar,
}: {
  id: string;
  tipo: TipoDesligamento;
  valor: TipoAviso;
  aoMudar: (valor: TipoAviso) => void;
}) {
  const opcoes =
    tipo === 'pedido_demissao'
      ? [
          ['cumprido', 'Cumprido ou dispensado sem desconto'],
          ['nao_cumprido', 'Não cumprido — estimar desconto'],
        ]
      : [
          ['indenizado', tipo === 'acordo' ? 'Indenizado — pago pela metade' : 'Indenizado pelo empregador'],
          ['trabalhado', 'Trabalhado'],
        ];

  return (
    <select id={id} value={valor} onChange={(evento) => aoMudar(evento.target.value as TipoAviso)}>
      {opcoes.map(([chave, rotulo]) => (
        <option key={chave} value={chave}>{rotulo}</option>
      ))}
    </select>
  );
}

/**
 * As quatro ferramentas que mais chegam pela busca — o atalho para quem já sabe
 * o que quer e não precisa passar pela escolha de área.
 */
const DESTAQUES = [
  'calculadora-rescisao-trabalhista',
  'calculadora-pensao-alimenticia',
  'calculadora-horas-extras',
  'calculadora-salario-liquido',
];

export function ListaCalculadoras() {
  const destaques = DESTAQUES.map((slug) => calculadoras.find((item) => item.slug === slug)).filter(
    Boolean,
  ) as (typeof calculadoras)[number][];

  return (
    <>
      <section className="heroi calculadoras-heroi">
        <div className="heroi__luz" aria-hidden />
        <div className="envolucro">
          <div className="artigo-cabeca">
            <nav className="migalhas" aria-label="Você está em">
              <Link para="/">Início</Link>
              <span aria-hidden>/</span>
              <span>Calculadoras</span>
            </nav>
            <span className="olho">Números abertos, critérios visíveis</span>
            <h1>Calculadoras jurídicas que mostram de onde vem o resultado</h1>
            <p className="chamada">
              Escolha a área do seu caso: cada uma tem a sua própria página de ferramentas, com os
              cálculos separados por assunto. Sem total mágico — toda ferramenta entrega memória de
              cálculo, fórmula e fonte oficial.
            </p>
            <div className="calculadora-etiquetas" aria-label="Características das ferramentas">
              <span>Memória de cálculo</span>
              <span>Dados públicos oficiais</span>
              <span>Relatórios conferíveis</span>
              <span>Sem cadastro</span>
            </div>
          </div>
        </div>
      </section>

      <section className="secao calculadoras-destaque">
        <div className="envolucro">
          <Revelar>
            <div className="cabeca-secao">
              <span className="olho">Escolha a área</span>
              <h2>Cada área do Direito tem a sua página.</h2>
              <p className="chamada">
                As ferramentas ficam agrupadas por assunto dentro de cada área, para você percorrer
                só o que tem a ver com o seu caso.
              </p>
            </div>
          </Revelar>

          <div className="grade grade--2">
            {CATEGORIAS_PUBLICADAS.map((categoria) => {
              const total = calculadorasDaCategoria(categoria).length;
              return (
                <Revelar key={categoria.slug}>
                  <Link
                    className="cartao calculadora-cartao calculadora-cartao--categoria"
                    para={caminhoDaCategoria(categoria)}
                  >
                    <span className="etiqueta">{categoria.areaNome}</span>
                    <h3>{categoria.titulo}</h3>
                    <p>{categoria.resumoHub}</p>
                    {categoria.grupos.length > 0 && (
                      <span className="calculadora-cartao__grupos">
                        {categoria.grupos.map((grupo) => (
                          <small key={grupo.nome}>{grupo.nome}</small>
                        ))}
                      </span>
                    )}
                    <span className="cartao__link">
                      Ver {total === 1 ? 'a ferramenta' : `as ${total} ferramentas`}
                      <IconeSeta tamanho={15} />
                    </span>
                  </Link>
                </Revelar>
              );
            })}
          </div>
        </div>
      </section>

      <section className="secao secao--creme">
        <div className="envolucro">
          <Revelar>
            <div className="cabeca-secao">
              <span className="olho">Mais procuradas</span>
              <h2>Se já sabe o cálculo, comece por aqui.</h2>
            </div>
          </Revelar>
          <div className="grade grade--2">
            {destaques.map((calculadora) => (
              <Revelar key={calculadora.slug}>
                <Link className="cartao calculadora-cartao" para={`/calculadoras/${calculadora.slug}/`}>
                  <span className="etiqueta">{calculadora.categoria}</span>
                  <h3>{calculadora.nomeCurto}</h3>
                  <p>{calculadora.resumo}</p>
                  <span className="cartao__link">Abrir calculadora <IconeSeta tamanho={15} /></span>
                </Link>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {CATEGORIAS_EM_PREPARO.length > 0 && (
        <section className="secao secao--fina">
          <div className="envolucro">
            <Revelar>
              <div className="cabeca-secao">
                <span className="olho">Ainda em preparo</span>
                <h2>Áreas que entram em seguida.</h2>
              </div>
            </Revelar>
            <ul className="calculadoras-preparo">
              {CATEGORIAS_EM_PREPARO.map((categoria) => (
                <li key={categoria.slug}>
                  <strong>{categoria.areaNome}</strong>
                  <span>{categoria.resumoHub}</span>
                  <Link para={categoria.areaCaminho}>
                    Ver a área <IconeSeta tamanho={14} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="secao secao--creme secao--fina">
        <div className="envolucro calculadoras-aviso">
          <div>
            <span className="olho">Antes de usar</span>
            <h2>Estimativa não é documento oficial.</h2>
          </div>
          <p>
            As ferramentas organizam informações e mostram uma memória de cálculo. Convenções
            coletivas, verbas variáveis, pagamentos, decisões judiciais e dados oficiais do caso
            podem mudar o resultado. Use a simulação para fazer perguntas melhores, não para pular
            a conferência documental.
          </p>
        </div>
      </section>

      <SecaoCta
        olho="Avaliação jurídica"
        titulo="Encontrou uma diferença nos seus documentos?"
        texto="Use as calculadoras para organizar o cenário e, quando precisar, solicite a conferência dos documentos e das particularidades do contrato."
        botao="Ver formas de atendimento"
        destino="/contato-advogado-cuiaba/"
      />
    </>
  );
}

export function CalculadoraRescisao() {
  const prefixo = useId();
  const categoria = categoriaDaCalculadora({ categoria: 'Direito Trabalhista' });
  const [admissao, setAdmissao] = useState('');
  const [desligamento, setDesligamento] = useState('');
  const [salario, setSalario] = useState('');
  const [metodoSaldo, setMetodoSaldo] = useState<'trinta' | 'calendario'>('trinta');
  const [tipoDesligamento, setTipoDesligamento] = useState<TipoDesligamento>('sem_justa_causa');
  const [tipoAviso, setTipoAviso] = useState<TipoAviso>('indenizado');
  const [feriasVencidas, setFeriasVencidas] = useState('0');
  const [adiantamentoDecimo, setAdiantamentoDecimo] = useState('');
  const [dependentes, setDependentes] = useState('0');
  const [outrasVerbas, setOutrasVerbas] = useState('');
  const [naturezaOutrasVerbas, setNaturezaOutrasVerbas] = useState<NaturezaOutrasVerbas>('remuneratoria');
  const [outrosDescontos, setOutrosDescontos] = useState('');
  const [resultado, setResultado] = useState<ResultadoRescisao | null>(null);
  const [erros, setErros] = useState<string[]>([]);

  const aoTrocarDesligamento = (tipo: TipoDesligamento) => {
    setTipoDesligamento(tipo);
    setTipoAviso(tipo === 'pedido_demissao' ? 'cumprido' : 'indenizado');
    setResultado(null);
  };

  const formatarCampo = (valor: string, mudar: (novo: string) => void) => {
    mudar(exibirMoedaNoCampo(valor));
  };

  const calcular = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const problemas: string[] = [];
    if (!admissao) problemas.push('Informe a data de admissão.');
    if (!desligamento) problemas.push('Informe a data de desligamento.');
    if (admissao && desligamento && desligamento < admissao) {
      problemas.push('A data de desligamento precisa ser posterior à admissão.');
    }
    if (desligamento && !desligamento.startsWith('2026-')) {
      problemas.push('Esta versão usa as tabelas de 2026; informe um desligamento ocorrido nesse ano.');
    }
    if (numeroMoeda(salario) <= 0) problemas.push('Informe um salário bruto maior que zero.');

    setErros(problemas);
    if (problemas.length) {
      setResultado(null);
      document.getElementById(`${prefixo}-erros`)?.focus();
      return;
    }

    const entrada: EntradaRescisao = {
      admissao,
      desligamento,
      salario: numeroMoeda(salario),
      metodoSaldo,
      tipoDesligamento,
      tipoAviso,
      feriasVencidas: Math.max(0, Math.min(3, Number(feriasVencidas) || 0)),
      adiantamentoDecimo: numeroMoeda(adiantamentoDecimo),
      dependentes: Math.max(0, Number(dependentes) || 0),
      outrasVerbas: numeroMoeda(outrasVerbas),
      naturezaOutrasVerbas,
      outrosDescontos: numeroMoeda(outrosDescontos),
    };

    setResultado(calcularRescisao(entrada));
    requestAnimationFrame(() => {
      document.getElementById('resultado-rescisao')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const limpar = () => {
    setAdmissao('');
    setDesligamento('');
    setSalario('');
    setMetodoSaldo('trinta');
    setTipoDesligamento('sem_justa_causa');
    setTipoAviso('indenizado');
    setFeriasVencidas('0');
    setAdiantamentoDecimo('');
    setDependentes('0');
    setOutrasVerbas('');
    setNaturezaOutrasVerbas('remuneratoria');
    setOutrosDescontos('');
    setResultado(null);
    setErros([]);
  };

  const mensagemResultado = resultado
    ? montarMensagemCalculadora({
        titulo: 'Calculadora de rescisão trabalhista',
        total: moeda(resultado.liquidoTrct),
        dados: [
          { rotulo: 'Data de admissão', valor: dataBr(admissao) },
          { rotulo: 'Data de desligamento', valor: dataBr(desligamento) },
          { rotulo: 'Salário bruto mensal', valor: moeda(numeroMoeda(salario)) },
          { rotulo: 'Divisor do saldo de salário', valor: metodoSaldo === 'trinta' ? '30 dias' : 'Dias reais do mês' },
          {
            rotulo: 'Tipo de desligamento',
            valor: tipoDesligamento === 'sem_justa_causa'
              ? 'Demissão sem justa causa'
              : tipoDesligamento === 'pedido_demissao'
                ? 'Pedido de demissão'
                : 'Rescisão por acordo',
          },
          {
            rotulo: 'Aviso-prévio',
            valor: tipoAviso === 'indenizado'
              ? 'Indenizado'
              : tipoAviso === 'trabalhado'
                ? 'Trabalhado'
                : tipoAviso === 'nao_cumprido'
                  ? 'Não cumprido'
                  : 'Cumprido ou dispensado',
          },
          { rotulo: 'Férias vencidas', valor: `${feriasVencidas} período(s)` },
          { rotulo: '13º já adiantado', valor: moeda(numeroMoeda(adiantamentoDecimo)) },
          { rotulo: 'Dependentes para IRRF', valor: dependentes },
          { rotulo: 'Outras verbas', valor: moeda(numeroMoeda(outrasVerbas)) },
          { rotulo: 'Natureza das outras verbas', valor: naturezaOutrasVerbas === 'remuneratoria' ? 'Remuneratória, com incidências' : 'Indenizatória, sem incidências' },
          { rotulo: 'Outros descontos', valor: moeda(numeroMoeda(outrosDescontos)) },
        ],
        memoria: [
          ...resultado.creditos.map((linha) => ({
            rotulo: linha.rotulo,
            valor: `${moeda(linha.valor)}${linha.detalhe ? ` — ${linha.detalhe}` : ''}`,
          })),
          ...resultado.descontos.map((linha) => ({
            rotulo: linha.rotulo,
            valor: `− ${moeda(linha.valor)}${linha.detalhe ? ` — ${linha.detalhe}` : ''}`,
          })),
          { rotulo: 'FGTS histórico estimado pelo período', valor: moeda(resultado.fgtsHistoricoEstimado) },
          { rotulo: 'Depósito rescisório estimado do FGTS', valor: moeda(resultado.fgtsDepositoRescisorio) },
          { rotulo: 'Saldo-base do FGTS com depósito', valor: moeda(resultado.fgtsSaldoComDeposito) },
          { rotulo: 'Multa rescisória estimada', valor: moeda(resultado.fgtsMulta) },
        ],
        observacoes: [
          `Projeção do contrato até ${dataBr(resultado.dataProjetada)}.`,
          'O FGTS e a multa são vinculados e não integram o líquido estimado do TRCT.',
        ],
      })
    : '';

  return (
    <>
      <section className="heroi calculadora-heroi">
        <div className="heroi__luz" aria-hidden />
        <div className="envolucro">
          <div className="calculadora-heroi__conteudo">
            <nav className="migalhas" aria-label="Você está em">
              <Link para="/">Início</Link>
              <span aria-hidden>/</span>
              <Link para="/calculadoras/">Calculadoras</Link>
              <span aria-hidden>/</span>
              {categoria && (
                <>
                  <Link para={caminhoDaCategoria(categoria)}>{categoria.nome}</Link>
                  <span aria-hidden>/</span>
                </>
              )}
              <span>Rescisão trabalhista</span>
            </nav>
            <span className="olho">Calculadora trabalhista · Rescisão e desligamento</span>
            <h1>Calculadora de rescisão trabalhista</h1>
            <p className="chamada">
              Estime saldo de salário, aviso-prévio, 13º proporcional, férias, FGTS, multa e
              descontos de INSS e IRRF com as tabelas oficiais em vigor.
            </p>
            <div className="calculadora-etiquetas" aria-label="Características da calculadora">
              <span>Grátis</span>
              <span>Estimativa detalhada</span>
              <span>CLT</span>
              <span>Sem cadastro</span>
            </div>
          </div>
        </div>
      </section>

      <section className="secao calculadora-secao" id="calcular">
        <div className="envolucro calculadora-layout">
          <form className="calculadora-formulario" onSubmit={calcular} noValidate>
            {erros.length > 0 && (
              <div
                className="calculadora-erros"
                id={`${prefixo}-erros`}
                role="alert"
                tabIndex={-1}
              >
                <strong>Revise os dados:</strong>
                <ul>{erros.map((erro) => <li key={erro}>{erro}</li>)}</ul>
              </div>
            )}

            <fieldset className="calculadora-passo">
              <legend><span>1</span> Período e remuneração</legend>
              <div className="calculadora-grade calculadora-grade--3">
                <div className="campo">
                  <label htmlFor={`${prefixo}-admissao`}>Data de admissão</label>
                  <input
                    id={`${prefixo}-admissao`}
                    type="date"
                    value={admissao}
                    onChange={(evento) => setAdmissao(evento.target.value)}
                    required
                  />
                </div>
                <div className="campo">
                  <label htmlFor={`${prefixo}-desligamento`}>Data de desligamento</label>
                  <input
                    id={`${prefixo}-desligamento`}
                    type="date"
                    min="2026-01-01"
                    max="2026-12-31"
                    value={desligamento}
                    onChange={(evento) => setDesligamento(evento.target.value)}
                    required
                  />
                </div>
                <div className="campo campo--moeda">
                  <label htmlFor={`${prefixo}-salario`}>Salário bruto mensal</label>
                  <span>
                    <i aria-hidden>R$</i>
                    <input
                      id={`${prefixo}-salario`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={salario}
                      onChange={(evento) => setSalario(evento.target.value)}
                      onBlur={() => formatarCampo(salario, setSalario)}
                      required
                    />
                  </span>
                </div>
              </div>

              <fieldset className="calculadora-subcampo">
                <legend>Cálculo do saldo de salário</legend>
                <div className="calculadora-radios">
                  <label>
                    <input
                      type="radio"
                      name="metodo-saldo"
                      value="trinta"
                      checked={metodoSaldo === 'trinta'}
                      onChange={() => setMetodoSaldo('trinta')}
                    />
                    <span><strong>Dividir por 30 dias</strong><small>Convenção mensal mais comum</small></span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="metodo-saldo"
                      value="calendario"
                      checked={metodoSaldo === 'calendario'}
                      onChange={() => setMetodoSaldo('calendario')}
                    />
                    <span><strong>Dias do mês</strong><small>Usar o calendário real</small></span>
                  </label>
                </div>
              </fieldset>
            </fieldset>

            <fieldset className="calculadora-passo">
              <legend><span>2</span> Desligamento e aviso-prévio</legend>
              <div className="calculadora-grade calculadora-grade--2">
                <div className="campo">
                  <label htmlFor={`${prefixo}-tipo`}>Tipo de desligamento</label>
                  <select
                    id={`${prefixo}-tipo`}
                    value={tipoDesligamento}
                    onChange={(evento) => aoTrocarDesligamento(evento.target.value as TipoDesligamento)}
                  >
                    <option value="sem_justa_causa">Demissão sem justa causa</option>
                    <option value="pedido_demissao">Pedido de demissão</option>
                    <option value="acordo">Rescisão por acordo</option>
                  </select>
                </div>
                <div className="campo">
                  <label htmlFor={`${prefixo}-aviso`}>Aviso-prévio</label>
                  <OpcoesAviso
                    id={`${prefixo}-aviso`}
                    tipo={tipoDesligamento}
                    valor={tipoAviso}
                    aoMudar={setTipoAviso}
                  />
                </div>
              </div>
              <p className="calculadora-ajuda">
                Na dispensa sem justa causa, estimamos 30 dias mais 3 por ano completo de contrato,
                até o limite de 90 dias. No pedido de demissão, o desconto estimado fica limitado a
                30 dias.
              </p>
            </fieldset>

            <fieldset className="calculadora-passo">
              <legend><span>3</span> Férias e 13º salário</legend>
              <div className="calculadora-grade calculadora-grade--2">
                <div className="campo">
                  <label htmlFor={`${prefixo}-ferias`}>Períodos de férias vencidas</label>
                  <select
                    id={`${prefixo}-ferias`}
                    value={feriasVencidas}
                    onChange={(evento) => setFeriasVencidas(evento.target.value)}
                  >
                    <option value="0">Nenhum</option>
                    <option value="1">1 período</option>
                    <option value="2">2 períodos</option>
                    <option value="3">3 períodos</option>
                  </select>
                  <small>Informe apenas períodos adquiridos e ainda não pagos.</small>
                </div>
                <div className="campo campo--moeda">
                  <label htmlFor={`${prefixo}-decimo`}>13º já adiantado no ano</label>
                  <span>
                    <i aria-hidden>R$</i>
                    <input
                      id={`${prefixo}-decimo`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={adiantamentoDecimo}
                      onChange={(evento) => setAdiantamentoDecimo(evento.target.value)}
                      onBlur={() => formatarCampo(adiantamentoDecimo, setAdiantamentoDecimo)}
                    />
                  </span>
                  <small>Use o valor efetivamente recebido como adiantamento.</small>
                </div>
              </div>
            </fieldset>

            <fieldset className="calculadora-passo">
              <legend><span>4</span> Dependentes e ajustes</legend>
              <div className="calculadora-grade calculadora-grade--2">
                <div className="campo">
                  <label htmlFor={`${prefixo}-dependentes`}>Dependentes para IRRF</label>
                  <input
                    id={`${prefixo}-dependentes`}
                    type="number"
                    min="0"
                    max="20"
                    step="1"
                    value={dependentes}
                    onChange={(evento) => setDependentes(evento.target.value)}
                  />
                </div>
                <div className="campo campo--moeda">
                  <label htmlFor={`${prefixo}-outras`}>Outras verbas</label>
                  <span>
                    <i aria-hidden>R$</i>
                    <input
                      id={`${prefixo}-outras`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={outrasVerbas}
                      onChange={(evento) => setOutrasVerbas(evento.target.value)}
                      onBlur={() => formatarCampo(outrasVerbas, setOutrasVerbas)}
                    />
                  </span>
                </div>
                <div className="campo">
                  <label htmlFor={`${prefixo}-natureza`}>Natureza das outras verbas</label>
                  <select
                    id={`${prefixo}-natureza`}
                    value={naturezaOutrasVerbas}
                    onChange={(evento) => setNaturezaOutrasVerbas(evento.target.value as NaturezaOutrasVerbas)}
                  >
                    <option value="remuneratoria">Remuneratória — com incidências</option>
                    <option value="indenizatoria">Indenizatória — sem incidências</option>
                  </select>
                </div>
                <div className="campo campo--moeda">
                  <label htmlFor={`${prefixo}-descontos`}>Outros descontos</label>
                  <span>
                    <i aria-hidden>R$</i>
                    <input
                      id={`${prefixo}-descontos`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={outrosDescontos}
                      onChange={(evento) => setOutrosDescontos(evento.target.value)}
                      onBlur={() => formatarCampo(outrosDescontos, setOutrosDescontos)}
                    />
                  </span>
                </div>
              </div>
              <p className="calculadora-ajuda">
                O FGTS agora é estimado automaticamente pelo salário e por todo o período do contrato.
                Como a ferramenta não conhece reajustes, afastamentos ou depósitos efetivos, confira o
                total com o extrato analítico antes de usar o número como valor definitivo.
              </p>
            </fieldset>

            <div className="calculadora-acoes">
              <button className="botao botao--dourado" type="submit">Calcular rescisão</button>
              <button className="botao botao--contorno" type="button" onClick={limpar}>Limpar</button>
            </div>
          </form>

          <aside className="calculadora-lateral" aria-label="Orientações para o cálculo">
            <div className="calculadora-lateral__cartao">
              <span className="olho">Antes de calcular</span>
              <h2>Separe os dados do vínculo.</h2>
              <ul>
                <li>Carteira de Trabalho</li>
                <li>Último holerite</li>
                <li>Extrato analítico do FGTS para conferência</li>
                <li>Aviso ou pedido de demissão</li>
                <li>Informação sobre férias e 13º</li>
              </ul>
              <p>
                Horas extras, comissões e adicionais habituais podem integrar médias. Se não forem
                informados em “outras verbas”, o resultado tende a ficar menor que o cálculo real.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {resultado && (
        <section className="secao secao--creme resultado-secao" id="resultado-rescisao" aria-live="polite">
          <div className="envolucro">
            <div className="resultado-cabeca">
              <div>
                <span className="olho">Resultado estimado</span>
                <h2>Resumo da rescisão</h2>
                <p>
                  Projeção do contrato até <strong>{dataBr(resultado.dataProjetada)}</strong>. Valores
                  arredondados para centavos.
                </p>
              </div>
              <div className="resultado-total">
                <span>Líquido estimado no TRCT</span>
                <strong>{moeda(resultado.liquidoTrct)}</strong>
                <small>FGTS não incluído neste total</small>
              </div>
            </div>

            <div className="resultado-grade">
              <section className="resultado-quadro">
                <div className="resultado-quadro__titulo">
                  <h3>Verbas estimadas</h3>
                  <strong>{moeda(resultado.totalCreditos)}</strong>
                </div>
                <dl>
                  {resultado.creditos.map((linha) => (
                    <div key={linha.chave}>
                      <dt>{linha.rotulo}{linha.detalhe && <small>{linha.detalhe}</small>}</dt>
                      <dd>{moeda(linha.valor)}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="resultado-quadro">
                <div className="resultado-quadro__titulo">
                  <h3>Descontos estimados</h3>
                  <strong>{moeda(resultado.totalDescontos)}</strong>
                </div>
                {resultado.descontos.length ? (
                  <dl>
                    {resultado.descontos.map((linha) => (
                      <div key={linha.chave}>
                        <dt>{linha.rotulo}{linha.detalhe && <small>{linha.detalhe}</small>}</dt>
                        <dd>− {moeda(linha.valor)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : <p className="resultado-vazio">Nenhum desconto estimado para os dados informados.</p>}
              </section>
            </div>

            <section className="resultado-fgts">
              <div>
                <span>FGTS histórico estimado</span>
                <strong>{moeda(resultado.fgtsHistoricoEstimado)}</strong>
                <small>8% sobre salários e 13º projetados no vínculo</small>
              </div>
              <div>
                <span>Depósito rescisório estimado</span>
                <strong>{moeda(resultado.fgtsDepositoRescisorio)}</strong>
                <small>8% sobre as bases informadas com incidência</small>
              </div>
              <div>
                <span>FGTS total estimado</span>
                <strong>{moeda(resultado.fgtsSaldoComDeposito)}</strong>
                <small>Histórico projetado + depósito rescisório</small>
              </div>
              <div>
                <span>Multa rescisória estimada</span>
                <strong>{moeda(resultado.fgtsMulta)}</strong>
                <small>{Math.round(resultado.percentualMultaFgts * 100)}% sobre a base estimada</small>
              </div>
              <p>
                {resultado.percentualSaqueFgts > 0
                  ? `A modalidade de desligamento permite, em regra, movimentar ${Math.round(resultado.percentualSaqueFgts * 100)}% do saldo por esse motivo. A opção pelo saque-aniversário pode impedir o saque imediato do saldo, sem afastar a multa quando devida.`
                  : 'O pedido de demissão não libera o saque do FGTS por esse motivo e não gera multa rescisória.'}
              </p>
            </section>

            <details className="resultado-memoria">
              <summary>Ver memória e parâmetros do cálculo</summary>
              <ul>
                <li>Saldo: {resultado.diasSaldo} dias, com divisor {resultado.divisorSaldo}.</li>
                <li>Aviso legal estimado: {resultado.diasAviso} dias; parcela paga: {resultado.diasAvisoPagos} dias.</li>
                <li>13º salário: {resultado.avosDecimo}/12 avos.</li>
                <li>Férias proporcionais: {resultado.avosFerias}/12 avos.</li>
                <li>IRRF mensal: dedução {resultado.deducaoIrrfMensal === 'simplificada' ? 'simplificada' : 'legal (INSS e dependentes)'}.</li>
                <li>IRRF do 13º: dedução {resultado.deducaoIrrfDecimo === 'simplificada' ? 'simplificada' : 'legal (INSS e dependentes)'}.</li>
              </ul>
            </details>

            <div className="calculadora-alerta resultado-aviso" role="note">
              <strong>Cálculo estimativo — não substitui o TRCT nem a folha oficial.</strong>
              <p>
                Convenção coletiva, remuneração variável, faltas, estabilidade, saldo real do FGTS e
                parametrização da folha podem mudar o resultado. Confira os documentos antes de tomar decisões.
              </p>
            </div>

            <aside className="resultado-cta">
              <div>
                <span className="olho">Ficou com alguma dúvida?</span>
                <h3>Fale agora mesmo com um especialista.</h3>
                <p>Tire suas dúvidas e entenda quais documentos podem ajudar na análise do seu caso.</p>
              </div>
              <div className="resultado-cta__acoes">
                <a
                  className="botao botao--zap"
                  href={linkWhatsApp(mensagemResultado)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cta="resultado-rescisao"
                >
                  <IconeWhatsApp tamanho={17} />
                  Falar com um especialista
                </a>
                <Link para="/contato-advogado-cuiaba/">Outras formas de contato</Link>
              </div>
            </aside>
          </div>
        </section>
      )}

      <section className="secao calculadora-conteudo">
        <div className="envolucro">
          <div className="artigo">
          <span className="olho">Entenda o resultado</span>
          <h2 id="como-funciona">Como funciona a calculadora de rescisão?</h2>
          <p>
            A ferramenta organiza as parcelas mais frequentes de uma rescisão CLT. A partir das
            datas, do salário e do motivo da saída, ela estima saldo de salário, aviso-prévio,
            décimo terceiro e férias proporcionais, férias vencidas informadas, as incidências em vigor
            e valores relacionados ao FGTS.
          </p>
          <p>
            O aviso indenizado projeta a data final do contrato para estimar novos avos de férias e
            13º. Na dispensa sem justa causa, são considerados 30 dias mais 3 dias por ano completo
            de serviço, até o total de 90. No acordo, a parcela indenizada do aviso é estimada pela
            metade.
          </p>

          <h2 id="verbas">Quais verbas entram na rescisão trabalhista?</h2>
          <p>
            A composição depende da forma de desligamento. Na dispensa sem justa causa, normalmente
            aparecem saldo de salário, aviso quando indenizado, férias vencidas e proporcionais com
            um terço, 13º proporcional e multa de 40% do FGTS. No pedido de demissão não há multa do
            FGTS e pode existir desconto do aviso não cumprido. No acordo, a multa é de 20% e o aviso
            indenizado é pago pela metade.
          </p>

          <h2 id="fgts">Por que o FGTS fica separado do valor líquido?</h2>
          <p>
            O depósito rescisório e a indenização compensatória são recolhidos à conta vinculada do
            trabalhador. Agora a calculadora também projeta o FGTS de todo o contrato, usando o salário
            informado como referência constante e incluindo os décimos terceiros anteriores. O resultado
            fica separado do líquido do TRCT porque não é pagamento direto feito no termo de rescisão.
          </p>

          <h2 id="limites">O que pode mudar o cálculo?</h2>
          <p>
            Médias de horas extras, adicionais, comissões, faltas, afastamentos, férias já gozadas,
            empréstimos, pensão judicial, convenção coletiva e valores já pagos podem alterar o
            resultado. A indenização adicional próxima à data-base da categoria e situações de
            estabilidade também exigem análise própria e não entram automaticamente nesta versão.
          </p>

          <aside className="destaque">
            <p>
              <strong>Importante:</strong> esta versão contempla dispensa sem justa causa, pedido de
              demissão e rescisão por acordo. Justa causa, rescisão indireta, culpa recíproca,
              falecimento e contratos por prazo determinado exigem regras próprias.
            </p>
          </aside>

          <p className="calculadora-links-internos">
            Confira as parcelas separadamente nas calculadoras de{' '}
            <Link para="/calculadoras/calculadora-aviso-previo/">aviso-prévio</Link>,{' '}
            <Link para="/calculadoras/calculadora-decimo-terceiro/">13º salário</Link>,{' '}
            <Link para="/calculadoras/calculadora-ferias/">férias</Link>,{' '}
            <Link para="/calculadoras/calculadora-fgts/">FGTS</Link> e{' '}
            <Link para="/calculadoras/calculadora-salario-liquido/">salário líquido</Link>. Veja também a página de{' '}
            <Link para="/advogado-trabalhista-cuiaba/">Direito Trabalhista</Link>.
          </p>

          <h2 id="fontes">Fontes e parâmetros oficiais</h2>
          <p>
            A parametrização consulta a tabela de contribuição do INSS em vigor, as tabelas mensais
            de IRRF da Receita Federal, a CLT, a Lei do aviso-prévio proporcional e as orientações
            oficiais do eSocial e do FGTS Digital. As fontes podem ser conferidas diretamente nos
            portais públicos:
          </p>
          <ul>
            <li><a href="https://www.gov.br/esocial/pt-br/documentacao-tecnica/documentacao-tecnica" target="_blank" rel="noopener noreferrer">Documentação técnica do eSocial</a></li>
            <li><a href="https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal" target="_blank" rel="noopener noreferrer">Tabela de contribuição mensal do INSS</a></li>
            <li><a href="https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026" target="_blank" rel="noopener noreferrer">Tabelas de tributação — Receita Federal</a></li>
            <li><a href="https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm" target="_blank" rel="noopener noreferrer">Consolidação das Leis do Trabalho</a></li>
            <li><a href="https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12506.htm" target="_blank" rel="noopener noreferrer">Lei nº 12.506/2011 — aviso-prévio proporcional</a></li>
            <li><a href="https://www.gov.br/trabalho-e-emprego/pt-br/servicos/empregador/fgtsdigital/perguntas-frequentes" target="_blank" rel="noopener noreferrer">Perguntas frequentes do FGTS Digital</a></li>
          </ul>
          </div>
        </div>
      </section>

      <section className="secao secao--creme" id="perguntas-frequentes">
        <div className="envolucro calculadora-faq">
          <div>
            <span className="olho">Perguntas frequentes</span>
            <h2>Dúvidas sobre a rescisão</h2>
            <p className="chamada">Respostas gerais. Documentos e fatos podem mudar a conclusão.</p>
          </div>
          <Faq perguntas={FAQ_RESCISAO} idPrefixo="rescisao" />
        </div>
      </section>

      <section className="secao secao--fina">
        <div className="envolucro">
          <span className="olho">Ferramentas relacionadas</span>
          <div className="calculadora-relacionadas">
            {categoria && (
              <Link para={caminhoDaCategoria(categoria)}>
                Calculadoras trabalhistas <IconeSeta tamanho={14} />
              </Link>
            )}
            <Link para="/calculadoras/">Todas as calculadoras <IconeSeta tamanho={14} /></Link>
            <Link para="/advogado-trabalhista-cuiaba/">Direito Trabalhista <IconeSeta tamanho={14} /></Link>
            <Link para="/artigos/">Artigos trabalhistas <IconeSeta tamanho={14} /></Link>
          </div>
        </div>
      </section>

      <SecaoCta
        olho="Ficou com alguma dúvida?"
        titulo="Fale agora mesmo com um especialista."
        texto="Separe o TRCT, os últimos holerites e o extrato do FGTS. O atendimento começa pela conferência dos fatos e dos documentos."
        botao="Falar com um especialista"
        mensagem={mensagemResultado || 'Olá, tenho uma dúvida sobre a calculadora de rescisão trabalhista do site.'}
        microcopy="A simulação não antecipa conclusão sobre diferenças ou direitos."
      />
    </>
  );
}
