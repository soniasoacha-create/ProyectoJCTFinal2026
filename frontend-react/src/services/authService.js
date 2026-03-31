import api from '../api/axiosConfig';

const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const backendMessage = String(error.response?.data?.message || '').toLowerCase();

      if (!error.response) {
        throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté activo e inténtalo de nuevo.');
      }

      if (status === 404 || backendMessage.includes('no se encuentra registrado')) {
        throw new Error('El correo no está registrado. Verifica el email o crea una cuenta nueva.');
      }

      if (status === 401 || backendMessage.includes('contraseña incorrecta')) {
        throw new Error('La contraseña es incorrecta. Inténtalo nuevamente.');
      }

      if (status === 400 && backendMessage.includes('correo')) {
        throw new Error('El formato del correo no es válido.');
      }

      throw new Error(error.response?.data?.message || 'No fue posible iniciar sesión en este momento.');
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error en el registro');
    }
  },

  logout: () => {
    localStorage.clear();
    window.location.href = '/login';
  }
};

export default authService;