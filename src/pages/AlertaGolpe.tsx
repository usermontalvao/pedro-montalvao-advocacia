import { useId, useState } from 'react';
import { Faq } from '../components/Faq';
import { FitaCena } from '../components/FitaCena';
import {
  IconeAlerta,
  IconeEmail,
  IconeEscudo,
  IconeMapa,
  IconeSemCobranca,
  IconeSeta,
  IconeTelefoneCortado,
  IconeWhatsApp,
} from '../components/Icones';
import { Revelar } from '../components/Revelar';
import { SecaoCta } from '../components/SecaoCta';
import { Link } from '../lib/router';
import { conferirContato, formatarTelefone } from '../lib/numeroOficial';
import {
  DOMINIOS_OFICIAIS,
  ENDERECO_LINHA,
  SITE,
  linkWhatsApp,
  oabFormatada,
} from '../site.config';

const MENSAGEM_CONFERIR =
  'Olá. Recebi um contato em nome do escritório e gostaria de confirmar se é oficial.';

/**
 * O que o golpista copia — e o que ele não consegue copiar.
 *
 * A página inteira se apoia nesta ideia: identidade visual se copia em um
 * minuto; a linha telefônica, não. Por isso a faixa fecha o topo, logo abaixo
 * do conferidor, e não numa seção qualquer no meio da página.
 */
const COPIAVEL = [
  ['A fotografia do advogado', true],
  ['O nome e a OAB', true],
  ['O logotipo do escritório', true],
  ['O número e o @usuário', false],
] as const;

/**
 * A conversa falsa, desmontada.
 *
 * Cada bolha carrega uma marca numerada que reaparece na lista ao lado: em vez
 * de explicar o golpe no abstrato, a página mostra a mensagem que a pessoa
 * recebeu e aponta, linha por linha, onde ela se entrega.
 */
const CONVERSA = [
  {
    marca: 1,
    texto: 'Boa tarde! Aqui é o Dr. Pedro Montalvão, responsável pelo seu processo. ⚖️',
    hora: '14:02',
  },
  {
    marca: 2,
    texto: 'Tenho uma ótima notícia: o tribunal liberou hoje a sua indenização de R$ 24.780,00.',
    hora: '14:02',
  },
  {
    marca: 3,
    texto:
      'Para dar baixa no alvará ainda hoje, é necessário o recolhimento da taxa judicial de R$ 487,00.',
    hora: '14:03',
  },
  {
    marca: 4,
    texto: 'Chave PIX (CPF): 018.***.***-40 — em nome de MARIA S. DE O. SANTOS',
    hora: '14:03',
  },
  {
    marca: 5,
    texto:
      'Preciso da confirmação em até 30 minutos, senão o valor volta para a fila e só sai no ano que vem.',
    hora: '14:04',
  },
] as const;

const DESMONTE = [
  {
    marca: 1,
    titulo: 'Número que não é do escritório',
    texto:
      'A foto, o nome e a inscrição na OAB foram copiados deste site. O que não dá para copiar é a linha telefônica — e é só ela que identifica o escritório.',
  },
  {
    marca: 2,
    titulo: 'Tribunal não avisa por mensagem',
    texto:
      'Nenhum tribunal telefona, manda mensagem ou chama no WhatsApp para comunicar liberação de valor. Quem acompanha o processo e comunica o resultado é o seu advogado.',
  },
  {
    marca: 3,
    titulo: 'Taxa para receber o que é seu',
    texto:
      'Valor de processo não depende de depósito prévio. Custas processuais são recolhidas por guia em nome do órgão, no curso do processo — nunca por transferência pedida em conversa.',
  },
  {
    marca: 4,
    titulo: 'Pix na conta de uma pessoa física',
    texto:
      'A chave é de alguém que você nunca ouviu falar. O escritório não recebe valores em conta de terceiros, e qualquer dado de pagamento consta do contrato.',
  },
  {
    marca: 5,
    titulo: 'Prazo de minutos',
    texto:
      'A pressa é a ferramenta principal do golpe: ela existe para impedir que você desligue, respire e confira. Prazo real de processo não vence em trinta minutos.',
  },
] as const;

