/**
 * SUSTENTACIÓN ACADÉMICA: CAPA DE CONTROLADOR (LOGIC LAYER)
 * Este componente orquestra la interacción entre la solicitud del usuario y el modelo de datos.
 * * CONCEPTOS CLAVE APLICADOS:
 * - Encapsulamiento: Toda la lógica de cargos extras y liquidación está aislada aquí.
 * - Integridad Financiera: Los cálculos se realizan en el servidor (Server-side) para evitar
 * que el cliente manipule precios desde el navegador.
 * - Normalización y Relacionamiento: Uso de JOINs y LEFT JOINs para consolidar información 
 * de múltiples entidades (Habitaciones, Servicios, Reservas y Usuarios).
 */

import { dbPool } from '../config/database.js';

const reservaServiciosController = {

    /**
     * @method agregarConsumo
     * Registra un consumo adicional vinculado a una reserva activa.
     */
    agregarConsumo: async (req, res) => {
        const { id_reserva, id_servicio, cantidad } = req.body;

        try {
            // 1. Verificación de Seguridad: Obtenemos el precio directamente de la BD
            // Académico: No confiamos en el precio que pueda enviar el Frontend.
            const [servicios] = await dbPool.query(
                'SELECT precio FROM servicios WHERE id_servicio = ?', 
                [id_servicio]
            );

            if (servicios.length === 0) {
                return res.status(404).json({ status: "error", message: "Servicio no localizado en el catálogo" });
            }

            // 2. Cálculo de Negocio: Server-side calculation
            const subtotal = servicios[0].precio * cantidad;

            // 3. Persistencia: Inserción en la tabla relacional (Intermedia)
            // Se usa execute por ser una sentencia de manipulación de datos (DML).
            await dbPool.execute(
                'INSERT INTO reserva_servicios (id_reserva, id_servicio, cantidad, subtotal) VALUES (?, ?, ?, ?)',
                [id_reserva, id_servicio, cantidad, subtotal]
            );

            res.status(201).json({ 
                status: "success", 
                message: "Servicio cargado correctamente a la habitación", 
                data: { subtotal } 
            });

        } catch (error) {
            console.error("❌ Error en agregarConsumo:", error);
            res.status(500).json({ status: "error", message: "Fallo en la persistencia del cargo extra" });
        }
    },

    /**
     * @method obtenerPorReserva
     * Recupera el historial de consumos de una reserva específica para auditoría.
     */
    obtenerPorReserva: async (req, res) => {
        const { id_reserva } = req.params;
        try {
            // Académico: El JOIN permite transformar un ID técnico en un nombre legible para el usuario.
            const [consumos] = await dbPool.query(
                `SELECT rs.*, s.nombre_servicio, s.precio as precio_unitario
                 FROM reserva_servicios rs 
                 JOIN servicios s ON rs.id_servicio = s.id_servicio 
                 WHERE rs.id_reserva = ?`,
                [id_reserva]
            );
            res.status(200).json(consumos);
        } catch (error) {
            console.error("❌ Error en obtenerPorReserva:", error);
            res.status(500).json({ status: "error", message: "Error al consultar historial de consumos" });
        }
    },

    /**
     * @method obtenerRemisionCompleta
     * Lógica Maestra de Liquidación: Une Habitación (Hospedaje) + Servicios (Extras).
     */
    obtenerRemisionCompleta: async (req, res) => {
        const { id_reserva } = req.params;
        try {
            /**
             * EXPLICACIÓN ACADÉMICA DEL QUERY CONSOLIDADO:
             * - DATEDIFF: Función nativa de SQL para determinar las noches de estancia.
             * - JOIN Usuarios: Se vincula para obtener el nombre real del cliente responsable.
             * - LEFT JOIN: Crucial para que si no hay servicios extra, la cuenta no salga vacía.
             * - IFNULL: Asegura que el subtotal sea 0 en lugar de un valor nulo matemáticamente inválido.
             */
            const query = `
                SELECT 
                    r.id_reserva,
                    h.numero_habitacion,
                    u.nombres AS nombre_huesped,
                    u.apellidos AS apellido_huesped,
                    r.fecha_checkin,
                    r.fecha_checkout,
                    DATEDIFF(r.fecha_checkout, r.fecha_checkin) AS noches_estadia,
                    t.precio_noche,
                    (DATEDIFF(r.fecha_checkout, r.fecha_checkin) * t.precio_noche) AS subtotal_hospedaje,
                    IFNULL(SUM(rs.subtotal), 0) AS subtotal_servicios_extra,
                    ((DATEDIFF(r.fecha_checkout, r.fecha_checkin) * t.precio_noche) + IFNULL(SUM(rs.subtotal), 0)) AS total_factura_general
                FROM reservas r
                JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
                JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion
                JOIN usuarios u ON r.id_usuario = u.id_usuarios
                LEFT JOIN reserva_servicios rs ON r.id_reserva = rs.id_reserva
                WHERE r.id_reserva = ?
                GROUP BY r.id_reserva, h.numero_habitacion, u.nombres, u.apellidos, r.fecha_checkin, r.fecha_checkout, t.precio_noche`;

            const [resultado] = await dbPool.query(query, [id_reserva]);
            
            if (resultado.length === 0) {
                return res.status(404).json({ status: "error", message: "No se encontró una reserva con ese ID" });
            }

            res.status(200).json({
                status: "success",
                message: "Liquidación consolidada generada con éxito",
                data: resultado[0]
            });

        } catch (error) {
            console.error("❌ Error en obtenerRemisionCompleta:", error);
            res.status(500).json({ status: "error", message: "Error crítico al procesar el cierre de cuenta" });
        }
    }
};

export default reservaServiciosController;