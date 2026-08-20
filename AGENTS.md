# Instruções permanentes do repositório

## Publicação

1. A publicação oficial do site é feita pelo repositório Git: validar as
   alterações, criar um commit e fazer push para `origin/main`.
2. Não gerar `site-hostinger.zip`, não atualizar a pasta `site-hostinger/` e não
   fazer upload manual na hospedagem, salvo se o responsável pedir isso
   expressamente.
3. Antes do commit, preservar alterações preexistentes do responsável e incluir
   somente os arquivos pertencentes à tarefa atual.

## Artigos e jurisprudência

Antes de criar, importar, revisar ou publicar qualquer artigo ou jurisprudência,
leia integralmente `docs/MANUAL_DE_ARTIGOS.md` e siga o checklist nele contido.

Regras que não podem ser ignoradas:

1. O conteúdo aprovado ou enviado pelo responsável do site deve ser preservado
   integralmente. Não resumir, reescrever, corrigir, reorganizar nem alterar uma
   linha sem autorização expressa.
2. Jurisprudência transcrita deve permanecer literal, completa e na mesma ordem,
   inclusive identificação, ementa, fundamentos, dispositivo, referência e
   quebras relevantes recebidas. Comentários editoriais devem ficar claramente
   separados da transcrição.
3. Metadados de SEO, sumário, links internos e CTAs são elementos externos ao
   texto original. Nunca inseri-los no meio de um conteúdo que deva permanecer
   literal.
4. Todo botão de conversão em artigo deve abrir diretamente o WhatsApp oficial.
   Não criar chatbot, formulário, pré-triagem, captura intermediária, fluxo de IA,
   integração com DeepSeek nem rota `/api/pre-triagem`.
5. Manter a estrutura de dados de `src/content/artigos.json` e os componentes
   compartilhados. Não criar formatação isolada para um único artigo.
6. Antes de concluir, executar `npm run test:artigos`, `npm run typecheck` e
   `npm run build`.
