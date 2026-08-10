# Manual para criação e publicação de artigos

Este é o padrão obrigatório para qualquer IA ou pessoa que criar, importar ou
alterar artigos e jurisprudência no site Pedro Montalvão Advocacia.

## 1. Regra principal: preservar o conteúdo integral

### Documento usado apenas como inspiração

Quando o pedido disser “com base em”, “inspirado em” ou “use como referência”,
o documento serve somente como base técnica. Não transportar para o artigo nomes,
valores, datas, fatos do processo, pedidos, número dos autos, estratégia ou
trechos da peça. Não revelar que o conteúdo veio de um caso real. Só reproduzir
informações da peça quando houver autorização expressa e específica para isso.

Quando o responsável pelo site enviar ou aprovar um artigo, uma jurisprudência,
uma decisão, uma ementa ou outro texto jurídico:

- publicar o material inteiro;
- não resumir, reescrever, “melhorar”, corrigir ou atualizar silenciosamente;
- não mudar palavras, pontuação, números, citações, ordem, títulos ou parágrafos;
- preservar as quebras relevantes e a sequência recebida;
- não suprimir trechos repetidos, assinaturas, referências ou dados processuais;
- não inserir CTA, link, comentário ou explicação dentro da transcrição original.

Se houver erro aparente, dado pessoal sensível, segredo de justiça, divergência
jurídica ou necessidade de atualização, interrompa a publicação e sinalize o
ponto ao responsável. Só altere o original depois de autorização expressa.

Metadados de SEO, rótulos de navegação, links relacionados e chamadas para o
WhatsApp podem ser criados, mas devem ficar fora do conteúdo original. Se for
necessário acrescentar uma explicação editorial, identifique-a como comentário
separado; jamais a apresente como parte da decisão ou do artigo recebido.

> Regra de conferência: compare o conteúdo publicado com a fonte linha a linha.
> A publicação só está pronta quando não existe nenhuma diferença não autorizada.

### Direitos autorais e fontes externas

Não copie integralmente artigo de terceiro encontrado na internet sem autorização
ou licença que permita a reprodução. Nesses casos, produza texto original e cite
a fonte por link. A preservação integral acima vale para material entregue ou
expressamente autorizado pelo responsável e para documentos oficiais cuja
reprodução seja adequada. Nunca invente uma citação ou decisão.

## 2. Onde o artigo é criado

A fonte única é `src/content/artigos.json`. Cada objeto do array gera
automaticamente:

- a página `/artigos/{slug}/`;
- o cartão na página de artigos;
- metadados de SEO e dados estruturados;
- entrada no sitemap durante o build;
- sumário lateral a partir dos blocos `h2` com `id`;
- botão flutuante e barra móvel que abrem o WhatsApp diretamente.

Não crie uma página React exclusiva para um artigo. Use sempre o sistema de
blocos compartilhado.

## 3. Formato obrigatório dos metadados

```json
{
  "slug": "tema-principal-em-palavras-curtas",
  "titulo": "Título completo e claro do artigo",
  "seoTitle": "Título para o Google com a palavra-chave",
  "seoDescription": "Descrição objetiva do conteúdo e da dúvida respondida, sem promessa de resultado.",
  "resumo": "Resumo editorial exibido na abertura e no cartão da listagem.",
  "categoria": "Direito Trabalhista",
  "area": "advogado-trabalhista-cuiaba",
  "publicadoEm": "2026-08-10",
  "atualizadoEm": "2026-08-10",
  "tempoLeitura": 8,
  "palavraChave": "palavra-chave principal",
  "destaque": false,
  "blocos": []
}
```

Padrões:

