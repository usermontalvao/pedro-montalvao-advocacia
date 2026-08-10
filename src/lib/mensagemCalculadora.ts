export type ItemMensagemCalculadora = {
  rotulo: string;
  valor: string;
};

export function montarMensagemCalculadora({
  titulo,
  total,
  dados,
  memoria,
  observacoes = [],
}: {
  titulo: string;
  total: string;
  dados: ItemMensagemCalculadora[];
  memoria: ItemMensagemCalculadora[];
  observacoes?: string[];
}): string {
  const bloco = (itens: ItemMensagemCalculadora[]) =>
    itens.map((item) => `• ${item.rotulo}: ${item.valor}`).join('\n');

  return [
    'Olá. Fiz uma simulação no site Pedro Montalvão Advocacia e gostaria de conferir o resultado.',
    '',
    `ASSUNTO: ${titulo}`,
    `RESULTADO ESTIMADO: ${total}`,
    '',
    'DADOS INFORMADOS',
    bloco(dados),
    '',
    'MEMÓRIA DO CÁLCULO',
    bloco(memoria),
    ...(observacoes.length
      ? ['', 'OBSERVAÇÕES DA CALCULADORA', ...observacoes.map((nota) => `• ${nota}`)]
      : []),
    '',
    'Gostaria de saber quais documentos devo enviar e se este cálculo precisa de algum ajuste no meu caso.',
  ].join('\n');
}
