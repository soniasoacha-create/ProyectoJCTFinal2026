import { Router } from "express";
import { requireAdminOrModerator } from "../middlewares/roleMiddleware.js";
import { 
    listarReservas, 
    obtenerReservasActivas,
    obtenerHabitacionesDisponiblesEdicion, 
    crearReserva,
    obtenerReservaPorId,
    cambiarEstadoReserva,
    updateReserva,
    eliminarReserva,
    obtenerResumenReserva
} from "../controllers/reservas-controller.js";

const router = Router();

/**
 * ============================================================
 * RUTAS DE RESERVAS - HOTEL EL SOL
 * ============================================================
 */

/**
 * @route GET /api/reservas
 * @desc Listar todas las reservas (cliente ve las suyas, admin ve todas)
 * @access Autenticado
 */
router.get("/", listarReservas);

/**
 * @route GET /api/reservas/activas
 * @desc Listar reservas activas para consumos y operación de recepción
 * @access Autenticado
 */
router.get('/activas', obtenerReservasActivas);

/**
 * @route GET /api/reservas/resumen/:id
 * @desc Obtener resumen de reserva para cliente
 * @access Autenticado
 */
router.get("/resumen/:id", obtenerResumenReserva);

/**
 * @route GET /api/reservas/disponibilidad-edicion
 * @desc Obtener habitaciones disponibles
 * @access Autenticado
 */
router.get("/disponibilidad-edicion", obtenerHabitacionesDisponiblesEdicion);

/**
 * @route GET /api/reservas/:id
 * @desc Obtener reserva por ID con detalles completos
 * @access Autenticado
 */
router.get("/:id", obtenerReservaPorId);

/**
 * @route POST /api/reservas
 * @desc Crear nueva reserva con servicios opcionales
 * @access Autenticado
 */
router.post("/", crearReserva);

/**
 * @route PUT /api/reservas/:id
 * @desc Actualizar reserva
 * @access Solo Admin/Moderador
 */
router.put("/:id", requireAdminOrModerator, updateReserva);

/**
 * @route PUT /api/reservas/:id/estado
 * @desc Cambiar estado de reserva
 * @access Solo Admin/Moderador
 */
router.put("/:id/estado", requireAdminOrModerator, cambiarEstadoReserva);

/**
 * @route DELETE /api/reservas/:id
 * @desc Eliminar reserva
 * @access Solo Admin/Moderador
 */
router.delete("/:id", requireAdminOrModerator, eliminarReserva);

export default router;