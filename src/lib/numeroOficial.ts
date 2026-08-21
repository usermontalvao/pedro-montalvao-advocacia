/**
 * Conferência do contato que chamou — número de telefone ou nome de usuário.
 *
 * A pessoa que recebeu a mensagem do golpista não compara treze dígitos na
 * tela: ela bate o olho, vê "65", vê "9840…" e conclui que é o escritório. O
 * conferidor existe para tirar essa conferência do olho e passá-la para uma
 * regra — e a regra é estrita de propósito. Número parecido é número diferente.
 *
 * O WhatsApp deixou de ser só telefone: hoje um perfil também se encontra pelo
 * nome de usuário, e o golpista registra o parecido (`adv.pedromontalvao`) com
 * a mesma facilidade com que compra um chip. Por isso o mesmo campo responde
 * pelos dois, e por isso existe um terceiro veredito: o NOME EXIBIDO no perfil
 * não é resposta nenhuma. Qualquer pessoa escreve "Dr. Pedro Montalvão" no
 * próprio perfil, e dizer "não é do escritório" com base nisso seria tão errado
 * quanto dizer que é.
 *
 * A lista de linhas verdadeiras vem do `site.config`, nunca daqui: o escritório
 * ganha linha nova com o tempo, e uma linha esquecida faria o site chamar de
 * golpe um atendimento real.
 *
 * Sem React, sem DOM e sem rede: é só texto entrando e um veredito saindo, para
 * que `scripts/auditar-numero-oficial.ts` consiga cobrir cada caso.
 */
import { TELEFONES_OFICIAIS, USUARIO_WHATSAPP, type TelefoneOficial } from '../site.config';

export type Conferencia =
  /** Bate com uma das linhas do escritório. */
  | { estado: 'oficial'; via: 'numero'; numero: TelefoneOficial }
  /** Bate com o nome de usuário oficial do WhatsApp. */
  | { estado: 'oficial'; via: 'usuario'; usuario: string }
  /** Não bate com nada disso — e "parecido" cai aqui. */
  | { estado: 'diferente'; via: 'numero' | 'usuario' }
  /** Ainda faltam caracteres: não é veredito, é pedido de mais. */
  | { estado: 'incompleto' }
  /**
   * Foi digitado um nome de perfil, e nome de perfil não identifica ninguém.
   *
   * Sem este estado o conferidor teria de escolher entre dois erros: reprovar
   * um contato verdadeiro que se apresenta com o nome certo, ou aprovar o
   * golpista que copiou exatamente esse nome.
   */
  | { estado: 'nome' };

/** Menos que isto não é número: é alguém no meio da digitação. */
const MINIMO_DE_DIGITOS = 9;

/** Menos que isto não é usuário: é a primeira letra. */
const MINIMO_DE_LETRAS = 3;

function digitosDe(texto: string): string {
  return (texto.match(/\d/g) ?? []).join('');
}

/**
 * Reduz o que foi digitado a DDD + número, que é a forma comparável.
 *
 * Aceita o que aparece na tela de quem recebeu a mensagem: `+55 65 98404-6375`,
 * `(65) 98404-6375`, `065 98404 6375` e o número solto, sem DDD.
 */
function comparavel(texto: string): string {
  let digitos = digitosDe(texto).replace(/^0+/, '');
  if (digitos.length > 11 && digitos.startsWith('55')) digitos = digitos.slice(2);
  return digitos.length > 11 ? digitos.slice(-11) : digitos;
}

/**
 * Reduz um nome de usuário à forma canônica: minúsculas, sem `@` e sem espaços
 * nas pontas. Acentos e espaços internos NÃO são removidos — são justamente
 * eles que denunciam que aquilo é um nome de perfil, e não um usuário.
 */
function usuarioComparavel(texto: string): string {
  return texto.trim().replace(/^@+/, '').toLowerCase();
}

/** Nome de usuário do WhatsApp não tem espaço nem acento; nome de perfil tem. */
function pareceNomeDePerfil(texto: string): boolean {
  const limpo = texto.trim();
  return /\s/.test(limpo) || /[^\u0021-\u007E]/.test(limpo);
}

function conferirUsuario(texto: string): Conferencia {
  if (pareceNomeDePerfil(texto)) return { estado: 'nome' };

  const digitado = usuarioComparavel(texto);
  if (digitado.length < MINIMO_DE_LETRAS) return { estado: 'incompleto' };
  if (digitado === USUARIO_WHATSAPP) return { estado: 'oficial', via: 'usuario', usuario: USUARIO_WHATSAPP };

  /*
    Enquanto o que foi digitado ainda é o começo do usuário oficial, a pessoa
    está no meio da digitação — cravar "não é do escritório" na terceira letra
    de `adv.pedro.montalvao` seria dar o veredito errado para o contato certo.
  */
  if (USUARIO_WHATSAPP.startsWith(digitado)) return { estado: 'incompleto' };

  return { estado: 'diferente', via: 'usuario' };
}

/**
 * Diz se o contato digitado é do escritório.
 *
 * Com menos dígitos do que a linha oficial tem, a comparação é feita pela cauda
 * do número — quem digita sem DDD ainda está digitando o mesmo telefone. O que
 * nunca acontece é o contrário: dígito que não bate reprova, mesmo que seja um
 * só, mesmo que o DDD esteja certo.
 */
export function conferirContato(texto: string): Conferencia {
  /*
    Uma letra qualquer já tira o texto do mundo dos telefones. Vale inclusive
    para `+55 65 98404-6375 (Dr. Pedro)`: um telefone com nome grudado é um
    nome de perfil, e é assim que ele vai ser tratado.
  */
  if (/\p{L}/u.test(texto)) return conferirUsuario(texto);

  const digitado = comparavel(texto);
  if (digitado.length < MINIMO_DE_DIGITOS) return { estado: 'incompleto' };

  for (const numero of TELEFONES_OFICIAIS) {
    const oficial = numero.e164.replace(/^55/, '');
    const alvo = digitado.length >= oficial.length ? oficial : oficial.slice(-digitado.length);
    if (digitado === alvo) return { estado: 'oficial', via: 'numero', numero };
  }

  return { estado: 'diferente', via: 'numero' };
}

/**
 * Máscara aplicada enquanto a pessoa digita.
 *
 * Serve à leitura, não à validação: quem confere um número em pânico precisa
 * ver os dígitos agrupados como no visor do celular para conseguir compará-los.
 * A máscara só acrescenta separadores — o veredito continua saindo do texto.
 *
 * Texto com letra passa intacto: ali não há telefone para agrupar, e formatar
 * um nome de usuário só atrapalharia quem está copiando um perfil.
 */
export function formatarTelefone(texto: string): string {
  if (/\p{L}/u.test(texto)) return texto.trimStart();

  let digitos = digitosDe(texto).slice(0, 13);
  let pais = '';

  if (digitos.length > 11 && digitos.startsWith('55')) {
    pais = '+55 ';
    digitos = digitos.slice(2);
  }

  if (digitos.length <= 2) return digitos ? `${pais}(${digitos}` : pais;

  const ddd = digitos.slice(0, 2);
  const resto = digitos.slice(2);
  /*
    O hífen só entra quando o número já tem tamanho de número (oito dígitos ou
    mais). Colocá-lo antes disso partiria o que a pessoa ainda está digitando —
    "(65) 9840-4" — e é justamente durante a digitação que ela está comparando o
    campo com a mensagem que recebeu.
  */
  if (resto.length < 8) return `${pais}(${ddd}) ${resto}`;

  const corte = resto.length - 4;
  return `${pais}(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}
