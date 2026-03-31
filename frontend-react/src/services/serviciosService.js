import api from '../api/axiosConfig';

const API_URL = 'servicios';

const serviciosService = {
  obtenerServicios: async () => {
    try {
      const response = await api.get(API_URL);
      return response.data;
    } catch (error) {
      console.error('Error al obtener servicios:', error);
      throw error;
    }
  },

  obtenerServicioById: async (id) => {
    try {
      const response = await api.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener servicio:', error);
      throw error;
    }
  },

  crearServicio: async (payload) => {
    try {
      const response = await api.post(API_URL, payload);
      return response.data;
    } catch (error) {
      console.error('Error al crear servicio:', error);
      throw error;
    }
  },

  actualizarServicio: async (id, payload) => {
    try {
      const response = await api.put(`${API_URL}/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar servicio:', error);
      throw error;
    }
  },

  eliminarServicio: async (id) => {
    try {
      const response = await api.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar servicio:', error);
      throw error;
    }
  }
};

export default serviciosService;