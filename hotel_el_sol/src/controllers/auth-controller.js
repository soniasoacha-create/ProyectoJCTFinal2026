import * as UsuarioModel from '../models/usuarios-model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * ✅ INICIO DE SESIÓN (LOGIN)
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Validar que el usuario existe en la tabla 'usuarios'
    // Usamos la función getUsuarioByEmail que añadimos al modelo
    const user = await UsuarioModel.getUsuarioByEmail(email);

    if (!user) {
      return res.status(404).json({ 
        message: "El correo electrónico no se encuentra registrado." 
      });
    }

    // 2. Comparar la contraseña enviada con el hash de la base de datos
    // Importante: user.password_hash viene del mapeo de tu modelo
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ 
        message: "Contraseña incorrecta. Inténtalo de nuevo." 
      });
    }

    // 3. Generar el Token JWT
    // Incluimos id_usuarios y tipo_usuario para que el Front sepa quién es y qué rol tiene
    const token = jwt.sign(
      { 
        id: user.id_usuarios, 
        rol: user.tipo_usuario 
      },
      process.env.JWT_SECRET || 'hotel_sol_secret_2026', // Usa tu variable de entorno
      { expiresIn: '8h' } // Sesión de 8 horas
    );

    // 4. Respuesta exitosa
    // No enviamos el password_hash al frontend por seguridad
    res.status(200).json({
      message: "Inicio de sesión exitoso",
      token,
      user: {
        id: user.id_usuarios,
        nombre: user.nombres,
        apellidos: user.apellidos,
        rol: user.tipo_usuario
      }
    });

  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({ 
      message: "Error interno del servidor al procesar el login." 
    });
  }
};

/**
 * ✅ REGISTRO DE USUARIOS
 */
export const register = async (req, res) => {
  const { nombres, apellidos, email, password, telefono } = req.body;

  try {
    // 1. Validar campos obligatorios
    if (!nombres || !apellidos || !email || !password) {
      return res.status(400).json({ 
        message: "Faltan campos obligatorios: nombres, apellidos, email y password." 
      });
    }

    // 2. Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: "El formato del correo electrónico no es válido." 
      });
    }

    // 3. Verificar si el email ya existe para evitar duplicados
    const existe = await UsuarioModel.getUsuarioByEmail(email);
    if (existe) {
      return res.status(400).json({ message: "El correo ya está en uso." });
    }

    // 4. Validar longitud mínima de contraseña
    if (password.length < 6) {
      return res.status(400).json({ 
        message: "La contraseña debe tener al menos 6 caracteres." 
      });
    }

    // 5. Encriptar la contraseña antes de guardar
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 6. Crear el usuario en la base de datos
    const nuevoUsuario = await UsuarioModel.crearUsuario({
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      email: email.toLowerCase().trim(),
      telefono: telefono?.trim() || '',
      tipo_usuario: 'cliente', // Rol por defecto
      password_hash
    });

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: nuevoUsuario
    });

  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).json({ 
      message: "Error al registrar el usuario.",
      error: error.message 
    });
  }
};