-- ============================================================
-- Historia App — Seed para MySQL
-- ============================================================
-- Uso: mysql -u root -p < server/seed.sql
-- O desde MySQL Workbench: ejecutar este archivo completo.
-- ============================================================

CREATE DATABASE IF NOT EXISTS historia_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE historia_app;

-- ============================================================
-- TABLA: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(100) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: materias (Nivel 1)
-- ============================================================
CREATE TABLE IF NOT EXISTS materias (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  orden  INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: temas (Nivel 2)
-- FK ON DELETE CASCADE: al borrar una materia, se borran sus temas
-- ============================================================
CREATE TABLE IF NOT EXISTS temas (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  materia_id   INT NOT NULL,
  titulo       VARCHAR(500) NOT NULL,
  video        VARCHAR(1000) DEFAULT '',
  texto_puente TEXT,
  orden        INT NOT NULL DEFAULT 0,
  INDEX idx_temas_materia (materia_id),
  CONSTRAINT fk_temas_materia
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: questions (Nivel 3)
-- options: JSON array almacenado como TEXT (desnormalización intencional,
--          las opciones no tienen existencia fuera de su pregunta).
-- FK ON DELETE CASCADE: al borrar un tema, se borran sus preguntas.
-- ============================================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DATOS DE EJEMPLO
-- El usuario admin se crea automáticamente al iniciar el servidor
-- usando las credenciales de ADMIN_USER y ADMIN_PASS en el .env
-- ============================================================

-- Materia de ejemplo
INSERT IGNORE INTO materias (nombre, orden) VALUES
  ('Historia Argentina', 1);

-- Tema de ejemplo (sin video, para verificar la conexión)
INSERT IGNORE INTO temas (materia_id, titulo, video, texto_puente, orden) VALUES
  (1, 'Revolución de Mayo', '', 'La Revolución de Mayo de 1810 marcó el inicio del proceso de independencia argentina.', 1);

-- Preguntas de ejemplo para el tema 1
INSERT IGNORE INTO questions (tema_id, prompt, options, answer, explanation) VALUES
  (1,
   '¿En qué año ocurrió la Revolución de Mayo?',
   '["1810","1816","1820","1806"]',
   0,
   'La Revolución de Mayo ocurrió el 25 de mayo de 1810.'),
  (1,
   '¿Qué crisis en España influyó en los hechos de 1810?',
   '["La invasión napoleónica","La Revolución Francesa","La unificación alemana","La Guerra de Crimea"]',
   0,
   'La invasión napoleónica debilitó a la monarquía española y generó una crisis de legitimidad.'),
  (1,
   '¿Qué organismo de gobierno reemplazó al Virrey Cisneros?',
   '["La Primera Junta","El Cabildo Abierto","El Congreso Nacional","La Audiencia Real"]',
   0,
   'La Primera Junta fue el primer gobierno patrio argentino, presidido por Cornelio Saavedra.');

-- ============================================================
-- FIN DEL SEED
-- Reiniciar el servidor para que cree el usuario admin
-- con las credenciales del archivo .env
-- ============================================================
