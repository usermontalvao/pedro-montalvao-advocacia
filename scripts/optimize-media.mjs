/**
 * Prepara as mídias do escritório para a web.
 *
 * As originais são pesadas demais para um site que precisa agradar o Google:
 * a foto do advogado tem 3120x4160 e quase 1 MB. Aqui elas viram WebP em dois
 * tamanhos, e o logotipo ganha uma versão branca (recolorida a partir do alfa
 * do PNG original) para usar sobre fundo escuro.
 *
 * Rode de novo sempre que trocar alguma foto:  npm run midias
 */
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, '..');
const DESTINO = path.join(RAIZ, 'public', 'midia');

// Pasta com os arquivos que o escritório já usava no site antigo.
const ORIGEM = process.env.MIDIA_ORIGEM
  || path.join(process.env.HOME ?? '', 'Downloads', '_public_html');

/*
  `origem: 'downloads'` aponta para a pasta de Downloads do usuário — é de lá
  que vêm as fotos novas do escritório. As demais continuam saindo do pacote
  do site antigo.
*/
const FOTOS = [
  {
    de: '11515709905921039226.jpeg',
    origem: 'downloads',
    para: 'retrato-home',
    larguras: [720, 1376],
    qualidade: 84,
  },
  {
    de: '10537598191604023049.jpeg',
    origem: 'downloads',
    para: 'retrato-institucional',
    larguras: [720, 1376],
    qualidade: 84,
  },
  {
    de: '11439253925460798358.jpeg',
    origem: 'downloads',
    para: 'atendimento-online',
    larguras: [720, 1024],
    qualidade: 84,
  },
  {
    de: '17283843579800063352.jpeg',
    origem: 'downloads',
    para: 'atendimento-escritorio',
    larguras: [720, 1400],
    qualidade: 84,
  },
  {
    de: '10713177436469709073.jpeg',
    origem: 'downloads',
    para: 'conteudo-juridico',
    larguras: [720, 1376],
    qualidade: 84,
  },
  {
    de: '10450579546458349772.jpeg',
    origem: 'downloads',
    para: 'sede-atendimento',
    larguras: [720, 1400],
    qualidade: 84,
  },
  {
    de: '9587379170594195253.jpeg',
    origem: 'downloads',
    para: 'retrato-pedro-montalvao',
    larguras: [720, 1376],
    qualidade: 84,
  },
  { de: 'escritorio.webp', para: 'escritorio-cuiaba', larguras: [720, 1400], qualidade: 80 },
];

const DOWNLOADS = path.join(process.env.HOME ?? '', 'Downloads');

const LOGOS = [
  { de: 'advogado/new_logo.png', para: 'logo-horizontal.png', largura: 1123 },
  { de: 'advogado/MARCA DAGUA ORIGINAL.png', para: 'marca-dourada.png', largura: 1000 },
];

/** Mesmo desenho do logotipo, pintado de branco: mantém só o recorte do alfa. */
async function versaoBranca(entrada, saida) {
  const { width, height } = await sharp(entrada).metadata();
  await sharp({
    create: { width, height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: entrada, blend: 'dest-in' }])
    .png({ compressionLevel: 9 })
    .toFile(saida);
}

