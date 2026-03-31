/**
 * CAPA DE SERVICIOS - GESTIÓN DE RESERVAS
 * Maneja la lógica de peticiones al backend para el Hotel El Sol.
 * Utiliza la instancia 'api' para incluir automáticamente el Token JWT.
 */
import api from '../api/axiosConfig';

const API_URL = 'reservas';

const reservasService = {
  /**
   * ✅ Obtener reservas activas
   * Filtra los huéspedes aptos para cargos extras (Estadía vigente).
   */
  getReservasActivas: async () => {
    try {
      const response = await api.get(`${API_URL}/activas`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener reservas activas:", error);
      throw error;
    }
  },

  /**
   * ✅ Obtener todas las reservas
   * Obtiene el listado total histórico de la base de datos.
   */
  getAllReservas: async () => {
    try {
      const response = await api.get(API_URL);
      return response.data;
    } catch (error) {
      console.error("Error al obtener todas las reservas:", error);
      throw error;
    }
  },

  /**
   * ✅ Obtener reservas del usuario autenticado (cliente)
   * Usa rutas fallback para compatibilidad con distintos backends.
   */
  getReservasUsuario: async (idUsuario) => {
    const rutas = [];

    if (idUsuario) {
      rutas.push(`${API_URL}/usuario/${idUsuario}`);
    }

    rutas.push(`${API_URL}/usuario`);
    rutas.push(API_URL); // el backend filtra por JWT cuando es cliente

    let lastError = null;
    for (const ruta of rutas) {
      try {
        const response = await api.get(ruta);
        return response.data;
      } catch (error) {
        if (error?.response?.status === 404) {
          continue;
        }
        lastError = error;
      }
    }

    if (lastError?.response?.status === 404 || !lastError) {
      return [];
    }

    throw lastError || new Error('No fue posible obtener reservas del usuario');
  },

  /**
   * ✅ Obtener reserva por ID
   */
  getReservaById: async (id) => {
    try {
      const response = await api.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener la reserva ${id}:`, error);
      throw error;
    }
  },

  /**
   * ✅ Crear una nueva reserva
   */
  crearReserva: async (reservaData) => {
    try {
      const response = await api.post(API_URL, reservaData);
      return response.data;
    } catch (error) {
      console.error("Error al crear reserva:", error);
      throw new Error(error.response?.data?.message || 'Error al crear la reserva');
    }
  },

  /**
   * ✅ Actualizar reserva
   */
  actualizarReserva: async (id, reservaData) => {
    try {
      const response = await api.put(`${API_URL}/${id}`, reservaData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar la reserva ${id}:`, error);
      throw error;
    }
  },

  /**
   * ✅ Cambiar estado de una reserva
   */
  cambiarEstadoReserva: async (id, estado_reserva) => {
    try {
      const response = await api.put(`${API_URL}/${id}/estado`, { estado_reserva });
      return response.data;
    } catch (error) {
      console.error(`Error al cambiar estado de la reserva ${id}:`, error);
      throw error;
    }
  },

  /**
   * ✅ Eliminar reserva
   */
  eliminarReserva: async (id) => {
    try {
      const response = await api.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar la reserva ${id}:`, error);
      throw error;
    }
  }
};

export default reservasService;