import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import artigos from '../src/content/artigos.json' with { type: 'json' };

let verificacoes = 0;
const ok = (condicao, mensagem) => {
  assert.ok(condicao, mensagem);
  verificacoes += 1;
};

const ler = (caminho) => readFileSync(caminho, 'utf8');
const componente = ler('src/components/PreTriagemFlutuante.tsx');
const pagina = ler('src/pages/Artigos.tsx');
const endpoint = ler('public/api/pre-triagem.php');
const privacidade = ler('src/content/juridico.json');

ok(pagina.includes('<PreTriagemFlutuante'), 'O widget precisa estar nas páginas de artigo.');
ok(componente.includes('/api/pre-triagem.php'), 'O widget precisa chamar o endpoint protegido.');
ok(componente.includes('nome e telefone não são enviados'), 'O fluxo precisa informar a separação dos dados de contato.');
ok(componente.includes('Política de Privacidade'), 'O consentimento precisa ligar para a Política de Privacidade.');
ok(componente.includes("useState<Etapa>('identificacao')"), 'O fluxo deve abrir diretamente na identificação.');
ok(!componente.includes('Pré-triagem online'), 'O antigo cartão inicial precisa ser removido.');
ok(!componente.includes('Vamos entender o ponto principal?'), 'A antiga chamada inicial precisa ser removida.');
ok(!componente.includes('Leva poucos minutos.'), 'A antiga explicação inicial precisa ser removida.');
ok(componente.includes("setEtapa('consentimento')"), 'O consentimento deve aparecer depois das alternativas fixas.');
ok(componente.includes('Demissão ou verbas rescisórias'), 'Alternativas trabalhistas fixas ausentes.');
ok(componente.includes('Benefício negado'), 'Alternativas previdenciárias fixas ausentes.');
ok(componente.includes('Cobrança ou negativação'), 'Alternativas de consumidor fixas ausentes.');
ok(componente.includes('Divórcio ou união estável'), 'Alternativas de família fixas ausentes.');
ok(componente.includes('Etapa {indiceFixo + 1}'), 'A qualificação precisa mostrar progresso.');
ok(componente.includes('alternativasIA.map'), 'As alternativas produzidas pela IA precisam ser exibidas como botões.');
ok(componente.includes('Minha resposta é diferente'), 'O visitante precisa poder escrever uma resposta própria.');
ok(componente.includes('RADAR PARA CONFERÊNCIA HUMANA'), 'O WhatsApp precisa levar o radar organizado.');
ok(componente.includes('TERMOS SUGERIDOS PARA PESQUISA JURISPRUDENCIAL'), 'O WhatsApp precisa levar termos de pesquisa.');
ok(componente.includes('https://www.tst.jus.br/jurisprudencia'), 'A pesquisa trabalhista precisa apontar para o TST.');
ok(componente.includes('https://processo.stj.jus.br/SCON/jurisprudencia'), 'A pesquisa das demais áreas precisa apontar para o STJ.');
ok(componente.includes('https://jurisprudencia.stf.jus.br/'), 'A pesquisa constitucional precisa apontar para o STF.');
ok(componente.includes('mensagemDoLead') === false, 'O widget não deve montar uma segunda mensagem genérica sobre o resumo.');
ok(componente.includes('registrar({'), 'O contato precisa ser preservado localmente antes do WhatsApp.');
ok(componente.includes('pre-triagem-whatsapp'), 'O CTA final do WhatsApp precisa ser rastreável.');
ok(!componente.includes('DEEPSEEK_API_KEY'), 'A chave do DeepSeek não pode aparecer no código do navegador.');

ok(endpoint.includes("getenv('DEEPSEEK_API_KEY')"), 'A chave precisa vir do ambiente do servidor.');
ok(endpoint.includes('https://api.deepseek.com/chat/completions'), 'Endpoint oficial do DeepSeek ausente.');
ok(endpoint.includes("'model' => 'deepseek-v4-flash'"), 'Modelo atual do DeepSeek não configurado.');
ok(endpoint.includes("'response_format' => ['type' => 'json_object']"), 'A resposta da IA precisa usar JSON estruturado.');
ok(endpoint.includes('NÃO presta consulta'), 'O prompt precisa impedir aconselhamento jurídico automatizado.');
ok(endpoint.includes('NÃO tem acesso à internet'), 'O prompt precisa reconhecer que não faz pesquisa online.');
ok(endpoint.includes('Jamais invente número de processo'), 'O prompt precisa impedir precedentes inventados.');
ok(endpoint.includes('"alternativas"'), 'A IA precisa devolver alternativas estruturadas.');
ok(endpoint.includes("'termosPesquisa'"), 'O endpoint precisa higienizar termos de pesquisa.');
ok(endpoint.includes("'pontosAtencao'"), 'O endpoint precisa higienizar pontos de atenção.');
ok(endpoint.includes('$statusPermitidos'), 'O status do radar precisa usar valores controlados.');
ok(endpoint.includes('count($tentativas) >= 12'), 'O endpoint precisa limitar abuso e custo.');
ok(endpoint.includes("strcasecmp($hostOrigem"), 'O endpoint precisa bloquear origens externas.');
ok(endpoint.includes('CURLOPT_TIMEOUT'), 'A chamada externa precisa ter limite de tempo.');

ok(privacidade.includes('Pré-triagem automatizada'), 'A Política de Privacidade precisa explicar a IA.');
ok(privacidade.includes('não são enviados à inteligência artificial'), 'A política precisa explicar o tratamento de nome e telefone.');
ok(privacidade.includes('processamento internacional'), 'A política precisa informar a possibilidade de processamento internacional.');
ok(privacidade.includes('não constituem consulta'), 'Os Termos precisam limitar o resultado automatizado.');
ok(privacidade.includes('não pesquisa jurisprudência em tempo real'), 'A política precisa explicar o limite da pesquisa automatizada.');
ok(privacidade.includes('pesquisa jurisprudencial concluída'), 'Os termos precisam reservar a pesquisa ao profissional.');

ok(existsSync('dist/api/pre-triagem.php'), 'O build precisa copiar o endpoint para dist/api.');
ok(ler('dist/api/pre-triagem.php').includes('deepseek-v4-flash'), 'O endpoint copiado para produção está incompleto.');

for (const artigo of artigos) {
  const html = ler(`dist/artigos/${artigo.slug}/index.html`);
  ok(html.includes('class="triagem-widget"'), `${artigo.slug}: widget ausente no HTML publicado.`);
  ok(html.includes('Ficou com alguma dúvida?'), `${artigo.slug}: convite da pré-triagem ausente.`);
  ok(html.includes('/midia/retrato-institucional-720.webp'), `${artigo.slug}: retrato do advogado ausente no widget.`);
}

const php = spawnSync('php', ['-l', 'public/api/pre-triagem.php'], { encoding: 'utf8' });
if (!php.error) {
  ok(php.status === 0, `PHP inválido: ${php.stdout}${php.stderr}`);
}

console.log(`Auditoria da pré-triagem concluída: ${artigos.length} artigo(s) e ${verificacoes} verificações aprovadas.`);
