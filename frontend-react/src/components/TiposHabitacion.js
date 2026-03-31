import React, { useState, useEffect } from 'react';
import tiposHabitacionService from '../services/tiposHabitacionService';
import Swal from 'sweetalert2';

const TiposHabitacion = () => {
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    nombreTipo: '',
    descripcion: '',
    capacidadMaxima: '',
    precioNoche: ''
  });

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    getTiposHabitacion();
  }, []);

  const getTiposHabitacion = async () => {
    try {
      setLoading(true);
      const data = await tiposHabitacionService.getAllTipos();
      setTipos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al obtener tipos de habitación:', error);
      Swal.fire('Error', 'No se pudieron cargar los tipos de habitación.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombreTipo || !form.precioNoche) {
      Swal.fire('Campos obligatorios', 'Nombre y Precio son requeridos.', 'warning');
      return;
    }

    const payload = {
      nombreTipo: form.nombreTipo,
      descripcion: form.descripcion,
      capacidadMaxima: form.capacidadMaxima ? Number(form.capacidadMaxima) : 0,
      precioNoche: Number(form.precioNoche)
    };

    try {
      if (editingId) {
        await tiposHabitacionService.actualizarTipo(editingId, payload);
        Swal.fire('¡Actualizado!', 'Tipo de habitación actualizado correctamente.', 'success');
      } else {
        await tiposHabitacionService.crearTipo(payload);
        Swal.fire('¡Guardado!', 'Nuevo tipo de habitación creado.', 'success');
      }

      handleCancelEdit();
      getTiposHabitacion();
    } catch (error) {
      Swal.fire('Error', 'No se pudieron guardar los cambios.', 'error');
    }
  };

  const handleEdit = (tipo) => {
    setForm({
      nombreTipo: tipo.nombre_tipo,
      descripcion: tipo.descripcion,
      capacidadMaxima: tipo.capacidad_maxima?.toString() || '',
      precioNoche: tipo.precio_noche?.toString() || ''
    });
    setEditingId(tipo.id_tipo_habitacion);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await tiposHabitacionService.eliminarTipo(id);
        Swal.fire('Eliminado', 'El registro ha sido borrado.', 'success');
        getTiposHabitacion();
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar el registro.', 'error');
      }
    }
  };

  const handleCancelEdit = () => {
    setForm({ nombreTipo: '', descripcion: '', capacidadMaxima: '', precioNoche: '' });
    setEditingId(null);
  };

  // Función para formatear moneda sin decimales innecesarios
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="container-xl py-4">
      <h2 className="mb-4 text-center fw-bold" style={{ color: '#2c3e50' }}>
        🏠 Gestión de Tipos de Habitación
      </h2>

      {/* ── FORMULARIO ─────────────────────────────────────────────── */}
      <div className="card border-0 shadow-sm mb-5 p-4">
        <h5 className="mb-3">
          {editingId ? '✏️ Editar Tipo' : '➕ Agregar Tipo de Habitación'}
        </h5>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-bold">Nombre del Tipo *</label>
              <input
                type="text"
                name="nombreTipo"
                className="form-control"
                placeholder="Ej: Suite Deluxe"
                value={form.nombreTipo}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">Precio por Noche (COP) *</label>
              <input
                type="number"
                name="precioNoche"
                className="form-control"
                placeholder="150000"
                value={form.precioNoche}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-bold">Capacidad Máxima</label>
              <input
                type="number"
                name="capacidadMaxima"
                className="form-control"
                placeholder="4"
                value={form.capacidadMaxima}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-9">
              <label className="form-label fw-bold">Descripción</label>
              <textarea
                name="descripcion"
                className="form-control"
                placeholder="Detalles y características de este tipo de habitación"
                value={form.descripcion}
                onChange={handleChange}
                rows="2"
              />
            </div>
            <div className="col-12">
              <button type="submit" className={`btn ${editingId ? 'btn-warning' : 'btn-primary'} fw-bold`}>
                {editingId ? '💾 Actualizar' : '✅ Guardar'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-secondary fw-bold ms-2"
                  onClick={handleCancelEdit}
                >
                  ❌ Cancelar
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* ── TABLA ───────────────────────────────────────────────────── */}
      <h5 className="mb-3 fw-bold" style={{ color: '#2c3e50' }}>
        📋 Listado de Tipos
      </h5>
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : tipos.length === 0 ? (
        <div className="alert alert-info text-center">
          No hay tipos de habitación registrados
        </div>
      ) : (
        <div className="table-responsive shadow-sm rounded-3">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-primary text-white">
              <tr>
                <th className="ps-3">ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Capacidad</th>
                <th>Precio/Noche</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tipos.map((tipo) => (
                <tr key={tipo.id_tipo_habitacion}>
                  <td className="ps-3 fw-bold">{tipo.id_tipo_habitacion}</td>
                  <td className="fw-bold">{tipo.nombre_tipo}</td>
                  <td style={{ fontSize: '0.9rem', color: '#666' }}>
                    {tipo.descripcion || '—'}
                  </td>
                  <td>
                    <span className="badge bg-info">{tipo.capacidad_maxima} pers.</span>
                  </td>
                  <td style={{ color: '#28a745', fontWeight: 'bold', fontSize: '1.05rem' }}>
                    {formatCurrency(tipo.precio_noche)}
                  </td>
                  <td className="text-center">
                    <button
                      onClick={() => handleEdit(tipo)}
                      className="btn btn-sm btn-outline-warning me-2"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(tipo.id_tipo_habitacion)}
                      className="btn btn-sm btn-outline-danger"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TiposHabitacion;