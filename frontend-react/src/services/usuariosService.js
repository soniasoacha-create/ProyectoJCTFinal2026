// ============================================================
// SERVICIO: GESTIÓN DE USUARIOS - HOTEL EL SOL
// ------------------------------------------------------------
// Capa de abstracción para la comunicación con el Backend.
// Utiliza la instancia 'api' centralizada para manejar JWT.
// ============================================================

//import api from '../api/axiosConfig'; // Importación corregida
import api from '../api/axiosConfig';
import Swal from "sweetalert2";

// Usamos solo el sufijo porque la baseURL (http://localhost:3001/api) 
// ya está definida en axiosConfig.js
const API_URL = "/usuarios"; 

// Configuración de Notificaciones Rápidas (Toasts)
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

/**
 * ✅ OBTENER TODOS LOS USUARIOS
 */
export const getAllUsuarios = async () => {
  try {
    // Cambio: se usa 'api' en lugar de 'axios' para incluir el interceptor
    const { data } = await api.get(API_URL); 
    return data; 
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error de conexión',
      text: 'No se pudo establecer comunicación con el servidor del hotel.',
      confirmButtonColor: '#dc3545'
    });
    throw error;
  }
};

/**
 * ✅ OBTENER UN USUARIO POR SU ID
 */
export const getUsuarioById = async (id) => {
  try {
    const { data } = await api.get(`${API_URL}/${id}`);
    return data;
  } catch (error) {
    console.error("Error al recuperar el usuario:", error);
    throw error;
  }
};

/**
 * ✅ CREAR UN NUEVO USUARIO
 */
export const crearUsuario = async (payload) => {
  try {
    const { data } = await api.post(API_URL, payload);
    
    await Swal.fire({
      icon: 'success',
      title: '¡Registro Exitoso!',
      text: data.message || 'El usuario ha sido ingresado al sistema.',
      confirmButtonColor: '#28a745',
      timer: 2000
    });
    
    return data;
  } catch (error) {
    const mensajeError = error.response?.data?.message || "Error al procesar el registro.";
    Swal.fire({
      icon: 'error',
      title: 'No se pudo crear',
      text: mensajeError,
      confirmButtonColor: '#dc3545'
    });
    throw error;
  }
};

/**
 * ✅ ACTUALIZAR USUARIO
 */
export const actualizarUsuario = async (id, payload) => {
  try {
    const { data } = await api.put(`${API_URL}/${id}`, payload);
    
    Toast.fire({
      icon: 'success',
      title: data.message || 'Cambios guardados con éxito'
    });
    
    return data;
  } catch (error) {
    const mensajeError = error.response?.data?.message || "Error al actualizar.";
    Swal.fire({
      icon: 'error',
      title: 'Error de Actualización',
      text: mensajeError,
      confirmButtonColor: '#dc3545'
    });
    throw error;
  }
};

/**
 * ✅ ELIMINAR USUARIO
 */
export const eliminarUsuario = async (id) => {
  try {
    const { data } = await api.delete(`${API_URL}/${id}`);
    
    if (data.status === "success") {
      await Swal.fire({
        icon: 'success',
        title: '¡Eliminado!',
        text: data.message,
        confirmButtonColor: '#28a745'
      });
    }
    
    return data;
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Acción Denegada',
      text: error.response?.data?.message || "No se puede eliminar este registro.",
      confirmButtonColor: '#dc3545'
    });
    throw error;
  }
};