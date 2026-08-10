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
