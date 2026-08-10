import { Faq } from '../components/Faq';
import { IconeSeta, IconeWhatsApp } from '../components/Icones';
import { Revelar } from '../components/Revelar';
import { SecaoCta } from '../components/SecaoCta';
import { Link } from '../lib/router';
import { linkWhatsApp } from '../site.config';
import areas from '../content/areas.json';

const REGIOES = [
  { nome: 'Norte', estados: 'AC · AP · AM · PA · RO · RR · TO' },
  { nome: 'Nordeste', estados: 'AL · BA · CE · MA · PB · PE · PI · RN · SE' },
  { nome: 'Centro-Oeste', estados: 'DF · GO · MT · MS' },
  { nome: 'Sudeste', estados: 'ES · MG · RJ · SP' },
  { nome: 'Sul', estados: 'PR · RS · SC' },
];

export const FAQ_ATENDIMENTO_BRASIL = [
  {
    pergunta: 'É possível contratar um advogado de outro estado?',
    resposta:
      'Sim. A advocacia pode ser prestada à distância, e grande parte dos processos e procedimentos utiliza sistemas eletrônicos. Antes da contratação, o escritório confirma a natureza da demanda, a competência territorial e se haverá necessidade de apoio ou comparecimento local.',
  },
  {
    pergunta: 'Como os documentos são enviados?',
    resposta:
      'O escritório informa o canal adequado depois do primeiro contato. Documentos podem ser digitalizados ou fotografados com boa legibilidade. Arquivos sensíveis só devem ser enviados após a confirmação dos canais oficiais.',
  },
  {
    pergunta: 'A reunião online tem a mesma validade do atendimento presencial?',
    resposta:
      'A reunião permite compreender os fatos, conferir informações e orientar os próximos passos. Quando houver contratação, documentos e procurações podem ser assinados por meios eletrônicos compatíveis com a necessidade do ato.',
  },
  {
    pergunta: 'Todo caso pode ser conduzido sem deslocamento?',
    resposta:
      'Não necessariamente. Algumas audiências, perícias, avaliações ou diligências podem exigir presença física. Essa possibilidade é informada na análise inicial, de acordo com o tipo de demanda e o órgão responsável.',
  },
  {
    pergunta: 'Quais áreas são atendidas online?',
    resposta:
      'O escritório analisa questões de Direito Trabalhista, Previdenciário, do Consumidor e de Família. A disponibilidade e a viabilidade dependem dos fatos, documentos, prazos e eventual conflito de interesses.',
  },
];

