import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, BookOpen, HelpCircle, FolderOpen,
  Moon, Sun, Database, Server,
  PlayCircle, Layers, LogOut, Lock
} from "lucide-react";
import GameView from "./game/GameView";
import MateriasManager from "./admin/MateriasManager";
import TemasManager from "./admin/TemasManager";
import PreguntasManager from "./admin/PreguntasManager";
import "./admin.css";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Si ya está autenticado, redirigir
  useEffect(() => {
    if (localStorage.getItem("admin_token")) {
      navigate("/admin");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      localStorage.setItem("admin_token", data.token);
      navigate("/admin");
    } catch (err) {
      setError("No se pudo conectar con el servidor");
      setLoading(false);
    }
  };

  return (
    <div className="admin-container" style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "400px", textAlign: "center" }}>
        <img src="/logo.png" alt="Logo" style={{ height: "120px", display: "block", margin: "0 auto 24px" }} />
        <h1 style={{ color: "#fff", fontSize: "1.5rem", marginBottom: "8px" }}>Panel de Administración</h1>
        <p style={{ color: "#6C7293", marginBottom: "32px", fontSize: "0.9rem" }}>Ingresá tus credenciales para acceder</p>

        <div className="admin-card" style={{ textAlign: "left" }}>
          <form onSubmit={handleSubmit}>
            <div className="admin-form-group">
              <label style={{ color: "#6C7293", fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="admin-input"
                required
                autoFocus
              />
            </div>
            <div className="admin-form-group">
              <label style={{ color: "#6C7293", fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="admin-input"
                required
              />
            </div>

            {error && (
              <div style={{ background: "rgba(235, 87, 87, 0.1)", color: "#EB5757", padding: "10px 14px", borderRadius: "10px", fontSize: "0.85rem", marginBottom: "16px", border: "1px solid rgba(235, 87, 87, 0.2)" }}>
                {error}
              </div>
            )}

            <button type="submit" className="admin-btn admin-btn-primary" style={{ width: "100%", marginTop: "8px" }} disabled={loading}>
              <Lock size={16} />
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>
        </div>


      </div>
    </div>
  );
}

function AdminDashboard({ darkMode, setDarkMode }) {
  const [currentView, setCurrentView] = useState("dashboard");
  const [stats, setStats] = useState({ materias: 0, videos: 0, preguntas: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Verificar autenticación
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/login");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/login");
  };

  const fetchStats = () => {
    fetch("/api/game-data")
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
    <div className="admin-container">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="admin-brand" style={{ justifyContent: 'center', margin: '20px 0 40px 0' }}>
          <img src="/logo.png" alt="Instituto Juan XXIII" style={{ maxHeight: '110px', maxWidth: '100%' }} />
        </div>

        <ul className="admin-nav-list">
          <li className={`admin-nav-item ${currentView === "dashboard" ? "active" : ""}`} onClick={() => setCurrentView("dashboard")}>
            <LayoutDashboard size={20} />
            Dashboard
          </li>
          <li className={`admin-nav-item ${currentView === "materias" ? "active" : ""}`} onClick={() => setCurrentView("materias")}>
            <BookOpen size={20} />
            Materias
          </li>
          <li className={`admin-nav-item ${currentView === "temas" ? "active" : ""}`} onClick={() => setCurrentView("temas")}>
            <FolderOpen size={20} />
            Temas
          </li>
          <li className={`admin-nav-item ${currentView === "preguntas" ? "active" : ""}`} onClick={() => setCurrentView("preguntas")}>
            <HelpCircle size={20} />
            Preguntas
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        {/* Header */}
        <div className="admin-header">
          <div className="admin-top-nav">
            {/* Vacío según instrucciones, mantenemos la estructura por si se necesitan breadcrumbs luego */}
          </div>
          <div className="admin-header-actions">
            <button className="admin-icon-btn" onClick={() => setDarkMode(!darkMode)} title={darkMode ? "Activar modo claro" : "Activar modo oscuro"}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="admin-icon-btn" onClick={handleLogout} title="Cerrar sesión"><LogOut size={18} /></button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="admin-content">
          {currentView === "dashboard" && (
            <>
              <div className="admin-grid-top" style={{ gridTemplateColumns: '1fr' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 className="admin-section-title" style={{ margin: 0 }}>Resumen General</h2>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    {/* Card 1 */}
                    <div className="admin-card" style={{ flex: 1, minWidth: '300px' }}>
                      <div className="summary-card">
                        <div className="summary-icon blue">
                          <BookOpen size={24} color="#5051F9" style={{ transform: 'rotate(45deg)' }} />
                        </div>
                        <div className="summary-info">
                          <span>Total Materias</span>
                          <h3>{stats.materias}</h3>
                        </div>
                      </div>
                      <div className="summary-stats">
                        <div className="stat-item">
                          <div className="stat-icon purple"><PlayCircle size={16} /></div>
                          <div className="stat-info">
                            <span>Videos Asignados</span>
                            <h4>{stats.videos}</h4>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div className="admin-card" style={{ flex: 1, minWidth: '300px' }}>
                      <div className="summary-card">
                        <div className="summary-icon">
                          <HelpCircle size={24} color="#FF8E53" style={{ transform: 'rotate(45deg)' }} />
                        </div>
                        <div className="summary-info">
                          <span>Total Preguntas</span>
                          <h3>{stats.preguntas}</h3>
                        </div>
                      </div>
                      <div className="summary-stats">
                        <div className="stat-item">
                          <div className="stat-icon orange"><Layers size={16} /></div>
                          <div className="stat-info">
                            <span>Promedio por Materia</span>
                            <h4>{stats.materias ? (stats.preguntas/stats.materias).toFixed(1) : 0}</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


            </>
          )}
          
          <div style={{ 
            background: currentView !== 'dashboard' ? 'var(--card-bg)' : 'transparent', 
            borderRadius: '20px', 
            padding: currentView !== 'dashboard' ? '24px' : '0', 
            boxshadow: currentView !== 'dashboard' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none', 
            border: currentView !== 'dashboard' ? '1px solid var(--border-color)' : 'none' 
          }}>
             {currentView === "materias" && <MateriasManager />}
             {currentView === "temas" && <TemasManager />}
             {currentView === "preguntas" && <PreguntasManager />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<GameView />} />
        <Route path="/admin" element={<AdminDashboard darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/login" element={<AdminLogin />} />
      </Routes>
    </Router>
  );
}
