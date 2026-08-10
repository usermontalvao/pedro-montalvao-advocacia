import { useState } from 'react';
import { IconeMais } from './Icones';

export type Pergunta = { pergunta: string; resposta: string };

/**
 * Sanfona de perguntas.
 *
 * As respostas ficam SEMPRE no HTML, mesmo fechadas — quem esconde texto do
 * rastreador perde o trecho destacado da busca, que é exatamente o que traz
 * visitante para uma página de dúvida jurídica. O fechamento é visual, feito
 * com altura em grid, não com remoção do conteúdo.
 */
export function Faq({ perguntas, idPrefixo = 'faq' }: { perguntas: Pergunta[]; idPrefixo?: string }) {
  const [aberta, setAberta] = useState<number | null>(0);

  return (
    <div className="faq">
      {perguntas.map((item, indice) => {
        const estaAberta = aberta === indice;
        const idResposta = `${idPrefixo}-${indice}`;

        return (
          <div className="faq__item" key={item.pergunta}>
            <h3 style={{ margin: 0 }}>
              <button
                type="button"
                className="faq__pergunta"
                aria-expanded={estaAberta}
                aria-controls={idResposta}
                onClick={() => setAberta(estaAberta ? null : indice)}
              >
                {item.pergunta}
                <span className="faq__sinal" aria-hidden>
                  <IconeMais />
                </span>
              </button>
            </h3>
            <div className="faq__resposta" id={idResposta} data-aberta={estaAberta}>
              <div>
                <p>{item.resposta}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
