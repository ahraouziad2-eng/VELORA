import sharp from 'sharp';
import { readFileSync } from 'fs';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const brandSrc = join(projectRoot, 'src/assets/brand');
const publicBrand = join(projectRoot, 'public/brand');
const assetsDir = join(projectRoot, 'assets');

mkdirSync(publicBrand, { recursive: true });
mkdirSync(assetsDir, { recursive: true });

async function generatePngs() {
  const iconSvg = readFileSync(join(brandSrc, 'velora-icon.svg'));
  const markSvg = readFileSync(join(brandSrc, 'velora-mark.svg'));
  const stackedSvg = readFileSync(join(brandSrc, 'velora-logo-stacked.svg'));

  // Web/PWA icons
  await sharp(iconSvg, { density: 512 }).resize(16, 16).png().toFile(join(publicBrand, 'favicon-16.png'));
  await sharp(iconSvg, { density: 512 }).resize(32, 32).png().toFile(join(publicBrand, 'favicon-32.png'));
  await sharp(iconSvg, { density: 512 }).resize(180, 180).png().toFile(join(publicBrand, 'apple-touch-icon.png'));
  await sharp(iconSvg, { density: 512 }).resize(192, 192).png().toFile(join(publicBrand, 'icon-192.png'));
  await sharp(iconSvg, { density: 512 }).resize(512, 512).png().toFile(join(publicBrand, 'icon-512.png'));

  // Android assets
  await sharp(iconSvg, { density: 512 }).resize(512, 512).png().toFile(join(assetsDir, 'icon-only.png'));

  // Icon foreground: mark on transparent, padded for adaptive icon safe zone
  const fgSize = 1024;
  const markSize = 660;
  const markPng = await sharp(markSvg, { density: 512 }).resize(markSize, markSize).png().toBuffer();
  await sharp({
    create: { width: fgSize, height: fgSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([{ input: markPng, top: (fgSize - markSize) / 2, left: (fgSize - markSize) / 2 }]).png().toFile(join(assetsDir, 'icon-foreground.png'));

  // Icon background: solid brand green
  await sharp({ create: { width: fgSize, height: fgSize, channels: 3, background: { r: 21, g: 128, b: 61 } } }).png().toFile(join(assetsDir, 'icon-background.png'));

  // Splash images (white bg with stacked logo centered)
  const splashW = 2732;
  const splashH = 2732;
  const logoSize = 600;
  const logoPng = await sharp(stackedSvg, { density: 300 }).resize(logoSize, logoSize).png().toBuffer();

  await sharp({ create: { width: splashW, height: splashH, channels: 3, background: { r: 255, g: 255, b: 255 } } })
    .composite([{ input: logoPng, top: (splashH - logoSize) / 2, left: (splashW - logoSize) / 2 }])
    .png().toFile(join(assetsDir, 'splash.png'));

  await sharp({ create: { width: splashW, height: splashH, channels: 3, background: { r: 11, g: 31, b: 20 } } })
    .composite([{ input: logoPng, top: (splashH - logoSize) / 2, left: (splashW - logoSize) / 2 }])
    .png().toFile(join(assetsDir, 'splash-dark.png'));

  console.log('Brand assets generated successfully.');
}

generatePngs().catch((err) => {
  console.error('Brand asset generation failed:', err);
  process.exit(1);
});
