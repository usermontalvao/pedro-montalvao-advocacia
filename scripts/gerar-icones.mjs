/**
 * Ícones do site a partir do símbolo da marca.
 *
 * O favicon anterior era a marca dourada sobre preto: em 32px, ouro fino sobre
 * fundo escuro vira um borrão — a aba do navegador não tem pixel sobrando para
 * gradiente. Aqui o símbolo entra em preto sobre o papel do site, que é o
 * contraste mais alto que a marca permite e o único que sobrevive tanto na aba
 * clara quanto na escura.
 *
 * O desenho é o mesmo arquivo que o cabeçalho usa (`simbolo-logo.png`), então
 * trocar a marca lá e rodar `npm run icones` mantém tudo alinhado.
 */
import { Buffer } from 'node:buffer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SIMBOLO = path.join(RAIZ, 'public', 'midia', 'simbolo-logo.png');
const PUBLICO = path.join(RAIZ, 'public');

const PAPEL = '#fbf9f5';
const TINTA = '#0e0e10';

/*
  Quanto do quadrado o símbolo ocupa. Em 32px ele precisa de quase toda a área
  para as balanças continuarem legíveis; nos tamanhos grandes, a margem maior é
  o que dá ar ao ícone no launcher.
*/
const ICONES = [
  { arquivo: 'favicon-32.png', tamanho: 32, ocupacao: 0.94, raio: 0.16 },
  { arquivo: 'icone-180.png', tamanho: 180, ocupacao: 0.82, raio: 0.22 },
  { arquivo: 'icone-192.png', tamanho: 192, ocupacao: 0.82, raio: 0.22 },
  { arquivo: 'icone-512.png', tamanho: 512, ocupacao: 0.8, raio: 0.22 },
];

/** O símbolo em preto chapado, sem as bordas transparentes do arquivo original. */
async function simboloPreto(origem) {
  const recortado = await sharp(origem).ensureAlpha().trim({ threshold: 10 }).toBuffer();
  const { data, info } = await sharp(recortado).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  // Só o canal alfa importa: o desenho vira uma silhueta preta, o que elimina
  // qualquer cinza de anti-aliasing sujo vindo do PNG original.
  for (let i = 0; i < data.length; i += info.channels) {
    data[i] = 0x0e;
    data[i + 1] = 0x0e;
    data[i + 2] = 0x10;
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png()
    .toBuffer();
}

function mascaraArredondada(tamanho, raio) {
  const r = Math.round(tamanho * raio);
  return Buffer.from(
    `<svg width="${tamanho}" height="${tamanho}"><rect width="${tamanho}" height="${tamanho}" rx="${r}" ry="${r}" fill="#fff"/></svg>`,
  );
}

/**
 * Gera os quatro ícones a partir do símbolo.
 *
 * Exportada porque o `optimize-media.mjs` também precisa dela: os ícones são
 * refeitos toda vez que a marca é reprocessada, e duas implementações diferentes
 * do mesmo ícone acabariam divergindo na primeira troca de logo.
 */
export async function gerarIcones({ simbolo = SIMBOLO, destino = PUBLICO } = {}) {
  const preto = await simboloPreto(simbolo);

  for (const { arquivo, tamanho, ocupacao, raio } of ICONES) {
    const alvo = Math.round(tamanho * ocupacao);
    const desenho = await sharp(preto)
      .resize(alvo, alvo, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const base = await sharp({
      create: { width: tamanho, height: tamanho, channels: 4, background: PAPEL },
    })
      .composite([{ input: desenho, gravity: 'center' }])
      .png()
      .toBuffer();

    await sharp(base)
      .composite([{ input: mascaraArredondada(tamanho, raio), blend: 'dest-in' }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(destino, arquivo));
  }

  return ICONES.map((icone) => icone.arquivo);
}

// Rodado direto pela linha de comando (`npm run icones`), e não importado.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arquivos = await gerarIcones();
  for (const arquivo of arquivos) console.log(`  ícone  ${arquivo}`);
  console.log(`\n✓ ${arquivos.length} ícones gerados em public/ — símbolo ${TINTA} sobre ${PAPEL}.`);
}
