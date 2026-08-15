import { Cabecalho } from './components/Cabecalho';
import { Rodape } from './components/Rodape';
import { ProgressoPagina, TransicaoPagina, useRolagemSuave } from './components/movimento';
import { Roteador, RolarAoTrocarDePagina, useRota } from './lib/router';
import { acharRota } from './rotas';
import { NaoEncontrada } from './pages/Juridico';

function Conteudo() {
  useRolagemSuave();
  const { caminho } = useRota();
  const rota = acharRota(caminho);

  /*
    Landing de anúncio entra sozinha, sem a moldura do site.

    Ela traz o próprio cabeçalho e o próprio rodapé, enxutos: quem chegou por um
    clique pago não deve encontrar um menu com dez caminhos para sair antes de
    responder a primeira pergunta.
  */
  if (rota?.semLayout) {
    return (
      <>
        <RolarAoTrocarDePagina caminho={caminho} />
        <main id="conteudo">{rota.elemento}</main>
      </>
    );
  }

  return (
    <>
      <RolarAoTrocarDePagina caminho={caminho} />
      <ProgressoPagina />
      <Cabecalho />
      <main id="conteudo">
        <TransicaoPagina chave={caminho}>
          {rota ? rota.elemento : <NaoEncontrada />}
        </TransicaoPagina>
      </main>
      <Rodape />
    </>
  );
}

export function App({ caminho }: { caminho: string }) {
  return (
    <Roteador caminhoInicial={caminho}>
      <Conteudo />
    </Roteador>
  );
}
