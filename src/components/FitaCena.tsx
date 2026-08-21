/**
 * A fita de isolamento amarela que atravessa o alto da página.
 *
 * Não é enfeite: é a única coisa da página que se entende antes de ler. Quem
 * chega aqui com a mensagem do golpista aberta na outra mão reconhece a fita de
 * cena de crime em um décimo de segundo — e essa leitura instantânea é o que
 * segura a pessoa por tempo suficiente para ler a primeira linha.
 *
 * O texto é repetido como na fita de verdade, que não tem começo nem fim
 * visível, e a inclinação é de pouco mais de um grau: o bastante para parecer
 * esticada de ponta a ponta, longe o suficiente do adesivo torto de banner.
 * Nada se move — fita animada viraria pisca-pisca de anúncio e derrubaria a
 * seriedade que o resto da página constrói.
 */

/** Repetido até cobrir telas largas; a fita não pode ter fim visível. */
const REPETICOES = 8;

export function FitaCena({
  texto = 'Alerta de golpe',
  reforco = 'Confira antes de pagar',
}: {
  texto?: string;
  reforco?: string;
}) {
  return (
    <div className="fita-cena" aria-hidden>
      <div className="fita-cena__corrida">
        {Array.from({ length: REPETICOES }, (_, indice) => (
          <span className="fita-cena__item" key={indice}>
            {texto}
            <i />
            {reforco}
            <i />
          </span>
        ))}
      </div>
    </div>
  );
}
