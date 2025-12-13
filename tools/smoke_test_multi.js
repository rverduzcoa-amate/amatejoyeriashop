const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const root = process.cwd();
const indexPath = path.join(root, 'index.html');
const manifestPath = path.join(root, 'media', 'image-manifest.json');

function read(p) { return fs.readFileSync(path.resolve(p), 'utf8'); }

if (!fs.existsSync(indexPath)) { console.error('index.html not found'); process.exit(2); }
if (!fs.existsSync(manifestPath)) { console.error('manifest not found'); process.exit(2); }

const indexHtml = read(indexPath);
const manifest = JSON.parse(read(manifestPath));

const dom = new JSDOM(indexHtml, { runScripts: 'outside-only', resources: 'usable' });
const { window } = dom;

// Polyfill requestAnimationFrame for the JSDOM environment used in smoke tests.
// The app uses chunked rendering via requestAnimationFrame; without this,
// scripts throw ReferenceError in Node. Provide a minimal rAF implementation.
if (typeof window.requestAnimationFrame !== 'function') {
    let lastTime = 0;
    window.requestAnimationFrame = function(cb) {
        const now = Date.now();
        const next = Math.max(lastTime + 16, now);
        const id = setTimeout(() => { cb(next); }, next - now);
        lastTime = next;
        return id;
    };
    window.cancelAnimationFrame = function(id) { clearTimeout(id); };
}

const ctx = vm.createContext(window);
window.global = window; window.console = console;

function evalScript(relPath) {
    const file = path.join(root, relPath);
    if (!fs.existsSync(file)) return;
    const src = read(file);
    const script = new vm.Script(src, { filename: relPath });
    script.runInContext(ctx);
}

// Load required scripts (same order as index.html)
['js/videos.js','js/products.js','js/category_videos.js','js/main.js','js/categories.js','js/newArrivals.js','js/product.js']
    .forEach(evalScript);

window.imageManifest = manifest;

// Detect categories from VM context
let keys = [];
try { keys = vm.runInContext("(typeof products !== 'undefined' ? Object.keys(products) : [])", ctx); } catch (e) { keys = []; }
if (!keys || keys.length === 0) { console.error('No categories found'); process.exit(3); }

const results = [];
const max = Math.min(keys.length, 8);
for (let i=0;i<max;i++) {
    const cat = keys[i];
    try {
        // clear products container
        const cont = window.document.getElementById('products');
        if (cont) cont.innerHTML = '';
        if (typeof window.showCategory === 'function') window.showCategory(cat);

        const firstCard = window.document.querySelector('.card');
        const pic = firstCard ? firstCard.querySelector('picture') : null;
        const img = pic ? pic.querySelector('img') : (firstCard ? firstCard.querySelector('img') : null);

        results.push({
            category: cat,
            cardFound: !!firstCard,
            pictureFound: !!pic,
            imgSrc: img ? img.getAttribute('src') : null,
            imgDataSrc: img ? img.getAttribute('data-src') : null,
            imgSrcset: img ? img.getAttribute('srcset') : null,
            imgSizes: img ? img.getAttribute('sizes') : null,
        });
    } catch (e) {
        results.push({ category: cat, error: String(e) });
    }
}

console.log('SMOKE_MULTI_RESULT:\n', JSON.stringify(results, null, 2));
process.exit(0);
