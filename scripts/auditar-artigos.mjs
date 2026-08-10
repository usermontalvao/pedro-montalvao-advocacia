import { readFileSync } from 'node:fs';

const raiz = new URL('../', import.meta.url);
const artigos = JSON.parse(readFileSync(new URL('src/content/artigos.json', raiz), 'utf8'));
const areas = JSON.parse(readFileSync(new URL('src/content/areas.json', raiz), 'utf8'));
const paginaArtigos = readFileSync(new URL('src/pages/Artigos.tsx', raiz), 'utf8');
const acoesFlutuantes = readFileSync(
  new URL('src/components/AcoesFlutuantes.tsx', raiz),
  'utf8',
);

let verificacoes = 0;
const erros = [];

function verificar(condicao, mensagem) {
  verificacoes += 1;
  if (!condicao) erros.push(mensagem);
}

function textoValido(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function textosDoBloco(bloco) {
  return [
    bloco.texto,
    bloco.titulo,
    bloco.botao,
    bloco.mensagem,
    bloco.fonte,
    ...(Array.isArray(bloco.itens)
      ? bloco.itens.flatMap((item) =>
          typeof item === 'string' ? [item] : [item.pergunta, item.resposta],
        )
      : []),
  ].filter(textoValido);
}

verificar(Array.isArray(artigos) && artigos.length > 0, 'artigos.json deve conter artigos');

const slugs = new Set();
const areasPorSlug = new Map(areas.map((area) => [area.slug, area]));
const proibidos = [/localhost/i, /pré-triagem/i, /pre-triagem/i, /deepseek/i, /chatbot/i, /\/api\/pre-triagem/i];

for (const [indice, artigo] of artigos.entries()) {
  const ref = `artigo ${indice + 1} (${artigo.slug || 'sem slug'})`;

  verificar(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(artigo.slug || ''), `${ref}: slug inválido`);
  verificar(!slugs.has(artigo.slug), `${ref}: slug duplicado`);
  slugs.add(artigo.slug);

  for (const campo of ['titulo', 'seoTitle', 'seoDescription', 'resumo', 'categoria', 'area', 'palavraChave']) {
    verificar(textoValido(artigo[campo]), `${ref}: campo ${campo} é obrigatório`);
  }

  verificar(artigo.seoTitle.length >= 35 && artigo.seoTitle.length <= 65, `${ref}: seoTitle deve ter de 35 a 65 caracteres`);
  verificar(artigo.seoDescription.length >= 120 && artigo.seoDescription.length <= 170, `${ref}: seoDescription deve ter de 120 a 170 caracteres`);
  verificar(artigo.resumo.length >= 100, `${ref}: resumo deve ter ao menos 100 caracteres`);

  const area = areasPorSlug.get(artigo.area);
  verificar(Boolean(area), `${ref}: área inexistente em areas.json`);
  verificar(!area || artigo.categoria === area.nome, `${ref}: categoria deve ser igual ao nome da área`);

  verificar(/^\d{4}-\d{2}-\d{2}$/.test(artigo.publicadoEm || ''), `${ref}: publicadoEm deve usar AAAA-MM-DD`);
  verificar(/^\d{4}-\d{2}-\d{2}$/.test(artigo.atualizadoEm || ''), `${ref}: atualizadoEm deve usar AAAA-MM-DD`);
  verificar(artigo.atualizadoEm >= artigo.publicadoEm, `${ref}: atualizadoEm não pode ser anterior a publicadoEm`);
  verificar(Number.isInteger(artigo.tempoLeitura) && artigo.tempoLeitura >= 1 && artigo.tempoLeitura <= 60, `${ref}: tempoLeitura inválido`);
  verificar(typeof artigo.destaque === 'boolean', `${ref}: destaque deve ser booleano`);

  verificar(Array.isArray(artigo.blocos) && artigo.blocos.length >= 8, `${ref}: são necessários ao menos 8 blocos`);
  if (!Array.isArray(artigo.blocos)) continue;

  verificar(artigo.blocos[0]?.t === 'p', `${ref}: o primeiro bloco deve ser um parágrafo`);
  const h2 = artigo.blocos.filter((bloco) => bloco.t === 'h2');
  const ids = new Set();
  verificar(h2.length >= 3, `${ref}: use ao menos 3 seções h2`);
  for (const titulo of h2) {
    verificar(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(titulo.id || ''), `${ref}: h2 “${titulo.texto}” precisa de id válido`);
    verificar(!ids.has(titulo.id), `${ref}: id de h2 duplicado: ${titulo.id}`);
    ids.add(titulo.id);
  }

  const ctas = artigo.blocos.filter((bloco) => bloco.t === 'cta');
  verificar(ctas.length >= 1, `${ref}: inclua um CTA direto para WhatsApp depois do conteúdo`);
  for (const cta of ctas) {
    verificar(/whatsapp/i.test(cta.botao || ''), `${ref}: o botão do CTA deve identificar o WhatsApp`);
    verificar(textoValido(cta.mensagem), `${ref}: o CTA precisa de mensagem contextual para WhatsApp`);
  }

  const faqs = artigo.blocos.filter((bloco) => bloco.t === 'faq');
  verificar(faqs.length >= 1, `${ref}: inclua FAQ relacionado ao tema`);

  for (const [blocoIndice, bloco] of artigo.blocos.entries()) {
    verificar(['p', 'h2', 'h3', 'ul', 'ol', 'destaque', 'lei', 'faq', 'cta'].includes(bloco.t), `${ref}: tipo de bloco inválido na posição ${blocoIndice + 1}`);
    for (const texto of textosDoBloco(bloco)) {
      verificar(!/<\/?[a-z][^>]*>/i.test(texto), `${ref}: HTML bruto não é permitido no bloco ${blocoIndice + 1}`);
      for (const proibido of proibidos) {
        verificar(!proibido.test(texto), `${ref}: referência proibida no bloco ${blocoIndice + 1}: ${proibido}`);
      }
    }
  }
}

verificar(paginaArtigos.includes('<AcoesFlutuantes'), 'PaginaArtigo deve manter AcoesFlutuantes');
verificar(paginaArtigos.includes('primeiraChamada?.mensagem'), 'o botão flutuante deve receber a mensagem do primeiro CTA');
verificar(acoesFlutuantes.includes('linkWhatsApp(mensagem)'), 'AcoesFlutuantes deve abrir linkWhatsApp diretamente');
verificar(!/<form\b/i.test(acoesFlutuantes), 'AcoesFlutuantes não pode conter formulário');
verificar(!/preTriagem|chatbot|deepseek|\/api\/pre-triagem/i.test(acoesFlutuantes), 'AcoesFlutuantes não pode conter pré-triagem ou chatbot');

if (erros.length > 0) {
  console.error(`Auditoria de artigos falhou com ${erros.length} erro(s):`);
  for (const erro of erros) console.error(`- ${erro}`);
  process.exit(1);
}

console.log(`Artigos aprovados: ${artigos.length} artigo(s), ${verificacoes} verificações.`);

