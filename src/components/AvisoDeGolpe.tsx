import { useCallback, useEffect, useRef, useState } from 'react';
import { IconeAlerta, IconeSeta } from './Icones';
import { Link } from '../lib/router';

/**
 * Aviso de golpe na primeira visita à home.
 *
 * O escritório tem uma página inteira sobre o golpe, e ela só serve para quem
 * já desconfia e foi procurar. O aviso existe para o caso contrário: a pessoa
 * que ainda não recebeu a mensagem falsa e que, quando receber, vai lembrar de
 * ter lido isto aqui. É o único momento em que o site interrompe alguém.
 *
 * Três decisões que o tornam suportável:
 *
 * - **Só na home.** Quem chegou por busca em um artigo ou numa calculadora
 *   veio atrás de outra coisa; interromper essa pessoa é custo sem retorno.
 * - **Volta a cada sete dias**, e não uma vez para sempre: o aviso é sobre uma
 *   fraude ativa, e quem fechou sem ler em uma visita rápida merece uma segunda
 *   chance — sem virar a janela que aparece toda vez e ensina a fechar no
 *   automático.
 * - **Fecha por qualquer caminho** (botão, Esc, clique fora) e todos eles
 *   valem os mesmos sete dias. Aviso que prende a pessoa não protege ninguém.
 *
 * Nasce fechado e só decide aparecer no navegador — nunca no HTML
 * pré-renderizado, que é o mesmo arquivo para todo mundo.
 */

const CHAVE = 'pma:aviso-golpe';
const DIAS = 7;
const PRAZO = DIAS * 24 * 60 * 60 * 1000;

/** Tempo até aparecer: o suficiente para a home pintar e a pessoa se situar. */
const ESPERA = 1400;

function jaViuHaPouco(): boolean {
  try {
    const marca = window.localStorage.getItem(CHAVE);
    if (!marca) return false;
    const quando = Number(marca);
    if (!Number.isFinite(quando)) return false;
    return Date.now() - quando < PRAZO;
  } catch {
    /* Navegador com armazenamento bloqueado: mostra o aviso e não insiste. */
    return false;
  }
}

function anotarQueViu() {
  try {
    window.localStorage.setItem(CHAVE, String(Date.now()));
  } catch {
    /* Sem armazenamento, o aviso volta na próxima visita. Não é erro. */
  }
}

export function AvisoDeGolpe() {
  const [aberto, setAberto] = useState(false);
  const fechar$ = useRef<HTMLButtonElement | null>(null);

  const fechar = useCallback(() => {
    anotarQueViu();
    setAberto(false);
  }, []);

  useEffect(() => {
    if (jaViuHaPouco()) return;
    const relogio = window.setTimeout(() => setAberto(true), ESPERA);
    return () => window.clearTimeout(relogio);
  }, []);

  useEffect(() => {
    if (!aberto) return;

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') fechar();
    };

    /*
      A rolagem do fundo trava enquanto o aviso está aberto; sem isso o toque
      no celular arrasta a home por baixo da janela e a pessoa perde o aviso de
      vista sem ter fechado nada.
    */
    const rolagem = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', aoTeclar);
    fechar$.current?.focus();

    return () => {
      document.body.style.overflow = rolagem;
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto, fechar]);

  if (!aberto) return null;

  return (
    <div className="aviso-golpe" role="presentation" onClick={fechar}>
      <div
        className="aviso-golpe__janela"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aviso-golpe-titulo"
        aria-describedby="aviso-golpe-texto"
        onClick={(evento) => evento.stopPropagation()}
      >
        <button
          className="aviso-golpe__x"
          type="button"
          onClick={fechar}
          ref={fechar$}
          aria-label="Fechar o aviso"
        >
          <span aria-hidden>×</span>
        </button>

        <div className="aviso-golpe__corpo">
          <span className="aviso-golpe__selo">
            <IconeAlerta tamanho={16} />
            Aviso sobre falsos contatos
          </span>

          <h2 id="aviso-golpe-titulo">Golpistas estão se passando pelo escritório.</h2>

          <p id="aviso-golpe-texto">
            Se receber uma mensagem sobre valor liberado ou cobrança por Pix, não pague e não envie
            dados.
          </p>

          <p className="aviso-golpe__regra">
            <strong>Antes de responder, confira o contato nesta página.</strong>
          </p>

          <div className="aviso-golpe__acoes">
            <Link className="botao botao--escuro" para="/alerta-de-golpe/" onClick={fechar}>
              Como identificar o golpe
              <IconeSeta />
            </Link>
            <button className="aviso-golpe__depois" type="button" onClick={fechar}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
