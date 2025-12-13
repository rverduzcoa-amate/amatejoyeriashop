const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

function read(p) { return fs.readFileSync(path.join(root, p), 'utf8'); }

// Load products.js into VM to extract the `products` const
const productsSrc = read('js/products.js');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(productsSrc + '\n;globalThis.__products = products;', sandbox);
const products = sandbox.__products || {};

// Load manifest
const manifestPath = path.join(root, 'media', 'image-manifest.json');
if (!fs.existsSync(manifestPath)) { console.error('Manifest missing:', manifestPath); process.exit(1); }
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

function normalizeManifestPath(p) {
  if (!p) return p;
  return p.replace(/^(?:\.\.\/)+/, '');
}

function fileSize(p) {
  try { return fs.statSync(p).size; } catch (e) { return 0; }
}

const report = {};
for (const cat of Object.keys(products)) {
  const items = products[cat];
  let originalBytes = 0, optimizedBytes = 0, count = 0;
  for (const prod of items) {
    const allImgs = Array.isArray(prod.img) ? prod.img : (prod.img ? [prod.img] : []);
    if (allImgs.length === 0) continue;
    const src = allImgs[0];
    const origPath = path.join(root, src.replace(/^\//,''));
    const origSize = fileSize(origPath);
    originalBytes += origSize;

    // Manifest key is the original path (as in manifest): typically 'media/img/...'
    const key = src.replace(/^\//,'');
    const entry = manifest[key];
    if (entry && entry.default) {
      const optRel = normalizeManifestPath(entry.default);
      const optPath = path.join(root, optRel.replace(/^\//,''));
      optimizedBytes += fileSize(optPath);
    } else {
      // fallback: no manifest entry — assume original
      optimizedBytes += origSize;
    }
    count++;
  }
  report[cat] = { count, originalBytes, optimizedBytes, reductionBytes: originalBytes - optimizedBytes, reductionPercent: originalBytes>0 ? Math.round((1 - optimizedBytes/originalBytes)*10000)/100 : 0 };
}

console.log(JSON.stringify(report, null, 2));
