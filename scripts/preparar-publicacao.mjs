import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(RAIZ, 'dist');
const PACOTE = path.join(RAIZ, 'site-hostinger.zip');

const arquivosObrigatorios = [
  'index.html',
  '.htaccess',
  'robots.txt',
  'sitemap.xml',
  'calculadoras/index.html',
  'calculadoras/calculadora-rescisao-trabalhista/index.html',
  'calculadoras/calculadora-pensao-alimenticia/index.html',
  'calculadoras/calculadora-fgts/index.html',
];

for (const arquivo of arquivosObrigatorios) {
  await fs.access(path.join(DIST, arquivo));
}

await fs.rm(PACOTE, { force: true });
execFileSync('zip', ['-qr', PACOTE, '.'], { cwd: DIST, stdio: 'inherit' });

const paginas = [];
async function contarPaginas(diretorio) {
  for (const entrada of await fs.readdir(diretorio, { withFileTypes: true })) {
    const destino = path.join(diretorio, entrada.name);
    if (entrada.isDirectory()) await contarPaginas(destino);
    else if (entrada.name === 'index.html') paginas.push(destino);
  }
}
await contarPaginas(DIST);

const tamanho = (await fs.stat(PACOTE)).size / 1024 / 1024;
console.log(`Pacote pronto: ${PACOTE}`);
console.log(`${paginas.length} páginas HTML · ${tamanho.toFixed(1)} MB`);
console.log('Na Hostinger, extraia o conteúdo deste ZIP diretamente dentro de public_html.');
