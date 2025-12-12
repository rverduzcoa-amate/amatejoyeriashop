#!/usr/bin/env node
// auto_insert_products_fixed.js — single clean implementation
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
function getFlag(names){
  for(const n of names){
    const i = argv.indexOf(n);
    if(i >= 0) return argv[i+1] === undefined ? true : argv[i+1];
  }
  return null;
}

const category = getFlag(['--category','-c']);
const dir = getFlag(['--dir','-d']);
const price = getFlag(['--price','-p']) || '$299';
const dry = !!getFlag(['--dry-run']);
const noBackup = !!getFlag(['--no-backup','--nobackup']);

if(!category || !dir){
  console.error('Usage: node tools/auto_insert_products_fixed.js --category aretes --dir media/img/aretes --price "$299" [--dry-run]');
  process.exit(1);
}

const repoRoot = path.join(__dirname, '..');
const productsPath = path.join(repoRoot, 'js', 'products.js');

if(!fs.existsSync(productsPath)){
  console.error('Could not find', productsPath);
  process.exit(1);
}

const dirPath = path.join(repoRoot, dir);
if(!fs.existsSync(dirPath)){
  console.error('Image directory not found:', dirPath);
  process.exit(1);
}

const files = fs.readdirSync(dirPath).filter(f => /\.(jpe?g|png)$/i.test(f));
if(files.length === 0){
  console.log('No jpg files found in', dir);
  process.exit(0);
}

const original = fs.readFileSync(productsPath, 'utf8');

function sanitizeId(base){
  return base.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g,'').toLowerCase();
}

function humanize(base){
  return base.replace(/[_\-\.\(\)]+/g,' ').replace(/\s+/g,' ').trim().split(' ').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
}

function alreadyExists(imgPath){
  return original.indexOf(imgPath) !== -1;
}

// Group files by canonical base name (remove trailing (1), (2), etc.)
const groups = new Map();
for(const f of files){
  const ext = path.extname(f);
  let base = path.basename(f, ext);
  const canonical = base.replace(/\(\d+\)$/, '').trim();
  const arr = groups.get(canonical) || [];
  arr.push(f);
  groups.set(canonical, arr);
}

const toAdd = [];
for(const [canonical, groupFiles] of groups){
  const relPaths = groupFiles.map(f => path.posix.join(dir.replace(/\\/g,'/'), f));
  const exists = relPaths.some(p => alreadyExists(p));
  if(exists) continue;

  const id = `${category.replace(/s$/i,'')}_${sanitizeId(canonical)}`;
  const nombre = humanize(canonical);
  // Always use an array for the `img` field to keep data consistent
  const imgField = JSON.stringify(relPaths);
  const entry = `{ id: "${id}", nombre: "${nombre}", precio: "${price}", img: ${imgField} }`;
  toAdd.push(entry);
}

if(toAdd.length === 0){
  console.log('No new images to add for', category);
  process.exit(0);
}

// Find the category array range using a bracket-balanced scan to avoid matching inner arrays
function findCategoryRange(text, key){
  const keyRe = new RegExp(`${key}\\s*:\\s*\\[`, 'm');
  const m = text.match(keyRe);
  if(!m) return null;
  const start = m.index + m[0].length - 1; // position of '['
  let depth = 0;
  for(let i = start; i < text.length; i++){
    const ch = text[i];
    if(ch === '[') depth++;
    else if(ch === ']'){
      depth--;
      if(depth === 0) {
        return {openIndex: start, closeIndex: i};
      }
    }
  }
  return null;
}

const range = findCategoryRange(original, category);
if(!range){
  console.error('Could not find top-level category array for', category);
  process.exit(1);
}

const before = original.slice(0, range.openIndex + 1);
const inside = original.slice(range.openIndex + 1, range.closeIndex).trim();
const after = original.slice(range.closeIndex);

let newInside = inside;
if(newInside.length > 0) newInside = newInside + ',\n' + toAdd.join(',\n');
else newInside = toAdd.join(',\n');

const updated = before + '\n' + newInside + '\n' + after;

console.log('Found', files.length, 'jpg files in', dir);
console.log('Will add', toAdd.length, 'new product(s) to category', category);
if(dry){
  console.log('Dry run enabled. Generated entries:\n');
  console.log(toAdd.join(',\n'));
  process.exit(0);
}

// backup (optional) and write
if(!noBackup){
  const ts = new Date().toISOString().replace(/[:.]/g,'-');
  const bakPath = productsPath + '.bak.' + ts;
  fs.copyFileSync(productsPath, bakPath);
  fs.writeFileSync(productsPath, updated, 'utf8');
  console.log('Inserted', toAdd.length, 'entries into', productsPath);
  console.log('Backup created at', bakPath);
} else {
  fs.writeFileSync(productsPath, updated, 'utf8');
  console.log('Inserted', toAdd.length, 'entries into', productsPath);
  console.log('No backup created (--no-backup)');
}
