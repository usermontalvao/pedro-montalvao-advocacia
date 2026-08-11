import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import calculadoras from '../src/content/calculadoras.json' with { type: 'json' };
import categorias from '../src/content/categoriasCalculadoras.json' with { type: 'json' };
import { lerEnderecoBase } from './sitemap.mjs';

// O domínio sai do site.config.ts, igual ao build. Escrito na mão aqui, a
// auditoria passava a cobrar um endereço que o site já não usa mais.
const enderecoBase = await lerEnderecoBase(process.cwd());

let verificacoes = 0;
const ok = (condicao, mensagem) => {
  assert.ok(condicao, mensagem);
  verificacoes += 1;
};
const igual = (recebido, esperado, mensagem) => {
  assert.equal(recebido, esperado, mensagem);
  verificacoes += 1;
};

const ler = (caminho) => readFileSync(caminho, 'utf8');
const hub = ler('dist/calculadoras/index.html');
const sitemap = ler('dist/sitemap.xml');
const mapa = ler('dist/mapa-do-site/index.html');
const titulos = [];
const descricoes = [];

/*
  As calculadoras vivem separadas por área: o hub escolhe a área e a página da
  área lista as ferramentas. Só entra no site a categoria que já tem ferramenta
  publicada — uma página de área vazia seria conteúdo raso.
*/
const publicadas = categorias.filter((categoria) =>
  calculadoras.some((calculadora) => calculadora.categoria === categoria.categoria),
);
const emPreparo = categorias.filter((categoria) => !publicadas.includes(categoria));

igual(
  (sitemap.match(/<url>/g) ?? []).length,
  calculadoras.length + publicadas.length + 15,
  'O sitemap deve conter todas as rotas públicas.',
);
ok(!hub.includes('Próximas ferramentas'), 'O hub não pode anunciar como futuras ferramentas já publicadas.');

for (const categoria of publicadas) {
  const caminho = `/calculadoras/${categoria.slug}/`;
  const html = ler(`dist${caminho}index.html`);
  const daCategoria = calculadoras.filter((item) => item.categoria === categoria.categoria);
  const titulo = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const descricao = html.match(/<meta name="description" content="([^"]+)"/i)?.[1];
  titulos.push(titulo);
  descricoes.push(descricao);

  ok(hub.includes(`href="${caminho}"`), `${categoria.slug}: o hub não liga para a página da área.`);
  ok(html.includes(`<link rel="canonical" href="${enderecoBase}${caminho}"`), `${categoria.slug}: canonical ausente ou incorreto.`);
  ok(html.includes(`<h1>${categoria.titulo}</h1>`), `${categoria.slug}: H1 próprio da área ausente.`);
  ok((descricao?.length ?? 0) >= 75, `${categoria.slug}: meta description muito curta.`);
  ok(html.includes('"@type":"CollectionPage"'), `${categoria.slug}: CollectionPage ausente.`);
  ok(html.includes('"@type":"BreadcrumbList"'), `${categoria.slug}: trilha de navegação ausente.`);
  for (const calculadora of daCategoria) {
    ok(
      html.includes(`href="/calculadoras/${calculadora.slug}/"`),
      `${categoria.slug}: a área não lista ${calculadora.slug}.`,
    );
  }
  ok(sitemap.includes(`<loc>${enderecoBase}${caminho}</loc>`), `${categoria.slug}: rota ausente no sitemap.`);
  ok(mapa.includes(`href="${caminho}"`), `${categoria.slug}: rota ausente no mapa humano.`);
}

for (const categoria of emPreparo) {
  const caminho = `/calculadoras/${categoria.slug}/`;
  ok(!sitemap.includes(`<loc>${enderecoBase}${caminho}</loc>`), `${categoria.slug}: área sem ferramenta não pode virar página.`);
  ok(!hub.includes(`href="${caminho}"`), `${categoria.slug}: o hub não pode ligar para uma área vazia.`);
}

