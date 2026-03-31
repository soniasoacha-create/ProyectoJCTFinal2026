import axios from 'axios';

const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    (process.env.NODE_ENV === 'development' ? '/api' : 'http://localhost:3000/api');

// 1. Configuración de la instancia base
const api = axios.create({
    // En desarrollo usa proxy (/api). En build local usa backend directo.
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 2. Interceptor de Peticiones (Request Interceptor)
// Este bloque es fundamental en MediPlan para la seguridad JWT
api.interceptors.request.use(
    (config) => {
        // Buscamos el token guardado en el navegador tras el Login
        const token = localStorage.getItem('token');
        
        if (token) {
            // Si el token existe, lo añade al encabezado de la petición
            // Esto permite que el Backend valide quién está operando
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. Interceptor de Respuestas (opcional pero recomendado)
// Ayuda a manejar errores globales, como cuando el token expira
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Si el servidor responde 401 (No autorizado), limpiamos el acceso
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;