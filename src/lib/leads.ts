/**
 * "Banco de dados" do site: o próprio navegador do visitante.
 *
 * Não existe servidor aqui. Cada contato preenchido no formulário é gravado
 * como JSON em localStorage e, na sequência, vira uma mensagem pronta no
 * WhatsApp do escritório — que é onde o atendimento realmente acontece.
 *
 * O histórico local serve para dois casos concretos: o visitante que fecha a
 * aba no meio do preenchimento e volta depois, e a conferência de um envio que
 * "não chegou". Quando o site ganhar um backend, basta trocar `registrar()`
 * por uma chamada de rede: o resto do formulário não muda.
 */

export type Lead = {
  id: string;
  criadoEm: string;
  nome: string;
  telefone: string;
  email: string;
  area: string;
  mensagem: string;
  origem: string;
};

const CHAVE = 'pma:contatos';
const LIMITE = 50;

function disponivel(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

export function listar(): Lead[] {
  if (!disponivel()) return [];
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return [];
    const dados = JSON.parse(bruto);
    return Array.isArray(dados) ? (dados as Lead[]) : [];
  } catch {
    return [];
  }
}

export function registrar(entrada: Omit<Lead, 'id' | 'criadoEm'>): Lead {
  const lead: Lead = {
    ...entrada,
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    criadoEm: new Date().toISOString(),
  };

  if (disponivel()) {
    try {
      const anteriores = listar();
      const atualizados = [lead, ...anteriores].slice(0, LIMITE);
      window.localStorage.setItem(CHAVE, JSON.stringify(atualizados));
    } catch {
      // Modo anônimo ou armazenamento cheio: o envio pelo WhatsApp continua.
    }
  }

  return lead;
}

/** Texto que o visitante envia no WhatsApp, já com o que ele preencheu. */
export function mensagemDoLead(lead: Omit<Lead, 'id' | 'criadoEm'>): string {
  const linhas = [
    `Olá! Meu nome é ${lead.nome}.`,
    lead.area ? `Área: ${lead.area}.` : '',
    '',
    lead.mensagem,
    '',
    lead.email ? `E-mail para retorno: ${lead.email}` : '',
    lead.telefone ? `Telefone: ${lead.telefone}` : '',
    lead.origem ? `(Enviado pelo site — ${lead.origem})` : '',
  ];

  return linhas.filter((linha) => linha !== '').join('\n');
}
