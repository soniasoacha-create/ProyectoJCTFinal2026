import api from '../api/axiosConfig';

const API_URL = 'tipos-habitacion';

const tiposHabitacionService = {
  getAllTipos: async () => {
    const { data } = await api.get(API_URL);
    return data;
  },

  crearTipo: async (payload) => {
    const { data } = await api.post(API_URL, payload);
    return data;
  },

  actualizarTipo: async (id, payload) => {
    const { data } = await api.put(`${API_URL}/${id}`, payload);
    return data;
  },

  eliminarTipo: async (id) => {
    const { data } = await api.delete(`${API_URL}/${id}`);
    return data;
  }
};

export default tiposHabitacionService;
