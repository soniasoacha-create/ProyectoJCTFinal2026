/**
 * reservas-controller.js
 * MEJORADO - Gestión integral de reservas con servicios
 */
import { dbPool } from '../config/database.js';
import * as FacturacionModel from '../models/facturacion-model.js';

const REQUIRED_RESERVA_FIELDS = ['id_usuario', 'id_habitacion', 'fecha_checkin', 'fecha_checkout', 'total_huespedes'];

const getMissingReservaFields = (payload) => {
    return REQUIRED_RESERVA_FIELDS.filter((field) => {
        const value = payload[field];
        return value === undefined || value === null || value === '';
    });
};

/**
 * ✅ LISTAR RESERVAS
 * - Admin/Moderador: Ve todas
 * - Cliente: Ve solo las suyas
 */
export const listarReservas = async (req, res) => {
    const usuarioAutenticado = req.user;
    
    try {
        let query = `
            SELECT 
                r.id_reserva, 
                CONCAT(u.nombres, ' ', u.apellidos) AS nombre_usuario, 
                h.numero_habitacion,
                r.fecha_checkin, 
                r.fecha_checkout, 
                r.total_huespedes,
                r.precio_total,
                r.estado_reserva,
                r.id_usuario,
                r.id_habitacion,
                t.nombre_tipo,
                r.fecha_reserva
            FROM reservas r
            JOIN usuarios u ON r.id_usuario = u.id_usuarios
            JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
            JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion
        `;
        const params = [];

        // Si es cliente, solo ve sus reservas
        if (usuarioAutenticado.rol === 'cliente') {
            query += ' WHERE r.id_usuario = ?';
            params.push(usuarioAutenticado.id);
        }

        query += ` ORDER BY r.fecha_reserva DESC`;
        
        const [rows] = await dbPool.query(query, params);
        res.status(200).json({
            message: "Reservas obtenidas exitosamente",
            total: rows.length,
            data: rows
        });
    } catch (error) {
        console.error("Error en listarReservas:", error.message);
        res.status(500).json({ message: "Error al obtener reservas" });
    }
};

/**
 * ✅ OBTENER HABITACIONES DISPONIBLES
 */
export const obtenerHabitacionesDisponiblesEdicion = async (req, res) => {
    try {
        const [rows] = await dbPool.query(`
            SELECT 
                h.id_habitacion, 
                h.numero_habitacion,
                t.nombre_tipo,
                t.descripcion,
                t.capacidad_maxima,
                t.precio_noche,
                h.estado
            FROM habitaciones h
            JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion
            WHERE h.estado = 'disponible'
            ORDER BY h.numero_habitacion ASC
        `);
        res.status(200).json({
            message: "Habitaciones disponibles obtenidas",
            data: rows
        });
    } catch (error) {
        console.error("Error en obtenerHabitacionesDisponiblesEdicion:", error.message);
        res.status(500).json({ message: "Error al cargar habitaciones" });
    }
};

/**
 * ✅ CREAR RESERVA (con servicios opcionales)
 * Ahora permite agregar servicios durante la creación
 */
