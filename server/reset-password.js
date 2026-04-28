import sqlite3Pkg from 'sqlite3';
const sqlite3 = sqlite3Pkg.verbose();
import path from 'path';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usar la misma lógica de ruta que database.js
const dbPath = process.env.DATABASE_PATH 
  ? path.resolve(process.env.DATABASE_PATH)
  : path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath);

const newUser = process.argv[2] || process.env.ADMIN_USER || 'admin';
const newPass = process.argv[3] || process.env.ADMIN_PASS || '123456';

async function resetPassword() {
  console.log(`[RESETEO] Intentando cambiar/crear usuario: ${newUser}...`);
  
  const hash = await bcrypt.hash(newPass, 10);
  
  db.get("SELECT id FROM users WHERE username = ?", [newUser], (err, row) => {
    if (row) {
      // Actualizar existente
      db.run("UPDATE users SET password = ? WHERE username = ?", [hash, newUser], (err) => {
        if (err) console.error("Error al actualizar:", err.message);
        else console.log(`✅ ¡Éxito! Contraseña actualizada para el usuario: ${newUser}`);
        db.close();
      });
    } else {
      // Crear nuevo
      db.run("INSERT INTO users (username, password) VALUES (?, ?)", [newUser, hash], (err) => {
        if (err) console.error("Error al crear:", err.message);
        else console.log(`✅ ¡Éxito! Usuario ${newUser} creado con la nueva contraseña.`);
        db.close();
      });
    }
  });
}

resetPassword();
