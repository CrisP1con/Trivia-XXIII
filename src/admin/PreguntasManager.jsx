import React, { useState, useEffect } from "react";

export default function PreguntasManager() {
  const [materias, setMaterias] = useState([]);
  const [temas, setTemas] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedMateria, setSelectedMateria] = useState("");
  const [selectedTema, setSelectedTema] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    tema_id: "",
    prompt: "",
    options: ["", "", "", ""],
    answer: 0,
    explanation: ""
  });

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
    if (!selectedMateria) return;
    fetch(`/api/temas?materia_id=${selectedMateria}`)
      .then(res => res.json())
      .then(data => {
        setTemas(data);
        if (data.length > 0) {
          setSelectedTema(prev => {
            const exists = data.find(t => t.id === prev);
            return exists ? prev : data[0].id;
          });
        } else {
          setSelectedTema("");
        }
      });
  };

  const fetchQuestions = () => {
    if (!selectedTema) { setQuestions([]); setLoading(false); return; }
    setLoading(true);
    fetch(`/api/questions?tema_id=${selectedTema}`)
      .then(res => res.json())
      .then(data => {
        setQuestions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => { fetchMaterias(); }, []);
  useEffect(() => { if (selectedMateria) fetchTemas(); }, [selectedMateria]);
  useEffect(() => { fetchQuestions(); }, [selectedTema]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      tema_id: selectedTema,
      prompt: "",
      options: ["", "", "", ""],
      answer: 0,
      explanation: ""
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const isEditing = editingId !== null;
    const url = isEditing
      ? `/api/questions/${editingId}`
      : `/api/questions`;

    fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      },
      body: JSON.stringify({ ...formData, answer: parseInt(formData.answer) })
    }).then(res => res.json())
      .then(() => {
        setEditingId(null);
        setIsModalOpen(false);
        fetchQuestions();
      });
  };

  const handleEdit = (q) => {
    setEditingId(q.id);
    setFormData({
      tema_id: q.tema_id,
      prompt: q.prompt,
      options: q.options.length === 4 ? q.options : ["", "", "", ""],
      answer: q.answer,
      explanation: q.explanation || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar esta pregunta?")) {
      fetch(`/api/questions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      }).then(() => fetchQuestions());
    }
  };

  const getTemaTitulo = (id) => {
    const t = temas.find(tema => tema.id === id);
    return t ? t.titulo : "—";
  };

  const noMaterias = materias.length === 0;
  const noTemas = temas.length === 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 className="admin-section-title" style={{ margin: 0 }}>Preguntas</h2>
        {!noMaterias && !noTemas && (
          <button onClick={handleAddNew} className="admin-btn admin-btn-primary">+ Agregar Pregunta</button>
        )}
      </div>

      {noMaterias ? (
        <div style={{ background: "rgba(235, 87, 87, 0.1)", color: "#EB5757", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(235, 87, 87, 0.2)" }}>
          Debes crear al menos una Materia antes de poder cargar preguntas.
        </div>
      ) : (
        <>
          {/* Filtros */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
            <div className="admin-form-group" style={{ flex: 1, minWidth: "200px", marginBottom: 0 }}>
              <label style={{ color: "#6C7293", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", display: "block" }}>Materia</label>
              <select
                value={selectedMateria}
                onChange={(e) => setSelectedMateria(Number(e.target.value))}
                className="admin-input"
              >
                {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div className="admin-form-group" style={{ flex: 1, minWidth: "200px", marginBottom: 0 }}>
              <label style={{ color: "#6C7293", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", display: "block" }}>Tema</label>
              {noTemas ? (
                <p style={{ color: "#EB5757", fontSize: "0.85rem", margin: "10px 0 0" }}>No hay temas en esta materia. Crea uno primero.</p>
              ) : (
                <select
                  value={selectedTema}
                  onChange={(e) => setSelectedTema(Number(e.target.value))}
                  className="admin-input"
                >
                  {temas.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Modal */}
          {isModalOpen && (
            <div className="admin-modal-overlay">
            <div className="admin-modal" style={{ maxWidth: "650px" }}>
                <div className="admin-modal-header">
                  <h3 className="admin-modal-title">{editingId ? "Editar Pregunta" : "Nueva Pregunta"}</h3>
                  <button onClick={() => setIsModalOpen(false)} className="admin-modal-close" style={{ fontSize: "1.5rem" }}>&times;</button>
                </div>
                <div className="admin-modal-content">
                  <form onSubmit={handleSave}>
                    <div className="admin-form-group">
                      <label style={{ color: "#6C7293", fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>Tema</label>
                      <select name="tema_id" value={formData.tema_id} onChange={handleInputChange} className="admin-input" required>
                        {temas.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
                      </select>
                    </div>

                    <div className="admin-form-group">
                      <label style={{ color: "#6C7293", fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>Pregunta</label>
                      <textarea name="prompt" value={formData.prompt} onChange={handleInputChange} placeholder="¿Cuál es la pregunta?" className="admin-input" style={{ minHeight: "60px" }} required />
                    </div>

                    <label style={{ color: "#6C7293", fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>Opciones (marcá la correcta)</label>
                    <div className="preguntas-options-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                      {formData.options.map((opt, i) => (
                        <div key={i} style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "10px", 
                          background: "#F1F5F9", 
                          padding: "10px", 
                          borderRadius: "10px", 
                          border: formData.answer == i ? "2px solid #5051F9" : "1px solid #E2E8F0" 
                        }}>
                          <input type="radio" name="answer" value={i} checked={formData.answer == i} onChange={handleInputChange} style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#5051F9", flexShrink: 0 }} />
                          <span style={{ color: "#5051F9", fontWeight: "700", fontSize: "0.8rem", flexShrink: 0 }}>{String.fromCharCode(65 + i)}.</span>
                          <input value={opt} onChange={(e) => handleOptionChange(i, e.target.value)} placeholder={`Opción ${String.fromCharCode(65 + i)}`} style={{ flex: 1, padding: "4px 0", background: "transparent", border: "none", color: "#1E293B", outline: "none", fontFamily: "'Inter', sans-serif", fontSize: "0.9rem" }} required />
                        </div>
                      ))}
                    </div>

                    <div className="admin-form-group">
                      <label style={{ color: "#6C7293", fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>Explicación (opcional)</label>
                      <textarea name="explanation" value={formData.explanation} onChange={handleInputChange} placeholder="Feedback al responder" className="admin-input" style={{ minHeight: "60px" }} />
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                      <button type="submit" className="admin-btn admin-btn-primary">
                        {editingId ? "Actualizar" : "Guardar Pregunta"}
                      </button>
                      <button type="button" onClick={() => setIsModalOpen(false)} className="admin-btn admin-btn-secondary">
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Tabla */}
          {!noTemas && (
            loading ? <p style={{ color: "#6C7293" }}>Cargando preguntas...</p> : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Pregunta</th>
                      <th>Respuesta correcta</th>
                      <th className="text-right" style={{ width: "200px" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map(q => (
                      <tr key={q.id}>
                        <td style={{ fontWeight: "500", color: "var(--text-main)" }}>{q.prompt}</td>
                        <td style={{ color: "#5051F9", fontWeight: "600" }}>{q.options[q.answer] || `Opción ${q.answer}`}</td>
                        <td className="text-right">
                          <div style={{ display: "flex", gap: "10px" }}>
                            <button onClick={() => handleEdit(q)} className="admin-btn admin-btn-secondary admin-btn-small">Editar</button>
                            <button onClick={() => handleDelete(q.id)} className="admin-btn admin-btn-danger admin-btn-small">Borrar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {questions.length === 0 && (
                      <tr>
                        <td colSpan="3" style={{ padding: "20px", textAlign: "center", color: "#6C7293" }}>No hay preguntas en este tema.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
