import { Router } from 'express';
import { authenticate, requireAdminOrModerator } from '../middlewares/roleMiddleware.js';
import {
    getServicios,
    getServicioById,
    createServicio,
    updateServicio,
    deleteServicio
} from '../controllers/servicios-controller.js';

const router = Router();

/**
 * ============================================================
 * MÓDULO DE RUTAS: SERVICIOS ADICIONALES — HOTEL EL SOL
 * ============================================================
 * Este archivo conecta las peticiones del Frontend (serviciosService)
 * con la lógica de negocio en el controlador.
 * ============================================================
 */

// ✅ OBTENER TODOS LOS SERVICIOS (Público - cualquier usuario autenticado puede ver)
router.get('/', authenticate, getServicios);

// ✅ OBTENER UN SERVICIO POR ID (Público)
router.get('/:id', authenticate, getServicioById);

// ✅ CREAR UN NUEVO SERVICIO (Solo Admin/Moderador)
router.post('/', authenticate, requireAdminOrModerator, createServicio);

// ✅ ACTUALIZAR UN SERVICIO EXISTENTE (Solo Admin/Moderador)
router.put('/:id', authenticate, requireAdminOrModerator, updateServicio);

// ✅ ELIMINAR UN SERVICIO (Solo Admin/Moderador)
router.delete('/:id', authenticate, requireAdminOrModerator, deleteServicio);

export default router;