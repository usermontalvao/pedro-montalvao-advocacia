/**
 * Auditoria do conferidor de número da página de alerta de golpe.
 *
 * É o único lugar do site em que o código responde "pode confiar". Um veredito
 * errado aqui não deixa a página feia: ele empurra alguém para o golpe com o
 * aval do escritório — ou faz um cliente desligar na cara de um atendimento
 * verdadeiro. Por isso cada forma de digitar tem caso, cada linha oficial é
 * verificada uma a uma, e cada variação parecida precisa reprovar.
 */
import assert from 'node:assert/strict';
import { conferirContato, formatarTelefone } from '../src/lib/numeroOficial';
import {
  SITE,
  TELEFONES_OFICIAIS,
  TELEFONES_PUBLICOS,
  USUARIO_WHATSAPP,
} from '../src/site.config';

let verificacoes = 0;

function ok(condicao: boolean, mensagem: string) {
  assert.ok(condicao, mensagem);
  verificacoes += 1;
}

/*
  Toda linha do `site.config` precisa ser reconhecida em cinco formas de digitar
  — é o teste que sobrevive à entrada de uma linha nova no escritório.
*/
for (const numero of TELEFONES_OFICIAIS) {
  const local = numero.e164.replace(/^55/, '');
  const formas = [
    numero.exibicao,
    numero.e164,
    `+${numero.e164}`,
    `+55 ${numero.exibicao}`,
    local,
    `  ${numero.exibicao}  `,
  ];

  for (const forma of formas) {
    const conferencia = conferirContato(forma);
    ok(
      conferencia.estado === 'oficial' &&
        conferencia.via === 'numero' &&
        conferencia.numero.e164 === numero.e164,
      `"${forma}" é a linha ${numero.exibicao} e não foi reconhecida (${conferencia.estado}).`,
    );
  }
}

/* A linha principal do site é, obrigatoriamente, uma das linhas oficiais. */
ok(
  conferirContato(SITE.telefoneExibicao).estado === 'oficial',
  'O número exibido no site precisa ser aprovado pelo próprio conferidor.',
);
ok(
  TELEFONES_OFICIAIS.some((numero) => numero.e164 === SITE.telefoneE164),
  'A linha principal do site precisa estar na lista de números oficiais.',
);

/*
  Linha que a página não divulga continua sendo linha do escritório: o
  conferidor precisa reconhecê-la, senão o cliente que recebeu uma ligação de
  verdade vai tratá-la como golpe.
*/
for (const numero of TELEFONES_OFICIAIS.filter((linha) => !linha.publico)) {
  ok(
    conferirContato(numero.exibicao).estado === 'oficial',
    `A linha não publicada ${numero.exibicao} precisa ser reconhecida pelo conferidor.`,
  );
}

ok(
  TELEFONES_PUBLICOS.every((numero) => numero.publico),
  'A lista pública não pode conter linha marcada como não publicada.',
);
ok(
  TELEFONES_PUBLICOS.some((numero) => numero.e164 === SITE.telefoneE164),
  'A linha principal do site precisa ser publicada na página de alerta.',
);

/*
  Os quase-iguais. Todo golpe mora aqui: mesmo DDD, mesmo começo, um dígito de
  diferença — ou o mesmo número sem o 9 inicial, que é outro telefone.
*/
const DIFERENTES = [
  '(65) 98404-6376',
  '(65) 98404-6370',
  '(65) 98405-6375',
  '(65) 99404-6375',
  '(66) 98404-6375',
  '(11) 98404-6375',
  '65 8404-6375',
  '+55 11 98404-6375',
  '5511984046375',
  '(65) 3025-1234',
  '(65) 9626-0464',
  '(65) 9626-4630',
  '(66) 9626-0463',
];

for (const digitado of DIFERENTES) {
  ok(
    conferirContato(digitado).estado === 'diferente',
    `"${digitado}" não é o escritório e passou como oficial.`,
  );
}

/* Enquanto a pessoa digita, nenhum veredito pode aparecer. */
for (const parcial of ['', '   ', '6', '65', '(65) 9', '65 98404', '98404', '(65)', 'ad', '@a']) {
  ok(
    conferirContato(parcial).estado === 'incompleto',
    `"${parcial}" ainda está sendo digitado e já recebeu veredito.`,
  );
}

