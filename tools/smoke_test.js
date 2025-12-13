const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

function read(p) { return fs.readFileSync(path.resolve(p), 'utf8'); }

const root = process.cwd();
const indexPath = path.join(root, 'index.html');
const manifestPath = path.join(root, 'media', 'image-manifest.json');

if (!fs.existsSync(indexPath)) {
    console.error('index.html not found at', indexPath); process.exit(2);
}
if (!fs.existsSync(manifestPath)) {
    console.error('manifest not found at', manifestPath); process.exit(2);
}

const indexHtml = read(indexPath);
const manifest = JSON.parse(read(manifestPath));

const dom = new JSDOM(indexHtml, { runScripts: 'outside-only', resources: 'usable' });
const { window } = dom;

// Provide a minimal console and timers in the VM context
const ctx = vm.createContext(window);
window.global = window;
window.console = console;

// Helper to evaluate a script file into the window context
function evalScript(relPath) {
    const file = path.join(root, relPath);
    if (!fs.existsSync(file)) {
        console.warn('Skipping missing', relPath); return;
    }
    const src = read(file);
    const script = new vm.Script(src, { filename: relPath });
    script.runInContext(ctx);
}

// Load product data and main runtime
evalScript('js/products.js');
evalScript('js/videos.js');
evalScript('js/category_videos.js');
evalScript('js/main.js');

// Attach manifest to window as the browser code expects
window.imageManifest = manifest;

// Determine available categories from the VM context (top-level `const products` may not be a
// property of `window`, so query the VM context directly).
let keys = [];
try {
    keys = vm.runInContext("(typeof products !== 'undefined' ? Object.keys(products) : [])", ctx);
} catch (e) { keys = []; }
const testCategory = keys[0];
if (!testCategory) {
    console.error('No categories found in products'); process.exit(3);
}

// Call showCategory to build DOM nodes
if (typeof window.showCategory === 'function') {
    try {
        window.showCategory(testCategory);
    } catch (e) {
        console.error('showCategory threw:', e);
        process.exit(4);
    }
} else {
    console.error('showCategory not defined'); process.exit(5);
}

// Inspect the first rendered card
const firstCard = window.document.querySelector('.card');
if (!firstCard) {
    console.error('No product cards rendered'); process.exit(6);
}

const pic = firstCard.querySelector('picture');
const img = pic ? pic.querySelector('img') : firstCard.querySelector('img');

const result = {
    category: testCategory,
    cardFound: !!firstCard,
    pictureFound: !!pic,
    imgSrc: img ? img.getAttribute('src') : null,
    imgDataSrc: img ? img.getAttribute('data-src') : null,
    imgSrcset: img ? img.getAttribute('srcset') : null,
    imgSizes: img ? img.getAttribute('sizes') : null,
};

console.log('SMOKE_TEST_RESULT:\n', JSON.stringify(result, null, 2));
process.exit(0);
