import { Link } from '../lib/router';
import { IconeSeta } from '../components/Icones';
import { Revelar } from '../components/Revelar';
import { Faq } from '../components/Faq';
import { SecaoCta } from '../components/SecaoCta';
import areas from '../content/areas.json';
import artigos from '../content/artigos.json';

export type ConteudoArea = (typeof areas)[number];

const jornadas: Record<string, {
  titulo: string;
  texto: string;
  imagem: string;
  alt: string;
  etapas: Array<{ titulo: string; texto: string }>;
}> = {
  'advogado-trabalhista-cuiaba': {
    titulo: 'Do relato à estratégia: cada fato encontra seu lugar.',
    texto: 'Uma conversa produtiva começa pela sequência dos acontecimentos. Assim, documentos, pessoas e datas deixam de ser uma pilha de informações e passam a compor um caso verificável.',
    imagem: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=85',
    alt: 'Documentos e caneta sobre uma mesa de trabalho',
    etapas: [
      { titulo: 'O vínculo', texto: 'Início, função, rotina e alterações do contrato.' },
      { titulo: 'O que mudou', texto: 'Jornada, pagamentos, afastamentos ou condutas relevantes.' },
      { titulo: 'Os registros', texto: 'Ponto, holerites, mensagens, extratos e testemunhas.' },
      { titulo: 'O próximo passo', texto: 'Orientação sobre medidas, prazos e documentos necessários.' }
    ]
  },
  'advogado-previdenciario-cuiaba': {
    titulo: 'Antes do protocolo, um mapa do seu histórico no INSS.',
    texto: 'Cada período pode influenciar a análise. A jornada abaixo organiza o histórico para que o pedido, recurso ou planejamento comece com uma visão mais clara.',
    imagem: '/midia/area-previdenciaria-inss.jpg',
    alt: 'Imagem relacionada ao atendimento do INSS',
    etapas: [
      { titulo: 'Histórico', texto: 'Vínculos, contribuições, afastamentos e atividades exercidas.' },
      { titulo: 'Conferência', texto: 'CNIS e documentos comparados com a realidade do segurado.' },
      { titulo: 'Cenários', texto: 'Regras, requisitos e alternativas compatíveis com o caso.' },
      { titulo: 'Decisão', texto: 'Pedido, recurso ou medida adequada à situação analisada.' }
    ]
  },
  'advogado-consumidor-cuiaba': {
    titulo: 'Quando a empresa diz uma coisa e os registros mostram outra.',
    texto: 'A força de uma questão de consumo está no seu rastro: oferta, cobrança, tentativa de solução e resposta. Esta sequência ajuda a preservar o que importa.',
    imagem: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=85',
    alt: 'Pessoa realizando uma compra online com cartão e computador',
    etapas: [
      { titulo: 'A oferta', texto: 'Anúncio, contrato, pedido ou condição apresentada.' },
      { titulo: 'O problema', texto: 'Cobrança, falha, negativa ou entrega diferente do combinado.' },
      { titulo: 'Os protocolos', texto: 'Canais da empresa, números de atendimento e respostas.' },
      { titulo: 'A análise', texto: 'Documentos, urgência e caminhos possíveis para a situação.' }
    ]
  },
  'advogado-familia-cuiaba': {
    titulo: 'Decisões importantes pedem uma conversa com começo, meio e futuro.',
    texto: 'Em família, o que é definido hoje afeta a rotina de amanhã. O atendimento organiza prioridades, documentos e possibilidades com o cuidado que a situação exige.',
    imagem: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=85',
    alt: 'Família caminhando junta ao ar livre',
    etapas: [
      { titulo: 'O que precisa mudar', texto: 'A decisão, acordo ou situação que trouxe a necessidade de orientação.' },
      { titulo: 'Quem é afetado', texto: 'Rotina, filhos, vínculos e patrimônio envolvidos.' },
      { titulo: 'O que já existe', texto: 'Certidões, acordos, decisões e informações relevantes.' },
      { titulo: 'Como avançar', texto: 'Possibilidades consensuais ou medidas adequadas ao contexto.' }
    ]
  }
};

