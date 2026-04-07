import { dbPool } from '../config/database.js';

const DEFAULT_TAX_RATE = 0.19;

const toAmount = (value) => Number(Number(value) || 0);

const getPrecioNocheFacturado = (subtotalHospedaje = 0, nochesEstadia = 0, precioActual = 0) => {
    const noches = Number(nochesEstadia) || 0;

    if (noches <= 0) {
        return toAmount(precioActual);
    }

    return Number((toAmount(subtotalHospedaje) / noches).toFixed(2));
};

const buildFinancialBreakdown = (subtotalHospedaje = 0, totalServicios = 0) => {
    const hospedaje = Number(subtotalHospedaje) || 0;
    const servicios = Number(totalServicios) || 0;
    const subtotal = Number((hospedaje + servicios).toFixed(2));
    const impuestos = Number((subtotal * DEFAULT_TAX_RATE).toFixed(2));
    const totalConImpuestos = Number((subtotal + impuestos).toFixed(2));

    return {
        porcentaje_impuesto: DEFAULT_TAX_RATE,
        subtotal_hospedaje: hospedaje,
        subtotal_servicios: servicios,
        subtotal,
        impuestos,
        total_con_impuestos: totalConImpuestos
    };
};

const attachFacturaSnapshot = (factura) => {
    if (!factura) return factura;

    const totalServicios = factura.total_servicios ?? factura.subtotal_servicios ?? 0;

    return {
        ...factura,
        precio_noche_facturado: getPrecioNocheFacturado(
            factura.subtotal_hospedaje,
            factura.noches_estadia,
            factura.precio_noche
        ),
        resumen_financiero: buildFinancialBreakdown(factura.subtotal_hospedaje, totalServicios)
    };
};

/**
 * ✅ MODELO DE FACTURACIÓN
 * Gestiona la creación y consulta de facturas basadas en reservas
 */

/**
 * Obtener o crear factura para una reserva
 */
