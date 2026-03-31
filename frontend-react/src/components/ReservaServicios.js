import React, { useState, useEffect } from 'react';
import reservasService from '../services/reservasService';
import serviciosService from '../services/serviciosService';
import reservaServiciosService from '../services/reservaServiciosService';

const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
};

const ReservaServicios = ({ idReservaSeleccionada: propId }) => {
    const [reservasActivas, setReservasActivas] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [idReservaLocal, setIdReservaLocal] = useState('');
    const [idServicio, setIdServicio] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [mensaje, setMensaje] = useState('');

    const idFinal = propId || idReservaLocal;

    useEffect(() => {
        /**
         * Hidratación de datos: Trae habitaciones con estadía vigente
         */
        const cargarDatos = async () => {
            try {
                const activos = await reservasService.getReservasActivas();
                setReservasActivas(toArray(activos));
                
                const catalogo = await serviciosService.obtenerServicios();
                setServicios(toArray(catalogo));
            } catch (error) {
                // Mensaje informativo si el servidor no responde
                setMensaje("❌ Error: No se pudo sincronizar con el servidor de datos.");
            }
        };
        cargarDatos();
    }, [propId]);

    const manejarEnvio = async (e) => {
        e.preventDefault();
        try {
            // Mapeo directo a las columnas de tu tabla SQL 'reserva_servicios'
            const cargo = { 
                id_reserva: idFinal, 
                id_servicio: idServicio, 
                cantidad: parseInt(cantidad) 
            };
            
            await reservaServiciosService.agregarConsumo(cargo);
            setMensaje("✅ Servicio cargado correctamente.");
            
            // CARGAS MÚLTIPLES: Limpiamos selección de servicio pero mantenemos al huésped
            setIdServicio('');
            setCantidad(1);
            
            // Ocultar mensaje de éxito tras 4 segundos
            setTimeout(() => setMensaje(''), 4000);
        } catch (error) {
            setMensaje("❌ Error al procesar el cargo en la base de datos.");
        }
    };

    return (
        <div className="card shadow border-primary">
            <div className="card-header bg-primary text-white d-flex justify-content-between">
                <h5 className="mb-0">Cargar Servicio a Habitación</h5>
                <span className="badge bg-info">Estadía Vigente</span>
            </div>
            <div className="card-body">
                <form onSubmit={manejarEnvio}>
                    {!propId && (
                        <div className="mb-3">
                            <label className="form-label fw-bold">Huésped en Habitación (Confirmada):</label>
                            <select 
                                className="form-select border-primary" 
                                value={idReservaLocal} 
                                onChange={(e) => setIdReservaLocal(e.target.value)} 
                                required
                            >
                                <option value="">-- Seleccione un huésped activo --</option>
                                {reservasActivas.map(r => (
                                    <option
                                        key={r.id_reserva || r.id_reservas || r.id}
                                        value={r.id_reserva || r.id_reservas || r.id}
                                    >
                                        Hab: {r.numero_habitacion || 'N/A'} - {r.nombres || ''} {r.apellidos || ''} ({r.estado_reserva || r.estado || 'activa'})
                                    </option>
                                ))}
                            </select>
                            <small className="text-muted">* Incluye estados Confirmada y Ocupada.</small>
                        </div>
                    )}
                    
                    <div className="row">
                        <div className="col-md-8 mb-3">
                            <label className="form-label fw-bold">Tipo de Servicio:</label>
                            <select className="form-select" value={idServicio} onChange={(e) => setIdServicio(e.target.value)} required>
                                <option value="">-- Seleccione un servicio --</option>
                                {servicios.map(s => (
                                    <option key={s.id_servicio || s.id_servicios || s.id} value={s.id_servicio || s.id_servicios || s.id}>{s.nombre_servicio || s.nombre || 'Servicio'}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-4 mb-3">
                            <label className="form-label fw-bold">Cantidad:</label>
                            <input type="number" className="form-control" value={cantidad} min="1" onChange={(e) => setCantidad(e.target.value)} required />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-success w-100 fw-bold">
                        Confirmar y Agregar otro cargo
                    </button>
                </form>

                {mensaje && (
                    <div className={`alert mt-3 ${mensaje.includes('✅') ? 'alert-success' : 'alert-danger'}`}>
                        {mensaje}
                    </div>
                )}
            </div>
            <div className="card-footer text-center small text-muted">
                Los cargos se acumulan automáticamente para la liquidación final.
            </div>
        </div>
    );
};

export default ReservaServicios;