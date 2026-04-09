import React, { useState, useEffect, useCallback } from 'react';
import reservasService from '../services/reservasService';
import habitacionesService from '../services/habitacionesService';
import tiposHabitacionService from '../services/tiposHabitacionService';
import serviciosService from '../services/serviciosService';
import { getAllUsuarios } from '../services/usuariosService';
import Swal from 'sweetalert2';
import { ESTADO_RESERVA_DEFAULT } from '../constants/reservas';

const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.rows)) return payload.rows;
    return [];
};

const toNumber = (value) => {
    const normalized = String(value ?? '0').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
};

const normalizarEstado = (value) => String(value || '').trim().toLowerCase();

const habitacionDisponible = (habitacion) => {
    const estado = normalizarEstado(habitacion?.estado);
    if (!estado) return true;
    return estado === 'disponible' || estado === 'available' || estado === 'libre';
};

const getTipoHabitacion = (tipos, habitacion) => (
    tipos.find((t) => Number(t.id_tipo_habitacion) === Number(habitacion?.id_tipo_habitacion))
);

const getCapacidadMaxima = (tipo, habitacion) => (
    toNumber(tipo?.capacidad_maxima ?? tipo?.capacidad ?? habitacion?.capacidad_maxima ?? habitacion?.capacidad)
);

const getPrecioNoche = (tipo, habitacion) => (
    toNumber(
        tipo?.precio_noche ??
        tipo?.precio ??
        tipo?.tarifa_noche ??
        habitacion?.precio_noche ??
        habitacion?.precio ??
        habitacion?.tarifa_noche ??
        habitacion?.costo
    )
);

const getPrecioServicio = (servicio) => (
    toNumber(servicio?.precio ?? servicio?.costo ?? servicio?.valor ?? servicio?.tarifa)
);

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const getNochesEstadia = (fechaCheckin, fechaCheckout) => {
    if (!fechaCheckin || !fechaCheckout) return 0;

    const inicio = new Date(fechaCheckin);
    const fin = new Date(fechaCheckout);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) return 0;

    const diff = Math.ceil((fin - inicio) / MS_PER_DAY);
    return diff > 0 ? diff : 0;
};

const compararNumeroHabitacion = (a, b) => {
    const valorA = String(a?.numero_habitacion ?? '').trim();
    const valorB = String(b?.numero_habitacion ?? '').trim();

    const numA = Number(valorA);
    const numB = Number(valorB);

    const aEsNumero = Number.isFinite(numA) && valorA !== '';
    const bEsNumero = Number.isFinite(numB) && valorB !== '';

    if (aEsNumero && bEsNumero) return numA - numB;
    if (aEsNumero) return -1;
    if (bEsNumero) return 1;

    return valorA.localeCompare(valorB, 'es', { numeric: true, sensitivity: 'base' });
};

const normalizarEstadoReserva = (value) => String(value || '').trim().toLowerCase().replace('_', '-');

const ESTADOS_RESERVA_UI = {
    PENDIENTE: 'pendiente',
    CONFIRMADA: 'confirmada',
    CHECK_IN: 'check-in',
    CHECK_OUT: 'check-out',
    CANCELADA: 'cancelada'
};

const estadosBloqueanHabitacion = new Set([
    ESTADOS_RESERVA_UI.PENDIENTE,
    ESTADOS_RESERVA_UI.CONFIRMADA,
    ESTADOS_RESERVA_UI.CHECK_IN
]);

const getAccionesEstadoReserva = (estado) => {
    const s = normalizarEstadoReserva(estado);

    if (s === ESTADOS_RESERVA_UI.PENDIENTE) {
        return [ESTADOS_RESERVA_UI.CONFIRMADA, ESTADOS_RESERVA_UI.CANCELADA];
    }
    if (s === ESTADOS_RESERVA_UI.CONFIRMADA) {
        return [ESTADOS_RESERVA_UI.CHECK_IN, ESTADOS_RESERVA_UI.CANCELADA];
    }
    if (s === ESTADOS_RESERVA_UI.CHECK_IN) {
        return [ESTADOS_RESERVA_UI.CHECK_OUT];
    }

    return [];
};

