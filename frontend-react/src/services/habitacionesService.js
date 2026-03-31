import api from '../api/axiosConfig';

const API_URL = 'habitaciones';

const habitacionesService = {
  // Obtener todas las habitaciones
  getAllHabitaciones: async () => {
    try {
      const { data } = await api.get(API_URL);
      return data;
    } catch (error) {
      console.error('Error al obtener habitaciones:', error);
      throw error;
    }
  },

  getHabitacionById: async (id_habitacion) => {
    try {
      const { data } = await api.get(`${API_URL}/${id_habitacion}`);
      return data;
    } catch (error) {
      console.error('Error al obtener habitación:', error);
      throw error;
    }
  },

  // Obtener habitaciones disponibles por rango de fechas
  getDisponibles: async (fechaInicio, fechaFin) => {
    const rutas = [
      `${API_URL}/disponibilidad?fecha_inicio=${encodeURIComponent(fechaInicio)}&fecha_fin=${encodeURIComponent(fechaFin)}`,
      `${API_URL}/disponibilidad?fecha_checkin=${encodeURIComponent(fechaInicio)}&fecha_checkout=${encodeURIComponent(fechaFin)}`,
    ];

    let lastError = null;
    for (const ruta of rutas) {
      try {
        const { data } = await api.get(ruta);
        return data;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  },

  // Resolver habitaciones para el flujo de reserva con fallback por permisos
  getHabitacionesParaReserva: async ({ fechaInicio, fechaFin } = {}) => {
    try {
      return await habitacionesService.getAllHabitaciones();
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        if (fechaInicio && fechaFin) {
          return habitacionesService.getDisponibles(fechaInicio, fechaFin);
        }
        return [];
      }
      throw error;
    }
  },

  // Crear una nueva habitación
  crearHabitacion: async (payload) => {
    try {
      const { data } = await api.post(API_URL, payload);
      return data;
    } catch (error) {
      console.error('Error al crear habitación:', error);
      throw error;
    }
  },

  // Actualizar una habitación existente
  actualizarHabitacion: async (id_habitacion, payload) => {
    try {
      const { data } = await api.put(`${API_URL}/${id_habitacion}`, payload);
      return data;
    } catch (error) {
      console.error('Error al actualizar habitación:', error);
      throw error;
    }
  },

  // Eliminar una habitación
  eliminarHabitacion: async (id_habitacion) => {
    try {
      const { data } = await api.delete(`${API_URL}/${id_habitacion}`);
      return data;
    } catch (error) {
      console.error('Error al eliminar habitación:', error);
      throw error;
    }
  }
};

export default habitacionesService;