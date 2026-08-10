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

Acrescente um item em `src/content/artigos.json` seguindo o que já existe. O
artigo entra sozinho na listagem, no sitemap, nos dados estruturados e ganha
sua própria página — nenhum código precisa ser tocado.

Blocos disponíveis no corpo do texto: `p`, `h2`, `h3`, `ul`, `ol`, `destaque`,
`lei` (citação de norma), `faq` e `cta` (caixa de WhatsApp no meio do texto).
Dentro dos textos funcionam `**negrito**` e `[link](/destino/)`.

## Trocar as fotos

Coloque os arquivos novos e ajuste a lista `FOTOS` em
`scripts/optimize-media.mjs`; depois rode:

```bash
npm run midias
```

## Contatos e pré-triagem do site

O formulário grava o contato em JSON no `localStorage` do próprio visitante e
abre o WhatsApp do escritório com o resumo já escrito.

Os artigos também carregam um atendimento inicial guiado. Primeiro, alternativas
fixas qualificam área, situação, período, provas, urgência e objetivo. Só depois
do consentimento as respostas seguem para a IA, que faz perguntas complementares
e organiza um radar factual para conferência humana. A mensagem do WhatsApp leva
o histórico, pontos de atenção, documentos e links de pesquisa em portais oficiais.

A integração segura fica em `public/api/pre-triagem.php`, que é copiado para
`dist/api/` e executado pela hospedagem PHP. Configure `DEEPSEEK_API_KEY` como
variável do ambiente da hospedagem. A chave nunca deve ser escrita em arquivos
públicos nem em código do navegador. A IA não consulta jurisprudência em tempo
real e não avalia viabilidade jurídica; ela apenas sugere termos para a pesquisa
que o profissional fará nas fontes oficiais. Em hospedagem puramente estática,
o widget continua oferecendo o WhatsApp, mas a etapa automatizada ficará
indisponível.

## Vídeo de fundo

`public/midia/justica.mp4` tem cerca de 20 MB em 4K. Ele só é baixado em telas
grandes, com conexão boa e quando o bloco chega perto da tela. Ainda assim,
vale comprimir antes de publicar:

```bash
ffmpeg -i public/midia/justica.mp4 -vf scale=1920:-2 -c:v libx264 -crf 28 -preset slow -an public/midia/justica-web.mp4
```

Depois troque o caminho em `src/pages/Home.tsx`.
