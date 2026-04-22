import sqlite3Pkg from 'sqlite3';
const sqlite3 = sqlite3Pkg.verbose();
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'server/database.sqlite');

const db = new sqlite3.Database(dbPath);

const gameData = {
  stations: [
    {
      title: "Revolución de Mayo",
      video: "/videos/mayo.mp4",
      bridge: "1810. Cuando el viejo orden empezó a crujir y apareció la idea de un gobierno propio.",
      questions: [
        {
          prompt: "¿Qué crisis en España influyó en los hechos de 1810?",
          options: ["La invasión napoleónica", "La Revolución rusa", "La unificación alemana", "La Guerra Fría"],
          answer: 0,
          explanation: "La invasión napoleónica debilitó a la monarquía española y generó una crisis de legitimidad."
        },
        {
          prompt: "¿Qué institución fue clave en los hechos de mayo?",
          options: ["Cabildo", "Senado", "Corte Suprema", "CGT"],
          answer: 0,
          explanation: "El Cabildo Abierto fue central en el debate político de mayo de 1810."
        },
        {
          prompt: "La Primera Junta significó...",
          options: ["La independencia total inmediata", "Un primer gobierno local", "El fin de las provincias", "Una monarquía criolla"],
          answer: 1,
          explanation: "No fue todavía la independencia formal, pero sí un paso decisivo hacia el autogobierno."
        },
        {
          prompt: "¿Cuál fue una figura destacada de ese proceso?",
          options: ["Manuel Belgrano", "Julio A. Roca", "Juan Perón", "Domingo F. Sarmiento"],
          answer: 0,
          explanation: "Belgrano fue protagonista del proceso revolucionario y de la etapa posterior."
        }
      ]
    },
    {
      title: "Independencia de 1816",
      video: "/videos/independencia.mp4",
      bridge: "Lo que comenzó en 1810 necesitaba una afirmación clara: romper formalmente con España.",
      questions: [
        {
          prompt: "¿Dónde se declaró la independencia?",
          options: ["Buenos Aires", "Córdoba", "San Miguel de Tucumán", "Mendoza"],
          answer: 2,
          explanation: "La declaración de la independencia se realizó en San Miguel de Tucumán."
        },
        {
          prompt: "¿En qué fecha se declaró la independencia?",
          options: ["25 de mayo", "9 de julio", "20 de junio", "12 de octubre"],
          answer: 1,
          explanation: "La independencia se declaró el 9 de julio de 1816."
        },
        {
          prompt: "¿Qué buscaba consolidar la independencia?",
          options: ["La dependencia económica", "La autonomía política", "La guerra interna", "El poder virreinal"],
          answer: 1,
          explanation: "La independencia consolidaba la autonomía política frente a España."
        },
        {
          prompt: "¿Qué idea está en el centro de este acontecimiento?",
          options: ["Soberanía", "Virreinato", "Esclavitud", "Imperio"],
          answer: 0,
          explanation: "La soberanía es una idea central para comprender la independencia."
        }
      ]
    }
  ]
};

db.serialize(() => {
  db.get("SELECT COUNT(*) as count FROM stations", (err, row) => {
    if (row.count === 0) {
      console.log("Poblando base de datos con datos semilla...");
      let order = 0;
      gameData.stations.forEach(station => {
        order++;
        db.run(`INSERT INTO stations (title, video, bridge, "order") VALUES (?, ?, ?, ?)`, 
          [station.title, station.video, station.bridge, order], function(err) {
            if (err) return console.error(err);
            const stationId = this.lastID;
            
            station.questions.forEach(q => {
              db.run(`INSERT INTO questions (station_id, prompt, options, answer, explanation) VALUES (?, ?, ?, ?, ?)`,
                [stationId, q.prompt, JSON.stringify(q.options), q.answer, q.explanation]);
            });
        });
      });
      console.log("Semilla terminada.");
    } else {
      console.log("La DB ya tiene datos.");
    }
  });
});
