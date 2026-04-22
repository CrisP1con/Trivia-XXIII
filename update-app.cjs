const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const importLines = `import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GameView from "./game/GameView";
import MateriasManager from "./admin/MateriasManager";
import PreguntasManager from "./admin/PreguntasManager";`;

content = content.replace(/import React[\s\S]*?GameView";/, importLines);

const newAdminDashboard = `function AdminDashboard() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [stats, setStats] = useState({ materias: 0, videos: 0, preguntas: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    fetch("http://localhost:3001/api/game-data")
      .then(res => res.json())
      .then(data => {
        let materias = data.stations ? data.stations.length : 0;
        let videos = data.stations ? data.stations.filter(s => s.video && s.video !== "").length : 0;
        let preguntas = data.stations ? data.stations.reduce((acc, s) => acc + (s.questions ? s.questions.length : 0), 0) : 0;
        setStats({ materias, videos, preguntas });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (currentView === "dashboard") {
      fetchStats();
    }
  }, [currentView]);

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#0a0a0a", color: "white" }}>
      <div style={{ width: "250px", borderRight: "1px solid #333", padding: "2rem", backgroundColor: "#111" }}>
        <h2 style={{ color: "#fca5a5", marginBottom: "30px", cursor: "pointer" }} onClick={() => setCurrentView("dashboard")}>Panel Admin</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li onClick={() => setCurrentView("materias")} style={{ padding: "14px 10px", cursor: "pointer", color: currentView === "materias" ? "#fff" : "#ccc", background: currentView === "materias" ? "#222" : "transparent", borderBottom: "1px solid #333", fontWeight: "bold", borderRadius: "8px" }}>📚 Materias</li>
          <li onClick={() => setCurrentView("preguntas")} style={{ padding: "14px 10px", cursor: "pointer", color: currentView === "preguntas" ? "#fff" : "#ccc", background: currentView === "preguntas" ? "#222" : "transparent", borderBottom: "1px solid #333", fontWeight: "bold", borderRadius: "8px", marginTop: "10px" }}>❓ Preguntas</li>
        </ul>
      </div>
      <div style={{ padding: "3rem", flex: 1, backgroundColor: "#000", overflowY: "auto" }}>
        {currentView === "dashboard" && (
          <>
            <h1 style={{ marginBottom: "2rem", borderBottom: "1px solid #333", paddingBottom: "10px", color: "#fff" }}>Resumen General</h1>
            {loading ? <p style={{ color: "#9ca3af" }}>Cargando estadísticas...</p> : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
                <div style={{ backgroundColor: "#111", padding: "24px", borderRadius: "16px", border: "1px solid #333", textAlign: "center", boxShadow: "0 4px 6px rgba(0,0,0,0.3)" }}>
                  <h3 style={{ margin: "0 0 12px", color: "#9ca3af", fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "1px" }}>Materias</h3>
                  <p style={{ margin: 0, fontSize: "4rem", fontWeight: "900", color: "#fca5a5" }}>{stats.materias}</p>
                </div>
                <div style={{ backgroundColor: "#111", padding: "24px", borderRadius: "16px", border: "1px solid #333", textAlign: "center", boxShadow: "0 4px 6px rgba(0,0,0,0.3)" }}>
                  <h3 style={{ margin: "0 0 12px", color: "#9ca3af", fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "1px" }}>Videos</h3>
                  <p style={{ margin: 0, fontSize: "4rem", fontWeight: "900", color: "#93c5fd" }}>{stats.videos}</p>
                </div>
                <div style={{ backgroundColor: "#111", padding: "24px", borderRadius: "16px", border: "1px solid #333", textAlign: "center", boxShadow: "0 4px 6px rgba(0,0,0,0.3)" }}>
                  <h3 style={{ margin: "0 0 12px", color: "#9ca3af", fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "1px" }}>Preguntas</h3>
                  <p style={{ margin: 0, fontSize: "4rem", fontWeight: "900", color: "#6ee7b7" }}>{stats.preguntas}</p>
                </div>
              </div>
            )}
          </>
        )}
        {currentView === "materias" && <MateriasManager />}
        {currentView === "preguntas" && <PreguntasManager />}
      </div>
    </div>
  );
}`;

content = content.replace(/function AdminDashboard\(\) \{[\s\S]*?  \);\n\}/, newAdminDashboard);

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('App.jsx updated with view switching!');
