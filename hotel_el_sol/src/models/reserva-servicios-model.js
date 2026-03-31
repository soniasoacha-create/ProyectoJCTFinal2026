/**
 * SUSTENTACIÓN ACADÉMICA: MODELO DE DATOS (DATA ACCESS LAYER)
 * Este componente es el encargado de interactuar directamente con la base de datos MySQL.
 * METODOLOGÍA APLICADA:
 * - Abstracción de Consultas: El controlador no necesita conocer la sintaxis SQL.
 * - Integridad Referencial: Se utilizan JOINs para asegurar que los consumos pertenezcan 
 * a habitaciones y reservas válidas.
 */
import { dbPool } from '../config/database.js'; // Ajustado a tu pool de conexión

const ReservaServicios = {
    
    /**
     * @method create
     * Registra un nuevo consumo extra en la tabla intermedia 'reserva_servicios'.
     */
    create: async (id_reserva, id_servicio, cantidad, subtotal) => {
        const query = `
            INSERT INTO reserva_servicios (id_reserva, id_servicio, cantidad, subtotal) 
            VALUES (?, ?, ?, ?)`;
        // Académico: El uso de placeholders (?) evita ataques de Inyección SQL
        return await dbPool.execute(query, [id_reserva, id_servicio, cantidad, subtotal]);
    },

    /**
     * @method getByReserva
     * Obtiene el listado de consumos vinculando el nombre del servicio para la interfaz.
     */
    getByReserva: async (id_reserva) => {
        const query = `
            SELECT rs.*, s.nombre_servicio 
            FROM reserva_servicios rs
            JOIN servicios s ON rs.id_servicio = s.id_servicio
            WHERE rs.id_reserva = ?`;
        const [rows] = await dbPool.query(query, [id_reserva]);
        return rows;
    },

    /**
     * @method getFullRemision
     * FUNCIONALIDAD DE REMISIÓN: Consolida el costo de la Habitación y los Servicios.
     * Vincula la tabla 'habitaciones' a través de la reserva para generar el total remito.
     */
    getFullRemision: async (id_reserva) => {
        const query = `
            SELECT 
                r.id_reserva,
                h.numero_habitacion,
                u.nombres AS nombre_huesped,
                DATEDIFF(r.fecha_checkout, r.fecha_checkin) AS noches_estadia,
                t.precio_noche,
                (DATEDIFF(r.fecha_checkout, r.fecha_checkin) * t.precio_noche) AS subtotal_hospedaje,
                IFNULL(SUM(rs.subtotal), 0) AS total_servicios_extra,
                ((DATEDIFF(r.fecha_checkout, r.fecha_checkin) * t.precio_noche) + IFNULL(SUM(rs.subtotal), 0)) AS gran_total_remito
            FROM reservas r
            JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
            JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion
            JOIN usuarios u ON r.id_usuario = u.id_usuarios
            LEFT JOIN reserva_servicios rs ON r.id_reserva = rs.id_reserva
            WHERE r.id_reserva = ?
            GROUP BY r.id_reserva`;
        
        const [rows] = await dbPool.query(query, [id_reserva]);
        return rows.length > 0 ? rows[0] : null;
    }
};

export default ReservaServicios;