import { Cabecalho } from './components/Cabecalho';
import { Rodape } from './components/Rodape';
import { AcoesFlutuantes } from './components/AcoesFlutuantes';
import { TransicaoPagina, useRolagemSuave } from './components/movimento';
import { Roteador, RolarAoTrocarDePagina, useRota } from './lib/router';
import { acharRota } from './rotas';
import { NaoEncontrada } from './pages/Juridico';

function Conteudo() {
  const { caminho } = useRota();
  const rota = acharRota(caminho);

  useRolagemSuave();

  return (
    <>
      <RolarAoTrocarDePagina caminho={caminho} />
      <Cabecalho />
      <main id="conteudo">
        <TransicaoPagina chave={caminho}>
          {rota ? rota.elemento : <NaoEncontrada />}
        </TransicaoPagina>
      </main>
      <Rodape />
      <AcoesFlutuantes />
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
