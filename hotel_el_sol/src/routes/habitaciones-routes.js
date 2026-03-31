/**
 * ============================================================
 * ENRUTADOR DE HABITACIONES — HOTEL EL SOL
 * ============================================================
 * Este módulo define los puntos de entrada (endpoints) para la
 * gestión de habitaciones. Mapea las URLs hacia las funciones
 * correspondientes en el controlador.
 * 
 * Prefijo: /api/habitaciones
 * ============================================================
 */

import { Router } from 'express';
import { requireAdminOrModerator } from '../middlewares/roleMiddleware.js';
import {
    getHabitaciones,
    getHabitacionesDisponibles,
    getHabitacionById,
    crearHabitacion,
    updateHabitacion,
    deleteHabitacion
} from '../controllers/habitaciones-controller.js';

const router = Router();

/**
 * ============================================================
 * RUTAS DE CONSULTA (READ) - Públicas
 * ============================================================
 */

/**
 * @route   GET /api/habitaciones/disponibilidad
 * @desc    Obtener habitaciones disponibles por rango de fechas
 * @access  Autenticado
 */
router.get('/disponibilidad', getHabitacionesDisponibles);

/**
 * @route   GET /api/habitaciones
 * @desc    Obtener listado de habitaciones
 * @access  Autenticado, solo Admin/Moderador para ver todas
 */
router.get('/', getHabitaciones);

/**
 * @route   GET /api/habitaciones/:id
 * @desc    Obtener detalle de una habitación específica
 * @access  Autenticado
 */
router.get('/:id', getHabitacionById);

/**
 * ============================================================
 * RUTAS DE ESCRITURA (CUD) - Solo Admin/Moderador
 * ============================================================
 */

/**
 * @route   POST /api/habitaciones
 * @desc    Registrar una nueva habitación
 * @access  Solo Admin/Moderador
 */
router.post('/', requireAdminOrModerator, crearHabitacion);

/**
 * @route   PUT /api/habitaciones/:id
 * @desc    Actualizar datos de una habitación
 * @access  Solo Admin/Moderador
 */
router.put('/:id', requireAdminOrModerator, updateHabitacion);

/**
 * @route   DELETE /api/habitaciones/:id
 * @desc    Eliminar una habitación
 * @access  Solo Admin/Moderador
 */
router.delete('/:id', requireAdminOrModerator, deleteHabitacion);

export default router;