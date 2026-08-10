import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

const raiz = document.getElementById('raiz');

if (raiz) {
  const caminho = window.location.pathname;
  const aplicacao = (
    <StrictMode>
      <App caminho={caminho} />
    </StrictMode>
  );

  // Em produção o HTML já veio pronto do prerender: hidratamos por cima dele.
  // No `npm run dev` a página chega vazia, então é montagem normal.
  if (raiz.hasChildNodes()) {
    hydrateRoot(raiz, aplicacao);
  } else {
    createRoot(raiz).render(aplicacao);
  }
}
