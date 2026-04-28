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

// Limite de peticiones para prevenir DoS y fuerza bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite cada IP a 100 peticiones por ventana
  message: { error: "Demasiadas peticiones desde esta IP, intente más tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar limite a las rutas de la API
app.use('/api/', limiter);

// Configuración de Seguridad de Cabeceras (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "http://192.168.0.6:3001"], // Ajustar IP si es necesario
      connectSrc: ["'self'", "capacitor://localhost", "http://localhost:3001", "http://192.168.0.6:3001"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "blob:", "data:", "http://192.168.0.6:3001"],
      upgradeInsecureRequests: [],
    },
  },
}));

// CORS restringido a orígenes conocidos y dinámicos desde .env
const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

const allowedOrigins = [
  'http://localhost:5173', // Vite Dev
  'http://localhost:3001', // Producción Web
  'http://localhost:4173', // Vite Preview
  'capacitor://localhost', // Android/iOS
  'http://localhost',      // iOS local
  ...envOrigins
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir si no hay origen (como el APK), si está en la lista o si es red local (clases)
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

// Servir videos de forma básica (estática) - Mantenido por compatibilidad
app.use('/videos', express.static(path.join(__dirname, '../public/videos')));

// ========== RUTA OPTIMIZADA DE VIDEO (Streaming con Buffering) ==========
app.get('/api/stream-video/:filename', (req, res) => {
  const filename = req.params.filename;
  const videoPath = path.join(__dirname, '../public/videos', filename);

  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: 'Video no encontrado' });
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
      return;
    }

    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Configuración de Multer para videos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/videos');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de video.'));
    }
  },
  limits: { fileSize: 500 * 1024 * 1024 } // Límite 500MB
});

app.post('/api/upload-video', authenticateToken, (req, res) => {
  upload.single('video')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer Error:", err);
      return res.status(400).json({ error: `Error de Multer: ${err.message}` });
    } else if (err) {
      console.error("Upload Error:", err);
      return res.status(500).json({ error: `Error de subida: ${err.message}` });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo de video' });
    }

    console.log("Archivo subido con éxito:", req.file.filename);
    res.json({ url: `/api/stream-video/${req.file.filename}` });
  });
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ========== AUTH ==========
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña requeridos" });
  }
  
  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err) return res.status(500).json({ error: "Error de servidor" });
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: "Credenciales inválidas" });
    
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token });
  });
});

// ========== GAME DATA ==========

// Todas las materias disponibles (para pantalla de selección)
app.get('/api/game-materias', (req, res) => {
  db.all("SELECT * FROM materias ORDER BY orden ASC", [], (err, materias) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(materias);
  });
});

// Datos del juego para UNA materia específica
app.get('/api/game-data/:materiaId', (req, res) => {
  const { materiaId } = req.params;
  
  db.get("SELECT * FROM materias WHERE id = ?", [materiaId], (err, materia) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!materia) return res.status(404).json({ error: "Materia no encontrada" });
    
    db.all("SELECT * FROM temas WHERE materia_id = ? ORDER BY orden ASC", [materiaId], (err, temas) => {
      if (err) return res.status(500).json({ error: err.message });
      
      db.all("SELECT * FROM questions", [], (err, allQuestions) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const formattedTemas = temas.map(tema => {
          const temaQuestions = allQuestions.filter(q => q.tema_id === tema.id);
          return {
            id: tema.id,
            title: tema.titulo,
            video: tema.video ? (tema.video.startsWith('/videos/') ? tema.video.replace('/videos/', '/api/stream-video/') : tema.video) : '',
            bridge: tema.texto_puente,
            questions: temaQuestions.map(q => ({
              id: q.id,
              prompt: q.prompt,
              options: JSON.parse(q.options),
              answer: q.answer,
              explanation: q.explanation
            }))
          };
        }).filter(t => t.questions.length > 0); // Solo temas con preguntas
        
        res.json({
          title: materia.nombre,
          subtitle: "Instituto Juan XXIII — 60 años educando",
          stations: formattedTemas
        });
      });
    });
  });
});

// Legacy: game-data sin filtro (devuelve todo)
app.get('/api/game-data', (req, res) => {
  db.all("SELECT * FROM temas ORDER BY orden ASC", [], (err, temas) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.all("SELECT * FROM questions", [], (err, allQuestions) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const formattedTemas = temas.map(tema => {
        const temaQuestions = allQuestions.filter(q => q.tema_id === tema.id);
        return {
          id: tema.id,
          title: tema.titulo,
          video: tema.video ? (tema.video.startsWith('/videos/') ? tema.video.replace('/videos/', '/api/stream-video/') : tema.video) : '',
          bridge: tema.texto_puente,
          questions: temaQuestions.map(q => ({
            id: q.id,
            prompt: q.prompt,
            options: JSON.parse(q.options),
            answer: q.answer,
            explanation: q.explanation
          }))
        };
      }).filter(t => t.questions.length > 0);
      
      res.json({
        title: "Instituto Juan XXIII",
        subtitle: "60 años educando con historia y futuro",
        stations: formattedTemas
      });
    });
  });
});

