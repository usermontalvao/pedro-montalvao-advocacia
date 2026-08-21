import { TriagemSemRegistro } from '../components/TriagemSemRegistro';
import { oabFormatada } from '../site.config';
import { Marca } from '../components/Marca';

/**
 * Landing da campanha "trabalhou sem registro em carteira".
 *
 * Uma tela e nada mais. Sem cabeçalho do site, sem menu, sem seção de
 * convencimento abaixo: quem chega aqui veio de um anúncio que já explicou o
 * assunto, e qualquer outra coisa na tela é um caminho para não responder.
 *
 * A identificação do escritório e o aviso de que ali não há promessa de
 * resultado — o que a publicidade da advocacia exige — ficam na moldura, sem
 * disputar espaço com a pergunta.
 *
 * A moldura é a mesma de `/conta-encerrada/` (`.campanha`), de propósito: são
 * duas campanhas do mesmo escritório e a pessoa que já viu uma reconhece a
 * outra. O que muda entre elas é o roteiro, não a casca.
 */
export function SemRegistro() {
  return (
    <div className="campanha">
      <div className="campanha__luz" aria-hidden />

      <header className="campanha__topo">
        <Marca tom="claro" altura={30} compacta tipografiaEditorial />
        <span className="campanha__oab">{oabFormatada()}</span>
      </header>

      {/*
        O <h1> da página é o título da tela de abertura, dentro da triagem — é
        ele que sai no HTML do build e é ele que o rastreador lê.
      */}
      <TriagemSemRegistro />
    </div>
  );
}
