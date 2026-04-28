import React, { useState } from "react";
import { Lock, ShieldCheck, AlertCircle, Save } from "lucide-react";

export default function ConfigManager() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (formData.newPassword !== formData.confirmPassword) {
      return setMessage({ type: "error", text: "Las contraseñas nuevas no coinciden" });
    }

    setLoading(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("admin_token")}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Error al cambiar contraseña" });
      } else {
        setMessage({ type: "success", text: "¡Contraseña actualizada correctamente!" });
        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "No se pudo conectar con el servidor" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ marginBottom: "30px" }}>
        <h2 className="admin-section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={24} color="#5051F9" />
          Seguridad y Configuración
        </h2>
        <p style={{ color: "#6C7293", fontSize: "0.9rem" }}>
          Mantén tu cuenta protegida. Te recomendamos cambiar tu contraseña periódicamente.
        </p>
      </div>

      <div className="admin-card">
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label style={{ color: "#6C7293", fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>Contraseña Actual</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className="admin-input"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="admin-form-group">
              <label style={{ color: "#6C7293", fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>Nueva Contraseña</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="admin-input"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            <div className="admin-form-group">
              <label style={{ color: "#6C7293", fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>Confirmar Nueva Contraseña</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="admin-input"
                placeholder="Repite la contraseña"
                required
              />
            </div>
          </div>

          {message.text && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              padding: '12px 16px', 
              borderRadius: '12px', 
              marginBottom: '20px',
              fontSize: '0.9rem',
              backgroundColor: message.type === 'error' ? 'rgba(235, 87, 87, 0.1)' : 'rgba(39, 174, 96, 0.1)',
              color: message.type === 'error' ? '#EB5757' : '#27AE60',
              border: `1px solid ${message.type === 'error' ? 'rgba(235, 87, 87, 0.2)' : 'rgba(39, 174, 96, 0.2)'}`
            }}>
              {message.type === 'error' ? <AlertCircle size={18} /> : <ShieldCheck size={18} />}
              {message.text}
            </div>
          )}

          <button 
            type="submit" 
            className="admin-btn admin-btn-primary" 
            style={{ width: '100%', justifyContent: 'center', gap: '10px' }}
            disabled={loading}
          >
            <Save size={18} />
            {loading ? "Guardando..." : "Actualizar Contraseña"}
          </button>
        </form>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(80, 81, 249, 0.05)', borderRadius: '16px', border: '1px dashed rgba(80, 81, 249, 0.2)' }}>
        <h4 style={{ color: 'var(--text-main)', margin: '0 0 8px 0', fontSize: '0.95rem' }}>Información de Sesión</h4>
        <p style={{ color: '#6C7293', fontSize: '0.85rem', margin: 0 }}>
          Al cambiar la contraseña, tu sesión actual se mantendrá activa, pero deberás usar la nueva clave la próxima vez que ingreses.
        </p>
      </div>
    </div>
  );
}
