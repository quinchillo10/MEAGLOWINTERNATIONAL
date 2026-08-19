const fs = require('fs');
const path = require('path');

const incomingDir = path.join(__dirname, 'incoming');
const imagesDir = path.join(__dirname, 'assets', 'images');
const manifestFile = path.join(imagesDir, 'manifest.json');

const categories = ['housekeeping','security','warehouse','plumbing','drivers','construction','plant','professional'];
const exts = ['.jpg','.jpeg','.png','.webp'];

if (!fs.existsSync(incomingDir)) {
  console.log('Create an `incoming` folder and place images there. No files to process.');
  process.exit(0);
}

const files = fs.readdirSync(incomingDir).filter(f => exts.includes(path.extname(f).toLowerCase()));
if (!files.length) {
  console.log('No image files found in incoming/.');
  process.exit(0);
}

if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

let manifest = {};
if (fs.existsSync(manifestFile)) {
  try { manifest = JSON.parse(fs.readFileSync(manifestFile,'utf8')); } catch(e){ manifest = {}; }
}

for (const file of files) {
  const src = path.join(incomingDir, file);
  const timestamp = Date.now();
  const safeName = `${timestamp}-${file.replace(/[^a-zA-Z0-9.-]/g,'_')}`;
  const dest = path.join(imagesDir, safeName);
  fs.renameSync(src, dest);

  const lname = file.toLowerCase();
  let key = 'misc';
  for (const c of categories) if (lname.includes(c)) { key = c; break; }

  if (!manifest[key]) manifest[key] = { images: [], primary: safeName };
  manifest[key].images.push(safeName);
  if (!manifest[key].primary) manifest[key].primary = safeName;

  console.log(`Imported ${file} -> assets/images/${safeName} (key: ${key})`);
}

fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
console.log('Updated manifest at assets/images/manifest.json');