const guiaPrevidenciario = [
  {
    tipo: 'Aposentadoria',
    titulo: 'Aposentadoria por idade urbana',
    resumo: 'A análise considera idade, tempo de contribuição, carência, vínculos e regras aplicáveis à trajetória de cada segurado.',
  },
  {
    tipo: 'Incapacidade',
    titulo: 'Benefício por incapacidade temporária',
    resumo: 'Abrange situações em que doença ou acidente impedem o trabalho. Histórico contributivo, atividade e documentos médicos são lidos em conjunto.',
  },
  {
    tipo: 'Assistencial',
    titulo: 'BPC/LOAS',
    resumo: 'É um benefício assistencial para pessoa idosa ou com deficiência em situação de vulnerabilidade. Não se confunde com aposentadoria.',
  },
  {
    tipo: 'Dependentes',
    titulo: 'Pensão por morte',
    resumo: 'Proteção destinada aos dependentes após o falecimento do segurado. A composição familiar e a situação previdenciária influenciam a análise.',
  },
  {
    tipo: 'Maternidade',
    titulo: 'Salário-maternidade',
    resumo: 'Relacionado a nascimento, adoção e outras hipóteses legais. A categoria da segurada e o vínculo com a Previdência orientam a avaliação.',
  },
  {
    tipo: 'Decisão do INSS',
    titulo: 'Benefício negado, suspenso ou cessado',
    resumo: 'Uma negativa, suspensão ou cessação precisa ser compreendida pela razão apresentada e pelo histórico que sustenta o caso.',
  },
];

