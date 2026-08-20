# Campanha Meta Ads — conta bloqueada ou encerrada

Montagem definida em 15/08/2026 para a landing `/conta-encerrada/`.
Orçamento e região vieram do responsável; o restante das escolhas está
justificado abaixo, para que quem revisar saiba o que foi decidido e por quê.

## Pré-requisito que trava tudo

O pixel `701214878974010` **precisa estar respondendo na página publicada**
antes de qualquer real ser gasto. Até 15/08/2026 ele não estava: o pacote da
Hostinger tinha o código do rastreador, mas não o ID — `VITE_META_PIXEL_ID`
não existia na máquina que gerou o `site-hostinger.zip`, então
`pixelConfigurado()` devolvia `false` e nenhum evento saía.

O pacote foi regerado com o ID embutido. Só depois do upload em `public_html`
é que a campanha tem sinal para otimizar.

Como conferir, sem depender de fé: abra `https://pedromontalvao.com/conta-encerrada/`,
console do navegador, `typeof window.fbq`. Tem que responder `"function"`.
Se responder `"undefined"`, o upload não subiu ou subiu build antigo.

## Campanha

| Campo | Valor |
|---|---|
| Nome | `Conta encerrada — MT — Leads` |
| Objetivo | Cadastros (*Leads*) → conversão no site |
| Categoria especial de anúncio | Nenhuma |
| Teste A/B | Desligado |
| Orçamento da campanha (CBO) | Desligado — o orçamento fica no conjunto |

Sobre a categoria especial: o anúncio trata de **encerramento de conta
bancária**, não de oferta de crédito. Não se enquadra em "Crédito". Se a Meta
sinalizar assim mesmo, é reclassificação errada dela — conteste, não aceite,
porque a categoria especial corta segmentação por idade e localização e
inviabiliza a campanha.

## Conjunto de anúncios

| Campo | Valor |
|---|---|
| Nome | `MT — amplo — Lead` |
| Orçamento | **R$ 20,00/dia** (orçamento diário do conjunto) |
| Conversão | Site → Pixel `701214878974010` → evento **`Lead`** |
| Janela de atribuição | 7 dias clique / 1 dia visualização |
| Localização | **Mato Grosso** (estado) — "pessoas que moram neste local" |
| Idade | 25 – 65+ |
| Gênero | Todos |
| Segmentação detalhada | **vazia** (público amplo) |
| Advantage+ público | Ligado |
| Posicionamentos | Automáticos (Advantage+) |

### Por que `Lead` e não `Contact`

`Contact` (clicou para abrir o WhatsApp) é o evento mais perto do cliente que
paga. Mas o Meta só sai da fase de aprendizado com volume, e R$ 20/dia é
orçamento pequeno: otimizar pelo evento mais raro é condenar o conjunto a
aprender para sempre e entregar caro. `Lead` (as 4 perguntas concluídas) tem
volume várias vezes maior e fica perto o bastante da intenção.

`Contact` continua sendo medido — só não é o alvo da otimização. É por ele que
se julga a campanha depois, não pelo custo por `Lead`.

### Por que estado, e não só Cuiabá

Com R$ 20/dia o gargalo não é tamanho de público, é entrega. Mato Grosso dá ao
algoritmo espaço para achar as conversões baratas; Cuiabá sozinha aperta o
leilão sem economizar nada. O escritório é OAB/MT e o atendimento é remoto,
então o estado inteiro é atendível.

Se em duas semanas o custo por `Lead` do interior vier muito acima do da
capital, aí sim vale cortar para Cuiabá + Várzea Grande — com dado na mão.

### Por que público amplo

