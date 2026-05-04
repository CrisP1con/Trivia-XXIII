import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import db from './database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = process.env.JWT_SECRET || "clave_secreta_por_defecto_escuela";

// ========== RATE LIMITING ==========
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Demasiadas peticiones desde esta IP, intente más tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ========== HELMET (CSP) ==========
// Desactivado temporalmente porque fuerza HTTPS en redes locales
/*
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "http://192.168.0.6:3001"],
      connectSrc: ["'self'", "capacitor://localhost", "http://localhost:3001", "http://192.168.0.6:3001"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "blob:", "data:", "http://192.168.0.6:3001"],
      upgradeInsecureRequests: null
    },
  },
}));
*/

// ========== CORS ==========
const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3001',
  'http://localhost:4173',
  'capacitor://localhost',
  'http://localhost',
  ...envOrigins
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://192.168.0.')) {
      callback(null, true);
    } else {
      console.warn(`[CORS Bloqueado]: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/videos', express.static(path.join(__dirname, '../public/videos')));

// ========== VIDEO STREAMING ==========
app.get('/api/stream-video/:filename', (req, res) => {
  // SEGURIDAD: Prevenir Path Traversal usando path.basename
  const safeFilename = path.basename(req.params.filename);
  const videoPath = path.join(__dirname, '../public/videos', safeFilename);
  if (!fs.existsSync(videoPath)) return res.status(404).json({ error: 'Video no encontrado' });

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    if (start >= fileSize) return res.status(416).send('Range not satisfiable');
    const chunksize = (end - start) + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    });
    fs.createReadStream(videoPath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Length': fileSize, 'Content-Type': 'video/mp4' });
    fs.createReadStream(videoPath).pipe(res);
  }
});

// ========== MULTER ==========
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/videos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // SEGURIDAD: Sanitizar la extensión del archivo para evitar inyección de .php, .html, etc.
    let ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
    if (!allowedExts.includes(ext)) ext = '.mp4'; // Fallback seguro
    
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // SEGURIDAD: Verificar el mimetype
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('El archivo debe ser un formato de video válido.'));
    }
  },
  limits: { fileSize: 500 * 1024 * 1024 }
});

app.post('/api/upload-video', authenticateToken, (req, res) => {
  upload.single('video')(req, res, (err) => {
    if (err instanceof multer.MulterError) return res.status(400).json({ error: `Multer: ${err.message}` });
    if (err) return res.status(500).json({ error: `Subida: ${err.message}` });
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo de video' });
    res.json({ url: `/api/stream-video/${req.file.filename}` });
  });
});

// ========== AUTH MIDDLEWARE ==========
function authenticateToken(req, res, next) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ========== HEALTH CHECK (HEARTBEAT) ==========
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ========== AUTH ==========
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Usuario y contraseña requeridos" });
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Credenciales inválidas" });
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Error de servidor" });
  }
});

// ========== GAME DATA ==========
app.get('/api/game-materias', async (req, res) => {
  try {
    const [materias] = await db.query("SELECT * FROM materias ORDER BY orden ASC");
    res.json(materias);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/game-data/:materiaId', async (req, res) => {
  try {
    const [mRows] = await db.query("SELECT * FROM materias WHERE id = ?", [req.params.materiaId]);
    const materia = mRows[0];
    if (!materia) return res.status(404).json({ error: "Materia no encontrada" });

    const [temas] = await db.query("SELECT * FROM temas WHERE materia_id = ? ORDER BY orden ASC", [req.params.materiaId]);
    const [allQuestions] = await db.query("SELECT * FROM questions");

    const stations = temas.map(tema => {
      const qs = allQuestions.filter(q => q.tema_id === tema.id);
      return {
        id: tema.id,
        title: tema.titulo,
        video: tema.video ? (tema.video.startsWith('/videos/') ? tema.video.replace('/videos/', '/api/stream-video/') : tema.video) : '',
        bridge: tema.texto_puente,
        questions: qs.map(q => ({
          id: q.id, prompt: q.prompt,
          options: JSON.parse(q.options || '[]'),
          answer: q.answer, explanation: q.explanation
        }))
      };
    }).filter(t => t.questions.length > 0);

    res.json({ title: materia.nombre, subtitle: "Instituto Juan XXIII — 60 años educando", stations });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/game-data', async (req, res) => {
  try {
    const [temas] = await db.query("SELECT * FROM temas ORDER BY orden ASC");
    const [allQuestions] = await db.query("SELECT * FROM questions");

    const stations = temas.map(tema => {
      const qs = allQuestions.filter(q => q.tema_id === tema.id);
      return {
        id: tema.id,
        title: tema.titulo,
        video: tema.video ? (tema.video.startsWith('/videos/') ? tema.video.replace('/videos/', '/api/stream-video/') : tema.video) : '',
        bridge: tema.texto_puente,
        questions: qs.map(q => ({
          id: q.id, prompt: q.prompt,
          options: JSON.parse(q.options || '[]'),
          answer: q.answer, explanation: q.explanation
        }))
      };
    }).filter(t => t.questions.length > 0);

    res.json({ title: "Instituto Juan XXIII", subtitle: "60 años educando con historia y futuro", stations });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========== CRUD MATERIAS ==========
app.get('/api/materias', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM materias ORDER BY orden ASC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/materias', authenticateToken, async (req, res) => {
  const { nombre, orden } = req.body;
  try {
    const [result] = await db.query("INSERT INTO materias (nombre, orden) VALUES (?, ?)", [nombre, orden || 0]);
    res.json({ id: result.insertId, nombre, orden });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/materias/:id', authenticateToken, async (req, res) => {
  const { nombre, orden } = req.body;
  try {
    await db.query("UPDATE materias SET nombre = ?, orden = ? WHERE id = ?", [nombre, orden || 0, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ON DELETE CASCADE en la FK elimina temas y questions automáticamente
app.delete('/api/materias/:id', authenticateToken, async (req, res) => {
  try {
    await db.query("DELETE FROM materias WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========== CRUD TEMAS ==========
app.get('/api/temas', async (req, res) => {
  const { materia_id } = req.query;
  try {
    const query = materia_id
      ? "SELECT * FROM temas WHERE materia_id = ? ORDER BY orden ASC"
      : "SELECT * FROM temas ORDER BY orden ASC";
    const params = materia_id ? [materia_id] : [];
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/temas', authenticateToken, async (req, res) => {
  const { materia_id, titulo, video, texto_puente, orden } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO temas (materia_id, titulo, video, texto_puente, orden) VALUES (?, ?, ?, ?, ?)",
      [materia_id, titulo, video || '', texto_puente || '', orden || 0]
    );
    res.json({ id: result.insertId, materia_id, titulo, video, texto_puente, orden });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/temas/:id', authenticateToken, async (req, res) => {
  const { materia_id, titulo, video, texto_puente, orden } = req.body;
  try {
    await db.query(
      "UPDATE temas SET materia_id = ?, titulo = ?, video = ?, texto_puente = ?, orden = ? WHERE id = ?",
      [materia_id, titulo, video || '', texto_puente || '', orden || 0, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ON DELETE CASCADE elimina questions del tema automáticamente
app.delete('/api/temas/:id', authenticateToken, async (req, res) => {
  try {
    await db.query("DELETE FROM temas WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========== CRUD QUESTIONS ==========
app.get('/api/questions', async (req, res) => {
  const { tema_id } = req.query;
  try {
    const query = tema_id ? "SELECT * FROM questions WHERE tema_id = ?" : "SELECT * FROM questions";
    const params = tema_id ? [tema_id] : [];
    const [rows] = await db.query(query, params);
    res.json(rows.map(r => ({ ...r, options: JSON.parse(r.options || '[]') })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/questions', authenticateToken, async (req, res) => {
  const { tema_id, prompt, options, answer, explanation } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO questions (tema_id, prompt, options, answer, explanation) VALUES (?, ?, ?, ?, ?)",
      [tema_id, prompt, JSON.stringify(options), answer, explanation]
    );
    res.json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/questions/:id', authenticateToken, async (req, res) => {
  const { tema_id, prompt, options, answer, explanation } = req.body;
  try {
    await db.query(
      "UPDATE questions SET tema_id = ?, prompt = ?, options = ?, answer = ?, explanation = ? WHERE id = ?",
      [tema_id, prompt, JSON.stringify(options), answer, explanation, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/questions/:id', authenticateToken, async (req, res) => {
  try {
    await db.query("DELETE FROM questions WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========== SETTINGS & SECURITY ==========
app.post('/api/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Todos los campos son obligatorios" });
  if (newPassword.length < 6) return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres" });

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [req.user.id]);
    const user = rows[0];
    if (!user) return res.status(500).json({ error: "Usuario no encontrado" });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: "La contraseña actual es incorrecta" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashed, req.user.id]);
    res.json({ success: true, message: "Contraseña actualizada correctamente" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========== LEGACY ==========
app.get('/api/stations', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM temas ORDER BY orden ASC");
    res.json(rows.map(r => ({ id: r.id, title: r.titulo, video: r.video, bridge: r.texto_puente, order: r.orden })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========== FRONTEND ESTÁTICO ==========
app.use(express.static(path.join(__dirname, '../dist')));
app.get(/.*/, (req, res) => {
  if (!req.url.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  } else {
    res.status(404).json({ error: "API route not found" });
  }
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error(err.stack);
  const message = process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message;
  res.status(err.status || 500).json({ error: message });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend funcionando en http://0.0.0.0:${PORT}`);
  console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[ERROR]: El puerto ${PORT} ya está ocupado.`);
  } else if (err.code === 'EACCES') {
    console.error(`[ERROR]: No tienes permisos para usar el puerto ${PORT}.`);
  } else {
    console.error(`[ERROR]: No se pudo arrancar el servidor:`, err);
  }
  process.exit(1);
});