async function principal() {
  await fs.mkdir(DESTINO, { recursive: true });

  for (const foto of FOTOS) {
    const entrada = path.join(foto.origem === 'downloads' ? DOWNLOADS : ORIGEM, foto.de);
    for (const largura of foto.larguras) {
      const sufixo = largura === Math.max(...foto.larguras) ? '' : `-${largura}`;
      const saida = path.join(DESTINO, `${foto.para}${sufixo}.webp`);
      await sharp(entrada)
        .rotate()
        .resize(largura, null, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: foto.qualidade })
        .toFile(saida);
      console.log('foto  ', path.basename(saida));
    }
  }

  for (const logo of LOGOS) {
    const entrada = path.join(ORIGEM, logo.de);
    const saida = path.join(DESTINO, logo.para);
    await sharp(entrada)
      .resize(logo.largura, null, { fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toFile(saida);
    console.log('logo  ', path.basename(saida));
  }

  await versaoBranca(
    path.join(ORIGEM, 'advogado/new_logo.png'),
    path.join(DESTINO, 'logo-horizontal-branco.png'),
  );
  console.log('logo   logo-horizontal-branco.png');

  // Favicon e ícone do app: o mesmo emblema vetorial usado no cabeçalho,
  // rasterizado sobre o grafite da marca.
  for (const tamanho of [180, 192, 512]) {
    await sharp(Buffer.from(iconeSvg(tamanho, true)))
      .png({ compressionLevel: 9 })
      .toFile(path.join(RAIZ, 'public', `icone-${tamanho}.png`));
  }
  await fs.writeFile(path.join(RAIZ, 'public', 'favicon.svg'), iconeSvg(64, true), 'utf8');
  console.log('ícones icone-180/192/512.png + favicon.svg');

  await imagemDeCompartilhamento();
  console.log('social og-imagem.png');
}

/**
 * O ícone da marca: as iniciais na mesma serifada do logotipo, sobre o
 * grafite. Num favicon de 32px o nome inteiro seria ilegível — as iniciais
 * com o filete dourado mantêm a identidade e continuam reconhecíveis.
 */
function iconeSvg(tamanho, comFundo) {
  const fundo = comFundo ? '<rect width="64" height="64" rx="13" fill="#0e0e10"/>' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="ouro" x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
      <stop stop-color="#E8D4A6"/><stop offset="0.5" stop-color="#C9A86A"/><stop offset="1" stop-color="#8F7238"/>
    </linearGradient>
  </defs>
  ${fundo}
  <text x="32" y="39" text-anchor="middle" font-family="Optima, Georgia, serif"
        font-size="26" font-weight="600" letter-spacing="2.4" fill="url(#ouro)">PM</text>
  <path d="M17 48h30" stroke="url(#ouro)" stroke-width="1.4" stroke-linecap="round"/>
</svg>`;
}

/**
 * Imagem que aparece quando alguém cola um link do site no WhatsApp, no
 * Facebook ou no LinkedIn. 1200x630 é o formato que todos recortam bem.
 */
async function imagemDeCompartilhamento() {
  const largura = 1200;
  const altura = 630;

  const fundo = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}">
      <defs>
        <radialGradient id="brilho" cx="78%" cy="16%" r="62%">
          <stop offset="0%" stop-color="#c9a86a" stop-opacity="0.34"/>
          <stop offset="100%" stop-color="#0e0e10" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="fio" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#8f7238"/>
          <stop offset="50%" stop-color="#c9a86a"/>
          <stop offset="100%" stop-color="#e8d4a6"/>
        </linearGradient>
      </defs>
      <rect width="${largura}" height="${altura}" fill="#0e0e10"/>
      <rect width="${largura}" height="${altura}" fill="url(#brilho)"/>
      <rect x="0" y="0" width="${largura}" height="6" fill="url(#fio)"/>
      <text x="86" y="118" font-family="Optima, Georgia, serif" font-size="30" font-weight="600" letter-spacing="4.6" fill="#f0ece4">PEDRO MONTALVÃO</text>
      <path d="M88 140h330" stroke="#c9a86a" stroke-width="1.2"/>
      <text x="88" y="168" font-family="Helvetica, Arial, sans-serif" font-size="13" letter-spacing="8" fill="#c9a86a">ADVOCACIA</text>

      <text x="86" y="352" font-family="Georgia, serif" font-size="60" fill="#f0ece4">Advocacia em Cuiabá</text>
      <text x="86" y="426" font-family="Georgia, serif" font-size="60" fill="#c9a86a">orientação para decisões importantes</text>
      <text x="86" y="506" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#a9a49a">Trabalhista · Previdenciário · Consumidor · Família</text>
      <text x="86" y="556" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#c9a86a">WhatsApp (65) 98404-6375</text>
    </svg>
  `);

  await sharp(fundo)
    .png()
    .toFile(path.join(RAIZ, 'public', 'og-imagem.png'));
}

principal().catch((erro) => {
  console.error('Falhou ao preparar as mídias:', erro.message);
  console.error('Aponte a pasta de origem com MIDIA_ORIGEM=/caminho npm run midias');
  process.exit(1);
});
