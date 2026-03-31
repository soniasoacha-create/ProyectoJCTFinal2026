import * as usuariosModel from '../models/usuarios-model.js';
import bcrypt from 'bcryptjs';

/**
 * READ ALL
 */
export const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await usuariosModel.getAllUsuarios();
    res.status(200).json(usuarios);
  } catch (error) {
    console.error("❌ Error en listarUsuarios:", error.message);
    res.status(500).json({ status: "error", message: "Error al obtener usuarios." });
  }
};

/**
 * READ ONE
 * Académico: Función exportada para resolver el error de importación en usuarios-routes.js.
 */
export const getUsuarioById = async (req, res) => {
  const { id } = req.params;
  const usuarioAutenticado = req.user;
  try {
    if (usuarioAutenticado.rol === 'cliente' && Number(id) !== Number(usuarioAutenticado.id)) {
      return res.status(403).json({ status: "error", message: "No tienes permiso para consultar este usuario." });
    }

    const usuario = await usuariosModel.getUsuarioById(id);
    if (usuario) {
      res.status(200).json(usuario);
    } else {
      res.status(404).json({ status: "error", message: "Usuario no encontrado." });
    }
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error al buscar el usuario." });
  }
};

/**
 * CREATE — Registro con Seguridad
 * Académico: Implementa el hashing de contraseñas. Si el Frontend no envía password,
 * se genera una por defecto para satisfacer la restricción NOT NULL de la base de datos.
 */
export const crearUsuario = async (req, res) => {
  const { nombres, apellidos, email, telefono, tipo_usuario, tipoUsuario, password } = req.body;
  const tipoUsuarioFinal = tipo_usuario || tipoUsuario;
  
  // Clave por defecto mientras se integra el campo en el formulario de React
  const passwordParaProcesar = password || "Hotel2026*"; 

  if (!nombres || !apellidos || !email || !tipoUsuarioFinal) {
    return res.status(400).json({
      status: "error",
      message: "Faltan campos obligatorios para completar el registro."
    });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(passwordParaProcesar, salt);

    const newUsuario = await usuariosModel.crearUsuario({
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      email: email.toLowerCase().trim(),
      telefono: telefono || "",
      tipo_usuario: tipoUsuarioFinal,
      password_hash: password_hash 
    });

    res.status(201).json({
      status: "success",
      message: "¡Usuario registrado correctamente!",
      data: newUsuario
    });
  } catch (error) {
    console.error("❌ Error en crearUsuario:", error.message);
    res.status(500).json({
      status: "error",
      message: "Error al guardar: Posible correo duplicado o error de conexión.",
      error: error.message
    });
  }
};

/**
 * UPDATE
 */
export const updateUsuario = async (req, res) => {
  const { id } = req.params;
  const usuarioAutenticado = req.user;
  try {
    if (usuarioAutenticado.rol === 'cliente' && Number(id) !== Number(usuarioAutenticado.id)) {
      return res.status(403).json({ status: "error", message: "No tienes permiso para actualizar este usuario." });
    }

    const payload = { ...req.body };

    // Cliente no puede escalar privilegios ni modificar hash directamente
    if (usuarioAutenticado.rol === 'cliente') {
      delete payload.tipo_usuario;
      delete payload.tipoUsuario;
      delete payload.password_hash;
    }

    const result = await usuariosModel.updateUsuario(id, payload);
    if (result && result.affectedRows > 0) {
      res.status(200).json({ status: "success", message: "Actualizado correctamente." });
    } else {
      res.status(404).json({ status: "error", message: "No se encontró el registro." });
    }
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error al actualizar." });
  }
};

/**
 * DELETE
 */
export const deleteUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await usuariosModel.deleteUsuario(id);
    if (result && result.affectedRows > 0) {
      res.status(200).json({ status: "success", message: "Usuario eliminado." });
    } else {
      res.status(404).json({ status: "error", message: "Registro no localizado." });
    }
  } catch (error) {
    res.status(500).json({ status: "error", message: "No se pudo eliminar el usuario." });
  }
};