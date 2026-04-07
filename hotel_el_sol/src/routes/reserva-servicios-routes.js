/**
 * SUSTENTACIÓN ACADÉMICA: CAPA DE ENRUTAMIENTO (API ROUTING)
 * Define los puntos de acceso (Endpoints) que permiten la comunicación entre 
 * la interfaz de React y la lógica de negocio en Node.js.
 * * - Modularidad: Las rutas están desacopladas de la lógica para facilitar el mantenimiento.
 * - Semántica REST: Uso de verbos HTTP adecuados para cada operación.
 */
import express from 'express';
import controller from '../controllers/reserva-servicios-controller.js';

const router = express.Router();

/**
 * @route POST /api/reserva-servicios
 * @desc Registra un nuevo cargo extra (Minibar, Spa, etc.) a una reserva.
 * @access Administrativo
 */
router.post('/', controller.agregarConsumo);

/**
 * @route DELETE /api/reserva-servicios/:id_reserva_servicio
 * @desc Elimina un cargo específico de una reserva.
 */
router.delete('/:id_reserva_servicio', controller.eliminarConsumo);

/**
 * @route GET /api/reserva-servicios/:id_reserva
 * @desc Recupera el historial detallado de consumos extras de un huésped.
 */
router.get('/:id_reserva', controller.obtenerPorReserva);

/**
 * @route GET /api/reserva-servicios/remision/:id_reserva
 * @desc NUEVO: Genera la remisión total consolidada.
 * Vincula: (Días de Hospedaje x Precio Habitación) + Sumatoria de Cargos Extras.
 * Este endpoint es el motor detrás del botón "Facturación" en la interfaz.
 */
router.get('/remision/:id_reserva', controller.obtenerRemisionCompleta);

export default router;