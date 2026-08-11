import calculadoras from '../src/content/calculadoras.json' with { type: 'json' };
import categorias from '../src/content/categoriasCalculadoras.json' with { type: 'json' };
import { lerEnderecoBase } from './sitemap.mjs';

const raiz = process.cwd();
const enderecoBase = await lerEnderecoBase(raiz);
const categoriasPublicadas = categorias.filter((categoria) =>
  calculadoras.some((calculadora) => calculadora.categoria === categoria.categoria),
);
const caminhos = [
  '/calculadoras/',
  ...categoriasPublicadas.map((categoria) => `/calculadoras/${categoria.slug}/`),
  ...calculadoras.map((calculadora) => `/calculadoras/${calculadora.slug}/`),
];

const [robotsResposta, sitemapResposta] = await Promise.all([
  fetch(`${enderecoBase}/robots.txt`, { cache: 'no-store' }),
  fetch(`${enderecoBase}/sitemap.xml`, { cache: 'no-store' }),
]);
const robots = await robotsResposta.text();
const sitemap = await sitemapResposta.text();
const falhas = [];

if (!robotsResposta.ok || !robots.includes(`Sitemap: ${enderecoBase}/sitemap.xml`)) {
  falhas.push('robots.txt indisponível ou sem o endereço correto do sitemap.');
}
if (!sitemapResposta.ok) falhas.push('sitemap.xml não respondeu com sucesso.');

const resultados = await Promise.all(caminhos.map(async (caminho) => {
  const url = `${enderecoBase}${caminho}`;
  try {
    const resposta = await fetch(url, { cache: 'no-store', redirect: 'manual' });
    const html = await resposta.text();
    return { caminho, url, status: resposta.status, html };
  } catch (erro) {
    return { caminho, url, status: 0, html: '', erro: erro instanceof Error ? erro.message : String(erro) };
  }
}));

for (const resultado of resultados) {
  const { caminho, url, status, html } = resultado;
  if (status !== 200) falhas.push(`${caminho} respondeu HTTP ${status || 'sem resposta'}.`);
  if (!html.includes(`<link rel="canonical" href="${url}"`)) falhas.push(`${caminho} sem canonical próprio.`);
  if (!html.includes('name="robots" content="index, follow')) falhas.push(`${caminho} sem index, follow.`);
  if (!html.includes('<main')) falhas.push(`${caminho} sem conteúdo HTML pré-renderizado.`);
  if (!sitemap.includes(`<loc>${url}</loc>`)) falhas.push(`${caminho} ausente do sitemap público.`);
}

if (falhas.length) {
  console.error(`Publicação reprovada: ${falhas.length} problema(s).`);
  for (const falha of falhas) console.error(`- ${falha}`);
  process.exit(1);
}

console.log(`Publicação aprovada: ${caminhos.length} páginas de calculadoras indexáveis em ${enderecoBase}.`);
