import { dbPool } from '../config/database.js';

/**
 * ✅ READ ALL
 */
export const getAllServicios = async () => {
    // Eliminamos el try-catch interno para que el controlador capture el error real
    const query = `
      SELECT id_servicio, nombre_servicio, descripcion, precio 
      FROM servicios 
      ORDER BY nombre_servicio ASC
    `;
    const [rows] = await dbPool.query(query);
    return rows;
};

/**
 * ✅ READ ONE
 */
export const getServicioById = async (id) => {
    const query = `SELECT * FROM servicios WHERE id_servicio = ?`;
    const [rows] = await dbPool.query(query, [id]);
    return rows.length ? rows[0] : null;
};

/**
 * ✅ CREATE
 * Soporta tanto nombre_servicio como nombreServicio
 */
export const createServicio = async ({ nombre_servicio, nombreServicio, descripcion, precio }) => {
    const nombreFinal = nombre_servicio || nombreServicio;
    
    const query = `
      INSERT INTO servicios (nombre_servicio, descripcion, precio)
      VALUES (?, ?, ?)
    `;

    const [result] = await dbPool.query(query, [
        nombreFinal,
        descripcion || "",
        precio
    ]);

    return {
        id_servicio: result.insertId,
        nombre_servicio: nombreFinal,
        descripcion: descripcion || "",
        precio
    };
};

/**
 * ✅ UPDATE (Dinámico)
 * Ahora mapea correctamente las variables del frontend a las columnas de la BD
 */
export const updateServicio = async (id, data) => {
    const sqlSet = [];
    const sqlValues = [];

    // Mapeo flexible para el nombre
    const nombreFinal = data.nombre_servicio || data.nombreServicio;
    if (nombreFinal !== undefined) {
        sqlSet.push("nombre_servicio = ?");
        sqlValues.push(nombreFinal);
    }

    if (data.descripcion !== undefined) {
        sqlSet.push("descripcion = ?");
        sqlValues.push(data.descripcion);
    }

    if (data.precio !== undefined) {
        sqlSet.push("precio = ?");
        sqlValues.push(data.precio);
    }

    if (sqlSet.length === 0) return { affectedRows: 0 };

    sqlValues.push(id);

    const query = `
      UPDATE servicios
      SET ${sqlSet.join(", ")}
      WHERE id_servicio = ?
    `;

    const [result] = await dbPool.query(query, sqlValues);
    return result;
};

/**
 * ✅ DELETE
 */
export const deleteServicio = async (id) => {
    const [result] = await dbPool.query(
        'DELETE FROM servicios WHERE id_servicio = ?',
        [id]
    );
    return result;
};