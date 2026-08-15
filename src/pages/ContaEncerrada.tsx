import { useEffect, useRef } from 'react';
import { TriagemContaEncerrada } from '../components/TriagemContaEncerrada';
import { META_PIXEL_ID, evento, iniciarPixel, pixelConfigurado } from '../lib/pixelMeta';
import { oabFormatada } from '../site.config';
import { Marca } from '../components/Marca';

/**
 * Landing da campanha "conta bancária bloqueada ou encerrada".
 *
 * Uma tela e nada mais. Sem cabeçalho do site, sem menu, sem seção de
 * convencimento abaixo: quem chega aqui veio de um anúncio que já explicou o
 * assunto, e qualquer outra coisa na tela é um caminho para não responder.
 *
 * A identificação do escritório e o aviso de que ali não há promessa de
 * resultado — o que a publicidade da advocacia exige — ficam na moldura, sem
 * disputar espaço com a pergunta.
 */
export function ContaEncerrada() {
  const rastreamentoIniciado = useRef(false);

  useEffect(() => {
    // O StrictMode repete efeitos no desenvolvimento. O ref impede que o
    // Gerenciador de Eventos receba PageView/ViewContent duplicados no teste.
    if (rastreamentoIniciado.current) return;
    rastreamentoIniciado.current = true;

    iniciarPixel();
    evento('ViewContent', { content_name: 'Landing conta bloqueada ou encerrada' });
  }, []);

  return (
    <div className="campanha">
      <div className="campanha__luz" aria-hidden />

      <header className="campanha__topo">
        <Marca tom="claro" altura={30} compacta tipografiaEditorial />
        <span className="campanha__oab">{oabFormatada()}</span>
      </header>

      {pixelConfigurado() ? (
        <noscript>
          <img
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            width="1"
            height="1"
            alt=""
            style={{ display: 'none' }}
          />
        </noscript>
      ) : null}

      {/*
        O <h1> da página é o título da tela de abertura, dentro da triagem — é
        ele que sai no HTML do build e é ele que o rastreador lê.
      */}
      <TriagemContaEncerrada />
    </div>
  );
}
