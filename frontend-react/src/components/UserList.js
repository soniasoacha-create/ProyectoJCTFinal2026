import React, { useEffect, useState } from "react";
import { getAllUsuarios, eliminarUsuario } from "../services/usuariosService";
import Swal from "sweetalert2";

const getRolColor = (rol) => {
  const rolesMap = {
    administrador: { bg: 'danger', icon: '👑', label: 'Administrador' },
    moderador: { bg: 'warning', icon: '⚙️', label: 'Moderador' },
    cliente: { bg: 'success', icon: '👤', label: 'Cliente' },
  };
  return rolesMap[rol] || { bg: 'secondary', icon: '❓', label: rol };
};

function UserList({ onUserEdit, refreshListToggle }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleEditClick = (user) => {
    if (typeof onUserEdit === "function") {
      onUserEdit(user);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, [refreshListToggle]);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const data = await getAllUsuarios();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      Swal.fire('Error', 'No se pudo cargar la lista de usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    const confirm = await Swal.fire({
      title: `🗑️ ¿Eliminar usuario?`,
      text: `Se eliminará a ${nombre} de forma permanente.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        await eliminarUsuario(id);
        Swal.fire('✅ Eliminado', `${nombre} ha sido eliminado.`, 'success');
        fetchUsuarios();
      } catch (error) {
        console.error("Error al eliminar usuario:", error);
        Swal.fire('❌ Error', 'No se pudo eliminar el usuario', 'error');
      }
    }
  };

  return (
    <div className="container-xl py-4">
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: '#1e293b' }}>👥 Gestión de Usuarios</h2>
          <p className="text-muted small mb-0">Administra los usuarios registrados en el hotel</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-muted mt-3 mb-0">Cargando usuarios…</p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5 text-muted">
            <div style={{ fontSize: '2.5rem' }}>👤</div>
            <p className="mb-0 mt-2">No hay usuarios registrados.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Grid de Tarjetas */}
          <div className="row g-3 mb-4">
            {usuarios.map((user) => {
              const rolInfo = getRolColor(user.tipo_usuario || user.rol);
              return (
                <div key={user.id_usuarios} className="col-sm-6 col-lg-4">
                  <div className="card border-0 shadow-sm h-100" style={{ transition: 'transform .18s, box-shadow .18s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                  >
                    <div className={`card-header bg-${rolInfo.bg} text-white d-flex align-items-center justify-content-between p-3`}>
                      <span style={{ fontSize: '1.2rem' }}>{rolInfo.icon}</span>
                      <span className="badge bg-dark ms-2">{user.id_usuarios}</span>
                    </div>
                    <div className="card-body p-3">
                      <h6 className="fw-bold mb-1" style={{ color: '#1e293b' }}>{user.nombres} {user.apellidos}</h6>
                      <p className="text-muted small mb-2">📧 {user.email}</p>
                      {user.telefono && <p className="text-muted small mb-2">📱 {user.telefono}</p>}
                      <div className="mb-3">
                        <span className={`badge bg-${rolInfo.bg}`}>{rolInfo.label}</span>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary flex-grow-1"
                          onClick={() => handleEditClick(user)}
                          title="Editar"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(user.id_usuarios, `${user.nombres} ${user.apellidos}`)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabla Alternativa (Admin) */}
          <div className="card border-0 shadow-sm mt-4">
            <div className="card-header bg-light p-3">
              <h6 className="mb-0 fw-bold">📋 Vista de Tabla</h6>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="ps-3">ID</th>
                    <th>Nombre Completo</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((user) => {
                    const rolInfo = getRolColor(user.tipo_usuario || user.rol);
                    return (
                      <tr key={user.id_usuarios}>
                        <td className="ps-3 fw-bold">#{user.id_usuarios}</td>
                        <td>{user.nombres} {user.apellidos}</td>
                        <td style={{ fontSize: '0.9rem', color: '#666' }}>{user.email}</td>
                        <td>{user.telefono || '—'}</td>
                        <td>
                          <span className={`badge bg-${rolInfo.bg}`}>
                            {rolInfo.icon} {rolInfo.label}
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleEditClick(user)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(user.id_usuarios, `${user.nombres} ${user.apellidos}`)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default UserList;