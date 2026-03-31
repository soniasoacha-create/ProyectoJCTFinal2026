import { dbPool } from '../config/database.js';

/**
 * Mapeo de Usuario: Capa de abstracción para integridad del Frontend.
 */
const mapUsuario = (row) => ({
  id_usuarios: row.id_usuarios,
  nombres: row.nombres,
  apellidos: row.apellidos,
  email: row.email,
  telefono: row.telefono,
  tipo_usuario: row.tipo_usuario,
  fecha_registro: row.fecha_registro,
  // El hash solo se incluye cuando es necesario para validación interna
  password_hash: row.password_hash 
});

/**
 * ✅ BUSCAR USUARIO POR EMAIL (Especial para Login)
 * Crucial para la autenticación en el controlador.
 */
export const getUsuarioByEmail = async (email) => {
  const [rows] = await dbPool.query(
    'SELECT * FROM usuarios WHERE email = ?',
    [email]
  );
  if (rows.length === 0) return null;
  return mapUsuario(rows[0]);
};

/**
 * ✅ OBTENER TODOS LOS USUARIOS
 */
export const getAllUsuarios = async () => {
  const [rows] = await dbPool.query(`
    SELECT id_usuarios, nombres, apellidos, email, telefono, tipo_usuario, fecha_registro 
    FROM usuarios 
    ORDER BY id_usuarios DESC
  `);
  return rows.map(mapUsuario); 
};

/**
 * ✅ OBTENER USUARIO POR ID
 */
export const getUsuarioById = async (id) => {
  const [rows] = await dbPool.query(
    'SELECT * FROM usuarios WHERE id_usuarios = ?',
    [id]
  );
  if (rows.length === 0) return null;
  return mapUsuario(rows[0]);
};

/**
 * ✅ CREAR USUARIO
 * Nota: password_hash debe venir ya encriptado desde el controlador.
 */
export const crearUsuario = async ({ nombres, apellidos, email, telefono, tipo_usuario, password_hash }) => {
  const [result] = await dbPool.execute(
    `INSERT INTO usuarios (nombres, apellidos, email, telefono, tipo_usuario, password_hash)
     VALUES (?, ?, ?, ?, ?, ?)`, 
    [nombres, apellidos, email, telefono, tipo_usuario || 'cliente', password_hash]
  );

  return {
    id_usuarios: result.insertId,
    nombres,
    apellidos,
    email,
    telefono,
    tipo_usuario: tipo_usuario || 'cliente'
  };
};

/**
 * ✅ ACTUALIZAR USUARIO (Dinámico)
 */
export const updateUsuario = async (id, data) => {
  const campos = [];
  const valores = [];

  if (data.nombres) { campos.push("nombres = ?"); valores.push(data.nombres); }
  if (data.apellidos) { campos.push("apellidos = ?"); valores.push(data.apellidos); }
  if (data.email) { campos.push("email = ?"); valores.push(data.email); }
  if (data.telefono !== undefined) { campos.push("telefono = ?"); valores.push(data.telefono); }
  
  const tipoFinal = data.tipo_usuario || data.tipoUsuario;
  if (tipoFinal) { 
    campos.push("tipo_usuario = ?"); 
    valores.push(tipoFinal); 
  }
  
  if (data.password_hash) { campos.push("password_hash = ?"); valores.push(data.password_hash); }

  if (campos.length === 0) return { affectedRows: 0 };

  valores.push(id);
  const sql = `UPDATE usuarios SET ${campos.join(", ")} WHERE id_usuarios = ?`;
  
  const [result] = await dbPool.execute(sql, valores);
  return result;
};

/**
 * ✅ ELIMINAR USUARIO
 */
export const deleteUsuario = async (id) => {
  const [result] = await dbPool.execute(
    'DELETE FROM usuarios WHERE id_usuarios = ?',
    [id]
  );
  return result;
};