import React, { useState, useEffect } from "react";

export default function TemasManager() {
  const [materias, setMaterias] = useState([]);
  const [temas, setTemas] = useState([]);
  const [selectedMateria, setSelectedMateria] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    materia_id: "",
    titulo: "",
    video: "",
    texto_puente: "",
    orden: 1
  });

  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchMaterias = () => {
    fetch("/api/materias")
      .then(res => res.json())
      .then(data => {
        setMaterias(data);
        if (data.length > 0 && !selectedMateria) {
          setSelectedMateria(data[0].id);
        }
      });
  };

  const fetchTemas = () => {
    if (!selectedMateria) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/temas?materia_id=${selectedMateria}`)
      .then(res => res.json())
      .then(data => {
        setTemas(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMaterias();
  }, []);

  useEffect(() => {
    if (selectedMateria) fetchTemas();
  }, [selectedMateria]);

  const handleAddNew = () => {
    setEditingId(null);
    setVideoFile(null);
    setFormData({
      materia_id: selectedMateria,
      titulo: "",
      video: "",
      texto_puente: "",
      orden: temas.length + 1
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    let finalVideoUrl = formData.video;

    // Si hay un archivo seleccionado, subirlo primero
    if (videoFile) {
      const uploadData = new FormData();
      uploadData.append('video', videoFile);

      try {
        const res = await fetch("/api/upload-video", {
          method: "POST",
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}` 
          },
          body: uploadData
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Error en el servidor al subir video");
        }
        
        if (data.url) {
          finalVideoUrl = data.url;
        }
      } catch (err) {
        console.error("Error detallado:", err);
        alert(`Error al subir el video: ${err.message}`);
        setUploading(false);
        return;
      }
    }

    const isEditing = editingId !== null;
    const url = isEditing
      ? `/api/temas/${editingId}`
      : `/api/temas`;

    fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      },
      body: JSON.stringify({ ...formData, video: finalVideoUrl })
    }).then(res => res.json())
      .then(() => {
        setEditingId(null);
        setVideoFile(null);
        setUploading(false);
        setIsModalOpen(false);
        fetchTemas();
      });
  };

  const handleEdit = (tema) => {
    setEditingId(tema.id);
    setVideoFile(null);
    setFormData({
      materia_id: tema.materia_id,
      titulo: tema.titulo,
      video: tema.video || "",
      texto_puente: tema.texto_puente || "",
      orden: tema.orden
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este tema? Se eliminarán también sus preguntas.")) {
      fetch(`/api/temas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      }).then(() => fetchTemas());
    }
  };

  const getMateriaNombre = (id) => {
    const m = materias.find(mat => mat.id === id);
    return m ? m.nombre : "—";
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 className="admin-section-title" style={{ margin: 0 }}>Temas</h2>
        {materias.length > 0 && (
          <button onClick={handleAddNew} className="admin-btn admin-btn-primary">+ Agregar Tema</button>
        )}
      </div>

      {materias.length === 0 ? (
        <div style={{ background: "rgba(235, 87, 87, 0.1)", color: "#EB5757", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(235, 87, 87, 0.2)" }}>
          Debes crear al menos una Materia antes de poder agregar temas.
        </div>
      ) : (
        <>
          <div className="admin-form-group" style={{ maxWidth: "300px", marginBottom: "20px" }}>
            <select
              value={selectedMateria}
              onChange={(e) => setSelectedMateria(Number(e.target.value))}
              className="admin-input"
            >
              {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>

          {isModalOpen && (
            <div className="admin-modal-overlay">
              <div className="admin-modal">
                <div className="admin-modal-header">
                  <h3 className="admin-modal-title">{editingId ? "Editar Tema" : "Nuevo Tema"}</h3>
                  <button onClick={() => setIsModalOpen(false)} className="admin-modal-close" style={{ fontSize: "1.5rem" }}>&times;</button>
                </div>
                <div className="admin-modal-content">
                  <form onSubmit={handleSave}>
                    <div className="admin-form-group">
                      <label style={{ color: "#6C7293", fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>Materia</label>
                      <select name="materia_id" value={formData.materia_id} onChange={(e) => setFormData({ ...formData, materia_id: Number(e.target.value) })} className="admin-input" required>
                        {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label style={{ color: "#6C7293", fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>Título del tema</label>
                      <input name="titulo" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} placeholder="Ej: Revolución de Mayo..." className="admin-input" required autoFocus />
                    </div>
                    
                    <div className="admin-form-group">
                      <label style={{ color: "#6C7293", fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>
                        Archivo de Video (Límite 500MB)
                      </label>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <input 
                          type="file" 
                          accept="video/*" 
                          onChange={(e) => setVideoFile(e.target.files[0])}
                          className="admin-input"
                          style={{ padding: "8px" }}
                        />
                      </div>
                      {formData.video && !videoFile && (
                        <p style={{ fontSize: "0.75rem", color: "#5051F9", marginTop: "5px" }}>
                          Video actual: {formData.video}
                        </p>
                      )}
                    </div>

                    <div className="admin-form-group">
                      <label style={{ color: "#6C7293", fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>Texto puente / narrativo (opcional)</label>
                      <textarea name="texto_puente" value={formData.texto_puente} onChange={(e) => setFormData({ ...formData, texto_puente: e.target.value })} placeholder="Contexto breve que se muestra antes de las preguntas" className="admin-input" />
                    </div>
                    <div className="admin-form-group">
                      <label style={{ color: "#6C7293", fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>Orden</label>
                      <input name="orden" type="number" value={formData.orden} onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })} className="admin-input" required />
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                      <button type="submit" className="admin-btn admin-btn-primary" disabled={uploading}>
                        {uploading ? "Subiendo..." : (editingId ? "Actualizar" : "Guardar Tema")}
                      </button>
                      <button type="button" onClick={() => setIsModalOpen(false)} className="admin-btn admin-btn-secondary" disabled={uploading}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {loading ? <p style={{ color: "#6C7293" }}>Cargando temas...</p> : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Orden</th>
                    <th>Título</th>
                    <th>Video</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {temas.map(t => (
                    <tr key={t.id}>
                      <td>{t.orden}</td>
                      <td style={{ fontWeight: "bold", color: "var(--text-main)" }}>{t.titulo}</td>
                      <td style={{ color: "#6C7293" }}>{t.video || "Sin video"}</td>
                      <td>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button onClick={() => handleEdit(t)} className="admin-btn admin-btn-secondary admin-btn-small">Editar</button>
                          <button onClick={() => handleDelete(t.id)} className="admin-btn admin-btn-danger admin-btn-small">Borrar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {temas.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: "20px", textAlign: "center", color: "#6C7293" }}>
                        No hay temas para "{getMateriaNombre(selectedMateria)}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
