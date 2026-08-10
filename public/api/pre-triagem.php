<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

function responder(int $status, array $dados): never
{
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function textoSeguro(mixed $valor, int $limite): string
{
    if (!is_string($valor)) {
        return '';
    }

    $texto = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $valor) ?? '');
    return mb_substr($texto, 0, $limite, 'UTF-8');
}

function listaTextosSeguros(mixed $valor, int $quantidade = 5, int $limite = 180): array
{
    if (!is_array($valor)) {
        return [];
    }

    $itens = [];
    foreach (array_slice($valor, 0, $quantidade) as $item) {
        $texto = textoSeguro($item, $limite);
        if ($texto !== '') {
            $itens[] = $texto;
        }
    }
    return $itens;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    responder(405, ['erro' => 'Método não permitido.']);
}

$origem = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? '';
if ($origem !== '' && $host !== '') {
    $hostOrigem = parse_url($origem, PHP_URL_HOST);
    if (!is_string($hostOrigem) || strcasecmp($hostOrigem, preg_replace('/:\d+$/', '', $host)) !== 0) {
        responder(403, ['erro' => 'Origem não autorizada.']);
    }
}

$tamanho = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($tamanho > 24000) {
    responder(413, ['erro' => 'Conteúdo inválido ou muito extenso.']);
}

// Limite simples por IP para proteger a chave e evitar custo automatizado.
$ip = $_SERVER['REMOTE_ADDR'] ?? 'desconhecido';
$arquivoLimite = sys_get_temp_dir() . '/pma-triagem-' . hash('sha256', $ip) . '.json';
$agora = time();
$janela = 10 * 60;
$tentativas = [];
$arquivo = @fopen($arquivoLimite, 'c+');
if ($arquivo !== false && flock($arquivo, LOCK_EX)) {
    $conteudo = stream_get_contents($arquivo);
    $anteriores = json_decode(is_string($conteudo) ? $conteudo : '', true);
    if (is_array($anteriores)) {
        $tentativas = array_values(array_filter($anteriores, fn ($tempo) => is_int($tempo) && $tempo > $agora - $janela));
    }
    if (count($tentativas) >= 12) {
        flock($arquivo, LOCK_UN);
        fclose($arquivo);
        responder(429, ['erro' => 'Muitas tentativas. Aguarde alguns minutos ou continue pelo WhatsApp.']);
    }
    $tentativas[] = $agora;
    ftruncate($arquivo, 0);
    rewind($arquivo);
    fwrite($arquivo, json_encode($tentativas));
    fflush($arquivo);
    flock($arquivo, LOCK_UN);
    fclose($arquivo);
}

$entrada = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($entrada)) {
    responder(400, ['erro' => 'JSON inválido.']);
}

$assunto = textoSeguro($entrada['assunto'] ?? '', 100);
$artigo = textoSeguro($entrada['artigo'] ?? '', 220);
$recebidas = $entrada['mensagens'] ?? [];
if ($assunto === '' || !is_array($recebidas)) {
    responder(422, ['erro' => 'Faltam informações para a pré-triagem.']);
}

$mensagens = [];
foreach (array_slice($recebidas, -10) as $mensagem) {
    if (!is_array($mensagem)) {
        continue;
    }
    $papel = ($mensagem['role'] ?? '') === 'assistant' ? 'assistant' : 'user';
    $conteudo = textoSeguro($mensagem['content'] ?? '', 1800);
    if ($conteudo !== '') {
        $mensagens[] = ['role' => $papel, 'content' => $conteudo];
    }
}

if ($mensagens === []) {
    responder(422, ['erro' => 'Escreva um breve relato para continuar.']);
}

$chave = getenv('DEEPSEEK_API_KEY') ?: getenv('DEEPSEEK_KEY');
if (!is_string($chave) || trim($chave) === '') {
    responder(503, ['erro' => 'A pré-triagem automatizada está temporariamente indisponível.']);
}

if (!function_exists('curl_init')) {
    responder(503, ['erro' => 'A integração de pré-triagem não está disponível neste servidor.']);
}

$sistema = <<<'PROMPT'
Você é o assistente AUTOMATIZADO de organização inicial do escritório Pedro Montalvão Advocacia, em Cuiabá/MT.

Sua única função é organizar informações iniciais para posterior conferência humana. Você NÃO é advogado, NÃO presta consulta, NÃO interpreta definitivamente direitos, NÃO estima chance de êxito, NÃO promete resultado e NÃO informa valor de indenização ou honorários.

O visitante já respondeu a uma qualificação fixa com área, tipo de situação, período, provas, urgência e objetivo. Leia essas respostas, não as repita e identifique apenas as lacunas que realmente mudam a compreensão factual.

Conduza uma conversa curta e acolhedora em português do Brasil. Antes da conclusão, faça apenas UMA pergunta objetiva por resposta e ofereça de 3 a 5 alternativas curtas, claras, mutuamente úteis e específicas para o cenário. As alternativas não podem induzir direitos nem afirmar conclusões jurídicas. Mantenha "permitirTexto" como true para o visitante poder responder algo diferente.

Tente identificar, sem repetir o que já foi respondido: quem está envolvido, sequência essencial dos fatos, datas relevantes, medida já tomada, documentos disponíveis e eventual prazo ou urgência. Não solicite CPF, RG, senhas, códigos, dados bancários, números completos de processo ou documentos sensíveis. Não peça nome ou telefone: esses dados são tratados somente no navegador e não são enviados a você.