export const crearReserva = async (req, res) => {
    const { id_usuario, id_habitacion, fecha_checkin, fecha_checkout, total_huespedes, estado_reserva, servicios } = req.body;
    const usuarioAutenticado = req.user;
    const idUsuarioReserva = usuarioAutenticado?.rol === 'cliente' ? usuarioAutenticado.id : id_usuario;
    
    try {
        if (usuarioAutenticado?.rol === 'cliente' && id_usuario !== undefined && Number(id_usuario) !== Number(usuarioAutenticado.id)) {
            return res.status(403).json({
                message: 'No puedes crear reservas para otro usuario'
            });
        }

        // Validar datos obligatorios
        const missingFields = getMissingReservaFields({ ...req.body, id_usuario: idUsuarioReserva });
        if (missingFields.length > 0) {
            return res.status(400).json({
                message: 'Faltan datos obligatorios para crear la reserva',
                faltantes: missingFields
            });
        }

        const totalHuespedesNum = Number(total_huespedes);
        if (!Number.isInteger(totalHuespedesNum) || totalHuespedesNum <= 0) {
            return res.status(400).json({
                message: 'El total de huéspedes debe ser un entero mayor a cero',
                faltantes: ['total_huespedes']
            });
        }

        // Validar fechas
        const checkin = new Date(fecha_checkin);
        const checkout = new Date(fecha_checkout);
        if (checkin >= checkout) {
            return res.status(400).json({
                message: "La fecha de checkout debe ser posterior a la de checkin"
            });
        }

        // Calcular noches y precio
        const noches = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
        const [habitacionData] = await dbPool.query(
            `SELECT h.*, t.nombre_tipo, t.capacidad_maxima, t.precio_noche
             FROM habitaciones h
             JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion
             WHERE h.id_habitacion = ?`,
            [id_habitacion]
        );

        if (habitacionData.length === 0) {
            return res.status(404).json({ message: "Habitación no encontrada" });
        }

        const habitacionSeleccionada = habitacionData[0];

        if (habitacionSeleccionada.estado !== 'disponible') {
            return res.status(400).json({
                message: `La habitación ${habitacionSeleccionada.numero_habitacion} no está disponible actualmente`,
                estado_actual: habitacionSeleccionada.estado
            });
        }

        if (totalHuespedesNum > habitacionSeleccionada.capacidad_maxima) {
            return res.status(400).json({
                message: `La habitación seleccionada permite máximo ${habitacionSeleccionada.capacidad_maxima} huésped(es)`,
                capacidad_maxima: habitacionSeleccionada.capacidad_maxima
            });
        }

        const [solapeReserva] = await dbPool.query(
            `SELECT id_reserva
             FROM reservas
             WHERE id_habitacion = ?
               AND estado_reserva != 'cancelada'
               AND (fecha_checkin < ? AND fecha_checkout > ?)
             LIMIT 1`,
            [id_habitacion, fecha_checkout, fecha_checkin]
        );

        if (solapeReserva.length > 0) {
            return res.status(409).json({
                message: 'La habitación ya tiene una reserva activa en ese rango de fechas'
            });
        }

        const precioHabitacion = habitacionSeleccionada.precio_noche * noches;
        let precioTotal = precioHabitacion;
        const serviciosAplicados = [];

        // Iniciar transacción
        const connection = await dbPool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Crear la reserva
            const [resultado] = await connection.execute(`
                INSERT INTO reservas 
                (id_usuario, id_habitacion, fecha_checkin, fecha_checkout, total_huespedes, precio_total, estado_reserva, fecha_reserva)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `, [idUsuarioReserva, id_habitacion, fecha_checkin, fecha_checkout, totalHuespedesNum, precioHabitacion, estado_reserva || 'pendiente']);

            const id_reserva = resultado.insertId;

            // 2. Agregar servicios si existen
            if (servicios && Array.isArray(servicios) && servicios.length > 0) {
                for (const servicio of servicios) {
                    const cantidad = Number(servicio.cantidad);
                    if (!servicio.id_servicio || !Number.isInteger(cantidad) || cantidad <= 0) {
                        throw new Error(`Servicio inválido en la solicitud: ${JSON.stringify(servicio)}`);
                    }

                    const [precioServicio] = await connection.query(
                        'SELECT id_servicio, nombre_servicio, precio FROM servicios WHERE id_servicio = ?',
                        [servicio.id_servicio]
                    );

                    if (precioServicio.length > 0) {
                        const subtotal = precioServicio[0].precio * cantidad;
                        await connection.execute(
                            'INSERT INTO reserva_servicios (id_reserva, id_servicio, cantidad, subtotal) VALUES (?, ?, ?, ?)',
                            [id_reserva, servicio.id_servicio, cantidad, subtotal]
                        );

                        serviciosAplicados.push({
                            id_servicio: precioServicio[0].id_servicio,
                            nombre_servicio: precioServicio[0].nombre_servicio,
                            cantidad,
                            precio_unitario: precioServicio[0].precio,
                            subtotal
                        });

                        precioTotal += subtotal;
                    } else {
                        throw new Error(`Servicio no encontrado: ${servicio.id_servicio}`);
                    }
                }
            }

            // 3. Actualizar precio total si hay servicios
            if (servicios && servicios.length > 0) {
                await connection.execute(
                    'UPDATE reservas SET precio_total = ? WHERE id_reserva = ?',
                    [precioTotal, id_reserva]
                );
            }

            // 4. Generar factura automáticamente
            const factura = await FacturacionModel.getOrCreateFactura(id_reserva);

            // Confirmar transacción
            await connection.commit();

            res.status(201).json({
                message: 'Reserva creada exitosamente (estado inicial: pendiente)',
                data: {
                    id_reserva,
                    noches,
                    habitacion: {
                        id_habitacion: habitacionSeleccionada.id_habitacion,
                        numero_habitacion: habitacionSeleccionada.numero_habitacion,
                        tipo: habitacionSeleccionada.nombre_tipo,
                        capacidad_maxima: habitacionSeleccionada.capacidad_maxima,
                        precio_noche: habitacionSeleccionada.precio_noche
                    },
                    huespedes: totalHuespedesNum,
                    servicios: serviciosAplicados,
                    precio_hospedaje: precioHabitacion,
                    precio_total: precioTotal,
                    factura: factura || null
                }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error en crearReserva:", error.message);
        if (error.message.startsWith('Servicio inválido') || error.message.startsWith('Servicio no encontrado')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Error al crear la reserva" });
    }
};

/**
 * ✅ OBTENER RESERVA POR ID CON DETALLES COMPLETOS
 */
export const obtenerReservaPorId = async (req, res) => {
    const { id } = req.params;
    const usuarioAutenticado = req.user;

    try {
        const [reserva] = await dbPool.query(`
            SELECT 
                r.*,
                CONCAT(u.nombres, ' ', u.apellidos) AS nombre_usuario,
                u.email,
                u.telefono,
                h.numero_habitacion,
                t.nombre_tipo,
                t.precio_noche,
                DATEDIFF(r.fecha_checkout, r.fecha_checkin) AS noches_estadia
            FROM reservas r
            JOIN usuarios u ON r.id_usuario = u.id_usuarios
            JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
            JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion
            WHERE r.id_reserva = ?
        `, [id]);

        if (reserva.length === 0) {
            return res.status(404).json({ message: "Reserva no encontrada" });
        }

        // Validar permisos: cliente solo ve su propia reserva
        if (usuarioAutenticado.rol === 'cliente' && reserva[0].id_usuario !== usuarioAutenticado.id) {
            return res.status(403).json({ message: "No tienes permiso para ver esta reserva" });
        }

        // Obtener servicios de la reserva
        const [servicios] = await dbPool.query(`
            SELECT 
                rs.id_reserva_servicio,
                rs.cantidad,
                rs.subtotal,
                s.id_servicio,
                s.nombre_servicio,
                s.descripcion,
                s.precio
            FROM reserva_servicios rs
            JOIN servicios s ON rs.id_servicio = s.id_servicio
            WHERE rs.id_reserva = ?
        `, [id]);

        res.status(200).json({
            message: "Reserva obtenida exitosamente",
            data: {
                ...reserva[0],
                servicios
            }
        });
    } catch (error) {
        console.error("Error en obtenerReservaPorId:", error.message);
        res.status(500).json({ message: "Error al obtener la reserva" });
    }
};

/**
 * ✅ CAMBIAR ESTADO DE RESERVA (Admin/Moderador)
 */
export const cambiarEstadoReserva = async (req, res) => {
    const { id } = req.params;
    const { estado_reserva } = req.body;

    const estadosValidos = ['pendiente', 'confirmada', 'check-in', 'check-out', 'cancelada'];
    if (!estadosValidos.includes(estado_reserva)) {
        return res.status(400).json({
            message: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`
        });
    }

    try {
        const [result] = await dbPool.execute(
            'UPDATE reservas SET estado_reserva = ? WHERE id_reserva = ?',
            [estado_reserva, id]
        );

        if (result.affectedRows > 0) {
            res.status(200).json({ 
                message: "Estado de reserva actualizado exitosamente",
                estado: estado_reserva
            });
        } else {
            res.status(404).json({ message: "Reserva no encontrada" });
        }
    } catch (error) {
        console.error("Error en cambiarEstadoReserva:", error.message);
        res.status(500).json({ message: "Error al actualizar la reserva" });
    }
};

/**
 * ✅ ACTUALIZAR RESERVA (Admin/Moderador)
 */
export const updateReserva = async (req, res) => {
    const { id } = req.params;
    const { id_usuario, id_habitacion, fecha_checkin, fecha_checkout, total_huespedes, estado_reserva } = req.body;
    
    try {
        const [result] = await dbPool.execute(`
            UPDATE reservas 
            SET id_usuario = ?, id_habitacion = ?, fecha_checkin = ?, fecha_checkout = ?, 
                total_huespedes = ?, estado_reserva = ? 
            WHERE id_reserva = ?
        `, [id_usuario, id_habitacion, fecha_checkin, fecha_checkout, total_huespedes, estado_reserva, id]);
        
        if (result.affectedRows > 0) {
            res.status(200).json({ message: "Reserva actualizada exitosamente" });
        } else {
            res.status(404).json({ message: "Reserva no encontrada" });
        }
    } catch (error) {
        console.error("Error en updateReserva:", error.message);
        res.status(500).json({ message: "Error al actualizar la reserva" });
    }
};

/**
 * ✅ ELIMINAR RESERVA (Admin/Moderador)
 */
export const eliminarReserva = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Primero, eliminar servicios asociados
        await dbPool.execute('DELETE FROM reserva_servicios WHERE id_reserva = ?', [id]);
        
        // Luego, eliminar la reserva
        const [result] = await dbPool.execute(
            'DELETE FROM reservas WHERE id_reserva = ?',
            [id]
        );
        
        if (result.affectedRows > 0) {
            res.status(200).json({ message: "Reserva eliminada exitosamente" });
        } else {
            res.status(404).json({ message: "Reserva no encontrada" });
        }
    } catch (error) {
        console.error("Error en eliminarReserva:", error.message);
        res.status(500).json({ message: "Error al eliminar la reserva" });
    }
};

/**
 * ✅ OBTENER RESUMEN DE RESERVA PARA CLIENTE
 * Muestra todo lo necesario para que el cliente vea su reserva y servicios
 */
export const obtenerResumenReserva = async (req, res) => {
    const { id } = req.params;
    const usuarioAutenticado = req.user;

    try {
        // Obtener datos de la reserva
        const [reserva] = await dbPool.query(`
            SELECT 
                r.id_reserva,
                r.id_usuario,
                r.fecha_checkin,
                r.fecha_checkout,
                r.total_huespedes,
                r.estado_reserva,
                h.numero_habitacion,
                t.nombre_tipo,
                t.precio_noche,
                DATEDIFF(r.fecha_checkout, r.fecha_checkin) AS noches_estadia
            FROM reservas r
            JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
            JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion
            WHERE r.id_reserva = ?
        `, [id]);

        if (reserva.length === 0) {
            return res.status(404).json({ message: "Reserva no encontrada" });
        }

        // Validar que el usuario pueda ver esta reserva
        if (usuarioAutenticado.rol === 'cliente' && reserva[0].id_usuario !== usuarioAutenticado.id) {
            return res.status(403).json({ message: "No tienes permiso para ver esta reserva" });
        }

        const reservaData = reserva[0];
        const precioHospedaje = reservaData.precio_noche * reservaData.noches_estadia;

        // Obtener servicios
        const [servicios] = await dbPool.query(`
            SELECT 
                s.nombre_servicio,
                rs.cantidad,
                rs.subtotal,
                s.descripcion
            FROM reserva_servicios rs
            JOIN servicios s ON rs.id_servicio = s.id_servicio
            WHERE rs.id_reserva = ?
        `, [id]);

        const totalServicios = servicios.reduce((sum, s) => sum + s.subtotal, 0);
        const totalGeneral = precioHospedaje + totalServicios;

        res.status(200).json({
            message: "Resumen de reserva obtenido exitosamente",
            resumen: {
                reserva: {
                    id: reservaData.id_reserva,
                    habitacion: {
                        numero: reservaData.numero_habitacion,
                        tipo: reservaData.nombre_tipo
                    },
                    fechas: {
                        checkin: reservaData.fecha_checkin,
                        checkout: reservaData.fecha_checkout,
                        noches: reservaData.noches_estadia
                    },
                    huespedes: reservaData.total_huespedes,
                    estado: reservaData.estado_reserva
                },
                precios: {
                    precioPorNoche: reservaData.precio_noche,
                    precioHospedaje,
                    servicios
                },
                totales: {
                    hospitalidad: precioHospedaje,
                    serviciosAdicionales: totalServicios,
                    general: totalGeneral
                }
            }
        });
    } catch (error) {
        console.error("Error en obtenerResumenReserva:", error.message);
        res.status(500).json({ message: "Error al obtener el resumen" });
    }
};

/**
 * ✅ OBTENER RESERVAS ACTIVAS
 * Reserva activa: confirmada o en curso y con checkout posterior al momento actual.
 */
export const obtenerReservasActivas = async (req, res) => {
    try {
        const [rows] = await dbPool.query(`
            SELECT
                r.id_reserva,
                r.id_usuario,
                r.id_habitacion,
                r.fecha_checkin,
                r.fecha_checkout,
                r.total_huespedes,
                r.estado_reserva,
                u.nombres,
                u.apellidos,
                h.numero_habitacion,
                t.nombre_tipo
            FROM reservas r
            JOIN usuarios u ON r.id_usuario = u.id_usuarios
            JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
            JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion
            WHERE r.estado_reserva IN ('confirmada', 'check-in')
              AND r.fecha_checkout >= CURDATE()
            ORDER BY r.fecha_checkin ASC
        `);

        res.status(200).json({
            message: 'Reservas activas obtenidas exitosamente',
            total: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Error en obtenerReservasActivas:', error.message);
        res.status(500).json({ message: 'Error al obtener reservas activas' });
    }
};