- `slug`: minúsculo, sem acento, sem data desnecessária e separado por hífens;
- `seoTitle`: preferencialmente entre 45 e 60 caracteres;
- `seoDescription`: preferencialmente entre 140 e 160 caracteres;
- `categoria`: deve ser o nome da área existente em `src/content/areas.json`;
- `area`: deve ser um `slug` existente em `src/content/areas.json`;
- datas: formato ISO `AAAA-MM-DD`; nunca fingir atualização que não ocorreu;
- `tempoLeitura`: estimativa realista baseada no texto integral;
- `palavraChave`: uma expressão principal, natural e coerente com a intenção de busca;
- `destaque`: usar `true` somente quando o artigo deve ocupar a posição principal.

## 4. Blocos e formatação compartilhada

Os únicos blocos de conteúdo são:

| Tipo | Uso |
|---|---|
| `p` | parágrafo |
| `h2` | seção principal, sempre com `id` único |
| `h3` | subseção |
| `ul` | lista sem ordem |
| `ol` | lista numerada |
| `destaque` | aviso editorial curto |
| `lei` | transcrição literal com a fonte |
| `faq` | perguntas e respostas |
| `cta` | chamada externa ao conteúdo para o WhatsApp |

Dentro dos textos são aceitos `**negrito**` e `[texto do link](/destino/)`.
Não use HTML bruto, estilos inline, emojis decorativos ou um `h1` dentro dos
blocos. O título do artigo já é o único `h1` da página.

Todo `h2` deve ter um `id` curto, descritivo, em minúsculas e separado por
hífens. Exemplo:

```json
{
  "t": "h2",
  "texto": "Como comprovar as horas extras",
  "id": "como-comprovar-horas-extras"
}
```

Para norma ou jurisprudência, copie o texto sem modificação e identifique a
fonte de forma completa:

```json
{
  "t": "lei",
  "texto": "Transcrição literal, integral e sem qualquer adaptação.",
  "fonte": "Tribunal, órgão julgador, processo, relator, data do julgamento e publicação"
}
```

Se a jurisprudência tiver várias páginas ou seções, mantenha a ordem original e
divida somente nas mesmas quebras já existentes na fonte. Não transforme a
ementa em uma paráfrase. Não atribua ao tribunal uma conclusão escrita pela IA.

## 5. Estrutura editorial de um novo texto autoral

Esta estrutura vale para artigo novo escrito para o site. Ela não autoriza
alterar a estrutura de material integral já entregue pelo responsável.

1. Dois ou três parágrafos de abertura com a situação prática e a dúvida central.
2. Seção explicando a regra geral.
3. Base legal ou jurisprudencial conferida em fonte oficial.
4. Seções com hipóteses, diferenças e consequências práticas.
5. Lista de documentos, provas ou próximos passos, quando útil.
6. Limites da análise: deixar claro quando o resultado depende do caso concreto.
7. Perguntas frequentes realmente relacionadas à busca.
8. Síntese final sem promessa de êxito.
9. CTA do WhatsApp depois do conteúdo integral.

Use linguagem clara, precisa e profissional. Evite juridiquês desnecessário,
alarmismo, captação indevida, promessa de resultado, valor garantido e afirmação
absoluta sem base.

## 6. Pesquisa jurídica e jurisprudencial

Antes de escrever conteúdo jurídico novo:

- conferir legislação no portal oficial correspondente;
- conferir jurisprudência no site oficial do tribunal;
- confirmar número do processo, órgão julgador, relator e datas;
- distinguir ementa, voto, decisão monocrática, acórdão e súmula;
- verificar se a norma e o entendimento continuam vigentes na data de publicação;
- registrar a fonte completa no bloco apropriado;
- nunca fabricar número, tese, trecho, precedente ou link.

Uma decisão isolada não deve ser descrita como entendimento pacífico. Quando
houver divergência, ela precisa ser informada com clareza.

## 7. CTA e botão direto para WhatsApp

O padrão do site é **contato direto**, sem etapa intermediária.

