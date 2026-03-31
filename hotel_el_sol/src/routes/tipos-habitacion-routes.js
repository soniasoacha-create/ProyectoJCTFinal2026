/**
 * ============================================================
 * MÓDULO DE RUTAS: TIPOS DE HABITACIÓN — HOTEL EL SOL
 * ============================================================
 * Este archivo actúa como el puente entre el frontend y el
 * controlador, permitiendo que las respuestas de éxito o error
 * se disparen correctamente en la interfaz de usuario.
 * ============================================================
 */

import { Router } from 'express';
import { requireAdminOrModerator } from '../middlewares/roleMiddleware.js';
import {
    getAllTiposHabitacion,
    getTipoHabitacionById,
    crearTipoHabitacion,
    updateTipoHabitacion,
    deleteTipoHabitacion
} from '../controllers/tipos-habitacion-controller.js';

const router = Router();

/**
 * ============================================================
 * RUTAS DE CONSULTA (READ) - Públicas
 * ============================================================
 */

/**
 * @route   GET /api/tipos-habitacion
 * @desc    Listar todos los tipos de habitación
 * @access  Autenticado
 */
router.get('/', getAllTiposHabitacion);

/**
 * @route   GET /api/tipos-habitacion/:id
 * @desc    Obtener tipo de habitación por ID
 * @access  Autenticado
 */
router.get('/:id', getTipoHabitacionById);

/**
 * ============================================================
 * RUTAS DE ESCRITURA (CUD) - Solo Admin/Moderador
 * ============================================================
 */

/**
 * @route   POST /api/tipos-habitacion
 * @desc    Crear nuevo tipo de habitación
 * @access  Solo Admin/Moderador
 */
router.post('/', requireAdminOrModerator, crearTipoHabitacion);

/**
 * @route   PUT /api/tipos-habitacion/:id
 * @desc    Actualizar tipo de habitación
 * @access  Solo Admin/Moderador
 */
router.put('/:id', requireAdminOrModerator, updateTipoHabitacion);

/**
 * @route   DELETE /api/tipos-habitacion/:id
 * @desc    Eliminar tipo de habitación
 * @access  Solo Admin/Moderador
 */
router.delete('/:id', requireAdminOrModerator, deleteTipoHabitacion);

export default router;