export function Area({ area }: { area: ConteudoArea }) {
  const relacionados = artigos.filter((artigo) => artigo.area === area.slug);
  const outras = areas.filter((item) => item.slug !== area.slug);
  const jornada = jornadas[area.slug];

  return (
    <>
      <section className="heroi heroi-area">
        <div className="heroi__luz" aria-hidden />
        <div className="envolucro heroi-area__grade">
          <div className="heroi-area__conteudo">
            <nav className="migalhas" aria-label="Você está em">
              <Link para="/">Início</Link>
              <span aria-hidden>/</span>
              <Link para="/areas-de-atuacao/">Áreas de atuação</Link>
              <span aria-hidden>/</span>
              <span>{area.nome}</span>
            </nav>

            <span className="olho">{area.nome}</span>
            <h1>{area.h1}</h1>
            <p className="chamada">{area.subtitulo}</p>

            <div className="grupo-botoes">
              <Link
                className="botao botao--claro"
                para="/contato-advogado-cuiaba/"
                data-cta="heroi-area"
              >
                {area.botaoPrincipal}
                <IconeSeta />
              </Link>
              <a className="botao botao--contorno" href="#temas">
                Explorar os temas
                <IconeSeta />
              </a>
            </div>

            <p className="microtexto">{area.microcopyHero}</p>
          </div>

          <figure className="heroi-area__imagem">
            <img
              src={`/midia/${area.imagem}.webp`}
              srcSet={`/midia/${area.imagem}-720.webp 720w, /midia/${area.imagem}.webp 1376w`}
              sizes="(max-width: 900px) 100vw, 540px"
              alt={`Contexto relacionado a ${area.nome}`}
              width={1376}
              height={768}
              fetchPriority="high"
            />
            <figcaption>{area.nome}</figcaption>
          </figure>
        </div>
      </section>

      {/* -------------------------------------------------------------- intro */}
      <section className="secao">
        <div className="envolucro">
          <div className="contato-grade">
            <Revelar>
              <span className="olho">Antes de qualquer medida</span>
              <h2>{area.introTitulo}</h2>
            </Revelar>
            <Revelar atraso={80}>
              {area.intro.map((paragrafo) => (
                <p key={paragrafo.slice(0, 24)} style={{ color: 'var(--texto-suave)' }}>
                  {paragrafo}
                </p>
              ))}
            </Revelar>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- percurso do caso */}
      {jornada && area.slug !== 'advogado-previdenciario-cuiaba' && (
        <section className="secao secao--escura area-jornada">
          <div className="envolucro">
            <div className="area-jornada__cabeca">
              <Revelar>
                <span className="olho">Uma leitura por etapas</span>
                <h2>{jornada.titulo}</h2>
                <p>{jornada.texto}</p>
              </Revelar>
              <Revelar atraso={100}>
                <figure className="area-jornada__imagem">
                  <img src={jornada.imagem} alt={jornada.alt} loading="lazy" />
                  <figcaption>{area.slug === 'advogado-previdenciario-cuiaba' ? 'Imagem relacionada ao INSS' : 'Imagem editorial · Unsplash'}</figcaption>
                </figure>
              </Revelar>
            </div>

            <ol className="area-jornada__linha">
              {jornada.etapas.map((etapa, indice) => (
                <Revelar key={etapa.titulo} atraso={indice * 80} className="area-jornada__etapa">
                  <li>
                    <span>0{indice + 1}</span>
                    <div className="area-jornada__ponto" aria-hidden />
                    <h3>{etapa.titulo}</h3>
                    <p>{etapa.texto}</p>
                  </li>
                </Revelar>
              ))}
            </ol>
            <p className="area-jornada__nota">Cada caso tem fatos e documentos próprios. A sequência acima organiza a conversa inicial, sem antecipar conclusões.</p>
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------- temas */}
      <section className="secao secao--creme" id="temas">
        <div className="envolucro">
          <Revelar>
            <div className="cabeca-secao">
              <span className="olho">Temas da área</span>
              <h2>{area.temasTitulo}</h2>
            </div>
          </Revelar>

          <Revelar atraso={70}>
            <div className="lista-temas">
              {area.temas.map((tema, indice) => (
                <details className="tema tema--interativo" key={tema.titulo} open={indice < 2}>
                  <summary>
                    <span>{String(indice + 1).padStart(2, '0')}</span>
                    <h3>{tema.titulo}</h3>
                    <i aria-hidden>+</i>
                  </summary>
                  <p>{tema.texto}</p>
                </details>
              ))}
            </div>
          </Revelar>
        </div>
      </section>

      {area.slug === 'advogado-trabalhista-cuiaba' && (
        <section className="secao secao--fina area-calculadora">
          <div className="envolucro area-calculadora__interno">
            <Revelar>
              <span className="olho">Ferramenta gratuita</span>
              <h2>Estime as verbas da rescisão.</h2>
              <p>
                Use datas, salário e tipo de desligamento para visualizar saldo, aviso-prévio,
                férias, 13º e FGTS com os parâmetros oficiais em vigor.
              </p>
            </Revelar>
            <Revelar atraso={80}>
              <Link
                className="botao botao--dourado"
                para="/calculadoras/calculadora-rescisao-trabalhista/"
              >
                Abrir calculadora de rescisão
                <IconeSeta tamanho={15} />
              </Link>
            </Revelar>
          </div>
        </section>
      )}

      {/* --------------------------------------------- quando procurar + docs */}
      {area.slug === 'advogado-previdenciario-cuiaba' && (
        <section className="secao secao--escura area-beneficios" id="beneficios">
          <div className="envolucro">
            <Revelar>
              <div className="cabeca-secao area-beneficios__cabeca">
                <span className="olho">Benefícios previdenciários</span>
                <h2>Cada benefício exige uma leitura própria.</h2>
                <p>O nome do benefício é apenas o começo. Vínculos, contribuições, documentos e acontecimentos de vida definem a análise jurídica de cada caso.</p>
              </div>
            </Revelar>

            <ol className="area-beneficios__grade">
              {guiaPrevidenciario.map((beneficio, indice) => (
                <Revelar
                  key={beneficio.titulo}
                  como="li"
                  atraso={indice * 55}
                  className="area-beneficios__item"
                >
                  <span className="area-beneficios__numero" aria-hidden>
                    {String(indice + 1).padStart(2, '0')}
                  </span>
                  <div className="area-beneficios__identidade">
                    <span>{beneficio.tipo}</span>
                    <h3>{beneficio.titulo}</h3>
                  </div>
                  <p>{beneficio.resumo}</p>
                  <span className="area-beneficios__marcador" aria-hidden />
                </Revelar>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* --------------------------------------------- quando procurar + docs */}
      <section className="secao">
        <div className="envolucro">
          <div className="contato-grade">
            <Revelar>
              <span className="olho">Quando vale olhar para isso</span>
              <h2>{area.quandoTitulo}</h2>
              {area.quando.map((paragrafo) => (
                <p key={paragrafo.slice(0, 24)} style={{ color: 'var(--texto-suave)' }}>
                  {paragrafo}
                </p>
              ))}

              <Link
                className="botao botao--escuro"
                para="/contato-advogado-cuiaba/"
                data-cta="meio-area"
                style={{ marginTop: '0.8rem' }}
              >
                Ver formas de atendimento
                <IconeSeta />
              </Link>
            </Revelar>

            <Revelar atraso={90}>
              <div className="painel-form">
                <h3 style={{ marginBottom: '1rem' }}>{area.documentosTitulo}</h3>
                <ul style={{ color: 'var(--texto-suave)', paddingLeft: '1.1rem' }}>
                  {area.documentos.map((documento) => (
                    <li key={documento} style={{ marginBottom: '0.45rem' }}>
                      {documento}
                    </li>
                  ))}
                </ul>
                <p className="microtexto">{area.documentosNota}</p>
              </div>
            </Revelar>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- FAQ */}
      <section className="secao secao--creme">
        <div className="envolucro">
          <div className="contato-grade">
            <Revelar>
              <span className="olho">Perguntas frequentes</span>
              <h2>{area.faqTitulo}</h2>
              <p className="chamada">Respostas gerais. Fatos e documentos podem mudar a orientação.</p>
            </Revelar>
            <Revelar atraso={80}>
              <Faq perguntas={area.faq} idPrefixo={area.slug} />
            </Revelar>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- artigos e outras */}
      {relacionados.length > 0 && (
        <section className="secao">
          <div className="envolucro">
            <Revelar>
              <div className="cabeca-secao">
                <span className="olho">Para ler antes de decidir</span>
                <h2>Artigos sobre {area.nome}</h2>
              </div>
            </Revelar>
            {relacionados.map((artigo, indice) => (
              <Revelar key={artigo.slug} atraso={indice * 70}>
                <Link className="artigo-cartao" para={`/artigos/${artigo.slug}/`} style={{ display: 'grid' }}>
                  <span className="etiqueta">{artigo.categoria}</span>
                  <h3>{artigo.titulo}</h3>
                  <p>{artigo.resumo}</p>
                </Link>
              </Revelar>
            ))}
          </div>
        </section>
      )}

      <section className="secao secao--fina secao--creme">
        <div className="envolucro">
          <Revelar>
            <span className="olho">Outras áreas</span>
            <div className="grade grade--3" style={{ marginTop: '1rem' }}>
              {outras.map((item) => (
                <Link className="cartao" key={item.slug} para={`/${item.slug}/`}>
                  <h3>{item.nome}</h3>
                  <p>{item.resumoHome}</p>
                  <span className="cartao__link">
                    Conhecer a área
                    <IconeSeta tamanho={15} />
                  </span>
                </Link>
              ))}
            </div>
          </Revelar>
        </div>
      </section>

      <SecaoCta
        titulo={area.ctaTitulo}
        texto={area.ctaTexto}
        microcopy={area.ctaMicrocopy}
        botao={area.botaoPrincipal}
        destino="/contato-advogado-cuiaba/"
      />
    </>
  );
}
