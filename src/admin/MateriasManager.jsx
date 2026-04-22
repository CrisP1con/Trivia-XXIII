import React, { useState, useEffect } from "react";

export default function MateriasManager() {
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    orden: 1
  });

  const fetchMaterias = () => {
    setLoading(true);
    fetch("/api/materias")
      .then(res => res.json())
      .then(data => {
        setMaterias(data);
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

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ nombre: "", orden: materias.length + 1 });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const isEditing = editingId !== null;
    const url = isEditing
      ? `/api/materias/${editingId}`
      : `/api/materias`;

    fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      },
      body: JSON.stringify(formData)
    }).then(res => res.json())
      .then(() => {
        setEditingId(null);
        setFormData({ nombre: "", orden: 1 });
        setIsModalOpen(false);
        fetchMaterias();
      });
  };

  const handleEdit = (materia) => {
    setEditingId(materia.id);
    setFormData({ nombre: materia.nombre, orden: materia.orden });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar esta materia? Se eliminarán también sus temas y preguntas.")) {
      fetch(`/api/materias/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      }).then(() => fetchMaterias());
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 className="admin-section-title" style={{ margin: 0 }}>Materias</h2>
        <button onClick={handleAddNew} className="admin-btn admin-btn-primary">+ Agregar Materia</button>
      </div>

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: "420px" }}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{editingId ? "Editar Materia" : "Nueva Materia"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="admin-modal-close" style={{ fontSize: "1.5rem" }}>&times;</button>
            </div>
            <div className="admin-modal-content">
              <form onSubmit={handleSave}>
                <div className="admin-form-group">
                  <input name="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Nombre (ej: Historia, Matemáticas)" className="admin-input" required autoFocus />
                </div>
                <div className="admin-form-group">
                  <input name="orden" type="number" value={formData.orden} onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })} placeholder="Orden" className="admin-input" required />
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button type="submit" className="admin-btn admin-btn-primary">
                    {editingId ? "Actualizar" : "Guardar"}
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

      {loading ? <p style={{ color: "#6C7293" }}>Cargando materias...</p> : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {materias.map(m => (
                <tr key={m.id}>
                  <td>{m.orden}</td>
                  <td style={{ fontWeight: "bold", color: "var(--text-main)" }}>{m.nombre}</td>
                  <td>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button onClick={() => handleEdit(m)} className="admin-btn admin-btn-secondary admin-btn-small">Editar</button>
                      <button onClick={() => handleDelete(m.id)} className="admin-btn admin-btn-danger admin-btn-small">Borrar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {materias.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ padding: "20px", textAlign: "center", color: "#6C7293" }}>No hay materias cargadas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
