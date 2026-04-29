import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'historia_app',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  timezone: '+00:00'
});

async function initDb() {
  try {
    // --- Tabla: users ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id       INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // --- Tabla: materias (nivel 1) ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS materias (
        id     INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        orden  INT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // --- Tabla: temas (nivel 2) ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS temas (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        materia_id  INT NOT NULL,
        titulo      VARCHAR(500) NOT NULL,
        video       VARCHAR(1000) DEFAULT '',
        texto_puente TEXT,
        orden       INT NOT NULL DEFAULT 0,
        INDEX idx_temas_materia (materia_id),
        CONSTRAINT fk_temas_materia
          FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // --- Tabla: questions (nivel 3) ---
    // NOTA DE NORMALIZACIÓN: "options" se guarda como JSON (TEXT).
    // Las opciones no tienen existencia independiente de la pregunta,
    // siempre son exactamente 4 y se consumen en conjunto.
    // Esto es una desnormalización intencional (justificada).
    // La FK ON DELETE CASCADE evita huérfanos sin lógica manual en la app.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        tema_id     INT NOT NULL,
        prompt      TEXT NOT NULL,
        options     TEXT NOT NULL COMMENT 'JSON array con las 4 opciones',
        answer      INT NOT NULL DEFAULT 0 COMMENT 'Índice 0-3 de la opción correcta',
        explanation TEXT,
        INDEX idx_questions_tema (tema_id),
        CONSTRAINT fk_questions_tema
          FOREIGN KEY (tema_id) REFERENCES temas(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('[DB]: Tablas MySQL verificadas/creadas correctamente.');

    // --- Usuario admin por defecto ---
    const defaultUser = process.env.ADMIN_USER || 'admin';
    const defaultPass = process.env.ADMIN_PASS || '123456';
    const [rows] = await pool.query('SELECT id FROM users WHERE username = ?', [defaultUser]);
    if (rows.length === 0) {
      const hash = await bcrypt.hash(defaultPass, 10);
      await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [defaultUser, hash]);
      console.log(`[Seguridad]: Usuario por defecto creado: ${defaultUser}`);
    } else {
      console.log(`[DB]: Usuario '${defaultUser}' ya existe.`);
    }

  } catch (err) {
    console.error('[DB Error] No se pudo inicializar la base de datos:', err.message);
    process.exit(1);
  }
}

// Conectar y verificar antes de exportar
pool.getConnection()
  .then(conn => {
    console.log('[DB]: Conectado a MySQL correctamente.');
    conn.release();
    return initDb();
  })
  .catch(err => {
    console.error('[DB]: Error de conexión a MySQL:', err.message);
    console.error('Verificá las variables DB_HOST, DB_USER, DB_PASS, DB_NAME en el .env');
    process.exit(1);
  });

export default pool;