/**
 * Quem nunca liga cobrando para liberar dinheiro.
 *
 * As marcas abaixo foram obtidas nos portais oficiais dos próprios órgãos.
 * `tema` existe porque a versão oficial do STF é negativa; ela precisa de um
 * fundo escuro, enquanto as demais conservam suas cores sobre fundo claro.
 */
const INSTITUICOES = [
  {
    sigla: 'STF',
    nome: 'Supremo Tribunal Federal',
    logo: '/midia/instituicoes/stf.png',
    largura: 344,
    altura: 67,
    tema: 'escuro',
  },
  {
    sigla: 'STJ',
    nome: 'Superior Tribunal de Justiça',
    logo: '/midia/instituicoes/stj.webp',
    largura: 438,
    altura: 215,
    tema: 'claro',
  },
  {
    sigla: 'TJMT',
    nome: 'Tribunal de Justiça de Mato Grosso',
    logo: '/midia/instituicoes/tjmt.webp',
    largura: 849,
    altura: 521,
    tema: 'claro',
  },
  {
    sigla: 'TRT-23',
    nome: 'Tribunal Regional do Trabalho de MT',
    logo: '/midia/instituicoes/trt23.png',
    largura: 437,
    altura: 80,
    tema: 'claro',
  },
  {
    sigla: 'CNJ',
    nome: 'Conselho Nacional de Justiça',
    logo: '/midia/instituicoes/cnj.png',
    largura: 247,
    altura: 69,
    tema: 'claro',
  },
  {
    sigla: 'INSS',
    nome: 'Instituto Nacional do Seguro Social',
    logo: '/midia/instituicoes/inss.png',
    largura: 768,
    altura: 264,
    tema: 'claro',
  },
] as const;

/** Como o dinheiro de um processo chega de verdade. */
const CAMINHO_REAL = [
  ['O processo é decidido', 'A decisão aparece no sistema do tribunal, com número, data e teor públicos.'],
  ['O alvará é expedido', 'O juízo determina a liberação. Nenhuma taxa é cobrada de você para que isso aconteça.'],
  ['O escritório comunica', 'O aviso chega por um dos canais oficiais desta página — e sempre é possível conferir no processo.'],
  ['O valor cai na sua conta', 'A transferência é feita para conta de sua titularidade. Nunca o contrário.'],
] as const;

const SINAIS = [
  [
    '"O escritório mudou de número"',
    'Mensagem de um número desconhecido explicando que houve troca de aparelho, de chip ou de linha. Número novo nunca se apresenta sozinho.',
  ],
  [
    'Pressa, sigilo e prazo curto',
    'Alvará que "sai hoje", acordo que "vence à noite", pedido para não comentar com ninguém. A urgência serve para impedir a conferência.',
  ],
  [
    'Pix para liberar o dinheiro',
    'Taxa, custa, imposto ou honorário cobrado às pressas — quase sempre em chave de pessoa física qualquer.',
  ],
  [
    'Documentos, selfie e códigos',
    'Foto do documento, selfie segurando o RG, senha do gov.br ou o código de seis dígitos do SMS. Esse código entrega a sua conta.',
  ],
  [
    'Conta bancária "atualizada"',
    'Aviso de que os dados bancários do escritório mudaram, com nova conta para receber. Dado bancário não se atualiza por mensagem.',
  ],
  [
    'Ligação em nome do tribunal',
    'Voz firme, ruído de central de atendimento, número que imita um telefone oficial. Órgão público não cobra por telefone.',
  ],
] as const;

const NUNCA = [
  'Pedir Pix, transferência ou depósito por mensagem para liberar alvará, acordo ou valor de processo.',
  'Cobrar taxa antecipada para "soltar" dinheiro que já é seu.',
  'Pedir senha, código de verificação do WhatsApp, do banco ou do gov.br.',
  'Avisar por um número novo que o número oficial mudou.',
  'Tratar contratação, honorários ou dados bancários fora dos canais oficiais e do contrato escrito.',
] as const;

const PASSOS = [
  ['Não responda', 'Responder confirma que o número está ativo e coloca você na próxima lista.'],
  ['Não pague nada', 'Nenhum valor, nenhuma taxa, nenhum comprovante — nem para "conferir se é real".'],
  ['Não envie documentos', 'Nem foto, nem selfie, nem o código que chegou por SMS.'],
  [
    'Confirme no canal oficial',
    'Abra você mesmo a conversa por um dos canais desta página. Nunca pelo número que enviou a mensagem.',
  ],
  [
    'Guarde as provas e denuncie',
    'Salve as capturas de tela antes de bloquear: são elas que sustentam o boletim de ocorrência.',
  ],
] as const;