const getTextoEstado = (estado) => {
    const s = normalizarEstadoReserva(estado);
    if (s === ESTADOS_RESERVA_UI.CHECK_IN) return 'check-in';
    if (s === ESTADOS_RESERVA_UI.CHECK_OUT) return 'check-out';
    return s || ESTADOS_RESERVA_UI.PENDIENTE;
};

const isReservaActivaParaBloqueo = (estado) => estadosBloqueanHabitacion.has(normalizarEstadoReserva(estado));

const hayCruceFechas = (inicioA, finA, inicioB, finB) => {
    if (!inicioA || !finA || !inicioB || !finB) return false;
    return inicioA < finB && finA > inicioB;
};

const isHabitacionDisponibleEnFechas = ({
    idHabitacion,
    fechaCheckin,
    fechaCheckout,
    reservas,
    editingId
}) => {
    if (!fechaCheckin || !fechaCheckout) return true;

    const inicioNueva = new Date(fechaCheckin);
    const finNueva = new Date(fechaCheckout);
    if (Number.isNaN(inicioNueva.getTime()) || Number.isNaN(finNueva.getTime())) return false;

    return !reservas.some((reserva) => {
        if (Number(reserva.id_habitacion) !== Number(idHabitacion)) return false;
        if (editingId && Number(reserva.id_reserva) === Number(editingId)) return false;
        if (!isReservaActivaParaBloqueo(reserva.estado_reserva)) return false;

        const inicioExistente = new Date(reserva.fecha_checkin);
        const finExistente = new Date(reserva.fecha_checkout);
        if (Number.isNaN(inicioExistente.getTime()) || Number.isNaN(finExistente.getTime())) return false;

        return hayCruceFechas(inicioNueva, finNueva, inicioExistente, finExistente);
    });
};