/* A máscara arruma os dígitos sem nunca inventar nem perder um deles. */
const MASCARA: [string, string][] = [
  ['', ''],
  ['6', '(6'],
  ['65', '(65'],
  ['65984', '(65) 984'],
  ['6598404', '(65) 98404'],
  ['659840463', '(65) 9840463'],
  ['65984046375', '(65) 98404-6375'],
  ['556596260463', '+55 (65) 9626-0463'],
  ['5565984046375', '+55 (65) 98404-6375'],
  ['(65) 98404-6375', '(65) 98404-6375'],
];

/*
  Texto com letra é nome de usuário, não telefone: a máscara não pode grudar
  parênteses nele nem comer os pontos do usuário oficial.
*/
const MASCARA_USUARIO: [string, string][] = [
  ['adv.pedro.montalvao', 'adv.pedro.montalvao'],
  ['@adv.pedro.montalvao', '@adv.pedro.montalvao'],
  ['  adv', 'adv'],
];

for (const [entrada, esperado] of MASCARA_USUARIO) {
  ok(
    formatarTelefone(entrada) === esperado,
    `formatarTelefone("${entrada}") devolveu "${formatarTelefone(entrada)}", esperava "${esperado}".`,
  );
}

for (const [entrada, esperado] of MASCARA) {
  ok(
    formatarTelefone(entrada) === esperado,
    `formatarTelefone("${entrada}") devolveu "${formatarTelefone(entrada)}", esperava "${esperado}".`,
  );
}

/*
  O que a máscara escreve tem de continuar valendo o mesmo veredito: se ela
  mexesse na ordem dos dígitos, o campo diria uma coisa e a conferência, outra.
*/
for (const numero of TELEFONES_OFICIAIS) {
  ok(
    conferirContato(formatarTelefone(numero.e164)).estado === 'oficial',
    `A máscara quebrou a conferência de ${numero.exibicao}.`,
  );
}

/*
  O nome de usuário do WhatsApp — o segundo jeito de encontrar o escritório, e
  o segundo jeito de imitá-lo. As variações abaixo são as que um perfil falso
  registra: ponto a menos, número no fim, palavra trocada.
*/
for (const forma of [
  USUARIO_WHATSAPP,
  `@${USUARIO_WHATSAPP}`,
  USUARIO_WHATSAPP.toUpperCase(),
  `  ${USUARIO_WHATSAPP}  `,
]) {
  const conferencia = conferirContato(forma);
  ok(
    conferencia.estado === 'oficial' && conferencia.via === 'usuario',
    `"${forma}" é o usuário oficial e não foi reconhecido (${conferencia.estado}).`,
  );
}

const USUARIOS_DIFERENTES = [
  'adv.pedromontalvao',
  'adv.pedro.montalvao1',
  'advpedro.montalvao',
  'dr.pedro.montalvao',
  'adv.pedro.montalvao.oficial',
  'pedro.montalvao',
  '@adv.pedro.montalvo',
];

for (const usuario of USUARIOS_DIFERENTES) {
  ok(
    conferirContato(usuario).estado === 'diferente',
    `"${usuario}" não é o usuário do escritório e passou como oficial.`,
  );
}

/* Começo do usuário oficial é digitação em curso, não reprovação. */
for (const parcial of ['adv', 'adv.', 'adv.pedro', '@adv.pedro.mont']) {
  ok(
    conferirContato(parcial).estado === 'incompleto',
    `"${parcial}" ainda é o começo do usuário oficial e já recebeu veredito.`,
  );
}

/*
  Nome de perfil não é resposta — nem para aprovar, nem para reprovar. O
  veredito próprio existe justamente porque o golpista copia o nome exato.
*/
for (const nome of [
  'Dr. Pedro Montalvão',
  'Pedro Montalvão Advocacia',
  'Dr Pedro Montalvao',
  'Montalvão',
  '(65) 98404-6375 Dr. Pedro',
]) {
  ok(
    conferirContato(nome).estado === 'nome',
    `"${nome}" é nome de perfil e recebeu veredito de ${conferirContato(nome).estado}.`,
  );
}

/* O usuário oficial não pode ser confundido com telefone em lugar nenhum. */
ok(
  /^[a-z0-9._]+$/.test(USUARIO_WHATSAPP),
  'O usuário oficial precisa estar em minúsculas, sem espaço e sem acento.',
);

console.log(`Auditoria do contato oficial concluída: ${verificacoes} verificações aprovadas.`);
