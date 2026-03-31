import React, { useState, useEffect } from 'react';
import habitacionesService from '../services/habitacionesService';
import tiposHabitacionService from '../services/tiposHabitacionService';
import Swal from 'sweetalert2';

const normalizarNumeroHabitacion = (value) => String(value || '').trim().replace(/^#/, '');

const Habitaciones = () => {
    const [habitaciones, setHabitaciones] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);

    const [formData, setFormData] = useState({
        id_habitacion: null,
        numero_habitacion: '',
        id_tipo_habitacion: '',
        estado: 'disponible',
        mantenimiento_inicio: '',
        mantenimiento_fin: ''
    });

    useEffect(() => {
        obtenerDatos();
    }, []);

    const obtenerDatos = async () => {
        try {
            const [resHab, resTipos] = await Promise.all([
                habitacionesService.getAllHabitaciones(),
                tiposHabitacionService.getAllTipos()
            ]);
            setHabitaciones(Array.isArray(resHab) ? resHab : []);
            setTipos(Array.isArray(resTipos) ? resTipos : []);
        } catch (error) {
            console.error("Error al obtener datos", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Si el usuario cambia el estado a algo distinto de mantenimiento, 
        // limpiamos las fechas en el formulario visual
        if (name === 'estado' && value !== 'mantenimiento') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                mantenimiento_inicio: '',
                mantenimiento_fin: ''
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const numeroNormalizado = normalizarNumeroHabitacion(formData.numero_habitacion);
        if (!numeroNormalizado) {
            Swal.fire('Validación', 'Debe ingresar un número de habitación válido.', 'warning');
            return;
        }

        const existeNumero = habitaciones.some((hab) => (
            normalizarNumeroHabitacion(hab.numero_habitacion) === numeroNormalizado &&
            Number(hab.id_habitacion) !== Number(formData.id_habitacion)
        ));

        if (existeNumero) {
            Swal.fire('Validación', `La habitación #${numeroNormalizado} ya existe.`, 'warning');
            return;
        }

        // VALIDACIÓN CRÍTICA: Evitar enviar strings vacíos a columnas DATE de MySQL
        const payload = {
            ...formData,
            numero_habitacion: numeroNormalizado,
            mantenimiento_inicio: formData.estado === 'mantenimiento' && formData.mantenimiento_inicio !== '' 
                ? formData.mantenimiento_inicio 
                : null,
            mantenimiento_fin: formData.estado === 'mantenimiento' && formData.mantenimiento_fin !== '' 
                ? formData.mantenimiento_fin 
                : null
        };

        try {
            if (editMode) {
                await habitacionesService.actualizarHabitacion(formData.id_habitacion, payload);
                Swal.fire('¡Éxito!', 'Habitación actualizada correctamente', 'success');
            } else {
                await habitacionesService.crearHabitacion(payload);
                Swal.fire('¡Éxito!', 'Habitación registrada', 'success');
            }
            cancelarEdicion();
            obtenerDatos();
        } catch (error) {
            console.error(error);
            // Captura el error 500 para informar al usuario
            Swal.fire('Error', 'No se pudo procesar la solicitud en el servidor', 'error');
        }
    };

    const cargarEdicion = (hab) => {
        setEditMode(true);
        setFormData({
            id_habitacion: hab.id_habitacion,
            numero_habitacion: hab.numero_habitacion,
            id_tipo_habitacion: hab.id_tipo_habitacion,
            estado: hab.estado,
            // substring(0,10) es necesario para que el input type="date" reconozca la fecha
            mantenimiento_inicio: hab.mantenimiento_inicio ? hab.mantenimiento_inicio.substring(0, 10) : '',
            mantenimiento_fin: hab.mantenimiento_fin ? hab.mantenimiento_fin.substring(0, 10) : ''
        });
    };

    const cancelarEdicion = () => {
        setFormData({ id_habitacion: null, numero_habitacion: '', id_tipo_habitacion: '', estado: 'disponible', mantenimiento_inicio: '', mantenimiento_fin: '' });
        setEditMode(false);
    };

    const eliminarHabitacion = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar habitación?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                await habitacionesService.eliminarHabitacion(id);
                Swal.fire('Eliminado', 'Registro borrado con éxito', 'success');
                obtenerDatos();
            } catch (error) {
                // Manejo de error por llave foránea
                const msg = error.response?.data?.message || "No se puede eliminar porque tiene reservas asociadas";
                Swal.fire('Error', msg, 'error');
            }
        }
    };

    if (loading) return <div className="text-center mt-5">Cargando datos del hotel...</div>;

    return (
        <div className="container mt-4">
            <h2 className="text-center mb-4 text-primary">Gestión de Habitaciones</h2>

            <div className="card shadow-sm mb-5 p-4">
                <h5>{editMode ? 'Editar Habitación' : 'Registrar Nueva Habitación'}</h5>
                <form onSubmit={handleSubmit} className="row g-3">
                    <div className="col-md-3">
                        <label className="form-label fw-bold">Número</label>
                        <input type="text" name="numero_habitacion" className="form-control" value={formData.numero_habitacion} onChange={handleChange} required />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label fw-bold">Tipo</label>
                        <select name="id_tipo_habitacion" className="form-select" value={formData.id_tipo_habitacion} onChange={handleChange} required>
                            <option value="">Seleccione...</option>
                            {tipos.map(t => <option key={t.id_tipo_habitacion} value={t.id_tipo_habitacion}>{t.nombre_tipo}</option>)}
                        </select>
                    </div>
                    <div className="col-md-3">
                        <label className="form-label fw-bold">Estado</label>
                        <select name="estado" className="form-select" value={formData.estado} onChange={handleChange}>
                            <option value="disponible">Disponible</option>
                            <option value="ocupada">Ocupada</option>
                            <option value="mantenimiento">Mantenimiento</option>
                        </select>
                    </div>
                    <div className="col-md-3 d-flex align-items-end gap-2">
                        <button type="submit" className={`btn w-100 ${editMode ? 'btn-warning' : 'btn-primary'}`}>{editMode ? 'Actualizar' : 'Guardar'}</button>
                        {editMode && <button type="button" className="btn btn-secondary" onClick={cancelarEdicion}>Cancelar</button>}
                    </div>

                    {formData.estado === 'mantenimiento' && (
                        <div className="row mt-3 g-2">
                            <div className="col-md-3">
                                <label className="form-label">Inicio Manto.</label>
                                <input type="date" name="mantenimiento_inicio" className="form-control" value={formData.mantenimiento_inicio} onChange={handleChange} required />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Fin Manto.</label>
                                <input type="date" name="mantenimiento_fin" className="form-control" value={formData.mantenimiento_fin} onChange={handleChange} required />
                            </div>
                        </div>
                    )}
                </form>
            </div>

            <div className="table-responsive shadow-sm rounded">
                <table className="table table-hover align-middle bg-white mb-0">
                    <thead className="bg-primary text-white">
                        <tr>
                            <th className="ps-3">ID</th>
                            <th>Número</th>
                            <th>Tipo</th>
                            <th>Estado</th>
                            <th>Mantenimiento</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {habitaciones.map(hab => {
                            const tipo = tipos.find(t => t.id_tipo_habitacion === hab.id_tipo_habitacion);
                            return (
                            <tr key={hab.id_habitacion}>
                                <td className="ps-3">{hab.id_habitacion}</td>
                                <td className="fw-bold text-info">#{hab.numero_habitacion}</td>
                                <td>
                                    <span className="badge bg-light text-dark">{tipo?.nombre_tipo || 'Desconocida'}</span>
                                </td>
                                <td>
                                    <span className={`badge rounded-pill px-3 py-2 ${hab.estado === 'disponible' ? 'bg-success' : hab.estado === 'ocupada' ? 'bg-danger' : hab.estado === 'mantenimiento' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                                        {hab.estado === 'disponible' ? '✓ Disponible' : hab.estado === 'ocupada' ? '⛔ Ocupada' : hab.estado === 'mantenimiento' ? '⚙️ Mantenimiento' : hab.estado.toUpperCase()}
                                    </span>
                                </td>
                                <td className="small text-muted" style={{ maxWidth: '150px' }}>
                                    {hab.mantenimiento_inicio ? `${hab.mantenimiento_inicio.substring(0,10)} al ${hab.mantenimiento_fin.substring(0,10)}` : '—'}
                                </td>
                                <td className="text-center">
                                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => cargarEdicion(hab)} title="Editar">✏️</button>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarHabitacion(hab.id_habitacion)} title="Eliminar">🗑️</button>
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Habitaciones;