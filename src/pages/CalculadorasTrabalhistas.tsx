import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import { Faq, type Pergunta } from '../components/Faq';
import { IconeSeta, IconeWhatsApp } from '../components/Icones';
import { Revelar } from '../components/Revelar';
import { SecaoCta } from '../components/SecaoCta';
import calculadoras from '../content/calculadoras.json';
import {
  MOTORES,
  type CampoCalculadora,
  type ResultadoGenerico,
  type ValoresCalculadora,
} from '../lib/calculosTrabalhistas';
import { caminhoDaCategoria, categoriaDaCalculadora } from '../lib/categoriasCalculadoras';
import { montarMensagemCalculadora } from '../lib/mensagemCalculadora';
import { Link } from '../lib/router';
import { linkWhatsApp } from '../site.config';

export type ConteudoCalculadora = (typeof calculadoras)[number];

function moeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
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

function valoresIniciais(campos: CampoCalculadora[]): ValoresCalculadora {
  return Object.fromEntries(campos.map((campo) => [campo.chave, campo.padrao ?? '']));
}

function dataBr(valor: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  const [ano, mes, dia] = valor.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function faqDaCalculadora(calculadora: ConteudoCalculadora): Pergunta[] {
  const perguntas: Pergunta[] = [
    {
      pergunta: `Como funciona o cálculo de ${calculadora.nomeCurto.toLowerCase()}?`,
      resposta: calculadora.comoFunciona,
    },
    {
      pergunta: `Qual fórmula é usada no cálculo de ${calculadora.nomeCurto.toLowerCase()}?`,
      resposta: calculadora.formula,
    },
    {
      pergunta: 'O resultado da calculadora é exato?',
      resposta: `Não. O resultado é uma estimativa educacional. ${calculadora.limites}`,
    },
    {
      pergunta: 'A calculadora substitui a folha, o TRCT ou uma análise jurídica?',
      resposta:
        'Não. A ferramenta organiza um cenário com os dados informados, mas documentos, histórico do contrato, convenção coletiva e circunstâncias do caso precisam ser conferidos por profissional qualificado.',
    },
  ];

  if (calculadora.motor === 'horas_trabalhadas') {
    perguntas.splice(2, 0,
      {
        pergunta: 'O que acontece quando a jornada passa de 44 horas semanais?',
        resposta:
          'Em regra, o período acima do limite normal precisa ser compensado por regime válido ou remunerado como hora extra, com adicional de pelo menos 50%. A jornada diária, o banco de horas e a convenção coletiva também precisam ser examinados.',
      },
      {
        pergunta: 'Como informar o horário de almoço ou outro intervalo?',
        resposta:
          'Informe o início e o fim da pausa para que esse tempo seja descontado. Se não houve intervalo, marque “Sem intervalo”. A ferramenta também aceita jornadas que terminam depois da meia-noite.',
      },
    );
  }

  return perguntas;
}

function Campo({
  campo,
  id,
  valor,
  aoMudar,
}: {
  campo: CampoCalculadora;
  id: string;
  valor: string;
  aoMudar: (valor: string) => void;
}) {
  if (campo.tipo === 'checkbox') {
    return (
      <div className="calculadora-campo calculadora-campo--checkbox">
        <label htmlFor={id}>
          <input
            id={id}
            type="checkbox"
            checked={valor === 'sim'}
            onChange={(evento) => aoMudar(evento.target.checked ? 'sim' : 'nao')}
          />
          <span>{campo.rotulo}</span>
        </label>
        {campo.ajuda && <small>{campo.ajuda}</small>}
      </div>
    );
  }

  return (
    <div className="calculadora-campo">
      <label htmlFor={id}>{campo.rotulo}</label>
      {campo.tipo === 'select' ? (
        <select id={id} value={valor} onChange={(evento) => aoMudar(evento.target.value)}>
          {campo.opcoes?.map((opcao) => (
            <option value={opcao.valor} key={opcao.valor}>{opcao.rotulo}</option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          value={valor}
          type={campo.tipo === 'data' ? 'date' : campo.tipo === 'numero' ? 'number' : campo.tipo === 'hora' ? 'time' : 'text'}
          inputMode={campo.tipo === 'moeda' ? 'decimal' : campo.tipo === 'numero' ? 'decimal' : undefined}
          placeholder={campo.placeholder}
          min={campo.minimo}
          max={campo.maximo}
          step={campo.passo}
          required={campo.obrigatorio}
          onChange={(evento) => aoMudar(evento.target.value)}
          onBlur={() => campo.tipo === 'moeda' && aoMudar(exibirMoedaNoCampo(valor))}
        />
      )}
      {campo.ajuda && <small>{campo.ajuda}</small>}
    </div>
  );
}

function formatarLinha(valor: number | string, formato = 'moeda'): string {
  if (typeof valor === 'string') return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? dataBr(valor) : valor;
  if (formato === 'duracao') {
    const minutosTotais = Math.max(0, Math.round(valor * 60));
    const horas = Math.floor(minutosTotais / 60);
    const minutos = minutosTotais % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
  }
  if (formato === 'numero') return valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  if (formato === 'texto') return String(valor);
  return moeda(valor);
}

function formatarDado(campo: CampoCalculadora, valor: string): string {
  if (campo.tipo === 'moeda') return moeda(numeroMoeda(valor));
  if (campo.tipo === 'data') return dataBr(valor);
  if (campo.tipo === 'select') {
    return campo.opcoes?.find((opcao) => opcao.valor === valor)?.rotulo ?? valor;
  }
  if (campo.tipo === 'checkbox') return valor === 'sim' ? 'Sim' : 'Não';
  return valor || 'Não informado';
}

function campoEstaVisivel(campo: CampoCalculadora, valores: ValoresCalculadora): boolean {
  return !campo.mostrarSe || valores[campo.mostrarSe.chave] === campo.mostrarSe.valor;
}

const RELACIONADAS: Record<string, string[]> = {
  horas_extras: ['calculadora-horas-trabalhadas', 'calculadora-banco-de-horas', 'calculadora-adicional-noturno'],
  horas_trabalhadas: ['calculadora-horas-extras', 'calculadora-intervalo-intrajornada', 'calculadora-banco-de-horas'],
  salario_liquido: ['calculadora-inss-irrf', 'calculadora-salario-dias-trabalhados', 'calculadora-ferias'],
  ferias: ['calculadora-salario-liquido', 'calculadora-decimo-terceiro', 'calculadora-rescisao-trabalhista'],
  decimo_terceiro: ['calculadora-salario-liquido', 'calculadora-inss-irrf', 'calculadora-ferias'],
  fgts: ['calculadora-rescisao-trabalhista', 'calculadora-rescisao-empregado-domestico', 'calculadora-vinculo-sem-registro'],
  aviso_previo: ['calculadora-rescisao-trabalhista', 'calculadora-ferias', 'calculadora-decimo-terceiro'],
  adicional_noturno: ['calculadora-horas-extras', 'calculadora-insalubridade', 'calculadora-periculosidade'],
  insalubridade: ['calculadora-periculosidade', 'calculadora-horas-extras', 'calculadora-rescisao-trabalhista'],
  periculosidade: ['calculadora-insalubridade', 'calculadora-horas-extras', 'calculadora-rescisao-trabalhista'],
  inss_irrf: ['calculadora-salario-liquido', 'calculadora-decimo-terceiro', 'calculadora-ferias'],
  seguro_desemprego: ['calculadora-rescisao-trabalhista', 'calculadora-aviso-previo', 'calculadora-fgts'],
  intervalo_intrajornada: ['calculadora-horas-extras', 'calculadora-banco-de-horas', 'calculadora-salario-liquido'],
  banco_horas: ['calculadora-horas-extras', 'calculadora-intervalo-intrajornada', 'calculadora-rescisao-trabalhista'],
  salario_dias: ['calculadora-salario-liquido', 'calculadora-inss-irrf', 'calculadora-decimo-terceiro'],
  comissoes_dsr: ['calculadora-salario-liquido', 'calculadora-horas-extras', 'calculadora-decimo-terceiro'],
  estabilidade_gestante: ['calculadora-rescisao-trabalhista', 'calculadora-ferias', 'calculadora-decimo-terceiro'],
  estabilidade_acidente: ['calculadora-rescisao-trabalhista', 'calculadora-fgts', 'calculadora-decimo-terceiro'],
  ferias_dobro: ['calculadora-ferias', 'calculadora-rescisao-trabalhista', 'calculadora-salario-liquido'],
  multa_477: ['calculadora-rescisao-trabalhista', 'calculadora-multa-artigo-467-clt', 'calculadora-aviso-previo'],
  multa_467: ['calculadora-rescisao-trabalhista', 'calculadora-multa-artigo-477-clt', 'calculadora-diferencas-salariais'],
  diferencas_salariais: ['calculadora-salario-liquido', 'calculadora-fgts', 'calculadora-decimo-terceiro'],
  vale_transporte: ['calculadora-salario-liquido', 'calculadora-salario-dias-trabalhados', 'calculadora-inss-irrf'],
  vinculo_sem_registro: ['calculadora-rescisao-trabalhista', 'calculadora-fgts', 'calculadora-horas-extras'],
  rescisao_domestico: ['calculadora-rescisao-trabalhista', 'calculadora-fgts', 'calculadora-aviso-previo'],
};

export function CalculadoraTrabalhista({ calculadora }: { calculadora: ConteudoCalculadora }) {
  const prefixo = useId();
  const motor = MOTORES[calculadora.motor];
  const [valores, setValores] = useState<ValoresCalculadora>(() => valoresIniciais(motor.campos));
  const [resultado, setResultado] = useState<ResultadoGenerico | null>(null);
  const [erros, setErros] = useState<string[]>([]);

  useEffect(() => {
    setValores(valoresIniciais(motor.campos));
    setResultado(null);
    setErros([]);
  }, [motor]);

  const faq = useMemo(() => faqDaCalculadora(calculadora), [calculadora]);
  const categoria = useMemo(() => categoriaDaCalculadora(calculadora), [calculadora]);
  const relacionadas = useMemo(() => {
    const slugs = RELACIONADAS[calculadora.motor] ?? [];
    return slugs.map((slug) => calculadoras.find((item) => item.slug === slug)).filter(Boolean) as ConteudoCalculadora[];
  }, [calculadora.motor]);

  const mensagemResultado = useMemo(() => {
    if (!resultado) return '';
    return montarMensagemCalculadora({
      titulo: calculadora.titulo,
      total: formatarLinha(resultado.total, resultado.formatoTotal),
      dados: motor.campos.filter((campo) => campoEstaVisivel(campo, valores)).map((campo) => ({
        rotulo: campo.rotulo,
        valor: formatarDado(campo, valores[campo.chave] ?? ''),
      })),
      memoria: resultado.linhas.map((linha) => ({
        rotulo: linha.rotulo,
        valor: formatarLinha(linha.valor, linha.formato),
      })),
      observacoes: resultado.notas,
    });
  }, [calculadora.titulo, motor.campos, resultado, valores]);

  const calcular = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const problemas: string[] = [];

    for (const campo of motor.campos) {
      if (!campoEstaVisivel(campo, valores)) continue;
      const valor = valores[campo.chave] ?? '';
      if (campo.obrigatorio && (campo.tipo === 'moeda' ? numeroMoeda(valor) <= 0 : !valor)) {
        problemas.push(`Informe ${campo.rotulo.toLowerCase()}.`);
      }
      if (campo.tipo === 'numero' && valor !== '') {
        const numero = Number(valor);
        if (!Number.isFinite(numero)) problemas.push(`${campo.rotulo} precisa ser um número válido.`);
        if (campo.minimo !== undefined && numero < campo.minimo) problemas.push(`${campo.rotulo} deve ser no mínimo ${campo.minimo}.`);
        if (campo.maximo !== undefined && numero > campo.maximo) problemas.push(`${campo.rotulo} deve ser no máximo ${campo.maximo}.`);
      }
    }

    problemas.push(...(motor.validar?.(valores) ?? []));

    const paresCronologicos = [
      ['admissao', 'desligamento'],
      ['inicio', 'fim'],
    ];
    for (const [inicio, fim] of paresCronologicos) {
      if (valores[inicio] && valores[fim] && valores[fim] < valores[inicio]) {
        problemas.push('A data final precisa ser posterior à data inicial.');
      }
    }

    setErros([...new Set(problemas)]);
    if (problemas.length) {
      setResultado(null);
      document.getElementById(`${prefixo}-erros`)?.focus();
      return;
    }

    const calculado = motor.calcular(valores);
    const numeros = [calculado.total, ...calculado.linhas.filter((linha) => typeof linha.valor === 'number').map((linha) => linha.valor as number)];
    if (numeros.some((numero) => !Number.isFinite(numero))) {
      setErros(['Não foi possível calcular com os valores informados. Revise os campos e tente novamente.']);
      setResultado(null);
      return;
    }

    setResultado(calculado);
    window.setTimeout(() => {
      document.getElementById(`${prefixo}-resultado`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const limpar = () => {
    setValores(valoresIniciais(motor.campos));
    setResultado(null);
    setErros([]);
  };

  return (
    <>
      <section className="heroi calculadora-heroi">
        <div className="heroi__luz" aria-hidden />
        <div className="envolucro">
          <div className="artigo-cabeca">
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
              <span>{calculadora.nomeCurto}</span>
            </nav>
            <span className="olho">
              {categoria ? `${categoria.olho} · ${calculadora.grupo}` : 'Calculadora jurídica gratuita'}
            </span>
            <h1>{calculadora.titulo}</h1>
            <p className="chamada">{calculadora.resumo}</p>
            <div className="calculadora-etiquetas" aria-label="Características da ferramenta">
              <span>Grátis</span>
              <span>Estimativa</span>
              <span>Parâmetros oficiais</span>
              <span>Sem cadastro</span>
            </div>
          </div>
        </div>
      </section>

      <section className="secao calculadora-area">
        <div className="envolucro calculadora-layout calculadora-pagina__largura">
          <form className="calculadora-formulario calculadora-formulario--generica" onSubmit={calcular} noValidate>
            <fieldset className="calculadora-passo">
              <legend>Dados para o cálculo</legend>
              <div className="calculadora-grade">
                {motor.campos.filter((campo) => campoEstaVisivel(campo, valores)).map((campo) => (
                  <Campo
                    campo={campo}
                    id={`${prefixo}-${campo.chave}`}
                    key={campo.chave}
                    valor={valores[campo.chave] ?? ''}
                    aoMudar={(valor) => {
                      setValores((atuais) => ({ ...atuais, [campo.chave]: valor }));
                      setResultado(null);
                    }}
                  />
                ))}
              </div>
            </fieldset>

            {erros.length > 0 && (
              <div className="calculadora-erros" id={`${prefixo}-erros`} role="alert" tabIndex={-1}>
                <strong>Revise os dados:</strong>
                <ul>{erros.map((erro) => <li key={erro}>{erro}</li>)}</ul>
              </div>
            )}

            <div className="calculadora-acoes">
              <button className="botao botao--dourado" type="submit">Calcular agora</button>
              <button className="botao botao--contorno" type="button" onClick={limpar}>Limpar</button>
            </div>
          </form>
        </div>
      </section>

      {resultado && (
        <section className="secao secao--creme resultado-secao" id={`${prefixo}-resultado`} aria-live="polite">
          <div className="envolucro resultado-envolucro calculadora-pagina__largura">
            <div className="resultado-cabeca">
              <span className="olho">Resultado estimado</span>
              <h2>{resultado.tituloTotal}</h2>
              <strong className="resultado-total">{formatarLinha(resultado.total, resultado.formatoTotal)}</strong>
            </div>

            <div className="resultado-tabela">
              {resultado.linhas.map((linha) => (
                <div className="resultado-linha" key={linha.rotulo}>
                  <span>
                    {linha.rotulo}
                    {linha.detalhe && <small>{linha.detalhe}</small>}
                  </span>
                  <strong>{formatarLinha(linha.valor, linha.formato)}</strong>
                </div>
              ))}
            </div>

            {resultado.notas.length > 0 && (
              <div className="resultado-notas">
                {resultado.notas.map((nota) => <p key={nota}>{nota}</p>)}
              </div>
            )}

            <div className="calculadora-alerta resultado-aviso" role="note">
              <strong>Cálculo estimativo — não substitui documentos ou análise profissional.</strong>
              <p>{calculadora.limites}</p>
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
                  data-cta="resultado-calculadora"
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

      <section className="secao">
        <div className="envolucro calculadora-conteudo calculadora-pagina__largura">
          <Revelar>
            <span className="olho">Entenda o resultado</span>
            <h2>Como funciona o cálculo de {calculadora.nomeCurto.toLowerCase()}?</h2>
            <p className="chamada">{calculadora.comoFunciona}</p>
          </Revelar>
          <div className="grade grade--2 calculadora-explicacoes">
            <Revelar>
              <article className="cartao">
                <h3>Fórmula usada</h3>
                <p>{calculadora.formula}</p>
              </article>
            </Revelar>
            <Revelar>
              <article className="cartao">
                <h3>Limites da estimativa</h3>
                <p>{calculadora.limites}</p>
              </article>
            </Revelar>
          </div>
          <p className="calculadora-fonte">
            Fonte principal: <a href={calculadora.fonteUrl} target="_blank" rel="noopener noreferrer">{calculadora.fonte}</a>.
          </p>
          <p className="calculadora-links-internos">
            Para complementar a conferência, veja também{' '}
            {relacionadas.map((item, indice) => (
              <span key={item.slug}>
                {indice > 0 && (indice === relacionadas.length - 1 ? ' e ' : ', ')}
                <Link para={`/calculadoras/${item.slug}/`}>{item.nomeCurto.toLowerCase()}</Link>
              </span>
            ))}
            {categoria && (
              <>
                {' '}ou percorra as{' '}
                <Link para={caminhoDaCategoria(categoria)}>
                  calculadoras de {categoria.nome.toLowerCase()}
                </Link>
              </>
            )}. Consulte ainda a página de{' '}
            <Link para={categoria?.areaCaminho ?? '/areas-de-atuacao/'}>
              {categoria?.areaNome ?? 'áreas de atuação'}
            </Link>{' '}
            e os <Link para="/artigos/">artigos jurídicos</Link>.
          </p>
        </div>
      </section>

      <section className="secao secao--creme">
        <div className="envolucro calculadora-pagina__largura">
          <div className="cabeca-secao">
            <span className="olho">Perguntas frequentes</span>
            <h2>Dúvidas sobre este cálculo</h2>
          </div>
          <Faq perguntas={faq} idPrefixo={`faq-${calculadora.motor}`} />
        </div>
      </section>

      <section className="secao">
        <div className="envolucro calculadora-pagina__largura">
          <div className="cabeca-secao">
            <span className="olho">Ferramentas relacionadas</span>
            <h2>Continue sua conferência.</h2>
          </div>
          <div className="grade grade--3 calculadora-relacionadas">
            {relacionadas.map((item) => (
              <Link className="cartao calculadora-cartao" para={`/calculadoras/${item.slug}/`} key={item.slug}>
                <span className="etiqueta">{item.grupo}</span>
                <h3>{item.nomeCurto}</h3>
                <p>{item.resumo}</p>
                <span className="cartao__link">Abrir calculadora <IconeSeta tamanho={15} /></span>
              </Link>
            ))}
          </div>
          {categoria && (
            <p className="calculadora-fonte">
              <Link para={caminhoDaCategoria(categoria)}>
                Ver todas as calculadoras de {categoria.nome.toLowerCase()}
              </Link>
            </p>
          )}
        </div>
      </section>

      <SecaoCta
        olho="Ficou com alguma dúvida?"
        titulo="Fale agora mesmo com um especialista."
        texto="Uma estimativa ajuda a organizar números. A orientação jurídica confere documentos, prazos e o que realmente pode ser exigido no seu caso."
        botao="Falar com um especialista"
        mensagem={mensagemResultado || `Olá, tenho uma dúvida sobre a calculadora de ${calculadora.nomeCurto.toLowerCase()} do site.`}
      />
    </>
  );
}