export function AtendimentoBrasil() {
  return (
    <>
      <section className="heroi heroi--nacional">
        <div className="heroi-nacional__midia" aria-hidden>
          <img
            src="/midia/atendimento-online.webp"
            srcSet="/midia/atendimento-online-720.webp 720w, /midia/atendimento-online.webp 1024w"
            sizes="(max-width: 900px) 100vw, 46vw"
            alt=""
            fetchPriority="high"
          />
        </div>
        <div className="heroi__luz" aria-hidden />
        <div className="envolucro">
          <nav className="migalhas" aria-label="Você está em">
            <Link para="/">Início</Link>
            <span aria-hidden>/</span>
            <span>Atendimento online</span>
          </nav>

          <div className="heroi__texto-largo">
            <span className="olho">Atendimento jurídico online</span>
            <h1>Orientação próxima, mesmo à distância.</h1>
            <p className="chamada">
              Reuniões, documentos e acompanhamento podem acontecer por meios digitais, mantendo
              comunicação direta e análise individual. A possibilidade de atuação é confirmada de
              acordo com a natureza e a competência de cada caso.
            </p>
            <div className="grupo-botoes">
              <a
                className="botao botao--claro"
                href={linkWhatsApp('Olá. Gostaria de receber informações sobre o atendimento jurídico online.')}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="heroi-atendimento-online"
              >
                <IconeWhatsApp tamanho={17} />
                Solicitar informações
              </a>
              <a className="botao botao--transparente" href="#como-funciona">
                Como funciona
                <IconeSeta />
              </a>
            </div>
            <p className="microtexto">
              O primeiro contato não formaliza contratação, não interrompe prazos e não representa
              promessa de resultado.
            </p>
          </div>
        </div>
      </section>

      <section className="secao" id="como-funciona">
        <div className="envolucro">
          <Revelar className="cabeca-secao">
            <span className="olho">Distância sem ruído</span>
            <h2>O atendimento muda de canal.<br />O cuidado não muda.</h2>
            <p className="chamada">
              A tecnologia organiza a conversa e os arquivos. A análise continua sendo feita por
              uma pessoa, com contexto, critérios e responsabilidade profissional.
            </p>
          </Revelar>

          <div className="passos passos--4">
            {[
              ['Relato inicial', 'Você apresenta a situação de forma breve e informa a cidade e o estado relacionados ao caso.'],
              ['Triagem', 'O escritório verifica a área, eventuais prazos, conflito de interesses e os documentos necessários.'],
              ['Reunião', 'Quando cabível, a conversa ocorre por videoconferência ou outro canal previamente combinado.'],
              ['Próximos passos', 'A orientação indica possibilidades, limites e atos que podem exigir presença física ou apoio local.'],
            ].map(([titulo, texto], indice) => (
              <Revelar key={titulo} atraso={indice * 50}>
                <article className="passo">
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </article>
              </Revelar>
            ))}
          </div>

          <Revelar className="atendimento-video" atraso={90}>
            <figure className="atendimento-video__quadro">
              <picture>
                <source
                  media="(max-width: 720px)"
                  srcSet="/midia/video-conferencia-720.webp"
                />
                <img
                  src="/midia/video-conferencia.webp"
                  alt="Pedro Montalvão durante atendimento por videoconferência"
                  width="1376"
                  height="768"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
              <figcaption>
                <span>Videoconferência</span>
                <strong>Conversa direta, com tempo para compreender o contexto.</strong>
                <p>
                  O canal é combinado previamente e utilizado quando for adequado à natureza da
                  demanda e às necessidades do atendimento.
                </p>
              </figcaption>
            </figure>
          </Revelar>
        </div>
      </section>

      <section className="secao secao--escura cobertura">
        <div className="envolucro">
          <Revelar className="cobertura__cabeca">
            <span className="olho">Cobertura de atendimento</span>
            <h2>26 estados.<br />1 Distrito Federal.</h2>
            <p>
              O atendimento online pode ser solicitado de todas as regiões. A possibilidade de
              atuação é confirmada após a análise da matéria e da competência do caso.
            </p>
          </Revelar>

          <div className="cobertura__regioes">
            {REGIOES.map((regiao) => (
              <div className="cobertura__regiao" key={regiao.nome}>
                <strong>{regiao.nome}</strong>
                <span>{regiao.estados}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="secao secao--creme">
        <div className="envolucro">
          <Revelar className="cabeca-secao">
            <span className="olho">Áreas analisadas à distância</span>
            <h2>Informação específica para cada matéria.</h2>
          </Revelar>
          <div className="grade grade--4">
            {areas.map((area, indice) => (
              <Revelar key={area.slug} atraso={indice * 50}>
                <Link className="cartao" para={`/${area.slug}/`}>
                  <span className="area-linha__num">0{indice + 1}</span>
                  <h3>{area.nome}</h3>
                  <p>{area.resumoHome}</p>
                  <span className="cartao__link">
                    Entender a atuação
                    <IconeSeta tamanho={15} />
                  </span>
                </Link>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      <section className="secao">
        <div className="envolucro contato-grade">
          <Revelar>
            <span className="olho">Perguntas frequentes</span>
            <h2>Atendimento online, sem atalhos.</h2>
            <p className="chamada">
              O formato digital amplia o acesso, mas cada demanda continua sujeita a documentos,
              prazos, regras territoriais e análise de viabilidade.
            </p>
          </Revelar>
          <Revelar atraso={70}>
            <Faq perguntas={FAQ_ATENDIMENTO_BRASIL} idPrefixo="brasil" />
          </Revelar>
        </div>
      </section>

      <SecaoCta
        titulo="Informações sobre atendimento online"
        texto="Informe a área, a cidade e o estado relacionados à situação para que o escritório indique os dados necessários à análise inicial."
        microcopy="O contato é informativo e não garante aceitação da demanda, ajuizamento de ação ou resultado."
        botao="Solicitar informações"
        mensagem="Olá. Gostaria de receber informações sobre o atendimento jurídico online."
      />
    </>
  );
}