// ========== CRUD MATERIAS ==========
app.get('/api/materias', (req, res) => {
  db.all("SELECT * FROM materias ORDER BY orden ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/materias', authenticateToken, (req, res) => {
  const { nombre, orden } = req.body;
  db.run("INSERT INTO materias (nombre, orden) VALUES (?, ?)", 
    [nombre, orden || 0], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, nombre, orden });
  });
});

app.put('/api/materias/:id', authenticateToken, (req, res) => {
  const { nombre, orden } = req.body;
  db.run("UPDATE materias SET nombre = ?, orden = ? WHERE id = ?", 
    [nombre, orden || 0, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
  });
});

app.delete('/api/materias/:id', authenticateToken, (req, res) => {
  // Borrar preguntas de los temas de esta materia
  db.all("SELECT id FROM temas WHERE materia_id = ?", [req.params.id], (err, temas) => {
    const temaIds = temas ? temas.map(t => t.id) : [];
    if (temaIds.length > 0) {
      db.run(`DELETE FROM questions WHERE tema_id IN (${temaIds.join(',')})`, () => {
        db.run("DELETE FROM temas WHERE materia_id = ?", [req.params.id], () => {
          db.run("DELETE FROM materias WHERE id = ?", [req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
          });
        });
      });
    } else {
      db.run("DELETE FROM materias WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
    }
  });
});

// ========== CRUD TEMAS ==========
app.get('/api/temas', (req, res) => {
  const { materia_id } = req.query;
  let query = "SELECT * FROM temas";
  let params = [];
  
  if (materia_id) {
    query += " WHERE materia_id = ?";
    params.push(materia_id);
  }
  
  query += " ORDER BY orden ASC";
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/temas', authenticateToken, (req, res) => {
  const { materia_id, titulo, video, texto_puente, orden } = req.body;
  db.run("INSERT INTO temas (materia_id, titulo, video, texto_puente, orden) VALUES (?, ?, ?, ?, ?)", 
    [materia_id, titulo, video || '', texto_puente || '', orden || 0], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, materia_id, titulo, video, texto_puente, orden });
  });
});

app.put('/api/temas/:id', authenticateToken, (req, res) => {
  const { materia_id, titulo, video, texto_puente, orden } = req.body;
  db.run("UPDATE temas SET materia_id = ?, titulo = ?, video = ?, texto_puente = ?, orden = ? WHERE id = ?", 
    [materia_id, titulo, video || '', texto_puente || '', orden || 0, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
  });
});

app.delete('/api/temas/:id', authenticateToken, (req, res) => {
  db.run("DELETE FROM questions WHERE tema_id = ?", [req.params.id], () => {
    db.run("DELETE FROM temas WHERE id = ?", [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// ========== CRUD QUESTIONS ==========
app.get('/api/questions', (req, res) => {
  const { tema_id } = req.query;
  let query = "SELECT * FROM questions";
  let params = [];
  
  if (tema_id) {
    query += " WHERE tema_id = ?";
    params.push(tema_id);
  }
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const parsedRows = rows.map(r => ({ ...r, options: JSON.parse(r.options || '[]') }));
    res.json(parsedRows);
  });
});

app.post('/api/questions', authenticateToken, (req, res) => {
  const { tema_id, prompt, options, answer, explanation } = req.body;
  db.run("INSERT INTO questions (tema_id, prompt, options, answer, explanation) VALUES (?, ?, ?, ?, ?)", 
    [tema_id, prompt, JSON.stringify(options), answer, explanation], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
  });
});

app.put('/api/questions/:id', authenticateToken, (req, res) => {
  const { tema_id, prompt, options, answer, explanation } = req.body;
  db.run("UPDATE questions SET tema_id = ?, prompt = ?, options = ?, answer = ?, explanation = ? WHERE id = ?", 
    [tema_id, prompt, JSON.stringify(options), answer, explanation, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
  });
});

app.delete('/api/questions/:id', authenticateToken, (req, res) => {
  db.run("DELETE FROM questions WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ========== SETTINGS & SECURITY ==========
app.post('/api/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres" });
  }

  db.get("SELECT * FROM users WHERE id = ?", [userId], async (err, user) => {
    if (err || !user) return res.status(500).json({ error: "Usuario no encontrado" });

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "La contraseña actual es incorrecta" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    db.run("UPDATE users SET password = ? WHERE id = ?", [hashedNewPassword, userId], (err) => {
      if (err) return res.status(500).json({ error: "Error al actualizar la contraseña" });
      res.json({ success: true, message: "Contraseña actualizada correctamente" });
    });
  });
});

// ========== LEGACY (backward compat) ==========
app.get('/api/stations', (req, res) => {
  db.all("SELECT * FROM temas ORDER BY orden ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Map to old format for backward compat
    res.json(rows.map(r => ({ id: r.id, title: r.titulo, video: r.video, bridge: r.texto_puente, order: r.orden })));
  });
});

// Servir archivos estáticos del Frontend (Production)
app.use(express.static(path.join(__dirname, '../dist')));

// Manejar cualquier otra ruta devolviendo el index.html del frontend (para React Router)
app.get(/.*/, (req, res) => {
  // Solo si no es una ruta de API que no existe
  if (!req.url.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  } else {
    res.status(404).json({ error: "API route not found" });
  }
});

// Manejador de errores global para evitar fugas de información
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Ocurrió un error interno en el servidor' 
    : err.message;
    
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`Backend funcionando en http://localhost:${PORT}`);
  console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
});