const Reservas = ({ soloFormulario, user }) => {
    const [reservas, setReservas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [habitaciones, setHabitaciones] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [selectedServicios, setSelectedServicios] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        id_usuario: '', id_habitacion: '', fecha_checkin: '', fecha_checkout: '',
        total_huespedes: '', precio_total: '', estado_reserva: ESTADO_RESERVA_DEFAULT, notas: ''
    });

    const usuarioSesion = user || JSON.parse(localStorage.getItem('user') || 'null') || {};
    const userId = Number(usuarioSesion.id_usuarios || usuarioSesion.id_usuario || usuarioSesion.id || 0);
    const role = usuarioSesion.rol || usuarioSesion.tipo_usuario || '';
    const isStaff = role === 'administrador' || role === 'moderador';
    const soloFormularioEfectivo = Boolean(soloFormulario) || !isStaff;

    useEffect(() => {
        if (soloFormularioEfectivo && userId) {
            setFormData(prev => ({ ...prev, id_usuario: userId }));
        }
    }, [soloFormularioEfectivo, userId]);

    const fetchData = useCallback(async () => {
        try {
            const [resR, resU, resHab, resTip, resSer] = await Promise.all([
                isStaff ? reservasService.getAllReservas() : reservasService.getReservasUsuario(userId),
                isStaff ? getAllUsuarios() : Promise.resolve([]),
                habitacionesService.getHabitacionesParaReserva(),
                tiposHabitacionService.getAllTipos(),
                serviciosService.obtenerServicios()
            ]);
            setReservas(toArray(resR));
            setUsuarios(toArray(resU));
            setHabitaciones(toArray(resHab));
            setTipos(toArray(resTip));
            setServicios(toArray(resSer));
        } catch (e) {
            console.error("Error al cargar datos", e);
            const status = e?.response?.status;
            const backendMessage = String(e?.response?.data?.message || '').toLowerCase();

            if (!isStaff && (status === 404 || backendMessage.includes('reserva no encontrada'))) {
                setReservas([]);
                setUsuarios([]);
                return;
            }

            const message = status === 403
                ? 'No tienes permisos para consultar ese recurso. Intenta iniciar sesión nuevamente como cliente.'
                : (e?.response?.data?.message || 'No se pudieron cargar los datos');

            Swal.fire('Error', message, 'error');
        } finally {
            setLoading(false);
        }
    }, [isStaff, userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (!soloFormularioEfectivo) return;
        if (!formData.fecha_checkin || !formData.fecha_checkout) return;

        const cargarDisponibilidad = async () => {
            try {
                const disponibles = await habitacionesService.getDisponibles(formData.fecha_checkin, formData.fecha_checkout);
                setHabitaciones(toArray(disponibles));
            } catch (error) {
                console.error('Error al consultar disponibilidad:', error);
            }
        };

        cargarDisponibilidad();
    }, [soloFormularioEfectivo, formData.fecha_checkin, formData.fecha_checkout]);

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.id_usuario) newErrors.id_usuario = 'Debe seleccionar un huésped';
        if (!formData.id_habitacion) newErrors.id_habitacion = 'Debe seleccionar una habitación';
        if (!formData.fecha_checkin) newErrors.fecha_checkin = 'Debe ingresar fecha de entrada';
        if (!formData.fecha_checkout) newErrors.fecha_checkout = 'Debe ingresar fecha de salida';
        if (!formData.total_huespedes || formData.total_huespedes < 1) newErrors.total_huespedes = 'Debe ingresar número de huéspedes (mínimo 1)';
        
        if (formData.fecha_checkin && formData.fecha_checkout) {
            const noches = getNochesEstadia(formData.fecha_checkin, formData.fecha_checkout);
            if (noches <= 0) {
                newErrors.fecha_checkout = 'La salida debe ser posterior a la entrada';
            }
        }

        if (formData.id_habitacion && formData.total_huespedes) {
            const hab = habitaciones.find(h => h.id_habitacion === parseInt(formData.id_habitacion, 10));
            const tipo = getTipoHabitacion(tipos, hab);
            const capacidad = getCapacidadMaxima(tipo, hab);
            const huespedes = Number(formData.total_huespedes || 0);

            if (capacidad > 0 && huespedes > capacidad) {
                newErrors.total_huespedes = `La habitación seleccionada permite máximo ${capacidad} huésped(es).`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const calcularPrecio = () => {
        if (!formData.id_habitacion || !formData.fecha_checkin || !formData.fecha_checkout) return 0;
        
        const habitacionId = parseInt(formData.id_habitacion, 10);
        const hab = habitaciones.find(h => Number(h.id_habitacion) === habitacionId);
        const tipo = getTipoHabitacion(tipos, hab);
        const precioNoche = getPrecioNoche(tipo, hab);
        
        const dias = getNochesEstadia(formData.fecha_checkin, formData.fecha_checkout);
        if (dias <= 0) return 0;

        const precioHab = toNumber(precioNoche) * dias;
        const precioServ = selectedServicios.reduce((sum, id) => {
            const srv = servicios.find(s => Number(s.id_servicio) === Number(id));
            return sum + getPrecioServicio(srv);
        }, 0);
        
        const total = toNumber(precioHab) + toNumber(precioServ);
        return total > 0 ? total : 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            Swal.fire('⚠️ Faltan datos obligatorios', 
                Object.values(errors).map(e => `• ${e}`).join('\n'), 
                'error');
            return;
        }

        try {
            const payload = {
                ...formData,
                precio_total: calcularPrecio(),
                servicios: selectedServicios.map((idServicio) => ({
                    id_servicio: idServicio,
                    cantidad: 1
                }))
            };
            
            if (editingId) {
                await reservasService.actualizarReserva(editingId, payload);
                Swal.fire('✅ ¡Éxito!', 'Reserva actualizada correctamente.', 'success');
            } else {
                const resultado = await reservasService.crearReserva(payload);
                const idNuevaReserva = resultado?.data?.id_reserva || resultado?.id_reserva || resultado?.id || 'N/A';
                const resumenServicios = selectedServicios
                    .map((id) => servicios.find((s) => Number(s.id_servicio || s.id_servicios || s.id) === Number(id)))
                    .filter(Boolean)
                    .map((s) => `• ${s.nombre_servicio || s.nombre || 'Servicio'} (${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(getPrecioServicio(s))})`)
                    .join('<br/>');

                await Swal.fire({
                    icon: 'success',
                    title: '✅ Reserva registrada',
                    html: `
                        <p class="mb-2">Tu solicitud fue registrada con el número <strong>#${idNuevaReserva}</strong>.</p>
                        <p class="mb-1"><strong>Orden de servicios y hospedaje:</strong></p>
                        <div class="text-start" style="font-size:0.95rem;">${resumenServicios || '• Sin servicios adicionales'}</div>
                        <hr class="my-2"/>
                        <small>La factura se emitirá cuando se registre el pago total de la estadía.</small>
                    `,
                    confirmButtonText: 'Entendido'
                });
            }

            // Regla de negocio: reserva confirmada => habitación ocupada
            if (payload.estado_reserva === 'confirmada' && payload.id_habitacion) {
                await habitacionesService.actualizarHabitacion(payload.id_habitacion, {
                    estado: 'ocupada',
                    mantenimiento_inicio: null,
                    mantenimiento_fin: null
                });
            }

            handleCancelEdit();
            fetchData();
        } catch (e) {
            console.error(e);
            Swal.fire('❌ Error', e.message || 'No se pudo guardar la reserva.', 'error');
        }
    };

    const handleEdit = (res) => {
        setEditingId(res.id_reserva);
        setFormData({
            ...res,
            fecha_checkin: res.fecha_checkin.split('T')[0],
            fecha_checkout: res.fecha_checkout.split('T')[0]
        });
    };

    const handleCancelEdit = () => {
        setFormData({
            id_usuario: soloFormulario ? user?.id_usuarios : '',
            id_habitacion: '',
            fecha_checkin: '',
            fecha_checkout: '',
            total_huespedes: '',
            precio_total: '0',
            estado_reserva: ESTADO_RESERVA_DEFAULT,
            notas: ''
        });
        setSelectedServicios([]);
        setErrors({});
        setEditingId(null);
    };

    const getEstadoGestion = (reserva) => getTextoEstado(reserva.estado_reserva);

    const getEstadoBadge = (estado) => {
        const s = normalizarEstadoReserva(estado);
        if (s === ESTADOS_RESERVA_UI.CONFIRMADA) return 'bg-success';
        if (s === ESTADOS_RESERVA_UI.CHECK_IN) return 'bg-info';
        if (s === ESTADOS_RESERVA_UI.CHECK_OUT) return 'bg-primary';
        if (s === ESTADOS_RESERVA_UI.CANCELADA) return 'bg-danger';
        return 'bg-warning text-dark';
    };

    const actualizarEstadoGestion = async (reserva, nuevoEstado) => {
        if (!nuevoEstado) return;

        try {
            const estadoDestino = normalizarEstadoReserva(nuevoEstado);
            await reservasService.cambiarEstadoReserva(reserva.id_reserva, estadoDestino);

            if (estadoDestino === ESTADOS_RESERVA_UI.CONFIRMADA || estadoDestino === ESTADOS_RESERVA_UI.CHECK_IN) {
                await habitacionesService.actualizarHabitacion(reserva.id_habitacion, {
                    estado: 'ocupada',
                    mantenimiento_inicio: null,
                    mantenimiento_fin: null
                });
            }

            if (estadoDestino === ESTADOS_RESERVA_UI.CHECK_OUT || estadoDestino === ESTADOS_RESERVA_UI.CANCELADA) {
                await habitacionesService.actualizarHabitacion(reserva.id_habitacion, {
                    estado: 'disponible',
                    mantenimiento_inicio: null,
                    mantenimiento_fin: null
                });
            }

            Swal.fire('✅ Éxito', `Reserva #${reserva.id_reserva} actualizada a ${getTextoEstado(estadoDestino)}.`, 'success');
            fetchData();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo actualizar el estado.', 'error');
        }
    };

    const normalizarEstadoFila = async (reserva) => {
        const hab = habitaciones.find(h => h.id_habitacion === reserva.id_habitacion);
        if (!hab) {
            Swal.fire('Error', 'No se encontró la habitación asociada.', 'error');
            return;
        }

        let estadoObjetivo = null;
        if (reserva.estado_reserva === 'confirmada' || reserva.estado_reserva === 'check-in') {
            estadoObjetivo = 'ocupada';
        }
        if (reserva.estado_reserva === 'cancelada' || reserva.estado_reserva === 'check-out') {
            estadoObjetivo = 'disponible';
        }

        if (!estadoObjetivo) {
            Swal.fire('Sin cambios', 'Esta reserva no requiere normalización automática.', 'info');
            return;
        }

        if (hab.estado === estadoObjetivo) {
            Swal.fire('OK', 'El estado ya está normalizado.', 'success');
            return;
        }

        try {
            await habitacionesService.actualizarHabitacion(hab.id_habitacion, {
                estado: estadoObjetivo,
                mantenimiento_inicio: null,
                mantenimiento_fin: null
            });

            Swal.fire('✅ Normalizado', `Habitación #${hab.numero_habitacion} actualizada a ${estadoObjetivo}.`, 'success');
            fetchData();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo normalizar el estado.', 'error');
        }
    };

    const formatCurrency = (v) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);

    const habitacionesDisponibles = habitaciones.filter((h) => {
        if (!habitacionDisponible(h)) return false;
        return isHabitacionDisponibleEnFechas({
            idHabitacion: h.id_habitacion,
            fechaCheckin: formData.fecha_checkin,
            fechaCheckout: formData.fecha_checkout,
            reservas,
            editingId
        });
    });
    const habitacionesDisponiblesOrdenadas = [...habitacionesDisponibles].sort(compararNumeroHabitacion);
    const fechasCompletas = Boolean(formData.fecha_checkin && formData.fecha_checkout);
    const mostrarNoDisponibilidad = habitacionesDisponibles.length === 0 && (!soloFormularioEfectivo || fechasCompletas);

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Cargando...</span></div></div>;

    return (
        <div className="container-xl py-4">
            <h2 className="text-center mb-4 fw-bold" style={{ color: '#2c3e50' }}>
                📅 {soloFormulario ? 'Solicita tu Reserva' : 'Gestión de Reservas'}
            </h2>

            {soloFormularioEfectivo && (
                <div className="alert alert-info" role="alert">
                    Bienvenido a Hotel El Sol, aquí podrá hacer su reserva.
                </div>
            )}
            
            {/* ── FORMULARIO ─────────────────────────────────────────────── */}
            <div className="card border-0 shadow-sm mb-5 p-4">
                <h5 className="mb-3">{editingId ? '✏️ Editar Reserva' : '➕ Nueva Reserva'}</h5>
                <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                        {!soloFormularioEfectivo && (
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Huésped *</label>
                                <select
                                    className={`form-select ${errors.id_usuario ? 'is-invalid' : ''}`}
                                    value={formData.id_usuario}
                                    onChange={(e) => setFormData({...formData, id_usuario: e.target.value})}
                                    required
                                >
                                    <option value="">— Seleccione un huésped —</option>
                                    {usuarios.map(u => (
                                        <option key={u.id_usuarios} value={u.id_usuarios}>
                                            {u.nombres} {u.apellidos} ({u.email})
                                        </option>
                                    ))}
                                </select>
                                {errors.id_usuario && <div className="invalid-feedback d-block">{errors.id_usuario}</div>}
                            </div>
                        )}
                        <div className="col-12">
                            <label className="form-label fw-bold">Habitación *</label>

                            {/* Cliente: aviso si no ha elegido fechas */}
                            {soloFormularioEfectivo && !fechasCompletas && (
                                <div className="alert alert-info py-2">
                                    Selecciona primero las fechas de entrada y salida para ver habitaciones disponibles.
                                </div>
                            )}

                            {/* Sin disponibilidad */}
                            {mostrarNoDisponibilidad && (
                                <div className="alert alert-warning py-2">
                                    No hay habitaciones disponibles para las fechas seleccionadas.
                                </div>
                            )}

                            {fechasCompletas && !mostrarNoDisponibilidad && (
                                <div className="alert alert-success py-2">
                                    {habitacionesDisponibles.length} de {habitaciones.length} habitaciones disponibles para
                                    {' '}{getNochesEstadia(formData.fecha_checkin, formData.fecha_checkout)} noche(s).
                                </div>
                            )}

                            {/* Staff: selector tradicional */}
                            {!soloFormularioEfectivo && (
                                <select
                                    className={`form-select ${errors.id_habitacion ? 'is-invalid' : ''}`}
                                    value={formData.id_habitacion}
                                    onChange={(e) => setFormData({...formData, id_habitacion: e.target.value})}
                                    required
                                >
                                    <option value="">— Seleccione habitación —</option>
                                    {habitacionesDisponiblesOrdenadas.map(h => {
                                        const tipo = getTipoHabitacion(tipos, h);
                                        const capacidad = getCapacidadMaxima(tipo, h);
                                        const precioNoche = getPrecioNoche(tipo, h);
                                        return (
                                            <option key={h.id_habitacion} value={h.id_habitacion}>
                                                #{h.numero_habitacion} - {tipo?.nombre_tipo || 'Habitación'} (Cap: {capacidad || '-'}) - {formatCurrency(precioNoche)}/noche
                                            </option>
                                        );
                                    })}
                                </select>
                            )}

                            {/* Cliente: grid de tarjetas */}
                            {soloFormularioEfectivo && fechasCompletas && !mostrarNoDisponibilidad && (
                                <div className="row g-3 mt-1">
                                    {habitacionesDisponiblesOrdenadas.map(h => {
                                        const tipo = getTipoHabitacion(tipos, h);
                                        const capacidad = getCapacidadMaxima(tipo, h);
                                        const precioNoche = getPrecioNoche(tipo, h);
                                        const seleccionada = Number(formData.id_habitacion) === Number(h.id_habitacion);
                                        const iconoTipo = (() => {
                                            const n = (tipo?.nombre_tipo || '').toLowerCase();
                                            if (n.includes('suite')) return '🛎️';
                                            if (n.includes('penthouse')) return '🏙️';
                                            if (n.includes('deluxe')) return '⭐';
                                            if (n.includes('doble')) return '🛏️';
                                            return '🏠';
                                        })();
                                        return (
                                            <div key={h.id_habitacion} className="col-sm-6 col-lg-4">
                                                <div
                                                    className={`card h-100 border-2 ${seleccionada ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`}
                                                    style={{ cursor: 'pointer', transition: 'border-color .15s' }}
                                                    onClick={() => setFormData({ ...formData, id_habitacion: String(h.id_habitacion) })}
                                                >
                                                    <div className="card-body p-3">
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <span style={{ fontSize: '1.8rem' }}>{iconoTipo}</span>
                                                            {seleccionada && (
                                                                <span className="badge bg-primary">Seleccionada ✓</span>
                                                            )}
                                                        </div>
                                                        <h6 className="fw-bold mb-1">
                                                            Hab. #{h.numero_habitacion} — {tipo?.nombre_tipo || 'Habitación'}
                                                        </h6>
                                                        <p className="text-muted small mb-2" style={{ minHeight: '2.5rem' }}>
                                                            {tipo?.descripcion || 'Habitación confortable con todas las comodidades del hotel.'}
                                                        </p>
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <span className="small text-muted">
                                                                👥 Hasta {capacidad || '?'} huésped{capacidad !== 1 ? 'es' : ''}
                                                            </span>
                                                            <span className="fw-bold text-success small">
                                                                {formatCurrency(precioNoche)}/noche
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {errors.id_habitacion && (
                                <div className="text-danger small mt-1">{errors.id_habitacion}</div>
                            )}
                        </div>

                        <div className="col-md-3">
                            <label className="form-label fw-bold">Entrada *</label>
                            <input
                                type="date"
                                className={`form-control ${errors.fecha_checkin ? 'is-invalid' : ''}`}
                                value={formData.fecha_checkin}
                                onChange={(e) => setFormData({...formData, fecha_checkin: e.target.value})}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                            {errors.fecha_checkin && <div className="invalid-feedback d-block">{errors.fecha_checkin}</div>}
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold">Salida *</label>
                            <input
                                type="date"
                                className={`form-control ${errors.fecha_checkout ? 'is-invalid' : ''}`}
                                value={formData.fecha_checkout}
                                onChange={(e) => setFormData({...formData, fecha_checkout: e.target.value})}
                                min={formData.fecha_checkin || new Date().toISOString().split('T')[0]}
                                required
                            />
                            {errors.fecha_checkout && <div className="invalid-feedback d-block">{errors.fecha_checkout}</div>}
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold">Huéspedes *</label>
                            <input
                                type="number"
                                min="1"
                                className={`form-control ${errors.total_huespedes ? 'is-invalid' : ''}`}
                                value={formData.total_huespedes}
                                onChange={(e) => setFormData({...formData, total_huespedes: e.target.value})}
                                required
                            />
                            {errors.total_huespedes && <div className="invalid-feedback d-block">{errors.total_huespedes}</div>}
                        </div>

                        {/* ── SERVICIOS ────────────────────────────────────────── */}
                        {servicios.length > 0 && (
                            <div className="col-12">
                                <label className="form-label fw-bold">Servicios Adicionales</label>
                                <div className="row g-2">
                                    {servicios.map(srv => (
                                        <div key={srv.id_servicio} className="col-md-4">
                                            <div className="form-check">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id={`srv-${srv.id_servicio}`}
                                                    checked={selectedServicios.includes(srv.id_servicio)}
                                                    onChange={(e) => {
                                                        const servicioId = Number(srv.id_servicio);
                                                        if (e.target.checked) {
                                                            setSelectedServicios([...selectedServicios, servicioId]);
                                                        } else {
                                                            setSelectedServicios(selectedServicios.filter(id => Number(id) !== servicioId));
                                                        }
                                                    }}
                                                />
                                                <label className="form-check-label" htmlFor={`srv-${srv.id_servicio}`}>
                                                    {srv.nombre_servicio || srv.nombre || 'Servicio'} ({formatCurrency(getPrecioServicio(srv))})
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="col-12 bg-light p-3 rounded">
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-bold" style={{ fontSize: '1.1rem' }}>Resumen:</span>
                                <div>
                                    <small className="text-secondary d-block">Total:</small>
                                    <span style={{ fontSize: '1.5rem', color: '#28a745', fontWeight: 'bold' }}>
                                        {formatCurrency(calcularPrecio())}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12">
                            <label className="form-label">Notas</label>
                            <textarea
                                className="form-control"
                                rows="2"
                                placeholder="Detalles adicionales (opcional)"
                                value={formData.notas}
                                onChange={(e) => setFormData({...formData, notas: e.target.value})}
                            />
                        </div>

                        <div className="col-12 text-center">
                            <button type="submit" className={`btn ${editingId ? 'btn-warning' : 'btn-success'} fw-bold me-2 px-4`}>
                                {editingId ? '💾 Actualizar' : '✅ Confirmar Reserva'}
                            </button>
                            {editingId && (
                                <button type="button" className="btn btn-secondary fw-bold px-4" onClick={handleCancelEdit}>
                                    ❌ Cancelar
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            {/* ── TABLA: Solo admin ──────────────────────────────────────── */}
            {!soloFormularioEfectivo && (
                <>
                    <h5 className="mb-3 fw-bold" style={{ color: '#2c3e50' }}>📋 Reservas Registradas</h5>
                    <div className="table-responsive shadow-sm rounded-3">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th className="ps-3">ID</th>
                                    <th>Huésped</th>
                                    <th>Habitación</th>
                                    <th>Entrada - Salida</th>
                                    <th>Huéspedes</th>
                                    <th>Total</th>
                                    <th>Estado</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservas.map((res) => {
                                    const hab = habitaciones.find(h => h.id_habitacion === res.id_habitacion);
                                    const estadoGestion = getEstadoGestion(res);
                                    const accionesPermitidas = getAccionesEstadoReserva(estadoGestion);
                                    return (
                                        <tr key={res.id_reserva}>
                                            <td className="ps-3 fw-bold">#{res.id_reserva}</td>
                                            <td>{res.nombre_usuario}</td>
                                            <td>#{hab?.numero_habitacion}</td>
                                            <td style={{ fontSize: '0.9rem' }}>
                                                {new Date(res.fecha_checkin).toLocaleDateString()} - {new Date(res.fecha_checkout).toLocaleDateString()}
                                            </td>
                                            <td>👥 {res.total_huespedes}</td>
                                            <td className="fw-bold text-success">{formatCurrency(res.precio_total)}</td>
                                            <td>
                                                <span className={`badge ${getEstadoBadge(estadoGestion)}`}>
                                                    {estadoGestion}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(res)} title="Editar">✏️</button>
                                                {accionesPermitidas.includes(ESTADOS_RESERVA_UI.CONFIRMADA) && (
                                                    <button
                                                        className="btn btn-sm btn-success me-2"
                                                        onClick={() => actualizarEstadoGestion(res, ESTADOS_RESERVA_UI.CONFIRMADA)}
                                                        title="Confirmar reserva"
                                                    >
                                                        Confirmar
                                                    </button>
                                                )}
                                                {accionesPermitidas.includes(ESTADOS_RESERVA_UI.CHECK_IN) && (
                                                    <button
                                                        className="btn btn-sm btn-warning me-2"
                                                        onClick={() => actualizarEstadoGestion(res, ESTADOS_RESERVA_UI.CHECK_IN)}
                                                        title="Registrar check-in"
                                                    >
                                                        Check-in
                                                    </button>
                                                )}
                                                {accionesPermitidas.includes(ESTADOS_RESERVA_UI.CHECK_OUT) && (
                                                    <button
                                                        className="btn btn-sm btn-info text-white me-2"
                                                        onClick={() => actualizarEstadoGestion(res, ESTADOS_RESERVA_UI.CHECK_OUT)}
                                                        title="Registrar check-out"
                                                    >
                                                        Check-out
                                                    </button>
                                                )}
                                                {accionesPermitidas.includes(ESTADOS_RESERVA_UI.CANCELADA) && (
                                                    <button
                                                        className="btn btn-sm btn-danger me-2"
                                                        onClick={() => actualizarEstadoGestion(res, ESTADOS_RESERVA_UI.CANCELADA)}
                                                        title="Cancelar reserva"
                                                    >
                                                        Cancelar
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-sm btn-outline-secondary ms-2"
                                                    onClick={() => normalizarEstadoFila(res)}
                                                    title="Normalizar estado"
                                                >
                                                    ♻️
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default Reservas;