Segmentação detalhada ("interesses: Nubank", "comportamento: usuários de banco
digital") parece precisão e é ruído: reduz o público, encarece o leilão e o
Advantage+ já reencontra essa gente sozinho a partir do pixel. Começar amplo é
o que dá ao sistema a chance de aprender.

## Anúncios

Dois anúncios no mesmo conjunto, para o Meta escolher. Ambos em registro
**informativo** — e isso é deliberado.

O Provimento 205/2021 do CFOAB permite impulsionar conteúdo informativo e veda
oferta de serviço, captação, promessa de resultado e estímulo à litigância. O
anúncio é justamente a peça impulsionada: é ele que a OAB olha primeiro. A
abertura da landing ("Veja se você tem direito à indenização") foi uma escolha
consciente do advogado responsável, registrada em `src/lib/triagemContaEncerrada.ts`
— mas ela vive dentro do site, depois do clique. Levar essa mesma frase para o
criativo aumenta a exposição sem aumentar a conversão, e ainda é das formulações
que a própria Meta mais reprova em serviços jurídicos.

Se o responsável quiser mesmo a frase no anúncio, ela está na variação C, no
fim desta seção, com o aviso.

### Anúncio A — "sem aviso prévio"

- **Texto principal**
  > A regulação do Banco Central prevê comunicação prévia quando é a
  > instituição que encerra a conta, e o saldo deve continuar à disposição do
  > titular. Muita gente descobre o encerramento pelo próprio aplicativo, com
  > dinheiro dentro e sem nenhum aviso. Quatro perguntas organizam o que
  > aconteceu no seu caso.
- **Título**: `Conta encerrada sem aviso prévio`
- **Descrição**: `Conteúdo informativo · 4 perguntas`
- **Chamada para ação**: `Saiba mais`

### Anúncio B — "bloqueio e saldo preso"

- **Texto principal**
  > Bloqueio sem explicação, encerramento do nada, dinheiro preso lá dentro.
  > O Código de Defesa do Consumidor e as normas do Banco Central tratam do
  > aviso prévio e da devolução do saldo. Responda 4 perguntas e veja o que as
  > regras preveem para uma situação como a sua.
- **Título**: `Bloqueio ou encerramento de conta`
- **Descrição**: `Conteúdo informativo · 4 perguntas`
- **Chamada para ação**: `Saiba mais`

### Anúncio C — registro assertivo (só com aval expresso)

- **Título**: `Veja se você tem direito à indenização`

Não subir sem decisão explícita do responsável. Repete no criativo a afirmação
de direito individual que hoje só existe depois do clique, e é o texto com maior
chance de reprovação tanto na OAB quanto na revisão da Meta.

## URL e parâmetros

- **URL do site**: `https://pedromontalvao.com/conta-encerrada/`
- **Parâmetros de URL** (campo próprio, no nível do anúncio):

```
utm_source=meta&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}
```

Isto não é enfeite de relatório. `origemDaVisita()` lê esses parâmetros e
`mensagemDoWhatsApp()` os cola no fim da mensagem que chega ao escritório —
é o único jeito de saber, no atendimento, qual anúncio trouxe a pessoa que
fechou. Sem os parâmetros, toda conversa chega como "(Questionário do site)".

## Criativo

Não há imagem aprovada no repositório para uso em anúncio. As peças de marca
disponíveis são `public/midia/*` e `public/og-imagem.png`.

Especificação para produzir, na identidade da landing:

| Item | Valor |
|---|---|
| Formatos | 1080×1080 (feed) e 1080×1350 (feed vertical) |
| Fundo | `#0e0e10` (`--tinta`) |
| Destaque | `#c9a86a` (`--dourado`) |
| Texto | `#f0ece4` (`--texto-claro`) |
| Marca | `public/midia/logo-horizontal-branco.png`, discreta, topo ou rodapé |
| Texto na imagem | curto — a imagem não repete o texto principal |

Nada de foto de martelo, balança ou terno apontando o dedo: além do clichê,
aproxima o criativo do registro de captação.

## Depois de publicar

1. **Test Events** (Gerenciador de Eventos → pixel → Testar eventos): abra a
   landing, responda as 4 perguntas, clique no WhatsApp. Devem aparecer
   `PageView`, `ViewContent`, `TriagemInicio`, `TriagemPasso`, `Lead`, `Contact`.
2. Confira que o `Lead` selecionado no conjunto é o do pixel certo.
3. Primeiras 48h: não mexer. Alterar orçamento ou criativo reinicia o
   aprendizado e queima o orçamento do dia.
4. O número que importa é **custo por `Contact`**, e depois quantos `Contact`
   viraram atendimento no CRM — não o CTR.
