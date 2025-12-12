#!/usr/bin/env node
// Generate responsive image variants (webp/avif) and a manifest for client-side srcset
// Usage: node tools/generate_responsive_images.js --src media/img --out media/optimized --manifest media/image-manifest.json

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const argv = require('minimist')(process.argv.slice(2));
const SRC = argv.src || path.join(__dirname, '..', 'media', 'img');
const OUT = argv.out || path.join(__dirname, '..', 'media', 'optimized');
const MANIFEST = argv.manifest || path.join(__dirname, '..', 'media', 'image-manifest.json');

const SIZES = [320, 640, 1024];
const FORMATS = ['webp','avif'];

function walk(dir) {
  const files = [];
  (function _walk(d){
    const entries = fs.readdirSync(d,{ withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d,e.name);
      if (e.isDirectory()) _walk(full);
      else files.push(full);
    }
  })(dir);
  return files;
}

async function ensureDir(p){
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

async function processFile(file) {
  const rel = path.relative(SRC, file).split(path.sep).join('/');
  const name = path.basename(file, path.extname(file));
  const outDir = path.join(OUT, path.dirname(rel));
  await ensureDir(outDir);

  const variants = [];
  for (const size of SIZES) {
    for (const fmt of FORMATS) {
      const outName = `${name}-${size}.${fmt}`;
      const outPath = path.join(outDir, outName);
      try {
        await sharp(file).resize({ width: size }).toFormat(fmt, { quality: 80 }).toFile(outPath);
        variants.push({ src: path.posix.join(path.posix.relative(path.join(__dirname,'..'), outPath).split(path.sep).join('/')), width: size, format: fmt });
      } catch (err) {
        console.error('Error processing', file, err.message);
      }
    }
  }

  // also produce a small placeholder jpeg for immediate src
  const placeholderName = `${name}-placeholder.jpg`;
  const placeholderPath = path.join(outDir, placeholderName);
  try {
    await sharp(file).resize({ width: 32 }).jpeg({ quality: 50 }).toFile(placeholderPath);
  } catch (e) {}

  return { original: path.posix.join('media','img', rel), variants, placeholder: path.posix.join(path.posix.relative(path.join(__dirname,'..'), placeholderPath).split(path.sep).join('/')) };
}

(async () => {
  console.log('Scanning', SRC);
  const all = walk(SRC).filter(f => /\.(jpe?g|png)$/i.test(f));
  const manifest = {};
  for (const f of all) {
    const entry = await processFile(f);
    // Build srcset for webp (prefer webp) and fallback jpeg/avif
    const webp = entry.variants.filter(v=>v.format==='webp').map(v=>`${v.src} ${v.width}w`).join(', ');
    const avif = entry.variants.filter(v=>v.format==='avif').map(v=>`${v.src} ${v.width}w`).join(', ');
    manifest[entry.original] = {
      placeholder: entry.placeholder,
      srcset_webp: webp,
      srcset_avif: avif,
      sizes: '(max-width: 600px) 50vw, 33vw'
    };
    console.log('Processed', entry.original);
  }

  await ensureDir(path.dirname(MANIFEST));
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('Manifest written to', MANIFEST);
})();
