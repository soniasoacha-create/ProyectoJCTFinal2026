import React, { useState, useEffect, useMemo } from 'react';
import serviciosService from '../services/serviciosService';
import Swal from 'sweetalert2';

// ── Nivel de precio ──────────────────────────────────────────────────────────
const getPrecioNivel = (precio) => {
    const v = Number(precio || 0);
    if (v <= 0)  return { label: 'Pendiente', bg: 'danger'  };
    if (v < 20)  return { label: 'Básico',    bg: 'info'    };
    if (v < 50)  return { label: 'Estándar',  bg: 'success' };
    if (v < 90)  return { label: 'Plus',      bg: 'warning' };
    if (v < 140) return { label: 'Premium',   bg: 'primary' };
    return              { label: 'VIP',       bg: 'danger'  };
};

// ── Emoji por nombre de servicio ─────────────────────────────────────────────
const getEmoji = (nombre) => {
    const n = (nombre || '').toLowerCase();
    if (n.includes('desayuno') || n.includes('buffet')) return '☕';
    if (n.includes('room') || n.includes('comida'))     return '🛎️';
    if (n.includes('spa') || n.includes('masaj'))       return '💆';
    if (n.includes('tour') || n.includes('guiad'))      return '🗺️';
    if (n.includes('traslado') || n.includes('aero'))   return '🚗';
    if (n.includes('estacion') || n.includes('parking'))return '🅿️';
    if (n.includes('wifi') || n.includes('internet'))   return '📶';
    if (n.includes('llamad') || n.includes('telefon'))  return '📞';
    return '⭐';
};

const formatCurrency = (v) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);

