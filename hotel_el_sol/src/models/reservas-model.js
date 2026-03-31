import { dbPool } from '../config/database.js';

/**
 * Obtener todas las reservas
 */
export const getAllReservas = async () => {
  try {
    const [rows] = await dbPool.query(`
      SELECT 
        r.id_reserva,
        r.id_usuario,
        r.id_habitacion,
        r.fecha_checkin,
        r.fecha_checkout,
        r.total_huespedes,
        r.precio_total,
        r.estado_reserva,
        r.fecha_reserva,
        r.notas,

        -- Datos del usuario
        u.nombres,
        u.apellidos,

        -- Datos de la habitación
        h.numero_habitacion,
        h.estado AS estado_habitacion,

        -- Datos del tipo de habitación
        t.nombre_tipo

      FROM reservas r
      INNER JOIN usuarios u ON r.id_usuario = u.id_usuarios
      INNER JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
      INNER JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion
      ORDER BY r.fecha_reserva DESC
    `);

    return rows;
  } catch (error) {
    console.error("Error en getAllReservas:", error.message);
    return [];
  }
};

/**
 * Obtener reserva por ID
 */
export const getReservaById = async (id) => {
  try {
    const [rows] = await dbPool.query(`
      SELECT 
        r.id_reserva,
        r.id_usuario,
        r.id_habitacion,
        r.fecha_checkin,
        r.fecha_checkout,
        r.total_huespedes,
        r.precio_total,
        r.estado_reserva,
        r.fecha_reserva,
        r.notas,

        u.nombres,
        u.apellidos,
        h.numero_habitacion,
        t.nombre_tipo

      FROM reservas r
      INNER JOIN usuarios u ON r.id_usuario = u.id_usuarios
      INNER JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
      INNER JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion
      WHERE r.id_reserva = ?
    `, [id]);

    return rows.length ? rows[0] : null;
  } catch (error) {
    console.error("Error en getReservaById:", error.message);
    return null;
  }
};

/**
 * Crear reserva
 */
export const createReserva = async ({
  id_usuario,
  id_habitacion,
  fecha_checkin,
  fecha_checkout,
  total_huespedes,
  precio_total,
  estado_reserva,
  notas
}) => {
  try {
    const [result] = await dbPool.query(`
      INSERT INTO reservas (
        id_usuario,
        id_habitacion,
        fecha_checkin,
        fecha_checkout,
        total_huespedes,
        precio_total,
        estado_reserva,
        fecha_reserva,
        notas
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)
    `, [
      id_usuario,
      id_habitacion,
      fecha_checkin,
      fecha_checkout,
      total_huespedes,
      precio_total,
      estado_reserva,
      notas
    ]);

    return {
      id_reserva: result.insertId,
      id_usuario,
      id_habitacion,
      fecha_checkin,
      fecha_checkout,
      total_huespedes,
      precio_total,
      estado_reserva,
      notas
    };
  } catch (error) {
    console.error("Error en createReserva:", error.message);
    return null;
  }
};

/**
 * Actualizar reserva (parcial)
 */
export const updateReserva = async (id, data) => {
  try {
    const sqlSet = [];
    const sqlValues = [];

    if (data.id_usuario !== undefined) {
      sqlSet.push("id_usuario = ?");
      sqlValues.push(data.id_usuario);
    }

    if (data.id_habitacion !== undefined) {
      sqlSet.push("id_habitacion = ?");
      sqlValues.push(data.id_habitacion);
    }

    if (data.fecha_checkin !== undefined) {
      sqlSet.push("fecha_checkin = ?");
      sqlValues.push(data.fecha_checkin);
    }

    if (data.fecha_checkout !== undefined) {
      sqlSet.push("fecha_checkout = ?");
      sqlValues.push(data.fecha_checkout);
    }

    if (data.total_huespedes !== undefined) {
      sqlSet.push("total_huespedes = ?");
      sqlValues.push(data.total_huespedes);
    }

    if (data.precio_total !== undefined) {
      sqlSet.push("precio_total = ?");
      sqlValues.push(data.precio_total);
    }

    if (data.estado_reserva !== undefined) {
      sqlSet.push("estado_reserva = ?");
      sqlValues.push(data.estado_reserva);
    }

    if (data.notas !== undefined) {
      sqlSet.push("notas = ?");
      sqlValues.push(data.notas);
    }

    if (sqlSet.length === 0) return { affectedRows: 0 };

    sqlValues.push(id);

    const query = `
      UPDATE reservas
      SET ${sqlSet.join(", ")}
      WHERE id_reserva = ?
    `;

    const [result] = await dbPool.query(query, sqlValues);
    return result;
  } catch (error) {
    console.error("Error en updateReserva:", error.message);
    return { affectedRows: 0 };
  }
};

/**
 * Eliminar reserva
 */
export const deleteReserva = async (id) => {
  try {
    const [result] = await dbPool.query(
      'DELETE FROM reservas WHERE id_reserva = ?',
      [id]
    );
    return result;
  } catch (error) {
    console.error("Error en deleteReserva:", error.message);
    return { affectedRows: 0 };
  }
};