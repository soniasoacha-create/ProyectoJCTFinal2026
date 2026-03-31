import React, { useState, useEffect } from 'react';
import reservasService from '../services/reservasService';
import habitacionesService from '../services/habitacionesService';
import tiposHabitacionService from '../services/tiposHabitacionService';
import { getAllUsuarios } from '../services/usuariosService';
import facturacionService from '../services/facturacionService';
import reservaServiciosService from '../services/reservaServiciosService';
import Swal from 'sweetalert2';

const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
};

const unwrap = (payload) => payload?.data || payload;

const toNumber = (value) => {
    const normalized = String(value ?? '0').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
};

const Facturacion = () => {
    const usuarioSesion = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null') || {}; } catch { return {}; } })();
    const userId = Number(usuarioSesion.id_usuarios || usuarioSesion.id_usuario || usuarioSesion.id || 0);
    const role = usuarioSesion.rol || usuarioSesion.tipo_usuario || '';
    const isStaff = role === 'administrador' || role === 'moderador';

    const [reservas, setReservas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [habitaciones, setHabitaciones] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [selectedReserva, setSelectedReserva] = useState(null);
    const [selectedFactura, setSelectedFactura] = useState(null);
    const [selectedServiciosFactura, setSelectedServiciosFactura] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [misReservas, setMisReservas] = useState([]);
    const [medioPago, setMedioPago] = useState(null);

    useEffect(() => {
        if (isStaff) {
            fetchData();
        } else {
            cargarMisReservas();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        try {
            const [resR, resU, resHab, resTip] = await Promise.all([
                reservasService.getAllReservas(),
                getAllUsuarios(),
                habitacionesService.getAllHabitaciones(),
                tiposHabitacionService.getAllTipos()
            ]);
            setReservas(toArray(resR));
            setUsuarios(toArray(resU));
            setHabitaciones(toArray(resHab));
            setTipos(toArray(resTip));
        } catch (e) {
            console.error("Error cargando datos", e);
            Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const cargarMisReservas = async () => {
        try {
            const data = await reservasService.getReservasUsuario(userId);
            setMisReservas(toArray(data));
        } catch (e) {
            console.error('Error cargando reservas del usuario', e);
        } finally {
            setLoading(false);
        }
    };

    const loadClientFactura = async (reserva) => {
        setLoading(true);
        try {
            let facturaData = null;
            try {
                const res = await facturacionService.obtenerFacturaCompleta(reserva.id_reserva);
                facturaData = unwrap(res);
            } catch {}
            await cargarServiciosReserva(facturaData?.id_reserva || reserva.id_reserva);
            setSelectedFactura(facturaData);
            setSelectedReserva(reserva);
            setMedioPago(null);
        } catch (e) {
            console.error('Error cargando factura del cliente', e);
        } finally {
            setLoading(false);
        }
    };

    const registrarPagoYGenerarFactura = async () => {
        if (!selectedReserva?.id_reserva) {
            Swal.fire('Atención', 'Selecciona una reserva válida para registrar el pago.', 'warning');
            return;
        }


        const { value: metodoPago } = await Swal.fire({
            title: '💰 Registrar Pago',
            html: `
                <p class="text-muted mb-3">Reserva #${selectedReserva.id_reserva}</p>
                <label class="form-label fw-bold d-block text-start mb-1">Método de pago recibido:</label>
                <select id="swal-metodo" class="form-select">
                    <option value="efectivo">💵 Efectivo</option>
                    <option value="mercadopago">💳 MercadoPago</option>
                    <option value="transferencia">🏦 Transferencia Caja Social</option>
                    <option value="tarjeta">💳 Tarjeta débito / crédito</option>
                </select>
            `,
            preConfirm: () => document.getElementById('swal-metodo').value,
            showCancelButton: true,
            confirmButtonText: 'Confirmar y registrar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#28a745',
        });

        if (metodoPago === undefined) return;

        setLoading(true);
        try {
            const generated = await facturacionService.generarOObtenerFactura(selectedReserva.id_reserva);
            const facturaGenerada = unwrap(generated);

            if (facturaGenerada?.id_factura) {
                try {
                    await facturacionService.cambiarEstadoFactura(facturaGenerada.id_factura, 'pagada');
                } catch (e) {
                    console.warn('No se pudo marcar como pagada, se mantiene estado retornado por backend.', e);
                }
            }

            const facturaCompleta = await facturacionService.obtenerFacturaCompleta(selectedReserva.id_reserva);
            setSelectedFactura(unwrap(facturaCompleta));
            await cargarServiciosReserva(selectedReserva.id_reserva);
            Swal.fire('Pago registrado', 'Se generó la factura de la reserva correctamente.', 'success');
        } catch (e) {
            console.error('Error al registrar pago y generar factura', e);
            Swal.fire('Error', 'No se pudo generar la factura para la reserva seleccionada.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (v) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);

    const cargarServiciosReserva = async (idReserva) => {
        if (!idReserva) {
            setSelectedServiciosFactura([]);
            return [];
        }

        try {
            const response = await reservaServiciosService.obtenerConsumosPorReserva(idReserva);
            const servicios = toArray(response);
            setSelectedServiciosFactura(servicios);
            return servicios;
        } catch (error) {
            console.warn('No se pudieron cargar servicios de la reserva.', error);
            setSelectedServiciosFactura([]);
            return [];
        }
    };

    const getFacturaDetalles = (factura) => {
        const subtotal = toNumber(
            factura.subtotal_hospedaje ??
            factura.subtotal_bruto ??
            0
        );
        const totalServicios = toNumber(
            factura.total_servicios ??
            factura.subtotal_servicios ??
            0
        );
        const iva = toNumber(
            factura.resumen_financiero?.impuestos ??
            factura.iva_19 ??
            subtotal * 0.19
        );
        const total = toNumber(
            factura.total_general ??
            factura.monto_total ??
            factura.resumen_financiero?.total_con_impuestos ??
            subtotal + totalServicios + iva
        );
        const dias = toNumber(
            factura.noches_estadia ??
            factura.detalle_estadia?.dias_hospedaje ??
            Math.ceil((new Date(factura.fecha_checkout) - new Date(factura.fecha_checkin)) / (1000 * 60 * 60 * 24))
        );

        return { subtotal, totalServicios, iva, total, dias };
    };

    const seleccionarFacturaPorId = async () => {
        const term = search.trim();
        if (!term) {
            Swal.fire('Campo requerido', 'Ingresa un ID de factura, ID de reserva o email.', 'warning');
            return;
        }

        if (/^\d+$/.test(term)) {
            try {
                const facturaResponse = await facturacionService.obtenerFacturaPorId(term);
                const factura = unwrap(facturaResponse);
                if (factura?.id_factura) {
                    await cargarServiciosReserva(factura.id_reserva);
                    setSelectedFactura(factura);
                    setSelectedReserva(null);
                    return;
                }
            } catch (error) {
                console.warn('No se encontró factura por ID, se intentará con reserva.', error);
            }
        }

        const res = reservasFiltradas[0];
        if (!res) {
            Swal.fire('No encontrado', 'No se encontró una factura o reserva con esos datos.', 'warning');
            return;
        }

        try {
            const facturaResponse = await facturacionService.obtenerFacturaCompleta(res.id_reserva);
            const factura = unwrap(facturaResponse);
            if (factura?.id_factura || factura?.id_reserva) {
                await cargarServiciosReserva(factura.id_reserva || res.id_reserva);
                setSelectedFactura(factura);
                setSelectedReserva(res);
                return;
            }
        } catch (error) {
            console.warn('No se pudo obtener factura completa; se usará el cálculo local.', error);
        }

        await cargarServiciosReserva(res.id_reserva);
        setSelectedFactura(null);
        setSelectedReserva(res);
    };

    const getDetalles = (res) => {
        const usuario = usuarios.find(u => u.id_usuarios === res.id_usuario);
        const hab = habitaciones.find(h => h.id_habitacion === res.id_habitacion);
        const tipo = tipos.find(t => t.id_tipo_habitacion === hab?.id_tipo_habitacion);
        
        const dias = Math.ceil((new Date(res.fecha_checkout) - new Date(res.fecha_checkin)) / (1000 * 60 * 60 * 24));
        const precioHab = (tipo?.precio_noche || 0) * dias;
        const totalServicios = selectedServiciosFactura.reduce((sum, servicio) => sum + toNumber(servicio.subtotal ?? servicio.precio ?? 0), 0);
        const subtotal = precioHab + totalServicios;
        const iva = subtotal * 0.19;
        const total = subtotal + iva;

        return { usuario, hab, tipo, dias, precioHab, totalServicios, subtotal, iva, total };
    };

    const reservasFiltradas = reservas.filter(r => {
        if (!search) return true;
        const detalles = getDetalles(r);
        return (
            r.id_reserva.toString().includes(search) ||
            detalles.usuario?.email?.toLowerCase().includes(search.toLowerCase())
        );
    });

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Cargando...</span></div></div>;

    return (
        <div className="container-xl py-4">
            <h2 className="text-center mb-4 fw-bold" style={{ color: '#2c3e50' }}>
                💳 Facturación y Cuentas
            </h2>

            {/* ── SELECCIÓN CLIENTE ─────────────────────────────────────── */}
            {!isStaff && (selectedFactura || selectedReserva) && (
                <div className="mb-3">
                    <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => { setSelectedFactura(null); setSelectedReserva(null); setMedioPago(null); }}
                    >
                        ← Volver a mis reservas
                    </button>
                </div>
            )}
            {!isStaff && !selectedFactura && !selectedReserva && (
                <div className="card border-0 shadow-sm mb-4 p-4">
                    <h5 className="mb-3">📋 Mis Reservas</h5>
                    {misReservas.length === 0 ? (
                        <div className="text-center text-muted py-3">
                            <div style={{ fontSize: '2.5rem' }}>🛏️</div>
                            <p className="mt-2 mb-0">No tienes reservas registradas. <a href="/reservas">Haz una reserva</a> para ver tu factura.</p>
                        </div>
                    ) : (
                        <div className="row g-3">
                            {misReservas.map((r) => (
                                <div key={r.id_reserva} className="col-md-6 col-lg-4">
                                    <div
                                        className="card h-100 border shadow-sm"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => loadClientFactura(r)}
                                    >
                                        <div className="card-body">
                                            <h6 className="fw-bold">Reserva #{r.id_reserva}</h6>
                                            <p className="mb-1 small"><strong>Entrada:</strong> {r.fecha_checkin ? new Date(r.fecha_checkin).toLocaleDateString('es-CO') : '\u2014'}</p>
                                            <p className="mb-1 small"><strong>Salida:</strong> {r.fecha_checkout ? new Date(r.fecha_checkout).toLocaleDateString('es-CO') : '\u2014'}</p>
                                            <p className="mb-2 small"><strong>Hu\u00e9spedes:</strong> {r.total_huespedes || r.num_huespedes || '\u2014'}</p>
                                            <span className={`badge bg-${r.estado_reserva === 'confirmada' ? 'success' : r.estado_reserva === 'cancelada' ? 'danger' : 'warning'}`}>
                                                {r.estado_reserva || 'pendiente'}
                                            </span>
                                            <div className="mt-3">
                                                <span className="btn btn-outline-primary btn-sm w-100">💳 Ver Factura</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── BUSCADOR (solo staff) ──────────────────────────────────── */}
            {isStaff && (
            <div className="card border-0 shadow-sm mb-4 p-4">
                <h5 className="mb-3">🔍 Buscar Reserva</h5>
                <div className="row g-3">
                    <div className="col-md-8">
                        <input
                            type="text"
                            className="form-control form-control-lg"
                            placeholder="ID de reserva o email del cliente..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="col-md-4">
                        <button
                            className="btn btn-primary w-100"
                            onClick={seleccionarFacturaPorId}
                        >
                            Buscar
                        </button>
                    </div>
                </div>
                {reservasFiltradas.length > 0 && (
                    <div className="mt-3">
                        <small className="text-muted">Se encontraron {reservasFiltradas.length} reserva(s)</small>
                        <div className="row g-2 mt-2">
                            {reservasFiltradas.slice(0, 5).map((res) => (
                                <div key={res.id_reserva} className="col-auto">
                                    <button
                                        className={`btn btn-sm ${selectedReserva?.id_reserva === res.id_reserva ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={async () => {
                                            setSelectedReserva(res);
                                            try {
                                                const facturaResponse = await facturacionService.obtenerFacturaCompleta(res.id_reserva);
                                                    const factura = unwrap(facturaResponse);
                                                    await cargarServiciosReserva(factura?.id_reserva || res.id_reserva);
                                                    setSelectedFactura(factura);
                                            } catch (error) {
                                                    await cargarServiciosReserva(res.id_reserva);
                                                setSelectedFactura(null);
                                            }
                                        }}
                                    >
                                        #{res.id_reserva} - {usuarios.find(u => u.id_usuarios === res.id_usuario)?.nombres || '?'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            )}

            {/* ── FACTURA ───────────────────────────────────────────────── */}
            {(selectedFactura || selectedReserva) ? (() => {
                if (selectedFactura) {
                    const factura = selectedFactura;
                    const detalles = getFacturaDetalles(factura);
                    const servicios = Array.isArray(factura.servicios) && factura.servicios.length > 0
                        ? factura.servicios
                        : selectedServiciosFactura;
                    const totalServiciosCalculado = servicios.reduce((sum, servicio) => sum + toNumber(servicio.subtotal ?? servicio.precio ?? 0), 0);

                    return (
                        <div className="card border-0 shadow-lg p-0 overflow-hidden">
                            <div style={{ background: 'linear-gradient(135deg, #2c3e50, #34495e)', color: 'white', padding: '40px' }} className="text-center">
                                <h3 className="fw-bold mb-1">🏨 HOTEL EL SOL</h3>
                                <p className="mb-0 opacity-75">Puente Piedra, Cundinamarca - Colombia</p>
                            </div>

                            <div className="p-4" style={{ maxWidth: '900px', margin: '0 auto' }}>
                                <div className="row mb-4">
                                    <div className="col-4">
                                        <h6 className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.1rem' }}>Número Factura</h6>
                                        <p className="fw-bold" style={{ fontSize: '1.2rem' }}>{factura.numero_factura || `FAC-${factura.id_factura}`}</p>
                                    </div>
                                    <div className="col-4">
                                        <h6 className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.1rem' }}>Fecha Factura</h6>
                                        <p className="fw-bold">{factura.fecha_factura ? new Date(factura.fecha_factura).toLocaleDateString('es-CO') : '—'}</p>
                                    </div>
                                    <div className="col-4">
                                        <h6 className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.1rem' }}>Estado</h6>
                                        <p className="fw-bold">
                                            <span className={`badge bg-${factura.estado_factura === 'pagada' ? 'success' : factura.estado_factura === 'cancelada' ? 'danger' : 'warning'}`}>
                                                {factura.estado_factura || 'generada'}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <hr className="my-4" />

                                <div className="row mb-4">
                                    <div className="col-6">
                                        <h6 className="fw-bold text-secondary text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.1rem' }}>Cliente</h6>
                                        <p className="mb-1"><strong>{factura.nombres} {factura.apellidos}</strong></p>
                                        <p className="mb-1 text-muted small">📧 {factura.email || '—'}</p>
                                        <p className="text-muted small">📱 {factura.telefono || '—'}</p>
                                    </div>
                                    <div className="col-6">
                                        <h6 className="fw-bold text-secondary text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.1rem' }}>Estancia</h6>
                                        <p className="mb-1"><strong>Entrada:</strong> {factura.fecha_checkin ? new Date(factura.fecha_checkin).toLocaleDateString('es-CO') : '—'}</p>
                                        <p className="mb-1"><strong>Salida:</strong> {factura.fecha_checkout ? new Date(factura.fecha_checkout).toLocaleDateString('es-CO') : '—'}</p>
                                        <p className="text-muted small"><strong>{detalles.dias}</strong> noches • <strong>{factura.total_huespedes || factura.detalle_estadia?.numero_personas || 0}</strong> huéspedes</p>
                                    </div>
                                </div>

                                <hr className="my-4" />

                                <h6 className="fw-bold mb-3">Detalles de Cargos</h6>
                                <div className="table-responsive mb-4">
                                    <table className="table table-sm text-sm">
                                        <thead className="border-top border-bottom">
                                            <tr>
                                                <th style={{ fontSize: '0.85rem', background: '#f8f9fa', color: '#495057' }}>Concepto</th>
                                                <th className="text-end" style={{ fontSize: '0.85rem', background: '#f8f9fa', color: '#495057' }}>Cantidad/Días</th>
                                                <th className="text-end" style={{ fontSize: '0.85rem', background: '#f8f9fa', color: '#495057' }}>Precio Unitario</th>
                                                <th className="text-end" style={{ fontSize: '0.85rem', background: '#f8f9fa', color: '#495057' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><strong>Habitación {factura.nombre_tipo || '—'}</strong> (#{factura.numero_habitacion || '—'})</td>
                                                <td className="text-end">{detalles.dias}</td>
                                                <td className="text-end">{formatCurrency(factura.precio_noche)}</td>
                                                <td className="text-end fw-bold">{formatCurrency(factura.subtotal_hospedaje)}</td>
                                            </tr>
                                            {servicios.map((servicio) => (
                                                <tr key={`${servicio.id_servicio}-${servicio.nombre_servicio}`}>
                                                    <td><strong>{servicio.nombre_servicio}</strong></td>
                                                    <td className="text-end">{servicio.cantidad || 1}</td>
                                                    <td className="text-end">{formatCurrency(servicio.precio_unitario || (Number(servicio.subtotal || 0) / Number(servicio.cantidad || 1)))}</td>
                                                    <td className="text-end fw-bold">{formatCurrency(servicio.subtotal)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="row justify-content-end mb-4">
                                    <div className="col-md-4">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Hospedaje:</span>
                                            <span className="fw-bold">{formatCurrency(factura.subtotal_hospedaje)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Servicios:</span>
                                                    <span className="fw-bold">{formatCurrency(totalServiciosCalculado || detalles.totalServicios)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-3 border-bottom pb-3">
                                            <span>IVA:</span>
                                            <span className="fw-bold text-success">{formatCurrency(detalles.iva)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between p-3 rounded" style={{ background: '#f0c040' }}>
                                            <span className="fw-bold" style={{ fontSize: '1.1rem' }}>TOTAL A PAGAR:</span>
                                            <span className="fw-bold" style={{ fontSize: '1.3rem' }}>{formatCurrency(detalles.total)}</span>
                                        </div>
                                    </div>
                                </div>

                                <hr className="my-4" />

                                <div className="text-center text-muted small">
                                    <p className="mb-1">Gracias por hospedarse en Hotel El Sol</p>
                                    <p className="mb-0">📞 +57 310 856 9611 | 📧 hotelelsol@gmail.com</p>
                                </div>
                            </div>

                            <div className="p-4 bg-light d-flex justify-content-end gap-2">
                                <button className="btn btn-outline-secondary" onClick={() => window.print()}>
                                    🖨️ Imprimir
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        Swal.fire('✅ Éxito', 'Factura descargada (funcionalidad simulada)', 'success');
                                    }}
                                >
                                    📥 Descargar PDF
                                </button>
                            </div>
                        </div>
                    );
                }

                const detalles = getDetalles(selectedReserva);
                const ordenNum = `ORD-${new Date().getFullYear()}-${String(selectedReserva.id_reserva).padStart(4, '0')}`;
                
                return (
                    <div className="card border-0 shadow-lg p-0 overflow-hidden">
                        {/* Header */}
                        <div style={{ background: 'linear-gradient(135deg, #2c3e50, #34495e)', color: 'white', padding: '40px' }} className="text-center">
                            <h3 className="fw-bold mb-1">🏨 HOTEL EL SOL</h3>
                            <p className="mb-0 opacity-75">Puente Piedra, Cundinamarca - Colombia</p>
                        </div>

                        {/* Documento */}
                        <div className="p-4" style={{ maxWidth: '900px', margin: '0 auto' }}>
                            {/* Info General */}
                            <div className="row mb-4">
                                <div className="col-4">
                                    <h6 className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.1rem' }}>Número Orden</h6>
                                    <p className="fw-bold" style={{ fontSize: '1.2rem' }}>{ordenNum}</p>
                                </div>
                                <div className="col-4">
                                    <h6 className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.1rem' }}>Fecha Orden</h6>
                                    <p className="fw-bold">{new Date().toLocaleDateString('es-CO')}</p>
                                </div>
                                <div className="col-4">
                                    <h6 className="fw-bold text-secondary text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.1rem' }}>Estado</h6>
                                    <p className="fw-bold">
                                        <span className="badge bg-warning text-dark">
                                            Orden pendiente de pago
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <hr className="my-4" />

                            {/* Datos Cliente */}
                            <div className="row mb-4">
                                <div className="col-6">
                                    <h6 className="fw-bold text-secondary text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.1rem' }}>Cliente</h6>
                                    <p className="mb-1"><strong>{detalles.usuario?.nombres} {detalles.usuario?.apellidos}</strong></p>
                                    <p className="mb-1 text-muted small">📧 {detalles.usuario?.email}</p>
                                    <p className="text-muted small">📱 {detalles.usuario?.telefono || '—'}</p>
                                </div>
                                <div className="col-6">
                                    <h6 className="fw-bold text-secondary text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.1rem' }}>Estancia</h6>
                                    <p className="mb-1"><strong>Entrada:</strong> {new Date(selectedReserva.fecha_checkin).toLocaleDateString('es-CO')}</p>
                                    <p className="mb-1"><strong>Salida:</strong> {new Date(selectedReserva.fecha_checkout).toLocaleDateString('es-CO')}</p>
                                    <p className="text-muted small"><strong>{detalles.dias}</strong> noches • <strong>{selectedReserva.total_huespedes}</strong> huéspedes</p>
                                </div>
                            </div>

                            <hr className="my-4" />

                            {/* Detalles */}
                            <h6 className="fw-bold mb-3">Detalles de Cargos</h6>
                            <div className="table-responsive mb-4">
                                <table className="table table-sm text-sm">
                                    <thead className="border-top border-bottom">
                                        <tr>
                                            <th style={{ fontSize: '0.85rem', background: '#f8f9fa', color: '#495057' }}>Concepto</th>
                                            <th className="text-end" style={{ fontSize: '0.85rem', background: '#f8f9fa', color: '#495057' }}>Cantidad/Días</th>
                                            <th className="text-end" style={{ fontSize: '0.85rem', background: '#f8f9fa', color: '#495057' }}>Precio Unitario</th>
                                            <th className="text-end" style={{ fontSize: '0.85rem', background: '#f8f9fa', color: '#495057' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>Habitación {detalles.tipo?.nombre_tipo}</strong> (#{detalles.hab?.numero_habitacion})</td>
                                            <td className="text-end">{detalles.dias}</td>
                                            <td className="text-end">{formatCurrency(detalles.tipo?.precio_noche)}</td>
                                            <td className="text-end fw-bold">{formatCurrency(detalles.precioHab)}</td>
                                        </tr>
                                        {selectedServiciosFactura.map((servicio, index) => (
                                            <tr key={`${servicio.id_servicio || 'srv'}-${index}`}>
                                                <td><strong>{servicio.nombre_servicio || servicio.nombre || 'Servicio adicional'}</strong></td>
                                                <td className="text-end">{servicio.cantidad || 1}</td>
                                                <td className="text-end">{formatCurrency(toNumber(servicio.precio || (toNumber(servicio.subtotal) / toNumber(servicio.cantidad || 1))))}</td>
                                                <td className="text-end fw-bold">{formatCurrency(toNumber(servicio.subtotal ?? servicio.precio ?? 0))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totales */}
                            <div className="row justify-content-end mb-4">
                                <div className="col-md-4">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Subtotal:</span>
                                        <span className="fw-bold">{formatCurrency(detalles.subtotal)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Servicios:</span>
                                        <span className="fw-bold">{formatCurrency(detalles.totalServicios)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-3 border-bottom pb-3">
                                        <span>IVA (19%):</span>
                                        <span className="fw-bold text-success">{formatCurrency(detalles.iva)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between p-3 rounded" style={{ background: '#f0c040' }}>
                                        <span className="fw-bold" style={{ fontSize: '1.1rem' }}>TOTAL A PAGAR:</span>
                                        <span className="fw-bold" style={{ fontSize: '1.3rem' }}>{formatCurrency(detalles.total)}</span>
                                    </div>
                                </div>
                            </div>

                            <hr className="my-4" />

                            {/* Footer */}
                            <div className="text-center text-muted small">
                                <p className="mb-1">Este documento corresponde a una orden de servicios y hospedaje.</p>
                                <p className="mb-1">La factura se emite al registrar el pago total de la estadía.</p>
                                <p className="mb-0">📞 +57 310 856 9611 | 📧 hotelelsol@gmail.com</p>
                            </div>
                        </div>

                        {/* Acciones — staff */}
                        {isStaff && (
                            <div className="p-4 bg-light d-flex justify-content-end gap-2">
                                <button className="btn btn-outline-secondary" onClick={() => window.print()}>
                                    🖨️ Imprimir Orden
                                </button>
                                <button className="btn btn-success" onClick={registrarPagoYGenerarFactura}>
                                    ✅ Registrar pago y generar factura
                                </button>
                            </div>
                        )}

                        {/* Medios de pago — cliente */}
                        {!isStaff && (
                            <div className="p-4 border-top">
                                <h6 className="fw-bold mb-3">💳 ¿Cómo deseas realizar el pago?</h6>
                                <div className="row g-3 mb-4">
                                    {/* MercadoPago */}
                                    <div className="col-sm-6">
                                        <div
                                            className={`card h-100 text-center py-3 px-2 border-2 ${medioPago === 'mercadopago' ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`}
                                            style={{ cursor: 'pointer', transition: 'border-color 0.2s' }}
                                            onClick={() => setMedioPago('mercadopago')}
                                        >
                                            <div style={{ fontSize: '2rem' }}>💳</div>
                                            <div className="fw-bold mt-1">MercadoPago</div>
                                            <small className="text-muted">Pago en línea seguro</small>
                                            {medioPago === 'mercadopago' && (
                                                <div className="mt-2"><span className="badge bg-primary">Seleccionado ✓</span></div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Transferencia Caja Social */}
                                    <div className="col-sm-6">
                                        <div
                                            className={`card h-100 text-center py-3 px-2 border-2 ${medioPago === 'transferencia' ? 'border-success bg-success bg-opacity-10' : 'border-light'}`}
                                            style={{ cursor: 'pointer', transition: 'border-color 0.2s' }}
                                            onClick={() => setMedioPago('transferencia')}
                                        >
                                            <div style={{ fontSize: '2rem' }}>🏦</div>
                                            <div className="fw-bold mt-1">Banco Caja Social</div>
                                            <small className="text-muted">Transferencia bancaria</small>
                                            {medioPago === 'transferencia' && (
                                                <div className="mt-2"><span className="badge bg-success">Seleccionado ✓</span></div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Instrucciones MercadoPago */}
                                {medioPago === 'mercadopago' && (
                                    <div className="alert alert-primary border-0 mb-3">
                                        <h6 className="fw-bold mb-2">📲 Instrucciones — MercadoPago</h6>
                                        <div className="row g-2 small mb-2">
                                            <div className="col-12">
                                                <span className="text-muted d-block">Monto a pagar</span>
                                                <strong style={{ fontSize: '1.1rem' }}>{formatCurrency(detalles.total)}</strong>
                                            </div>
                                            <div className="col-12">
                                                <span className="text-muted d-block">Referencia</span>
                                                <strong>Reserva #{selectedReserva.id_reserva} — Hotel El Sol</strong>
                                            </div>
                                        </div>
                                        <p className="small mb-2">
                                            Escanea el código QR de MercadoPago en recepción o solicita el link de cobro al correo <strong>hotelelsol@gmail.com</strong>.
                                        </p>
                                        <p className="small mb-0 text-muted">
                                            Una vez realizado el pago, envía el comprobante indicando el número de reserva.
                                        </p>
                                    </div>
                                )}

                                {/* Instrucciones Transferencia Banco Caja Social */}
                                {medioPago === 'transferencia' && (
                                    <div className="alert alert-success border-0 mb-3">
                                        <h6 className="fw-bold mb-2">🏦 Datos de Transferencia — Banco Caja Social</h6>
                                        <div className="row g-2 small">
                                            <div className="col-6">
                                                <span className="text-muted d-block">Banco</span>
                                                <strong>Banco Caja Social</strong>
                                            </div>
                                            <div className="col-6">
                                                <span className="text-muted d-block">Tipo de cuenta</span>
                                                <strong>Cuenta Corriente</strong>
                                            </div>
                                            <div className="col-6">
                                                <span className="text-muted d-block">Número de cuenta</span>
                                                <strong>20004018545</strong>
                                            </div>
                                            <div className="col-6">
                                                <span className="text-muted d-block">NIT</span>
                                                <strong>900.234.567-8</strong>
                                            </div>
                                            <div className="col-12">
                                                <span className="text-muted d-block">Beneficiario</span>
                                                <strong>Hotel El Sol S.A.S.</strong>
                                            </div>
                                            <div className="col-12">
                                                <span className="text-muted d-block">Referencia de pago</span>
                                                <strong>Reserva #{selectedReserva.id_reserva} — {usuarioSesion.nombre || ''} {usuarioSesion.apellidos || ''}</strong>
                                            </div>
                                            <div className="col-12">
                                                <span className="text-muted d-block">Valor a transferir</span>
                                                <strong className="text-success" style={{ fontSize: '1.1rem' }}>{formatCurrency(detalles.total)}</strong>
                                            </div>
                                        </div>
                                        <p className="small mb-0 mt-3 text-muted">
                                            📧 Envía el comprobante a <strong>hotelelsol@gmail.com</strong> indicando el número de reserva, o preséntalo en recepción.
                                        </p>
                                    </div>
                                )}

                                <div className="d-flex justify-content-between align-items-center mt-2">
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>
                                        🖨️ Imprimir Orden
                                    </button>
                                    {medioPago && (
                                        <button
                                            className="btn btn-outline-success"
                                            onClick={() => Swal.fire({
                                                icon: 'info',
                                                title: '¡Gracias por tu notificación!',
                                                text: 'Hemos registrado tu intención de pago. El personal de recepción confirmará el ingreso y emitirá la factura.',
                                                confirmButtonText: 'Entendido'
                                            })}
                                        >
                                            ✅ Ya realicé el pago
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })() : (
                isStaff ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-5 text-muted">
                        <div style={{ fontSize: '3rem' }}>📄</div>
                        <p className="mt-3 mb-0">Busca una reserva para generar la factura</p>
                    </div>
                </div>
                ) : null
            )}
        </div>
    );
};

export default Facturacion;