export const getOrCreateFactura = async (id_reserva) => {
    try {
        // 1. Verificar si ya existe factura para esta reserva
        const [existingFactura] = await dbPool.query(
            'SELECT * FROM facturacion WHERE id_reserva = ?',
            [id_reserva]
        );

        if (existingFactura.length > 0) {
            const facturaExistente = existingFactura[0];
            return attachFacturaSnapshot(facturaExistente);
        }

        // 2. Calcular total de la reserva con servicios
        const [reservaData] = await dbPool.query(`
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
                u.email,
                u.telefono,
                h.numero_habitacion,
                t.nombre_tipo,
                t.precio_noche,
                DATEDIFF(r.fecha_checkout, r.fecha_checkin) AS noches_estadia,
                (DATEDIFF(r.fecha_checkout, r.fecha_checkin) * t.precio_noche) AS subtotal_hospedaje,
                IFNULL((SELECT SUM(rs.subtotal) FROM reserva_servicios rs WHERE rs.id_reserva = r.id_reserva), 0) AS total_servicios
            FROM reservas r
            INNER JOIN usuarios u ON r.id_usuario = u.id_usuarios
            INNER JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
            INNER JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion
            WHERE r.id_reserva = ?
        `, [id_reserva]);

        if (reservaData.length === 0) {
            return null;
        }

        const data = reservaData[0];
        const resumenFinanciero = buildFinancialBreakdown(data.subtotal_hospedaje, data.total_servicios);
        const numeroFactura = `FAC-${Date.now()}`;

        // 3. Crear nueva factura
        const [result] = await dbPool.execute(`
            INSERT INTO facturacion 
            (
                id_reserva,
                id_usuario,
                numero_factura,
                fecha_factura,
                subtotal_hospedaje,
                subtotal_servicios,
                total_servicios,
                subtotal_bruto,
                iva_19,
                impoconsumo_8,
                retefuente,
                monto_total,
                total_general,
                estado_factura
            )
            VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id_reserva,
            data.id_usuario,
            numeroFactura,
            data.subtotal_hospedaje,
            data.total_servicios,
            data.total_servicios,
            resumenFinanciero.subtotal,
            resumenFinanciero.impuestos,
            0,
            0,
            resumenFinanciero.total_con_impuestos,
            resumenFinanciero.total_con_impuestos,
            'generada'
        ]);

        return {
            id_factura: result.insertId,
            ...data,
            precio_noche_facturado: getPrecioNocheFacturado(
                data.subtotal_hospedaje,
                data.noches_estadia,
                data.precio_noche
            ),
            subtotal_bruto: resumenFinanciero.subtotal,
            iva_19: resumenFinanciero.impuestos,
            monto_total: resumenFinanciero.total_con_impuestos,
            total_general: resumenFinanciero.total_con_impuestos,
            numero_factura: numeroFactura,
            fecha_factura: new Date(),
            estado_factura: 'generada',
            resumen_financiero: resumenFinanciero
        };
    } catch (error) {
        console.error("Error en getOrCreateFactura:", error.message);
        throw error;
    }
};

/**
 * Obtener factura por ID
 */
export const getFacturaById = async (id_factura) => {
    try {
        const [rows] = await dbPool.query(`
            SELECT 
                f.*,
                u.nombres,
                u.apellidos,
                u.email,
                u.telefono,
                h.numero_habitacion,
                t.nombre_tipo,
                t.precio_noche,
                r.fecha_checkin,
                r.fecha_checkout,
                r.total_huespedes,
                DATEDIFF(r.fecha_checkout, r.fecha_checkin) AS noches_estadia
            FROM facturacion f
            INNER JOIN reservas r ON f.id_reserva = r.id_reserva
            INNER JOIN usuarios u ON f.id_usuario = u.id_usuarios
            INNER JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
            INNER JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion
            WHERE f.id_factura = ?
        `, [id_factura]);

        if (rows.length === 0) {
            return null;
        }

        return attachFacturaSnapshot(rows[0]);
    } catch (error) {
        console.error("Error en getFacturaById:", error.message);
        throw error;
    }
};

/**
 * Obtener factura por ID de reserva
 */
export const getFacturaByReserva = async (id_reserva) => {
    try {
        const [rows] = await dbPool.query(`
            SELECT 
                f.*,
                u.nombres,
                u.apellidos,
                u.email,
                u.telefono,
                h.numero_habitacion,
                t.nombre_tipo,
                r.fecha_checkin,
                r.fecha_checkout,
                r.total_huespedes,
                DATEDIFF(r.fecha_checkout, r.fecha_checkin) AS noches_estadia
            FROM facturacion f
            INNER JOIN reservas r ON f.id_reserva = r.id_reserva
            INNER JOIN usuarios u ON f.id_usuario = u.id_usuarios
            INNER JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
            INNER JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion
            WHERE f.id_reserva = ?
        `, [id_reserva]);

        if (rows.length === 0) {
            return null;
        }

        return attachFacturaSnapshot(rows[0]);
    } catch (error) {
        console.error("Error en getFacturaByReserva:", error.message);
        throw error;
    }
};

/**
 * Obtener todas las facturas (solo admin)
 */
export const getAllFacturas = async () => {
    try {
        const [rows] = await dbPool.query(`
            SELECT 
                f.*,
                CONCAT(u.nombres, ' ', u.apellidos) AS nombre_cliente,
                h.numero_habitacion
            FROM facturacion f
            INNER JOIN reservas r ON f.id_reserva = r.id_reserva
            INNER JOIN usuarios u ON f.id_usuario = u.id_usuarios
            INNER JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
            ORDER BY f.fecha_factura DESC
        `);

        return rows;
    } catch (error) {
        console.error("Error en getAllFacturas:", error.message);
        throw error;
    }
};

/**
 * Obtener facturas de un usuario específico
 */
export const getFacturasByUsuario = async (id_usuario) => {
    try {
        const [rows] = await dbPool.query(`
            SELECT 
                f.*,
                h.numero_habitacion,
                t.nombre_tipo
            FROM facturacion f
            INNER JOIN reservas r ON f.id_reserva = r.id_reserva
            INNER JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
            INNER JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion
            WHERE f.id_usuario = ?
            ORDER BY f.fecha_factura DESC
        `, [id_usuario]);

        return rows;
    } catch (error) {
        console.error("Error en getFacturasByUsuario:", error.message);
        throw error;
    }
};

/**
 * Actualizar estado de factura
 */
export const updateEstadoFactura = async (id_factura, estado_factura) => {
    try {
        const [result] = await dbPool.execute(
            'UPDATE facturacion SET estado_factura = ? WHERE id_factura = ?',
            [estado_factura, id_factura]
        );

        return result.affectedRows > 0;
    } catch (error) {
        console.error("Error en updateEstadoFactura:", error.message);
        throw error;
    }
};

/**
 * Obtener datos de factura con detalles de servicios
 */
export const getFacturaCompleta = async (id_reserva) => {
    try {
        const [factura] = await dbPool.query(`
            SELECT 
                f.*,
                u.nombres,
                u.apellidos,
                u.email,
                u.telefono,
                u.tipo_usuario,
                h.numero_habitacion,
                t.nombre_tipo,
                t.precio_noche,
                r.fecha_checkin,
                r.fecha_checkout,
                r.total_huespedes,
                DATEDIFF(r.fecha_checkout, r.fecha_checkin) AS noches_estadia
            FROM facturacion f
            INNER JOIN reservas r ON f.id_reserva = r.id_reserva
            INNER JOIN usuarios u ON f.id_usuario = u.id_usuarios
            INNER JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
            INNER JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion
            WHERE f.id_reserva = ?
        `, [id_reserva]);

        if (factura.length === 0) {
            return null;
        }

        // Obtener servicios asociados
        const [servicios] = await dbPool.query(`
            SELECT 
                rs.id_reserva_servicio,
                rs.id_servicio,
                rs.cantidad,
                rs.subtotal,
                s.nombre_servicio,
                s.descripcion,
                CASE
                    WHEN rs.cantidad IS NULL OR rs.cantidad = 0 THEN rs.subtotal
                    ELSE ROUND(rs.subtotal / rs.cantidad, 2)
                END AS precio_unitario,
                s.precio AS precio_catalogo_actual
            FROM reserva_servicios rs
            INNER JOIN servicios s ON rs.id_servicio = s.id_servicio
            WHERE rs.id_reserva = ?
        `, [id_reserva]);

        const facturaBase = attachFacturaSnapshot(factura[0]);

        return {
            ...facturaBase,
            servicios,
            detalle_estadia: {
                dias_hospedaje: facturaBase.noches_estadia,
                numero_personas: facturaBase.total_huespedes
            }
        };
    } catch (error) {
        console.error("Error en getFacturaCompleta:", error.message);
        throw error;
    }
};

export default {
    getOrCreateFactura,
    getFacturaById,
    getFacturaByReserva,
    getAllFacturas,
    getFacturasByUsuario,
    updateEstadoFactura,
    getFacturaCompleta
};
