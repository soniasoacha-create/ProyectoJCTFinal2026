/**
 * SUSTENTACIÓN ACADÉMICA:
 * Este servicio implementa la lógica de negocio para la tabla intermedia (Muchos a Muchos).
 * - Integridad Referencial: Gestiona la unión entre 'Reservas' y 'Servicios'.
 * - Manejo de Errores: Captura tanto errores de lógica de negocio (ej. reserva inexistente) 
 * como errores de infraestructura (caída del servidor).
 * - Patrón Singleton: Se exporta como un objeto de servicio único para centralizar 
 * la gestión de consumos extras.
 */

import api from '../api/axiosConfig';

const API_URL = 'reserva-servicios';

const reservaServiciosService = {
    /**
     * Registra un consumo adicional (servicio) a una estancia.
     * @param {Object} consumoData - { id_reserva, id_servicio, cantidad }
     */
    agregarConsumo: async (consumoData) => {
        try {
            const response = await api.post(API_URL, consumoData);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : new Error("Error de conexión con el servidor");
        }
    },

    /**
     * Obtiene el desglose de servicios cargados a una reserva específica.
     * @param {number} id_reserva 
     */
    obtenerConsumosPorReserva: async (id_reserva) => {
        try {
            const response = await api.get(`${API_URL}/${id_reserva}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : new Error("Error al obtener el historial de consumos");
        }
    },

    /**
     * Elimina un cargo específico de la reserva (en caso de error humano).
     * @param {number} id_reserva_servicio 
     */
    eliminarConsumo: async (id_reserva_servicio) => {
        try {
            const response = await api.delete(`${API_URL}/${id_reserva_servicio}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : new Error("No se pudo eliminar el cargo");
        }
    }
};

export default reservaServiciosService;