Se houver possível risco imediato à vida ou integridade, violência em curso, prisão, prazo para hoje, audiência iminente ou outra urgência grave, inclua um alerta curto para buscar imediatamente o serviço público competente e atendimento humano; não tente resolver a emergência.

Na primeira resposta, sempre faça uma pergunta complementar e mantenha "pronto" como false. Quando já houver informações materiais suficientes — normalmente após 2 a 4 respostas complementares — marque "pronto" como true, produza um resumo factual, neutro e compacto, zere as alternativas e use a mensagem para informar que o material está pronto para conferência humana.

Ao concluir, produza também um radar estritamente factual:
- "status": use somente uma destas frases: "Informações suficientes para avaliação humana", "Possível urgência — priorizar atendimento", "Faltam informações relevantes" ou "Assunto fora da triagem principal";
- "indicadores": fatos objetivos potencialmente relevantes, sem dizer que são favoráveis ou desfavoráveis;
- "pontosAtencao": lacunas, inconsistências, prazos a confirmar ou questões que o advogado deve conferir;
- "documentos": documentos ou provas que podem ajudar na conferência;
- "termosPesquisa": de 2 a 4 expressões jurídicas neutras para pesquisar em portais oficiais depois.

Você NÃO tem acesso à internet nem consulta jurisprudência em tempo real. Jamais invente número de processo, tribunal, súmula, tema, precedente, decisão ou citação. Os termos de pesquisa não são pesquisa concluída e não permitem declarar o caso viável ou inviável.

Responda SOMENTE em JSON válido neste formato exato:
{"mensagem":"uma pergunta ou orientação curta","alternativas":["alternativa 1","alternativa 2","alternativa 3"],"permitirTexto":true,"resumo":"resumo factual acumulado ou string vazia","pronto":false,"alerta":"string vazia ou alerta urgente","radar":{"status":"","indicadores":[],"pontosAtencao":[],"documentos":[],"termosPesquisa":[]}}
PROMPT;

$contexto = [
    'role' => 'user',
    'content' => "Contexto da página: artigo \"{$artigo}\". Assunto escolhido: {$assunto}. Organize a pré-triagem sem fornecer aconselhamento jurídico.",
];

$carga = [
    'model' => 'deepseek-v4-flash',
    'messages' => array_merge([
        ['role' => 'system', 'content' => $sistema],
        $contexto,
    ], $mensagens),
    'thinking' => ['type' => 'disabled'],
    'response_format' => ['type' => 'json_object'],
    'temperature' => 0.2,
    'max_tokens' => 1000,
    'user_id' => substr(hash('sha256', $ip . '|' . date('Y-m-d')), 0, 48),
];

$curl = curl_init('https://api.deepseek.com/chat/completions');
curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_TIMEOUT => 24,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . trim($chave),
        'Content-Type: application/json',
        'Accept: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode($carga, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
]);

$resposta = curl_exec($curl);
$status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
$erroCurl = curl_errno($curl);
curl_close($curl);

if ($erroCurl !== 0 || !is_string($resposta) || $status < 200 || $status >= 300) {
    responder(502, ['erro' => 'Não foi possível concluir a pré-triagem agora. Continue pelo WhatsApp.']);
}

$dadosApi = json_decode($resposta, true);
$conteudoModelo = $dadosApi['choices'][0]['message']['content'] ?? '';
$dadosModelo = json_decode(is_string($conteudoModelo) ? $conteudoModelo : '', true);
if (!is_array($dadosModelo)) {
    responder(502, ['erro' => 'A resposta automatizada não pôde ser organizada. Continue pelo WhatsApp.']);
}

$mensagemFinal = textoSeguro($dadosModelo['mensagem'] ?? '', 700);
if ($mensagemFinal === '') {
    responder(502, ['erro' => 'A resposta automatizada veio vazia. Continue pelo WhatsApp.']);
}

$radarRecebido = is_array($dadosModelo['radar'] ?? null) ? $dadosModelo['radar'] : [];
$statusPermitidos = [
    'Informações suficientes para avaliação humana',
    'Possível urgência — priorizar atendimento',
    'Faltam informações relevantes',
    'Assunto fora da triagem principal',
];
$statusRadar = textoSeguro($radarRecebido['status'] ?? '', 120);
if (!in_array($statusRadar, $statusPermitidos, true)) {
    $statusRadar = '';
}

responder(200, [
    'mensagem' => $mensagemFinal,
    'alternativas' => listaTextosSeguros($dadosModelo['alternativas'] ?? [], 5, 180),
    'permitirTexto' => ($dadosModelo['permitirTexto'] ?? true) !== false,
    'resumo' => textoSeguro($dadosModelo['resumo'] ?? '', 1400),
    'pronto' => (bool) ($dadosModelo['pronto'] ?? false),
    'alerta' => textoSeguro($dadosModelo['alerta'] ?? '', 500),
    'radar' => [
        'status' => $statusRadar,
        'indicadores' => listaTextosSeguros($radarRecebido['indicadores'] ?? []),
        'pontosAtencao' => listaTextosSeguros($radarRecebido['pontosAtencao'] ?? []),
        'documentos' => listaTextosSeguros($radarRecebido['documentos'] ?? []),
        'termosPesquisa' => listaTextosSeguros($radarRecebido['termosPesquisa'] ?? [], 4),
    ],
]);