/**
 * A data do comunicado, escrita uma vez só.
 *
 * Aviso de fraude sem data é aviso que ninguém sabe se ainda vale. Ela aparece
 * na tela para quem lê e vai junto no `atualizadoEm` da rota, para o buscador.
 */
export const ATUALIZADO_EM = '2026-08-20';

function dataPorExtenso(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** O @ do Instagram sai do próprio endereço — um lugar só para mudar. */
const USUARIO_INSTAGRAM = SITE.instagram.replace(/\/$/, '').split('/').pop() ?? '';

export const FAQ_GOLPE = [
  {
    pergunta: 'Como saber se estou falando mesmo com o escritório?',
    resposta:
      'Use apenas os botões e canais oficiais publicados nesta página. Se alguém entrar em contato, copie o número ou o nome de usuário e confira no campo do topo antes de responder. Foto, nome, logotipo e número da OAB podem ser copiados em um minuto; o canal legítimo, não. Na dúvida, feche a conversa e abra você mesmo o contato pelo botão oficial do site.',
  },
  {
    pergunta: 'O golpista pode usar um nome de usuário parecido com o oficial?',
    resposta:
      'Pode, e é o que ele faz. Um ponto a menos, uma palavra trocada ou um número no fim já identificam outra conta, mesmo que a foto e o nome exibido sejam idênticos aos do escritório. Copie o nome recebido e use o conferidor no topo desta página, que compara cada caractere com os dados oficiais vigentes.',
  },
  {
    pergunta: 'O STF, o STJ ou o TJMT ligam para liberar indenização?',
    resposta:
      'Não. Nenhum tribunal — e nenhum órgão público — telefona, manda mensagem ou chama no WhatsApp para comunicar liberação de valores, cobrar taxa ou pedir dados. Decisões e alvarás constam do processo, que é acompanhado pelo advogado constituído. Ligação em nome de tribunal cobrando qualquer coisa é golpe, sempre.',
  },
  {
    pergunta: 'Recebi uma mensagem dizendo que o escritório mudou de número. É verdade?',
    resposta:
      'Não. Qualquer aviso de troca de número recebido por um número diferente dos oficiais é golpe. Se um dia houver mudança real, ela será comunicada pelos próprios canais oficiais e publicada nesta página.',
  },
  {
    pergunta: 'O escritório pede pagamento por Pix pelo WhatsApp?',
    resposta:
      'Não. Honorários e despesas processuais, quando existem, são tratados de forma clara, com contrato escrito e dados de titularidade do escritório. Cobrança repentina por mensagem, com pressa e chave Pix de pessoa física, é golpe — mesmo que o valor pareça pequeno.',
  },
  {
    pergunta: 'Sou cliente e tenho processo em andamento. O golpista pode saber disso?',
    resposta:
      'Pode. Grande parte dos processos é pública e permite consultar nome das partes, do advogado e as movimentações. O criminoso usa esses dados para parecer alguém que acompanha o seu caso. Saber detalhes do processo não prova identidade nenhuma.',
  },
  {
    pergunta: 'Já fiz o pagamento. O que faço agora?',
    resposta:
      'Comunique o seu banco imediatamente e peça a contestação da transferência — no Pix existe um mecanismo próprio de devolução para casos de fraude, e ele tem prazo, então quanto antes melhor. Registre boletim de ocorrência com as capturas de tela e o comprovante, e avise o escritório por um dos canais oficiais.',
  },
  {
    pergunta: 'Enviei meus documentos para o número falso. Qual o risco?',
    resposta:
      'Documentos e selfies podem ser usados para abrir contas e contratar crédito em seu nome. Registre boletim de ocorrência, acompanhe o seu CPF em serviços de consulta de crédito e ative a verificação em duas etapas do WhatsApp e do gov.br. Se chegou a informar algum código recebido por SMS, trate a conta correspondente como comprometida.',
  },
  {
    pergunta: 'Como denuncio o perfil falso?',
    resposta:
      'Dentro da própria conversa do WhatsApp, use "Denunciar" e depois "Bloquear" — a denúncia envia as últimas mensagens para análise da plataforma. Registre também boletim de ocorrência, que pode ser feito pela delegacia eletrônica do seu estado, e avise o escritório pelo canal oficial para que o uso indevido do nome seja apurado.',
  },
];

/* -------------------------------------------------------------------------- */

/** O veredito, em uma frase forte e uma explicação curta. */
function textoDoVeredito(conferencia: ReturnType<typeof conferirContato>) {
  if (conferencia.estado === 'oficial' && conferencia.via === 'numero') {
    return {
      titulo: 'É uma linha oficial do escritório.',
      texto:
        'O contato confere com os dados oficiais vigentes. Ainda assim, nenhuma conversa legítima vai pedir senha, código de verificação ou Pix às pressas.',
    };
  }

  if (conferencia.estado === 'oficial') {
    return {
      titulo: 'É o perfil oficial do escritório.',
      texto:
        'Este é o nome de usuário do WhatsApp do escritório. Ainda assim, nenhuma conversa legítima vai pedir senha, código de verificação ou Pix às pressas.',
    };
  }

  if (conferencia.estado === 'nome') {
    return {
      titulo: 'Nome de perfil não prova nada.',
      texto:
        'Qualquer pessoa escreve "Dr. Pedro Montalvão" no próprio perfil, com a mesma foto. Confira pelo número de telefone ou pelo nome de usuário — são os dois únicos dados que não se copiam.',
    };
  }

  if (conferencia.estado === 'diferente' && conferencia.via === 'usuario') {
    return {
      titulo: 'Este perfil não é do escritório.',
      texto:
        'Ele não confere com os dados oficiais vigentes. Não responda, não pague e não envie documentos; feche a conversa e abra o contato pelo botão oficial desta página.',
    };
  }

  return {
    titulo: 'Este número não é do escritório.',
    texto:
      'Nenhum contato feito por este número parte daqui, mesmo que use o nome, a foto e o logotipo. Não responda, não pague, não envie documentos: bloqueie e denuncie.',
  };
}

/**
 * Conferidor do contato que chamou — o motivo de a página existir.
 *
 * Fica no alto, dentro do herói, e não numa seção mais abaixo: quem abre isto
 * está com a conversa do golpista na outra mão e com a pressa que o golpe
 * fabricou. Rolar a página para achar a resposta é tempo que trabalha a favor
 * do criminoso.
 *
 * A comparação é da máquina, é estrita e acontece dentro do aparelho — nada é
 * enviado a lugar nenhum.
 */
function Conferidor() {
  const [digitado, setDigitado] = useState('');
  const campo = useId();
  const conferencia = conferirContato(digitado);
  const veredito = textoDoVeredito(conferencia);
  const respondeu = conferencia.estado !== 'incompleto';

  return (
    <aside className="conferidor" id="conferir" data-estado={conferencia.estado}>
      <header className="conferidor__cabeca">
        <span className="conferidor__olho">
          <IconeEscudo tamanho={15} />
          Conferidor oficial
        </span>
        <h2>Quem entrou em contato com você?</h2>
        <p>Digite o número que apareceu no visor, ou o @usuário do perfil.</p>
      </header>

      <div className="conferidor__campo">
        <label htmlFor={campo}>Número de telefone ou @usuário</label>
        <input
          id={campo}
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="(00) 00000-0000"
          value={digitado}
          onChange={(evento) => setDigitado(formatarTelefone(evento.target.value))}
        />
      </div>

      <div
        className="conferidor__veredito"
        data-estado={conferencia.estado}
        role="status"
        aria-live="polite"
      >
        {respondeu ? (
          <>
            <span className="conferidor__marca" aria-hidden>
              {conferencia.estado === 'oficial' ? (
                <IconeEscudo tamanho={20} />
              ) : (
                <IconeAlerta tamanho={20} />
              )}
            </span>
            <div>
              <strong>{veredito.titulo}</strong>
              <p>{veredito.texto}</p>
            </div>
          </>
        ) : (
          <p className="conferidor__espera">
            A conferência acontece dentro do seu aparelho — nada é enviado ao escritório nem a
            qualquer servidor.
          </p>
        )}
      </div>

      <p className="conferidor__assinatura">
        {SITE.advogado} · {oabFormatada()}
      </p>
    </aside>
  );
}

/**
 * Um órgão que não telefona cobrando nada.
 *
 * O brasão oficial entra como imagem; se o arquivo ainda não estiver na pasta,
 * o cartão troca sozinho pela placa com a sigla. Nunca aparece imagem quebrada
 * numa página cujo assunto é confiança.
 */
function Instituicao({ instituicao }: { instituicao: (typeof INSTITUICOES)[number] }) {
  const [semLogo, setSemLogo] = useState(false);

  return (
    <article className="golpe-instituicao" data-logo-tema={instituicao.tema}>
      <span className="golpe-instituicao__corte" aria-hidden>
        <IconeTelefoneCortado tamanho={18} />
      </span>

      <span className="golpe-instituicao__brasao">
        {semLogo ? (
          <span className="golpe-instituicao__sigla" aria-hidden>
            {instituicao.sigla}
          </span>
        ) : (
          <img
            src={instituicao.logo}
            alt=""
            width={instituicao.largura}
            height={instituicao.altura}
            loading="lazy"
            decoding="async"
            onError={() => setSemLogo(true)}
          />
        )}
      </span>

      <h3>{instituicao.nome}</h3>
      <p>não telefona para liberar valores</p>
    </article>
  );
}

/* -------------------------------------------------------------------------- */

export function AlertaGolpe() {
  return (
    <>
      <section className="heroi heroi--alerta">
        <FitaCena />

        <div className="envolucro golpe-topo">
          <div className="golpe-topo__texto">
            <nav className="migalhas" aria-label="Você está em">
              <Link para="/">Início</Link>
              <span aria-hidden>/</span>
              <span>Alerta de golpe</span>
            </nav>

            <span className="golpe-selo">
              <span className="golpe-selo__pulso" aria-hidden>
                <IconeAlerta tamanho={15} />
              </span>
              Comunicado oficial do escritório
            </span>

            {/*
              O título carrega as palavras pelas quais alguém procura isto no
              buscador — "alerta de golpe" — e não só a frase de efeito. Quem
              recebeu a mensagem falsa pesquisa o nome do escritório antes de
              pagar; se este aviso não estiver no índice, a única coisa que a
              busca devolve é o material que o golpista copiou.
            */}
            <h1 className="golpe-titulo">
              Alerta de golpe
              <em>em nome do escritório</em>
            </h1>

            <p className="chamada">
              Criminosos usam o nome, a fotografia do advogado e a identidade visual do escritório
              para anunciar valores liberados e cobrar uma taxa por Pix. A foto e o nome eles copiam
              em um minuto. <strong>O número e o nome de usuário, não.</strong>
            </p>

            <p className="golpe-atualizado">
              Comunicado publicado pelo escritório e atualizado em{' '}
              <time dateTime={ATUALIZADO_EM}>{dataPorExtenso(ATUALIZADO_EM)}</time>.
            </p>

            <div className="grupo-botoes">
              <a
                className="botao botao--zap"
                href={linkWhatsApp(MENSAGEM_CONFERIR)}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="heroi-alerta-golpe"
              >
                <IconeWhatsApp tamanho={18} />
                Falar pela linha oficial
              </a>
              <a className="botao botao--contorno" href="#como-chega">
                Ver como o golpe chega
                <IconeSeta />
              </a>
            </div>
          </div>

          <Conferidor />
        </div>

        <div className="envolucro">
          <ul className="golpe-copiavel">
            {COPIAVEL.map(([item, copiavel]) => (
              <li key={item} data-copiavel={copiavel}>
                <span aria-hidden>{copiavel ? '✓' : '✕'}</span>
                <span>
                  {item}
                  <small>{copiavel ? 'copiável em um minuto' : 'não se copia'}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}

      <section className="secao secao--escura golpe-tribunais">
        <div className="envolucro">
          <Revelar className="cabeca-secao">
            <span className="olho olho--alerta">O golpe mais comum</span>
            <h2>
              Tribunal nenhum liga para <em>liberar indenização</em>.
            </h2>
            <p className="chamada">
              Nem por telefone, nem por WhatsApp, nem por SMS. Nenhum destes órgãos entra em contato
              para comunicar valor liberado, cobrar taxa ou pedir dados bancários.
            </p>
          </Revelar>

          <div className="golpe-instituicoes">
            {INSTITUICOES.map((instituicao, indice) => (
              <Revelar key={instituicao.sigla} atraso={indice * 40}>
                <Instituicao instituicao={instituicao} />
              </Revelar>
            ))}
          </div>

          <p className="golpe-instituicoes__nota">
            Marcas exibidas apenas para identificação dos órgãos citados. Não há parceria, vínculo ou
            endosso institucional.
          </p>

          <Revelar className="golpe-caminho" atraso={120}>
            <h3 className="golpe-caminho__titulo">Como o dinheiro de um processo chega de verdade</h3>
            <ol className="golpe-caminho__lista">
              {CAMINHO_REAL.map(([titulo, texto]) => (
                <li key={titulo}>
                  <strong>{titulo}</strong>
                  <span>{texto}</span>
                </li>
              ))}
            </ol>
            <p className="golpe-caminho__nota">
              <IconeSemCobranca tamanho={18} />
              Em nenhum degrau dessa escada existe pagamento feito por você para receber.
            </p>
          </Revelar>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}

      <section className="secao" id="como-chega">
        <div className="envolucro">
          <Revelar className="cabeca-secao">
            <span className="olho">A mensagem, desmontada</span>
            <h2>É assim que o golpe chega.</h2>
            <p className="chamada">
              A conversa abaixo é um exemplo montado a partir das tentativas relatadas ao escritório.
              Cada marca vermelha aponta o ponto em que ela se entrega.
            </p>
          </Revelar>

          <div className="golpe-desmonte">
            <Revelar>
              <div
                className="golpe-print"
                role="img"
                aria-label="Exemplo de conversa falsa: um número desconhecido se apresenta como o advogado, anuncia indenização liberada pelo tribunal e cobra uma taxa de R$ 487,00 por Pix na conta de uma pessoa física, com prazo de trinta minutos."
              >
                <div className="golpe-print__topo">
                  <span className="golpe-print__avatar" aria-hidden>
                    PM
                  </span>
                  <span className="golpe-print__quem">
                    <strong>Dr. Pedro Montalvão — Advocacia ⚖️</strong>
                    <small>+55 65 9•••-•••• · online</small>
                  </span>
                  <span className="golpe-print__falso" aria-hidden>
                    falso
                  </span>
                </div>

                <div className="golpe-print__conversa" aria-hidden>
                  {CONVERSA.map((bolha) => (
                    <p className="golpe-bolha" key={bolha.marca}>
                      <span className="golpe-marca">{bolha.marca}</span>
                      {bolha.texto}
                      <time>{bolha.hora}</time>
                    </p>
                  ))}
                </div>
              </div>
            </Revelar>

            <Revelar atraso={90}>
              <ol className="golpe-pistas">
                {DESMONTE.map((pista) => (
                  <li key={pista.marca}>
                    <span className="golpe-marca golpe-marca--lista" aria-hidden>
                      {pista.marca}
                    </span>
                    <div>
                      <strong>{pista.titulo}</strong>
                      <p>{pista.texto}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Revelar>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}

      <section className="secao secao--creme">
        <div className="envolucro">
          <Revelar className="cabeca-secao">
            <span className="olho">Outros formatos</span>
            <h2>Seis sinais que aparecem quase sempre.</h2>
            <p className="chamada">
              Nenhum deles depende de conhecimento jurídico. Basta reconhecer o padrão.
            </p>
          </Revelar>

          <div className="grade grade--3 golpe-sinais">
            {SINAIS.map(([titulo, texto], indice) => (
              <Revelar key={titulo} atraso={indice * 40}>
                <article className="golpe-sinal">
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </article>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}

      <section className="secao">
        <div className="envolucro golpe-estreito">
          <Revelar className="cabeca-secao">
            <span className="olho">Limite claro</span>
            <h2>O que o escritório nunca faz.</h2>
            <p className="chamada">
              Se o pedido estiver nesta lista, não é o escritório — não importa a foto do perfil.
            </p>
          </Revelar>

          <ul className="golpe-nunca">
            {NUNCA.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}

      <section className="secao secao--escura">
        <div className="envolucro">
          <Revelar className="cabeca-secao">
            <span className="olho">Se já recebeu o contato</span>
            <h2>Cinco passos, nesta ordem.</h2>
          </Revelar>

          <div className="passos golpe-passos">
            {PASSOS.map(([titulo, texto], indice) => (
              <Revelar key={titulo} atraso={indice * 40}>
                <article className="passo">
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </article>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}

      <section className="secao">
        <div className="envolucro golpe-estreito">
          <Revelar className="cabeca-secao">
            <span className="olho">Onde denunciar</span>
            <h2>A denúncia protege quem vem depois.</h2>
          </Revelar>

          <div className="golpe-denuncia">
            <article>
              <h3>No próprio WhatsApp</h3>
              <p>
                Abra a conversa, use <strong>Denunciar</strong> e depois <strong>Bloquear</strong>. A
                denúncia envia as últimas mensagens para análise da plataforma. Faça as capturas de
                tela antes de bloquear.
              </p>
            </article>
            <article>
              <h3>Boletim de ocorrência</h3>
              <p>
                Pode ser registrado pela delegacia eletrônica do seu estado, sem sair de casa. Leve
                as capturas de tela, o número usado pelo golpista e, se houve pagamento, o
                comprovante.
              </p>
            </article>
            <article>
              <h3>No seu banco, se houve pagamento</h3>
              <p>
                Comunique a fraude imediatamente e peça a contestação da transferência. No Pix há um
                mecanismo próprio de devolução para casos assim, com prazo — quanto mais cedo o
                pedido, maior a chance de bloquear o valor.
              </p>
            </article>
            <article>
              <h3>Avise o escritório</h3>
              <p>
                Por um dos canais oficiais desta página. O registro de cada tentativa ajuda a apurar
                o uso indevido do nome e a alertar outras pessoas.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}

      <section className="secao secao--creme">
        <div className="envolucro">
          <Revelar className="cabeca-secao">
            <span className="olho">Canais oficiais</span>
            <h2>Só existe o que está listado aqui.</h2>
          </Revelar>

          <div className="golpe-canais__grade">
            <div className="golpe-canal golpe-canal--principal">
              <span aria-hidden>
                <IconeWhatsApp tamanho={20} />
              </span>
              <div>
                <strong>WhatsApp oficial</strong>
                <a href={linkWhatsApp(MENSAGEM_CONFERIR)} target="_blank" rel="noopener noreferrer">
                  Abrir pelo botão seguro
                </a>
              </div>
            </div>

            <div className="golpe-canal">
              <span aria-hidden>
                <IconeEmail />
              </span>
              <div>
                <strong>E-mail</strong>
                <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </div>
            </div>

            <div className="golpe-canal">
              <span aria-hidden>
                <IconeEscudo tamanho={20} />
              </span>
              <div>
                <strong>Instagram</strong>
                <a href={SITE.instagram} target="_blank" rel="noopener noreferrer">
                  @{USUARIO_INSTAGRAM}
                </a>
              </div>
            </div>

            <div className="golpe-canal">
              <span aria-hidden>
                <IconeMapa />
              </span>
              <div>
                <strong>Endereço em Cuiabá</strong>
                <span>{ENDERECO_LINHA}</span>
              </div>
            </div>

            <div className="golpe-canal">
              <span aria-hidden>
                <IconeEscudo tamanho={20} />
              </span>
              <div>
                <strong>Endereços na internet</strong>
                <span>{DOMINIOS_OFICIAIS.join(' e ')} — e nenhum outro.</span>
              </div>
            </div>
          </div>

          <p className="microtexto golpe-nota">
            Esta página é informativa e não substitui orientação sobre um caso concreto. O primeiro
            contato não formaliza contratação nem interrompe prazos legais.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}

      <section className="secao">
        <div className="envolucro golpe-estreito">
          <Revelar className="cabeca-secao">
            <span className="olho">Perguntas frequentes</span>
            <h2>Dúvidas de quem recebeu o contato.</h2>
          </Revelar>
          <Revelar atraso={80}>
            <Faq perguntas={FAQ_GOLPE} idPrefixo="golpe" />
          </Revelar>
        </div>
      </section>

      <SecaoCta
        olho="Confirmação"
        titulo="Na dúvida, confirme antes de qualquer coisa."
        texto="Uma mensagem para a linha oficial resolve em minutos o que um golpe leva meses para desfazer."
        botao="Confirmar pela linha oficial"
        mensagem={MENSAGEM_CONFERIR}
        microcopy="O botão abre o canal oficial vigente. A mensagem não formaliza contratação."
      />
    </>
  );
}
