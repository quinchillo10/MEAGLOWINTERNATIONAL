const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

const publicDir = path.join(__dirname);
const imagesDir = path.join(publicDir, 'assets', 'images');
const manifestPath = path.join(imagesDir, 'manifest.json');

// ensure images dir exists
if(!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: process.env.SESSION_SECRET || 'meaglow-secret', resave: false, saveUninitialized: false }));
app.use(express.static(publicDir));

// simple session-based auth (defaults can be overridden with env vars)
const ADMIN_USER = process.env.ADMIN_USER || 'Meaglowltd';
const ADMIN_PASS = process.env.ADMIN_PASS || 'AWndungu2021';

function requireAuth(req, res, next){
  if(req.session && req.session.user === ADMIN_USER) return next();
  if(req.path.startsWith('/api')) return res.status(401).json({ error: 'Unauthorized' });
  return res.redirect('/admin-login.html');
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random()*1e9);
    const ext = path.extname(file.originalname) || '.png';
    cb(null, file.fieldname + '-' + unique + ext);
  }
});

function fileFilter(req, file, cb){
  if(!file.mimetype || !file.mimetype.startsWith('image/')){
    return cb(new Error('Invalid file type'), false);
  }
  cb(null, true);
}

const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

app.get('/admin', requireAuth, (req, res) => {
  res.sendFile(path.join(publicDir, 'admin.html'));
});

// login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if(username === ADMIN_USER && password === ADMIN_PASS){
    req.session.user = ADMIN_USER;
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/logout', (req, res) => {
  req.session.destroy(()=>res.json({ ok: true }));
});

// contact form handler - persist messages and redirect to thank-you
app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  if(!name || !email || !message) return res.status(400).send('Missing fields');
  const dataDir = path.join(publicDir, 'assets', 'data');
  if(!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const messagesPath = path.join(dataDir, 'messages.json');
  let messages = [];
  if(fs.existsSync(messagesPath)){
    try{ messages = JSON.parse(fs.readFileSync(messagesPath)); }catch(e){ messages = []; }
  }
  messages.push({ name, email, message, receivedAt: new Date().toISOString() });
  fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));
  return res.redirect('/thank-you.html');
});

// upload multiple images for a key
app.post('/upload', requireAuth, upload.array('images', 10), async (req, res) => {
  const key = req.body.key;
  if(!key || !req.files || req.files.length === 0){
    return res.status(400).json({ error: 'Missing key or files' });
  }

  // load or create manifest
  let manifest = {};
  if(fs.existsSync(manifestPath)){
    try { manifest = JSON.parse(fs.readFileSync(manifestPath)); } catch(e){ manifest = {}; }
  }

  if(!manifest[key]) manifest[key] = { images: [], primary: null };

  const uploaded = [];
  for(const file of req.files){
    const filepath = path.join(imagesDir, file.filename);
    try{
      // resize for web (max width 1200) and overwrite
      await sharp(filepath).resize({ width: 1200, withoutEnlargement: true }).toFile(filepath + '.tmp');
      fs.renameSync(filepath + '.tmp', filepath);
      // create thumbnail
      const thumb = path.join(imagesDir, 'thumb-' + file.filename);
      await sharp(filepath).resize({ width: 320 }).toFile(thumb);
    } catch(e){
      console.error('Image processing failed', e);
    }

    manifest[key].images.push(file.filename);
    uploaded.push(file.filename);
    if(!manifest[key].primary) manifest[key].primary = file.filename;
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  res.json({ ok: true, key, uploaded });
});

// set primary image for a key
app.post('/set-primary', requireAuth, (req, res) => {
  const { key, filename } = req.body;
  if(!key || !filename) return res.status(400).json({ error: 'Missing key or filename' });
  let manifest = {};
  if(fs.existsSync(manifestPath)){
    try{ manifest = JSON.parse(fs.readFileSync(manifestPath)); }catch(e){manifest={}}}
  if(!manifest[key] || !manifest[key].images.includes(filename)) return res.status(400).json({ error: 'Image not found for key' });
  manifest[key].primary = filename;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  res.json({ ok: true, key, primary: filename });
});

// delete an image for a key
app.post('/delete-image', requireAuth, (req, res) => {
  const { key, filename } = req.body;
  if(!key || !filename) return res.status(400).json({ error: 'Missing key or filename' });
  let manifest = {};
  if(fs.existsSync(manifestPath)){
    try{ manifest = JSON.parse(fs.readFileSync(manifestPath)); }catch(e){manifest={}}}
  if(!manifest[key] || !manifest[key].images.includes(filename)) return res.status(400).json({ error: 'Image not found for key' });
  // remove file and thumbnail
  const filePath = path.join(imagesDir, filename);
  const thumbPath = path.join(imagesDir, 'thumb-' + filename);
  try{ if(fs.existsSync(filePath)) fs.unlinkSync(filePath); }catch(e){}
  try{ if(fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath); }catch(e){}

  manifest[key].images = manifest[key].images.filter(f=>f!==filename);
  if(manifest[key].primary === filename){
    manifest[key].primary = manifest[key].images.length ? manifest[key].images[0] : null;
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  res.json({ ok: true, key });
});

// reorder images for a key
app.post('/reorder-images', requireAuth, (req, res) => {
  const { key, images } = req.body;
  if(!key || !Array.isArray(images)) return res.status(400).json({ error: 'Missing key or images array' });
  let manifest = {};
  if(fs.existsSync(manifestPath)){
    try{ manifest = JSON.parse(fs.readFileSync(manifestPath)); }catch(e){manifest={}}}
  if(!manifest[key]) return res.status(400).json({ error: 'Key not found' });
  // ensure images are a permutation of existing images
  const existing = manifest[key].images || [];
  const valid = images.every(i=>existing.includes(i)) && images.length === existing.length;
  if(!valid) return res.status(400).json({ error: 'Invalid images array' });
  manifest[key].images = images;
  if(!images.includes(manifest[key].primary)) manifest[key].primary = images[0] || null;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  res.json({ ok: true, key });
});

// update per-job requirements (admin only)
app.post('/api/jobs/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  const { requirements, title } = req.body;
  const jobsPath = path.join(publicDir, 'assets', 'data', 'jobs.json');
  let jobs = {};
  if(fs.existsSync(jobsPath)){
    try{ jobs = JSON.parse(fs.readFileSync(jobsPath)); } catch(e){ jobs = {}; }
  }
  if(!jobs[id]) jobs[id] = { title: title || id, requirements: [] };
  if(Array.isArray(requirements)){
    jobs[id].requirements = requirements;
  }
  if(title) jobs[id].title = title;
  fs.writeFileSync(jobsPath, JSON.stringify(jobs, null, 2));
  res.json({ ok: true, id });
});

app.listen(PORT, () => console.log(`MeaGlow server running at http://localhost:${PORT}`));