```json
{
  "t": "cta",
  "titulo": "Ficou com alguma dúvida?",
  "texto": "Fale agora mesmo com um especialista.",
  "botao": "Falar pelo WhatsApp",
  "mensagem": "Olá. Li o artigo sobre [TEMA] e gostaria de falar com o advogado sobre o meu caso."
}
```

Regras obrigatórias:

- o botão deve parecer e funcionar como botão de WhatsApp;
- o clique deve chamar `linkWhatsApp(...)` e abrir o canal oficial diretamente;
- a mensagem deve identificar o artigo e o tema, sem afirmar viabilidade jurídica;
- não pedir nome, telefone ou documentos antes de abrir o WhatsApp;
- não criar formulário, modal, chatbot, pré-triagem, conversa com IA ou tela de espera;
- não usar DeepSeek nem criar endpoint para intermediar o contato;
- não duplicar `AcoesFlutuantes` dentro do conteúdo: a página já o inclui;
- a primeira mensagem de um bloco `cta` alimenta automaticamente o botão
  flutuante, a barra móvel e a CTA final da página.

Quando o artigo precisa permanecer literalmente intacto, acrescente o bloco CTA
somente depois do último bloco original. Ele é interface do site, não parte do
texto recebido.

## 8. Links internos

Inclua links apenas quando ajudarem o leitor. Prioridades:

- página da área jurídica correspondente;
- calculadora relacionada, quando houver;
- outro artigo que aprofunde uma dúvida citada;
- página de contato somente quando não duplicar o CTA do WhatsApp.

Use caminho interno, por exemplo `[calculadora de horas extras](/calculadoras/calculadora-horas-extras/)`.
Não force repetição de palavra-chave nem crie link sem página existente. O rodapé
do artigo já inclui automaticamente a página da área e os artigos relacionados.

## 9. Modelo completo de blocos

```json
"blocos": [
  {
    "t": "p",
    "texto": "Primeiro parágrafo do conteúdo, preservado exatamente como aprovado."
  },
  {
    "t": "h2",
    "texto": "A regra aplicável",
    "id": "regra-aplicavel"
  },
  {
    "t": "p",
    "texto": "Desenvolvimento do tema."
  },
  {
    "t": "lei",
    "texto": "Transcrição literal da fonte.",
    "fonte": "Identificação oficial completa"
  },
  {
    "t": "h2",
    "texto": "Perguntas frequentes",
    "id": "perguntas-frequentes"
  },
  {
    "t": "faq",
    "itens": [
      {
        "pergunta": "Pergunta objetiva?",
        "resposta": "Resposta clara, correta e sem promessa."
      }
    ]
  },
  {
    "t": "cta",
    "titulo": "Ficou com alguma dúvida?",
    "texto": "Fale agora mesmo com um especialista.",
    "botao": "Falar pelo WhatsApp",
    "mensagem": "Olá. Li o artigo sobre [TEMA] e gostaria de falar com o advogado sobre o meu caso."
  }
]
```

## 10. Checklist antes de publicar

- [ ] O texto fornecido foi comparado linha a linha e permanece integral?
- [ ] A jurisprudência está completa, literal, na ordem recebida e com fonte?
- [ ] Nenhuma citação, processo ou norma foi inventado?
- [ ] O `slug` é único e a área existe?
- [ ] Há somente um `h1`, gerado pelo título da página?
- [ ] Todos os `h2` têm `id` único?
- [ ] SEO title, descrição, resumo e datas estão preenchidos?
- [ ] Os links internos apontam para rotas existentes?
- [ ] O CTA está depois do conteúdo original e abre o WhatsApp diretamente?
- [ ] Não existe formulário, chatbot, pré-triagem ou endpoint de IA?
- [ ] A página está correta no computador e no celular?
- [ ] O artigo apareceu na listagem e no `dist/sitemap.xml`?

Execute:

```bash
npm run test:artigos
npm run typecheck
npm run build
```

Corrija todos os erros antes de concluir a publicação.