for (const calculadora of calculadoras) {
  const caminho = `/calculadoras/${calculadora.slug}/`;
  const html = ler(`dist${caminho}index.html`);
  const categoria = publicadas.find((item) => item.categoria === calculadora.categoria);
  const titulo = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const descricao = html.match(/<meta name="description" content="([^"]+)"/i)?.[1];
  titulos.push(titulo);
  descricoes.push(descricao);

  ok(Boolean(titulo?.toLowerCase().includes(calculadora.nomeCurto.split(' ')[0].toLowerCase())), `${calculadora.slug}: title não corresponde à ferramenta.`);
  ok((descricao?.length ?? 0) >= 75, `${calculadora.slug}: meta description muito curta.`);
  ok(html.includes(`<link rel="canonical" href="${enderecoBase}${caminho}"`), `${calculadora.slug}: canonical ausente ou incorreto.`);
  ok(html.includes('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1"'), `${calculadora.slug}: diretiva explícita de indexação ausente.`);
  ok(!html.includes('content="noindex'), `${calculadora.slug}: página marcada indevidamente como noindex.`);
  ok(html.includes(`<h1>${calculadora.titulo}</h1>`), `${calculadora.slug}: H1 único da ferramenta ausente.`);
  ok(html.includes('"@type":"WebApplication"'), `${calculadora.slug}: WebApplication ausente.`);
  ok(html.includes('"@type":"FAQPage"'), `${calculadora.slug}: FAQPage ausente.`);
  ok(html.includes('href="/contato-advogado-cuiaba/"'), `${calculadora.slug}: CTA para atendimento ausente.`);
  ok(html.includes('botao botao--zap'), `${calculadora.slug}: CTA do WhatsApp sem aparência própria.`);
  ok(!/class="botao botao--dourado"[^>]+href="https:\/\/wa\.me\//.test(html), `${calculadora.slug}: CTA do WhatsApp ainda usa aparência dourada.`);
  ok((html.match(/href="\/calculadoras\/calculadora-[^"]+\//g) ?? []).length >= 4, `${calculadora.slug}: links internos entre calculadoras insuficientes.`);
  ok(!html.includes('class="calculadora-alerta"'), `${calculadora.slug}: aviso não deve ocupar espaço antes de existir resultado.`);
  if (calculadora.motor !== 'rescisao') {
    ok((html.match(/calculadora-pagina__largura/g) ?? []).length >= 4, `${calculadora.slug}: blocos principais sem o alinhamento compartilhado.`);
  }
  ok(html.includes(calculadora.fonteUrl.replaceAll('&', '&amp;')) || html.includes(calculadora.fonteUrl), `${calculadora.slug}: fonte oficial ausente.`);
  if (calculadora.motor === 'pensao_alimenticia') {
    ok(html.includes('/midia/logo-horizontal.png'), 'Pensão alimentícia: logo ausente do relatório imprimível.');
  }
  ok(Boolean(categoria), `${calculadora.slug}: categoria sem página correspondente.`);
  // Subir um degrau precisa ser possível a partir da própria ferramenta.
  ok(
    html.includes(`href="/calculadoras/${categoria.slug}/"`),
    `${calculadora.slug}: falta o caminho de volta para a área.`,
  );
  ok(sitemap.includes(`<loc>${enderecoBase}${caminho}</loc>`), `${calculadora.slug}: rota ausente no sitemap.`);
  ok(mapa.includes(`href="${caminho}"`), `${calculadora.slug}: rota ausente no mapa humano.`);
}

const paginas = calculadoras.length + publicadas.length;
igual(new Set(titulos).size, paginas, 'Os titles das calculadoras e das áreas precisam ser únicos.');
igual(new Set(descricoes).size, paginas, 'As meta descriptions das calculadoras e das áreas precisam ser únicas.');

console.log(`Auditoria SEO concluída: ${paginas} páginas e ${verificacoes} verificações aprovadas.`);
