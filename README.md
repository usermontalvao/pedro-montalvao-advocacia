# Pedro Montalvão Advocacia — site institucional

Site pré-renderizado, sem banco de dados. O conteúdo vive em arquivos
JSON dentro de `src/content/`, e cada página é gerada como HTML pronto no
build — é isso que faz o Google ler o site inteiro sem depender de JavaScript.

## Rodar no seu computador

Duplo clique em **`Abrir Terminal aqui.command`** e digite:

```bash
npm install
```

```bash
npm run dev
```

O site abre em <http://localhost:4321>.

## Gerar a versão que vai para o ar

```bash
npm run build
```

A pasta **`dist/`** é o site pronto: é ela inteira que você envia para a
hospedagem (Netlify, Vercel, Hostinger, cPanel — qualquer uma serve, porque
são só arquivos).

### Publicar

A publicação oficial é feita pelo repositório Git. Depois de validar a alteração,
crie o commit e faça push para `origin/main`; a hospedagem faz o deploy conectado
ao repositório. Não gere nem envie ZIP manualmente, salvo quando esse procedimento
for solicitado expressamente.

Depois do deploy, confirme o domínio:

```bash
npm run test:publicacao
```

A publicação somente é aprovada quando todas as calculadoras respondem HTTP
200, constam no sitemap e entregam canonical, `index, follow` e HTML
pré-renderizado. Só então envie novamente o sitemap no Google Search Console.

### Meta Pixel

O ID público `1715491819680381` está configurado no código e segue no deploy por
Git. Para apontar um build de teste a outro dataset/pixel, use opcionalmente:

```env
VITE_META_PIXEL_ID=1715491819680381
```

O rastreamento envia `PageView` em todas as páginas e `Contact` nos cliques que
abrem o WhatsApp do escritório. A landing `/conta-encerrada/` também envia
`ViewContent`, `Lead` (triagem concluída) e eventos próprios de andamento.
Mensagens, respostas da triagem e dados do formulário não são enviados ao Pixel.

## Antes de publicar

| O quê | Onde |
|---|---|
| Número da OAB (obrigatório pelo Provimento 205/2021) | `src/site.config.ts` → `oab` |
| Endereço do site (canonical, sitemap, compartilhamento) | `src/site.config.ts` → `url` |
| Horário de atendimento | `src/site.config.ts` → `horario` |
| Coordenadas do mapa | `src/site.config.ts` → `endereco.latitude/longitude` |

Depois de publicar, cadastre o site no Google Search Console e envie
`https://SEU-DOMINIO/sitemap.xml`.

## Estrutura

```
src/
  content/       textos de todas as páginas, em JSON — é aqui que se edita
    areas.json     as 4 áreas de atuação (temas, documentos, FAQ)
    artigos.json   os artigos do blog
    home.json      a página inicial
    sobre.json     a página do advogado
    juridico.json  política de privacidade e termos de uso
  components/    peças de interface (cabeçalho, formulário, animações)
  pages/         montagem de cada página
  lib/           roteador, SEO, formatação de texto, contatos locais
  styles/        o sistema visual inteiro, num arquivo só
scripts/
  optimize-media.mjs   prepara fotos, ícones e imagem de compartilhamento
  prerender.mjs        gera o HTML de cada página + sitemap + robots
public/midia/    as imagens já otimizadas
```

## Publicar um artigo novo

Antes de editar, leia **`docs/MANUAL_DE_ARTIGOS.md`**. Ele é o padrão obrigatório
de conteúdo, SEO, jurisprudência, links internos e botão direto para WhatsApp.
O arquivo **`AGENTS.md`** faz qualquer IA do repositório consultar esse manual.

Acrescente um item em `src/content/artigos.json` seguindo o manual. O artigo
entra sozinho na listagem, no sitemap, nos dados estruturados e ganha sua
própria página — nenhum código precisa ser tocado.

Blocos disponíveis no corpo do texto: `p`, `h2`, `h3`, `ul`, `ol`, `destaque`,
`lei` (citação de norma), `faq` e `cta` (caixa de WhatsApp no meio do texto).
Dentro dos textos funcionam `**negrito**` e `[link](/destino/)`.

Antes de publicar, rode:

```bash
npm run test:artigos
npm run typecheck
npm run build
```

## Trocar as fotos

Coloque os arquivos novos e ajuste a lista `FOTOS` em
`scripts/optimize-media.mjs`; depois rode:

```bash
npm run midias
```

## Contatos do site

O formulário grava o contato em JSON no `localStorage` do próprio visitante e
abre o WhatsApp do escritório com o resumo já escrito.

Nos artigos, o botão flutuante abre diretamente o WhatsApp do escritório com uma
mensagem que identifica o conteúdo de origem. Não há formulário, chatbot ou etapa
intermediária antes da conversa no canal oficial.

## Vídeo de fundo

`public/midia/justica.mp4` tem cerca de 20 MB em 4K. Ele só é baixado em telas
grandes, com conexão boa e quando o bloco chega perto da tela. Ainda assim,
vale comprimir antes de publicar:

```bash
ffmpeg -i public/midia/justica.mp4 -vf scale=1920:-2 -c:v libx264 -crf 28 -preset slow -an public/midia/justica-web.mp4
```

Depois troque o caminho em `src/pages/Home.tsx`.
