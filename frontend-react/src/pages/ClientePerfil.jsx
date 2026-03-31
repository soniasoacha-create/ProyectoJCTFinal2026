import React, { useState, useEffect } from 'react';
import reservasService from '../services/reservasService';
import reservaServiciosService from '../services/reservaServiciosService';
import facturacionService from '../services/facturacionService';
import { getUsuarioById, actualizarUsuario } from '../services/usuariosService';
import Swal from 'sweetalert2';

const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.reservas)) return payload.reservas;
    return [];
};

const unwrap = (payload) => payload?.data || payload;

const toNumber = (value) => {
    const normalized = String(value ?? '0').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) => (
    new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
    }).format(toNumber(value))
);

const ClientePerfil = () => {
    const usuarioSesion = (() => {
        try { return JSON.parse(localStorage.getItem('user') || 'null') || {}; }
        catch { return {}; }
    })();
    const userId = Number(
        usuarioSesion.id_usuarios ||
        usuarioSesion.id_usuario ||
        usuarioSesion.user_id ||
        usuarioSesion.id ||
        0
    );

    const [reservas, setReservas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroEstado, setFiltroEstado] = useState('todas');

    // Datos de perfil del backend
    const [perfil, setPerfil] = useState(null);
    const [editando, setEditando] = useState(false);
    const [loadingPerfil, setLoadingPerfil] = useState(false);
    const [editForm, setEditForm] = useState({ nombres: '', apellidos: '', email: '', telefono: '' });
    const [editErrors, setEditErrors] = useState({});

    const opcionesFiltro = [
        { value: 'todas', label: 'Todas' },
        { value: 'orden_pendiente', label: 'Orden pendiente' },
        { value: 'facturada', label: 'Con factura' },
        { value: 'pagada', label: 'Pagada' },
        { value: 'reserva_pendiente', label: 'Reserva pendiente' },
        { value: 'reserva_confirmada', label: 'Reserva confirmada' },
        { value: 'reserva_completada', label: 'Reserva completada' },
        { value: 'reserva_cancelada', label: 'Reserva cancelada' },
    ];

    // Cargar datos completos del usuario desde el backend
    useEffect(() => {
        if (!userId) return;
        getUsuarioById(userId)
            .then((u) => {
                const datos = u?.data || u;
                setPerfil(datos);
                setEditForm({
                    nombres: datos?.nombres || '',
                    apellidos: datos?.apellidos || '',
                    email: datos?.email || '',
                    telefono: datos?.telefono || '',
                });
            })
            .catch(() => setPerfil(null));
    }, [userId]);

    const handleGuardarPerfil = async () => {
        const errs = {};
        if (!editForm.nombres.trim()) errs.nombres = 'El nombre es requerido';
        if (!editForm.apellidos.trim()) errs.apellidos = 'El apellido es requerido';
        if (!editForm.email.includes('@')) errs.email = 'Email inválido';
        setEditErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setLoadingPerfil(true);
        try {
            await actualizarUsuario(userId, {
                nombres: editForm.nombres.trim(),
                apellidos: editForm.apellidos.trim(),
                email: editForm.email.trim(),
                telefono: editForm.telefono.trim(),
            });
            setPerfil(prev => ({ ...prev, ...editForm }));
            setEditando(false);
        } catch {
            Swal.fire('Error', 'No se pudo actualizar el perfil.', 'error');
        } finally {
            setLoadingPerfil(false);
        }
    };

    useEffect(() => {
        if (!userId) { setLoading(false); return; }

        const cargarHistorico = async () => {
            try {
                const data = await reservasService.getReservasUsuario(userId);
                const reservasBase = toArray(data);

                const enriquecidas = await Promise.all(
                    reservasBase.map(async (reserva) => {
                        const idReserva = Number(reserva.id_reserva || reserva.id_reservas || reserva.id || 0);
                        let servicios = [];
                        let factura = null;

                        try {
                            const serviciosRes = await reservaServiciosService.obtenerConsumosPorReserva(idReserva);
                            servicios = toArray(serviciosRes);
                        } catch {
                            servicios = [];
                        }

                        try {
                            const facturaRes = await facturacionService.obtenerFacturaCompleta(idReserva);
                            factura = unwrap(facturaRes);
                        } catch {
                            factura = null;
                        }

                        const totalServicios = servicios.reduce(
                            (sum, s) => sum + toNumber(s.subtotal ?? s.total ?? s.precio ?? s.costo),
                            0
                        );

                        return {
                            ...reserva,
                            id_reserva: idReserva,
                            servicios,
                            totalServicios,
                            totalOrden: toNumber(reserva.precio_total) + totalServicios,
                            factura,
                        };
                    })
                );

                setReservas(enriquecidas);
            } catch (e) {
                console.error('Error cargando reservas', e);
                setReservas([]);
            } finally {
                setLoading(false);
            }
        };

        cargarHistorico();
    }, [userId]);

    const estadoBadge = (estado) => {
        const map = { confirmada: 'success', pendiente: 'warning', cancelada: 'danger', completada: 'info' };
        return map[estado?.toLowerCase()] || 'secondary';
    };

    const normalizar = (value) => String(value || '').trim().toLowerCase();

    const reservasFiltradas = reservas.filter((r) => {
        if (filtroEstado === 'todas') return true;

        const estadoReserva = normalizar(r.estado_reserva);
        const estadoFactura = normalizar(r.factura?.estado_factura);
        const tieneFactura = Boolean(r.factura?.id_factura);

        if (filtroEstado === 'orden_pendiente') return !tieneFactura;
        if (filtroEstado === 'facturada') return tieneFactura;
        if (filtroEstado === 'pagada') return estadoFactura === 'pagada';
        if (filtroEstado === 'reserva_pendiente') return estadoReserva === 'pendiente';
        if (filtroEstado === 'reserva_confirmada') return estadoReserva === 'confirmada';
        if (filtroEstado === 'reserva_cancelada') return estadoReserva === 'cancelada';
        if (filtroEstado === 'reserva_completada') return estadoReserva === 'completada';

        return true;
    });

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-CO') : '—';

    const datosPerfil = perfil || usuarioSesion;
    const nombreMostrado = [datosPerfil.nombres || datosPerfil.nombre, datosPerfil.apellidos].filter(Boolean).join(' ') || '—';

    return (
        <div className="container-xl py-4">
            <h2 className="text-center mb-4 fw-bold" style={{ color: '#2c3e50' }}>
                👤 Mi Perfil
            </h2>

            {/* ── DATOS PERSONALES ─────────────────────────────────────── */}
            <div className="card border-0 shadow-sm mb-4 p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">🪪 Datos Personales</h5>
                    {!editando && (
                        <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => setEditando(true)}
                        >
                            ✏️ Editar
                        </button>
                    )}
                </div>

                {!editando ? (
                    <div className="row g-3">
                        <div className="col-md-6">
                            <p className="mb-2"><strong>Nombre:</strong> {nombreMostrado}</p>
                            <p className="mb-2">
                                <strong>Correo:</strong>{' '}
                                {datosPerfil.email
                                    ? <a href={`mailto:${datosPerfil.email}`} className="text-decoration-none">{datosPerfil.email}</a>
                                    : '—'}
                            </p>
                        </div>
                        <div className="col-md-6">
                            <p className="mb-2"><strong>Teléfono:</strong> {datosPerfil.telefono || '—'}</p>
                            <p className="mb-2">
                                <strong>Tipo de usuario:</strong>{' '}
                                <span className="badge bg-primary">
                                    {datosPerfil.tipo_usuario || datosPerfil.rol || '—'}
                                </span>
                            </p>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Nombres</label>
                                <input
                                    type="text"
                                    className={`form-control ${editErrors.nombres ? 'is-invalid' : ''}`}
                                    value={editForm.nombres}
                                    onChange={(e) => setEditForm({ ...editForm, nombres: e.target.value })}
                                />
                                {editErrors.nombres && <div className="invalid-feedback">{editErrors.nombres}</div>}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Apellidos</label>
                                <input
                                    type="text"
                                    className={`form-control ${editErrors.apellidos ? 'is-invalid' : ''}`}
                                    value={editForm.apellidos}
                                    onChange={(e) => setEditForm({ ...editForm, apellidos: e.target.value })}
                                />
                                {editErrors.apellidos && <div className="invalid-feedback">{editErrors.apellidos}</div>}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Correo electrónico</label>
                                <input
                                    type="email"
                                    className={`form-control ${editErrors.email ? 'is-invalid' : ''}`}
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                />
                                {editErrors.email && <div className="invalid-feedback">{editErrors.email}</div>}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Teléfono / Celular</label>
                                <input
                                    type="tel"
                                    className="form-control"
                                    placeholder="Ej: 3001234567"
                                    value={editForm.telefono}
                                    onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="d-flex gap-2 mt-3">
                            <button
                                className="btn btn-primary"
                                onClick={handleGuardarPerfil}
                                disabled={loadingPerfil}
                            >
                                {loadingPerfil ? 'Guardando…' : '💾 Guardar cambios'}
                            </button>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => {
                                    setEditando(false);
                                    setEditErrors({});
                                    setEditForm({
                                        nombres: datosPerfil.nombres || datosPerfil.nombre || '',
                                        apellidos: datosPerfil.apellidos || '',
                                        email: datosPerfil.email || '',
                                        telefono: datosPerfil.telefono || '',
                                    });
                                }}
                                disabled={loadingPerfil}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── MIS RESERVAS ─────────────────────────────────────────── */}
            <div className="card border-0 shadow-sm p-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                    <h5 className="mb-0">📋 Mis Reservas</h5>
                    <div className="d-flex align-items-center gap-2">
                        <label htmlFor="filtroPerfil" className="mb-0 small text-muted">Filtrar:</label>
                        <select
                            id="filtroPerfil"
                            className="form-select form-select-sm"
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                            style={{ minWidth: '240px' }}
                        >
                            {opcionesFiltro.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="d-flex flex-wrap gap-2 mb-3">
                    {opcionesFiltro.map((opt) => (
                        <button
                            key={`chip-${opt.value}`}
                            type="button"
                            className={`btn btn-sm ${filtroEstado === opt.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setFiltroEstado(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                <div className="small text-muted mb-3">
                    Mostrando {reservasFiltradas.length} de {reservas.length} reserva(s).
                </div>

                {loading ? (
                    <div className="text-center py-3">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                ) : reservas.length === 0 ? (
                    <div className="text-center text-muted py-4">
                        <div style={{ fontSize: '2.5rem' }}>🛏️</div>
                        <p className="mt-2 mb-3">No tienes reservas registradas aún.</p>
                        <a href="/reservas" className="btn btn-primary btn-sm">Hacer una reserva</a>
                    </div>
                ) : reservasFiltradas.length === 0 ? (
                    <div className="alert alert-light border text-muted mb-0">
                        No hay resultados para el filtro seleccionado.
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>Entrada</th>
                                    <th>Salida</th>
                                    <th>Huéspedes</th>
                                    <th>Servicios</th>
                                    <th>Total Orden</th>
                                    <th>Documento</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservasFiltradas.map((r) => (
                                    <tr key={r.id_reserva}>
                                        <td className="fw-bold">#{r.id_reserva}</td>
                                        <td>{formatDate(r.fecha_checkin)}</td>
                                        <td>{formatDate(r.fecha_checkout)}</td>
                                        <td>{r.total_huespedes || r.num_huespedes || '—'}</td>
                                        <td>
                                            {r.servicios?.length ? (
                                                <div>
                                                    {r.servicios.map((s, idx) => (
                                                        <div key={`${r.id_reserva}-${idx}`} className="small">
                                                            • {s.nombre_servicio || s.nombre || 'Servicio'} x{s.cantidad || 1}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : 'Sin servicios'}
                                        </td>
                                        <td className="fw-semibold">{formatCurrency(r.totalOrden)}</td>
                                        <td>
                                            {r.factura?.id_factura ? (
                                                <span className="badge bg-success">
                                                    Factura {r.factura.numero_factura || `#${r.factura.id_factura}`}
                                                </span>
                                            ) : (
                                                <span className="badge bg-warning text-dark">Orden de servicios y hospedaje</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge bg-${estadoBadge(r.estado_reserva)}`}>
                                                {r.estado_reserva || 'pendiente'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientePerfil;
