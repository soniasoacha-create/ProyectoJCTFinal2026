import { Router } from "express";
import { requireAdminOrModerator, authenticate } from "../middlewares/roleMiddleware.js";
import { 
    listarReservas, 
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
router.get("/", authenticate, listarReservas);

/**
 * @route GET /api/reservas/resumen/:id
 * @desc Obtener resumen de reserva para cliente
 * @access Autenticado
 */
router.get("/resumen/:id", authenticate, obtenerResumenReserva);

/**
 * @route GET /api/reservas/disponibilidad-edicion
 * @desc Obtener habitaciones disponibles
 * @access Autenticado
 */
router.get("/disponibilidad-edicion", authenticate, obtenerHabitacionesDisponiblesEdicion);

/**
 * @route GET /api/reservas/:id
 * @desc Obtener reserva por ID con detalles completos
 * @access Autenticado
 */
router.get("/:id", authenticate, obtenerReservaPorId);

/**
 * @route POST /api/reservas
 * @desc Crear nueva reserva con servicios opcionales
 * @access Autenticado
 */
router.post("/", authenticate, crearReserva);

/**
 * @route PUT /api/reservas/:id
 * @desc Actualizar reserva
 * @access Solo Admin/Moderador
 */
router.put("/:id", authenticate, requireAdminOrModerator, updateReserva);

/**
 * @route PUT /api/reservas/:id/estado
 * @desc Cambiar estado de reserva
 * @access Solo Admin/Moderador
 */
router.put("/:id/estado", authenticate, requireAdminOrModerator, cambiarEstadoReserva);

/**
 * @route DELETE /api/reservas/:id
 * @desc Eliminar reserva
 * @access Solo Admin/Moderador
 */
router.delete("/:id", authenticate, requireAdminOrModerator, eliminarReserva);

export default router;