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
import { gerarIcones } from './gerar-icones.mjs';
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
    de: '11203320946907841446.jpeg',
    origem: 'downloads',
    para: 'video-conferencia',
    larguras: [720, 1376],
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
  {
    de: '14794753527133858660.jpeg',
    origem: 'downloads',
    para: 'area-trabalhista',
    larguras: [720, 1376],
    qualidade: 82,
  },
  {
    de: '15001162875298710121.jpeg',
    origem: 'downloads',
    para: 'area-previdenciaria',
    larguras: [720, 1376],
    qualidade: 82,
  },
  {
    de: '4799986149596935486.jpeg',
    origem: 'downloads',
    para: 'area-consumidor',
    larguras: [720, 1376],
    qualidade: 82,
  },
  {
    de: '11875979752770185470.jpeg',
    origem: 'downloads',
    para: 'area-familia',
    larguras: [720, 1376],
    qualidade: 82,
  },
  { de: 'escritorio.webp', para: 'escritorio-cuiaba', larguras: [720, 1400], qualidade: 80 },
  /*
    A arte do alerta de golpe é a única que já nasce dentro do repositório: ela
    não veio do acervo do escritório antigo nem de uma foto do celular. O
    original fica em `public/midia/alerta-golpe-cena.png` e é daqui que saem as
    duas versões WebP que o herói usa — a original PNG pesa alguns megabytes e
    nunca deve ser servida ao visitante.
  */
  {
    de: 'alerta-golpe-cena.png',
    origem: 'midia',
    para: 'alerta-golpe-cena',
    larguras: [900, 1600],
    qualidade: 78,
  },
];

const DOWNLOADS = path.join(process.env.HOME ?? '', 'Downloads');

const LOGOS = [
  {
    de: 'logo-site-institucional.png',
    origem: 'downloads',
    para: 'logo-horizontal.png',
    largura: 766,
  },
  { de: 'advogado/MARCA DAGUA ORIGINAL.png', para: 'marca-dourada.png', largura: 1000 },
];

/** Corta uma fração da imagem, em proporção — não em pixels do original. */
async function recortar(imagem, { esquerda = 0, direita = 0, topo = 0, base = 0 }) {
  const { width, height } = await sharp(imagem).metadata();
  const left = Math.round(width * esquerda);
  const top = Math.round(height * topo);
  return sharp(imagem)
    .extract({
      left,
      top,
      width: Math.round(width * (1 - esquerda - direita)),
      height: Math.round(height * (1 - topo - base)),
    })
    .toBuffer();
}

/** Mesmo desenho do logotipo, pintado de branco: mantém só o recorte do alfa. */
async function versaoBranca(entrada, saida, largura) {
  const preparacao = sharp(entrada).resize(largura ?? null, null, {
    fit: 'inside',
    withoutEnlargement: true,
  });
  const mascara = await preparacao.png().toBuffer();
  const { width, height } = await sharp(mascara).metadata();
  await sharp({
    create: { width, height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: mascara, blend: 'dest-in' }])
    .png({ compressionLevel: 9 })
    .toFile(saida);
}

async function principal() {
  await fs.mkdir(DESTINO, { recursive: true });

  for (const foto of FOTOS) {
    const pasta =
      foto.origem === 'downloads' ? DOWNLOADS : foto.origem === 'midia' ? DESTINO : ORIGEM;
    const entrada = path.join(pasta, foto.de);

    /*
      Arte que ainda não chegou à pasta não derruba a rodada inteira: as outras
      dezesseis imagens continuam sendo geradas, e o aviso diz qual falta.
    */
    if (!(await fs.stat(entrada).catch(() => null))) {
      console.log('faltou', foto.de);
      continue;
    }

    const original = await sharp(entrada).rotate().toBuffer();
    const fonte = foto.recorte ? await recortar(original, foto.recorte) : original;

    for (const largura of foto.larguras) {
      const sufixo = largura === Math.max(...foto.larguras) ? '' : `-${largura}`;
      const saida = path.join(DESTINO, `${foto.para}${sufixo}.webp`);
      await sharp(fonte)
        .resize(largura, null, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: foto.qualidade })
        .toFile(saida);
      console.log('foto  ', path.basename(saida));
    }
  }

  for (const logo of LOGOS) {
    const entrada = path.join(logo.origem === 'downloads' ? DOWNLOADS : ORIGEM, logo.de);
    const saida = path.join(DESTINO, logo.para);
    await sharp(entrada)
      .resize(logo.largura, null, { fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toFile(saida);
    console.log('logo  ', path.basename(saida));
  }

  await versaoBranca(
    path.join(DOWNLOADS, 'logo-site-institucional.png'),
    path.join(DESTINO, 'logo-horizontal-branco.png'),
  );
  console.log('logo   logo-horizontal-branco.png');

  // Favicon e ícones usam o símbolo oficial, sem redesenho ou tipografia substituta.
  const simbolo = path.join(DOWNLOADS, 'LOGO (2).png');
  await sharp(simbolo)
    .resize(512, null, { fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(path.join(DESTINO, 'simbolo-logo.png'));
  await versaoBranca(simbolo, path.join(DESTINO, 'simbolo-logo-branco.png'), 512);
  console.log('logo   simbolo-logo.png + simbolo-logo-branco.png');

  // Um gerador só para os ícones, compartilhado com `npm run icones`.
  const icones = await gerarIcones({ simbolo: path.join(DESTINO, 'simbolo-logo.png') });
  console.log(`ícones ${icones.join(' + ')}`);

  await imagemDeCompartilhamento();
  console.log('social og-imagem.png');
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
