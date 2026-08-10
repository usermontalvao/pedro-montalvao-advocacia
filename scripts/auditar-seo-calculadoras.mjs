import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import calculadoras from '../src/content/calculadoras.json' with { type: 'json' };

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

igual((sitemap.match(/<url>/g) ?? []).length, calculadoras.length + 15, 'O sitemap deve conter todas as rotas públicas.');
igual((hub.match(/href="\/calculadoras\/calculadora-[^"]+\//g) ?? []).length, calculadoras.length, 'O hub deve ligar todas as calculadoras.');
ok(!hub.includes('Próximas ferramentas'), 'O hub não pode anunciar como futuras ferramentas já publicadas.');

for (const calculadora of calculadoras) {
  const caminho = `/calculadoras/${calculadora.slug}/`;
  const html = ler(`dist${caminho}index.html`);
  const titulo = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const descricao = html.match(/<meta name="description" content="([^"]+)"/i)?.[1];
  titulos.push(titulo);
  descricoes.push(descricao);

  ok(Boolean(titulo?.toLowerCase().includes(calculadora.nomeCurto.split(' ')[0].toLowerCase())), `${calculadora.slug}: title não corresponde à ferramenta.`);
  ok((descricao?.length ?? 0) >= 75, `${calculadora.slug}: meta description muito curta.`);
  ok(html.includes(`<link rel="canonical" href="https://advcuiaba.com${caminho}"`), `${calculadora.slug}: canonical ausente ou incorreto.`);
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
  ok(sitemap.includes(`<loc>https://advcuiaba.com${caminho}</loc>`), `${calculadora.slug}: rota ausente no sitemap.`);
  ok(mapa.includes(`href="${caminho}"`), `${calculadora.slug}: rota ausente no mapa humano.`);
}

igual(new Set(titulos).size, calculadoras.length, 'Os titles das calculadoras precisam ser únicos.');
igual(new Set(descricoes).size, calculadoras.length, 'As meta descriptions das calculadoras precisam ser únicas.');

console.log(`Auditoria SEO concluída: ${calculadoras.length} páginas e ${verificacoes} verificações aprovadas.`);
