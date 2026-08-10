# Instruções permanentes do repositório

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