// ── Componente ────────────────────────────────────────────────────────────────
const Servicios = () => {
    const [servicios, setServicios] = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [search,    setSearch]    = useState('');
    const [showForm,  setShowForm]  = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving,    setSaving]    = useState(false);
    const [formData,  setFormData]  = useState({ nombre_servicio: '', descripcion: '', precio: '' });

    // Estadísticas derivadas
    const stats = useMemo(() => {
        const precios = servicios.map(s => Number(s.precio || 0)).filter(p => p > 0);
        return {
            total:    servicios.length,
            activos:  precios.length,
            promedio: precios.length ? Math.round(precios.reduce((a, b) => a + b, 0) / precios.length) : 0,
            masCaro:  precios.length ? Math.max(...precios) : 0,
        };
    }, [servicios]);

    const filtrados = useMemo(() =>
        servicios.filter(s =>
            (s.nombre_servicio || '').toLowerCase().includes(search.toLowerCase()) ||
            (s.descripcion     || '').toLowerCase().includes(search.toLowerCase())
        ), [servicios, search]);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await serviciosService.obtenerServicios();
            setServicios(Array.isArray(res) ? res : []);
        } catch {
            Swal.fire('Error', 'No se pudieron cargar los servicios.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openNew = () => {
        setFormData({ nombre_servicio: '', descripcion: '', precio: '' });
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (serv) => {
        setFormData({ nombre_servicio: serv.nombre_servicio, descripcion: serv.descripcion || '', precio: serv.precio });
        setEditingId(serv.id_servicio);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const closeForm = () => { setShowForm(false); setEditingId(null); };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { nombreServicio: formData.nombre_servicio, descripcion: formData.descripcion, precio: Number(formData.precio) };
        try {
            setSaving(true);
            if (editingId) {
                await serviciosService.actualizarServicio(editingId, payload);
                Swal.fire({ icon: 'success', title: '¡Actualizado!', timer: 1600, showConfirmButton: false });
            } else {
                await serviciosService.crearServicio(payload);
                Swal.fire({ icon: 'success', title: '¡Guardado!', timer: 1600, showConfirmButton: false });
            }
            closeForm();
            fetchData();
        } catch {
            Swal.fire('Error', 'No se pudo guardar el servicio.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, nombre) => {
        const result = await Swal.fire({
            title: `¿Eliminar "${nombre}"?`,
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });
        if (!result.isConfirmed) return;
        try {
            await serviciosService.eliminarServicio(id);
            Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1400, showConfirmButton: false });
            fetchData();
        } catch {
            Swal.fire('Error', 'No se pudo eliminar. Es posible que esté en uso.', 'error');
        }
    };

    return (
        <div className="container-xl py-4">

            {/* ── Encabezado ─────────────────────────────────────────────── */}
            <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
                <div>
                    <h2 className="fw-bold mb-1" style={{ color: '#1e293b' }}>Gestión de Servicios</h2>
                    <p className="text-muted small mb-0">Administra el catálogo de servicios adicionales del hotel</p>
                </div>
                <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={showForm && !editingId ? closeForm : openNew}
                >
                    {showForm && !editingId ? '✕ Cerrar' : '+ Nuevo Servicio'}
                </button>
            </div>

            {/* ── Estadísticas ────────────────────────────────────────────── */}
            <div className="row g-3 mb-4">
                {[
                    { icon: '📦', label: 'Total servicios',    value: stats.total,                color: '#667eea' },
                    { icon: '✅', label: 'Con precio activo',  value: stats.activos,              color: '#11998e' },
                    { icon: '📈', label: 'Precio promedio',    value: formatCurrency(stats.promedio), color: '#f093fb' },
                    { icon: '💲', label: 'Precio más alto',    value: formatCurrency(stats.masCaro),  color: '#4facfe' },
                ].map((s, i) => (
                    <div key={i} className="col-6 col-lg-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body d-flex align-items-center gap-3 p-3">
                                <div
                                    className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                    style={{ width: 48, height: 48, background: s.color, fontSize: '1.3rem' }}
                                >
                                    {s.icon}
                                </div>
                                <div className="overflow-hidden">
                                    <div className="fw-bold text-truncate" style={{ fontSize: '1.05rem', color: '#1e293b' }}>{s.value}</div>
                                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>{s.label}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Formulario ─────────────────────────────────────────────── */}
            {showForm && (
                <div className="card border-0 shadow mb-4">
                    <div className="card-header bg-light d-flex justify-content-between align-items-center py-3">
                        <span className="fw-semibold text-secondary">
                            {editingId ? '✏️  Editar servicio' : '➕  Nuevo servicio'}
                        </span>
                        <button type="button" className="btn-close" onClick={closeForm} />
                    </div>
                    <div className="card-body p-4">
                        <form onSubmit={handleSubmit} style={{ boxShadow: 'none', padding: 0, margin: 0, background: 'none' }}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold small text-uppercase text-muted">Nombre del servicio *</label>
                                    <input
                                        className="form-control"
                                        type="text"
                                        name="nombre_servicio"
                                        placeholder="ej. Spa y masajes, Desayuno buffet…"
                                        value={formData.nombre_servicio}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold small text-uppercase text-muted">Precio por unidad *</label>
                                    <div className="input-group">
                                        <span className="input-group-text">$</span>
                                        <input
                                            className="form-control"
                                            type="number"
                                            name="precio"
                                            placeholder="0"
                                            value={formData.precio}
                                            onChange={handleChange}
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                    {Number(formData.precio) > 0 && (
                                        <span className={`badge bg-${getPrecioNivel(formData.precio).bg} mt-1`}>
                                            {getPrecioNivel(formData.precio).label}
                                        </span>
                                    )}
                                </div>
                                <div className="col-md-3 d-flex align-items-end gap-2">
                                    <button type="submit" className="btn btn-primary flex-grow-1" disabled={saving}>
                                        {saving ? 'Guardando…' : editingId ? 'Actualizar' : 'Guardar'}
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary" onClick={closeForm}>
                                        Cancelar
                                    </button>
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-semibold small text-uppercase text-muted">Descripción *</label>
                                    <textarea
                                        className="form-control"
                                        name="descripcion"
                                        placeholder="Describe brevemente lo que incluye este servicio…"
                                        value={formData.descripcion}
                                        onChange={handleChange}
                                        rows="2"
                                        required
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Buscador ────────────────────────────────────────────────── */}
            <div className="mb-3">
                <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">🔍</span>
                    <input
                        className="form-control border-start-0 ps-0"
                        type="text"
                        placeholder="Buscar servicio por nombre o descripción…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>✕</button>
                    )}
                </div>
            </div>

            {/* ── Contenido ───────────────────────────────────────────────── */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                    <p className="text-muted mt-3 mb-0">Cargando servicios…</p>
                </div>
            ) : filtrados.length === 0 ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-5 text-muted">
                        <div style={{ fontSize: '2.5rem' }}>🔍</div>
                        <p className="mb-0 mt-2">
                            {search ? `No se encontraron servicios para "${search}"` : 'No hay servicios registrados.'}
                        </p>
                        {!search && (
                            <button className="btn btn-primary mt-3" onClick={openNew}>+ Agregar primer servicio</button>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {/* Grid de tarjetas */}
                    <div className="row g-3">
                        {filtrados.map(serv => {
                            const nivel = getPrecioNivel(serv.precio);
                            return (
                                <div key={serv.id_servicio} className="col-sm-6 col-lg-4 col-xl-3">
                                    <div className="card h-100 border-0 shadow-sm" style={{ transition: 'transform .18s, box-shadow .18s' }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.12)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                                    >
                                        <div className="card-body d-flex flex-column gap-2 p-3">
                                            {/* Icono + badge */}
                                            <div className="d-flex align-items-center justify-content-between">
                                                <span style={{ fontSize: '1.8rem' }}>{getEmoji(serv.nombre_servicio)}</span>
                                                <span className={`badge bg-${nivel.bg} text-${nivel.bg === 'warning' ? 'dark' : 'white'}`}>
                                                    {nivel.label}
                                                </span>
                                            </div>
                                            {/* Nombre */}
                                            <div className="fw-bold" style={{ fontSize: '0.97rem', color: '#1e293b' }}>
                                                {serv.nombre_servicio}
                                            </div>
                                            {/* Descripción */}
                                            <div className="text-muted small flex-grow-1" style={{
                                                display: '-webkit-box', WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                            }}>
                                                {serv.descripcion}
                                            </div>
                                            {/* Precio */}
                                            <div className="fw-bold" style={{ color: '#15803d', fontSize: '1.05rem' }}>
                                                {formatCurrency(serv.precio)}
                                            </div>
                                        </div>
                                        {/* Acciones */}
                                        <div className="card-footer bg-transparent border-top d-flex gap-2 p-2">
                                            <button
                                                className="btn btn-sm btn-outline-primary flex-grow-1"
                                                onClick={() => openEdit(serv)}
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger flex-grow-1"
                                                onClick={() => handleDelete(serv.id_servicio, serv.nombre_servicio)}
                                            >
                                                🗑️ Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Tabla resumen al pie */}
                    <div className="mt-4">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-light py-2">
                                <small className="fw-semibold text-muted text-uppercase">Vista de tabla</small>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-primary">
                                        <tr>
                                            <th className="ps-3">#</th>
                                            <th>Servicio</th>
                                            <th>Descripción</th>
                                            <th>Precio</th>
                                            <th>Nivel</th>
                                            <th className="text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtrados.map(serv => {
                                            const nivel = getPrecioNivel(serv.precio);
                                            return (
                                                <tr key={serv.id_servicio}>
                                                    <td className="ps-3 text-muted small">{serv.id_servicio}</td>
                                                    <td className="fw-semibold">
                                                        {getEmoji(serv.nombre_servicio)} {serv.nombre_servicio}
                                                    </td>
                                                    <td className="text-muted small">{serv.descripcion}</td>
                                                    <td className="fw-bold" style={{ color: '#15803d' }}>
                                                        {formatCurrency(serv.precio)}
                                                    </td>
                                                    <td>
                                                        <span className={`badge bg-${nivel.bg} text-${nivel.bg === 'warning' ? 'dark' : 'white'}`}>
                                                            {nivel.label}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <button className="btn btn-sm btn-info text-white me-2" onClick={() => openEdit(serv)}>
                                                            Editar
                                                        </button>
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(serv.id_servicio, serv.nombre_servicio)}>
                                                            Eliminar
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <p className="text-muted small text-end mt-2">
                        Mostrando {filtrados.length} de {servicios.length} servicio{servicios.length !== 1 ? 's' : ''}
                    </p>
                </>
            )}
        </div>
    );
};

export default Servicios;