const express = require('express');
const sqlite = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'wedding-admin-secret-dev';

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

const db = new sqlite('admin-portal.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password_hash TEXT,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone TEXT,
    attendance TEXT,
    dietary_restrictions TEXT,
    plus_ones INTEGER DEFAULT 0,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uploader_name TEXT,
    uploader_email TEXT,
    caption TEXT,
    url TEXT,
    approved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS guest_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

app.use(cors());
app.use(express.json());
app.use('/public', express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.static('.'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error();
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

const ALLOWED_EMAILS = ['lakshminamburi@yahoo.com', 'vnamboori@yahoo.com', 'sparx.sandeep@gmail.com', 'chamanthiaki5@gmail.com'];

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!ALLOWED_EMAILS.includes(email)) return res.status(403).json({ error: 'Email not authorized' });
  
  try {
    const hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO admin_users (email, password_hash, name) VALUES (?, ?, ?)');
    stmt.run(email, hash, name);
    res.json({ message: 'Registered successfully' });
  } catch (e) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { name: user.name, email: user.email } });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, name, email FROM admin_users WHERE id = ?').get(req.user.id);
  res.json(user);
});

app.post('/api/rsvps', (req, res) => {
  const { name, email, phone, attendance, dietary_restrictions, plus_ones, message } = req.body;
  const stmt = db.prepare('INSERT INTO rsvps (name, email, phone, attendance, dietary_restrictions, plus_ones, message) VALUES (?, ?, ?, ?, ?, ?, ?)');
  stmt.run(name, email, phone, attendance, dietary_restrictions, plus_ones || 0, message);
  res.json({ message: 'RSVP submitted' });
});

app.get('/api/rsvps', auth, (req, res) => {
  const { search } = req.query;
  let q = 'SELECT * FROM rsvps ORDER BY created_at DESC';
  if (search) {
    q = `SELECT * FROM rsvps WHERE name LIKE '%${search}%' OR email LIKE '%${search}%' ORDER BY created_at DESC`;
  }
  res.json(db.prepare(q).all());
});

app.patch('/api/rsvps/:id', auth, (req, res) => {
  db.prepare('UPDATE rsvps SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
  res.json({ message: 'Updated' });
});

app.delete('/api/rsvps/:id', auth, (req, res) => {
  db.prepare('DELETE FROM rsvps WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

app.post('/api/photos', upload.single('photo'), (req, res) => {
  const { uploader_name, uploader_email, caption } = req.body;
  const url = '/uploads/' + req.file.filename;
  db.prepare('INSERT INTO photos (uploader_name, uploader_email, caption, url) VALUES (?, ?, ?, ?)')
    .run(uploader_name, uploader_email, caption, url);
  res.json({ message: 'Photo uploaded' });
});

app.get('/api/photos', auth, (req, res) => res.json(db.prepare('SELECT * FROM photos ORDER BY created_at DESC').all()));
app.patch('/api/photos/:id', auth, (req, res) => res.json(db.prepare('UPDATE photos SET approved = ? WHERE id = ?').run(req.body.approved ? 1 : 0, req.params.id)));
app.delete('/api/photos/:id', auth, (req, res) => {
  const photo = db.prepare('SELECT url FROM photos WHERE id = ?').get(req.params.id);
  if (photo && fs.existsSync('.' + photo.url)) fs.unlinkSync('.' + photo.url);
  res.json(db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id));
});
app.get('/api/photos/approved', (req, res) => res.json(db.prepare('SELECT * FROM photos WHERE approved = 1 ORDER BY created_at DESC').all()));

app.post('/api/messages', (req, res) => res.json(db.prepare('INSERT INTO guest_messages (name, email, message) VALUES (?, ?, ?)').run(req.body.name, req.body.email, req.body.message)));
app.get('/api/messages', auth, (req, res) => res.json(db.prepare('SELECT * FROM guest_messages ORDER BY created_at DESC').all()));
app.delete('/api/messages/:id', auth, (req, res) => res.json(db.prepare('DELETE FROM guest_messages WHERE id = ?').run(req.params.id)));

app.get('/api/dashboard/stats', auth, (req, res) => {
  const rsvpCount = db.prepare('SELECT COUNT(*) as c FROM rsvps').get().c;
  const attendingCount = db.prepare('SELECT COUNT(*) as c FROM rsvps WHERE attendance = "yes"').get().c;
  const photoCount = db.prepare('SELECT COUNT(*) as c FROM photos').get().c;
  const unapprovedPhotos = db.prepare('SELECT COUNT(*) as c FROM photos WHERE approved = 0').get().c;
  res.json({ rsvpCount, attendingCount, photoCount, unapprovedPhotos });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
