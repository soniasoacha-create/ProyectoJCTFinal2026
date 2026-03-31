import { dbPool } from '../config/database.js';

/**
 * ✅ READ ALL — Obtener todos los tipos de habitación
 */
export const getAllTiposHabitacion = async () => {
  const query = `
    SELECT 
      id_tipo_habitacion,
      nombre_tipo,
      descripcion,
      capacidad_maxima,
      precio_noche
    FROM tipos_habitacion
    ORDER BY nombre_tipo ASC
  `;
  const [rows] = await dbPool.query(query);
  return rows;
};

/**
 * ✅ READ ONE — Obtener tipo de habitación por ID
 */
export const getTipoHabitacionById = async (id) => {
  const query = `
    SELECT * FROM tipos_habitacion WHERE id_tipo_habitacion = ?
  `;
  const [rows] = await dbPool.query(query, [id]);
  return rows.length ? rows[0] : null;
};

/**
 * ✅ CREATE — Crear un nuevo tipo de habitación
 */
export const crearTipoHabitacion = async ({
  nombre_tipo,
  descripcion,
  capacidad_maxima,
  precio_noche
}) => {
  const query = `
    INSERT INTO tipos_habitacion 
      (nombre_tipo, descripcion, capacidad_maxima, precio_noche)
    VALUES (?, ?, ?, ?)
  `;

  const [result] = await dbPool.query(query, [
    nombre_tipo,
    descripcion || "",
    capacidad_maxima ?? 1,
    precio_noche
  ]);

  return {
    id_tipo_habitacion: result.insertId,
    nombre_tipo,
    descripcion: descripcion || "",
    capacidad_maxima: capacidad_maxima ?? 1,
    precio_noche
  };
};

/**
 * ✅ UPDATE — Actualización dinámica
 */
export const updateTipoHabitacion = async (id, updateData) => {
  const sqlSet = [];
  const sqlValues = [];

  // Mapeo dinámico de campos
  if (updateData.nombre_tipo !== undefined) {
    sqlSet.push("nombre_tipo = ?");
    sqlValues.push(updateData.nombre_tipo);
  }

  if (updateData.descripcion !== undefined) {
    sqlSet.push("descripcion = ?");
    sqlValues.push(updateData.descripcion);
  }

  if (updateData.capacidad_maxima !== undefined) {
    sqlSet.push("capacidad_maxima = ?");
    sqlValues.push(updateData.capacidad_maxima);
  }

  if (updateData.precio_noche !== undefined) {
    sqlSet.push("precio_noche = ?");
    sqlValues.push(updateData.precio_noche);
  }

  if (sqlSet.length === 0) return { affectedRows: 0 };

  sqlValues.push(id);

  const query = `
    UPDATE tipos_habitacion
    SET ${sqlSet.join(", ")}
    WHERE id_tipo_habitacion = ?
  `;

  const [result] = await dbPool.query(query, sqlValues);
  return result;
};

/**
 * ✅ DELETE — Eliminar registro
 */
export const deleteTipoHabitacion = async (id) => {
  const query = `DELETE FROM tipos_habitacion WHERE id_tipo_habitacion = ?`;
  const [result] = await dbPool.query(query, [id]);
  return result;
};