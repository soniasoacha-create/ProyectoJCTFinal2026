/**
 * ============================================================
 * MODELO DE HABITACIONES — HOTEL EL SOL (VERSIÓN INTEGRAL)
 * ------------------------------------------------------------
 * Sincronizado con BD: Se eliminaron 'descripcion' y 'capacidad'
 * para evitar fallos de columna desconocida.
 * ============================================================
 */

import { dbPool } from '../config/database.js';

/**
 * ✅ 1. OBTENER TODAS LAS HABITACIONES (READ ALL)
 * Ajustado a columnas reales: id_habitacion, numero_habitacion, estado,
 * mantenimiento_inicio, mantenimiento_fin e id_tipo_habitacion.
 */
export const getAllHabitaciones = async () => {
  const query = `
    SELECT 
      h.id_habitacion,
      h.numero_habitacion,
      h.estado,
      h.mantenimiento_inicio,
      h.mantenimiento_fin,
      h.id_tipo_habitacion,
      t.nombre_tipo,
      t.descripcion,
      t.capacidad_maxima,
      t.precio_noche
    FROM habitaciones h
    INNER JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion
    ORDER BY h.numero_habitacion ASC
  `;
  try {
    const [rows] = await dbPool.query(query);
    console.log(`[Model] ${rows.length} habitaciones cargadas con éxito.`);
    return rows;
  } catch (error) {
    console.error("❌ Error en getAllHabitaciones SQL:", error.message);
    throw new Error(`Error en base de datos: ${error.message}`);
  }
};

/**
 * ✅ 2. CONSULTAR DISPONIBILIDAD (FILTRO MAESTRO)
 * Cruza fechas de reservas y mantenimientos.
 */
export const getHabitacionesDisponibles = async (fecha_inicio, fecha_fin) => {
  const sql = `
    SELECT h.*, t.nombre_tipo, t.descripcion, t.capacidad_maxima, t.precio_noche
    FROM habitaciones h
    JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion
    WHERE h.estado = 'disponible'
    AND h.id_habitacion NOT IN (
        -- Filtro: Reservas activas
        SELECT id_habitacion FROM reservas 
        WHERE estado_reserva != 'cancelada'
        AND (fecha_checkin < ? AND fecha_checkout > ?)
    )
    AND h.id_habitacion NOT IN (
        -- Filtro: Mantenimientos
        SELECT id_habitacion FROM habitaciones 
        WHERE estado = 'mantenimiento'
        AND (mantenimiento_inicio < ? AND mantenimiento_fin > ?)
    )
  `;
  try {
    // Nota: Usamos la lógica de traslape (overlap) estándar de hotelería
    const [rows] = await dbPool.query(sql, [fecha_fin, fecha_inicio, fecha_fin, fecha_inicio]);
    return rows;
  } catch (error) {
    console.error("❌ Error en disponibilidad SQL:", error.message);
    return [];
  }
};

/**
 * ✅ 3. OBTENER UNA HABITACIÓN (READ BY ID)
 */
export const getHabitacionById = async (id) => {
  const query = `
    SELECT h.*, t.nombre_tipo, t.descripcion, t.capacidad_maxima, t.precio_noche
    FROM habitaciones h
    JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion
    WHERE h.id_habitacion = ?
  `;
  try {
    const [rows] = await dbPool.query(query, [id]);
    return rows.length ? rows[0] : null;
  } catch (error) {
    console.error(`❌ Error al buscar ID ${id}:`, error.message);
    return null;
  }
};

/**
 * ✅ 4. CREAR HABITACIÓN (CREATE)
 */
export const createHabitacion = async (data) => {
  const { numero_habitacion, id_tipo_habitacion, estado } = data;
  const query = `
    INSERT INTO habitaciones (numero_habitacion, id_tipo_habitacion, estado)
    VALUES (?, ?, ?)
  `;
  try {
    const [result] = await dbPool.query(query, [
      numero_habitacion, 
      id_tipo_habitacion, 
      estado || 'disponible'
    ]);
    return { id_habitacion: result.insertId, ...data };
  } catch (error) {
    console.error("❌ Error al insertar habitación:", error.message);
    throw error;
  }
};

/**
 * ✅ 5. ACTUALIZAR HABITACIÓN (UPDATE)
 */
export const updateHabitacion = async (id, updateData) => {
  const fields = [];
  const values = [];
  const allowed = ['numero_habitacion', 'estado', 'id_tipo_habitacion', 'mantenimiento_inicio', 'mantenimiento_fin'];

  for (const key of allowed) {
    if (updateData[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    }
  }

  if (fields.length === 0) return { affectedRows: 0 };
  values.push(id);

  const sql = `UPDATE habitaciones SET ${fields.join(', ')} WHERE id_habitacion = ?`;
  try {
    const [result] = await dbPool.query(sql, values);
    return result;
  } catch (error) {
    console.error("❌ Error en updateHabitacion:", error.message);
    throw error;
  }
};

/**
 * ✅ 6. ELIMINAR HABITACIÓN (DELETE)
 */
export const deleteHabitacion = async (id) => {
  try {
    const [result] = await dbPool.query('DELETE FROM habitaciones WHERE id_habitacion = ?', [id]);
    return result;
  } catch (error) {
    console.error("❌ Error en deleteHabitacion:", error.message);
    throw error;
  }
};

/**
 * ✅ 7. VERIFICAR EXISTENCIA
 */
export const checkExistingNumero = async (numero) => {
  const [rows] = await dbPool.query('SELECT id_habitacion FROM habitaciones WHERE numero_habitacion = ?', [numero]);
  return rows.length > 0;
};