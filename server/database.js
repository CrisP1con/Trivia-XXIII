import sqlite3Pkg from 'sqlite3';
const sqlite3 = sqlite3Pkg.verbose();
import path from 'path';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Tabla de usuarios (Admin)
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`);

    // Tabla de materias (nivel 1: Historia, Matemáticas, Lengua, etc.)
    db.run(`CREATE TABLE IF NOT EXISTS materias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      orden INTEGER DEFAULT 0
    )`);

    // Tabla de temas (nivel 2: dentro de una materia, ej: "Revolución de Mayo")
    db.run(`CREATE TABLE IF NOT EXISTS temas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      materia_id INTEGER,
      titulo TEXT,
      video TEXT,
      texto_puente TEXT,
      orden INTEGER DEFAULT 0,
      FOREIGN KEY (materia_id) REFERENCES materias (id)
    )`);

    // Tabla de preguntas (nivel 3: dentro de un tema)
    db.run(`CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tema_id INTEGER,
      prompt TEXT,
      options TEXT,
      answer INTEGER,
      explanation TEXT,
      FOREIGN KEY (tema_id) REFERENCES temas (id)
    )`);

    // Migrar datos de stations viejas si existen
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='stations'", (err, row) => {
      if (row) {
        // Asegurar que questions tenga la columna tema_id
        db.run("ALTER TABLE questions ADD COLUMN tema_id INTEGER", (alterErr) => {
          // Ignorar error si la columna ya existe
          
          db.get("SELECT COUNT(*) as count FROM materias", (err, r) => {
            if (r && r.count === 0) {
              console.log("Migrando datos de stations al nuevo modelo...");
              db.run("INSERT INTO materias (nombre, orden) VALUES ('Historia', 1)", function(err) {
                if (err) return;
                const materiaId = this.lastID;
                
                db.all("SELECT * FROM stations ORDER BY \"order\" ASC", (err, stations) => {
                  if (!stations || stations.length === 0) return;
                  
                  let migrated = 0;
                  stations.forEach(station => {
                    db.run(
                      "INSERT INTO temas (materia_id, titulo, video, texto_puente, orden) VALUES (?, ?, ?, ?, ?)",
                      [materiaId, station.title, station.video, station.bridge, station.order],
                      function(err) {
                        if (err) return;
                        const temaId = this.lastID;
                        
                        // Migrar preguntas de esta station al nuevo tema
                        db.run(
                          "UPDATE questions SET tema_id = ? WHERE station_id = ?",
                          [temaId, station.id],
                          () => {
                            migrated++;
                            if (migrated === stations.length) {
                              console.log("Migración completada: " + migrated + " temas migrados.");
                            }
                          }
                        );
                      }
                    );
                  });
                });
              });
            }
          });
        });
      }
    });

    // Crear un usuario admin por defecto si no existe
    db.get("SELECT id FROM users WHERE username = 'admin'", async (err, row) => {
      if (!row) {
        const hash = await bcrypt.hash('123456', 10);
        db.run("INSERT INTO users (username, password) VALUES ('admin', ?)", [hash]);
        console.log("Usuario por defecto creado: admin / 123456");
      }
    });
  });
}

export default db;
