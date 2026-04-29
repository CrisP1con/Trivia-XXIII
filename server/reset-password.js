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
});

const newUser = process.argv[2] || process.env.ADMIN_USER || 'admin';
const newPass = process.argv[3] || process.env.ADMIN_PASS || '123456';

async function resetPassword() {
  console.log(`[RESETEO] Cambiando/creando usuario: ${newUser}...`);
  const hash = await bcrypt.hash(newPass, 10);

  const [rows] = await pool.query("SELECT id FROM users WHERE username = ?", [newUser]);
  if (rows.length > 0) {
    await pool.query("UPDATE users SET password = ? WHERE username = ?", [hash, newUser]);
    console.log(`✅ Contraseña actualizada para: ${newUser}`);
  } else {
    await pool.query("INSERT INTO users (username, password) VALUES (?, ?)", [newUser, hash]);
    console.log(`✅ Usuario ${newUser} creado correctamente.`);
  }
  await pool.end();
}

resetPassword().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
