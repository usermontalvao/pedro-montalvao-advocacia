import { IconeSeta } from '../components/Icones';
import { Revelar } from '../components/Revelar';
import { SecaoCta } from '../components/SecaoCta';
import {
  CATEGORIAS_PUBLICADAS,
  caminhoDaCategoria,
  calculadorasDaCategoria,
  gruposDaCategoria,
  type CategoriaCalculadora,
} from '../lib/categoriasCalculadoras';
import { Link } from '../lib/router';

/**
 * Uma área do Direito, uma página de calculadoras.
 *
 * Antes tudo caía no mesmo hub e a pessoa que procurava pensão alimentícia
 * precisava passar por vinte e seis ferramentas trabalhistas. Aqui a área já
 * chega escolhida, e dentro dela as ferramentas vêm divididas em blocos
 * (jornada, salário, rescisão…) para que a lista continue navegável mesmo
 * quando a biblioteca crescer.
 */
export function CategoriaCalculadoras({ categoria }: { categoria: CategoriaCalculadora }) {
  const grupos = gruposDaCategoria(categoria);
  const calculadoras = calculadorasDaCategoria(categoria);
  const total = calculadoras.length;
  const unicaCalculadora = total === 1 ? calculadoras[0] : undefined;
  const outras = CATEGORIAS_PUBLICADAS.filter((item) => item.slug !== categoria.slug);

  return (
    <>
      <section className={`heroi calculadoras-heroi ${unicaCalculadora ? 'calculadoras-heroi--entrada-direta' : ''}`}>
        <div className="heroi__luz" aria-hidden />
        <div className="envolucro">
          <div className="artigo-cabeca">
            <nav className="migalhas" aria-label="Você está em">
              <Link para="/">Início</Link>
              <span aria-hidden>/</span>
              <Link para="/calculadoras/">Calculadoras</Link>
              <span aria-hidden>/</span>
              <span>{categoria.nome}</span>
            </nav>
            <span className="olho">{categoria.olho}</span>
            <h1>{categoria.titulo}</h1>
            <p className="chamada">{categoria.chamada}</p>
            {unicaCalculadora && <div className="calculadoras-categoria__acoes">
              <Link className="botao botao--dourado" para={`/calculadoras/${unicaCalculadora.slug}/`}>
                Abrir calculadora de {unicaCalculadora.nomeCurto.toLowerCase()}
                <IconeSeta tamanho={15} />
              </Link>
              <a href="#calculadoras-disponiveis">Ver o que a ferramenta calcula</a>
            </div>}
            <div className="calculadora-etiquetas" aria-label="Características das ferramentas">
              <span>{total === 1 ? '1 ferramenta' : `${total} ferramentas`}</span>
              <span>Memória de cálculo</span>
              <span>Grátis</span>
              <span>Sem cadastro</span>
            </div>
          </div>
        </div>
      </section>

      {grupos.map((grupo, indice) => (
        <section
          className={`secao ${indice % 2 === 1 ? 'secao--creme' : ''}`}
          key={grupo.nome}
          id={indice === 0 ? 'calculadoras-disponiveis' : `grupo-${indice + 1}`}
        >
          <div className="envolucro">
            <Revelar>
              <div className="cabeca-secao">
                <span className="olho">{grupo.nome}</span>
                <h2>{grupo.descricao}</h2>
              </div>
            </Revelar>

            <div className={`grade grade--3 ${unicaCalculadora ? 'calculadoras-categoria__grade-unica' : ''}`}>
              {grupo.itens.map((calculadora) => (
                <Revelar key={calculadora.slug}>
                  <Link
                    className={`cartao calculadora-cartao ${unicaCalculadora ? 'calculadora-cartao--entrada-direta' : ''}`}
                    para={`/calculadoras/${calculadora.slug}/`}
                  >
                    <div className="calculadora-cartao-entrada__texto">
                      {unicaCalculadora && <span className="olho">Calculadora disponível</span>}
                      {/* O título do bloco já diz o grupo — repetir em cada
                          cartão só empurraria o nome da ferramenta para baixo. */}
                      <h3>{calculadora.nomeCurto}</h3>
                      <p>{calculadora.resumo}</p>
                      {unicaCalculadora && <div className="calculadora-cartao-entrada__beneficios" aria-label="Recursos da calculadora">
                        <span>Resultado imediato</span><span>Memória por parcela</span><span>Relatório em PDF</span>
                      </div>}
                    </div>
                    <span className="cartao__link calculadora-cartao-entrada__acao">
                      {unicaCalculadora && <small>Não precisa criar conta</small>}
                      <strong>{unicaCalculadora ? 'Começar o cálculo agora' : 'Abrir calculadora'} <IconeSeta tamanho={15} /></strong>
                    </span>
                  </Link>
                </Revelar>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="secao secao--fina">
        <div className="envolucro">
          <span className="olho">Outras áreas</span>
          <div className="calculadora-relacionadas">
            {outras.map((item) => (
              <Link key={item.slug} para={caminhoDaCategoria(item)}>
                Calculadoras de {item.nome.toLowerCase()} <IconeSeta tamanho={14} />
              </Link>
            ))}
            <Link para="/calculadoras/">Todas as calculadoras <IconeSeta tamanho={14} /></Link>
            <Link para={categoria.areaCaminho}>{categoria.areaNome} <IconeSeta tamanho={14} /></Link>
          </div>
        </div>
      </section>

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
        texto="Use as calculadoras para organizar o cenário e, quando precisar, solicite a conferência dos documentos e das particularidades do caso."
        botao="Ver formas de atendimento"
        destino="/contato-advogado-cuiaba/"
      />
    </>
  );
}
