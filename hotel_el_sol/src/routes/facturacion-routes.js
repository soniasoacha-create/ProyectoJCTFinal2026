import { Router } from 'express';
import { requireAdmin } from '../middlewares/roleMiddleware.js';
import {
    generarObtenerFactura,
    obtenerFactura,
    obtenerFacturaCompleta,
    listarTodasFacturas,
    obtenerFacturasUsuario,
    cambiarEstadoFactura
} from '../controllers/facturacion-controller.js';

const router = Router();

/**
 * ============================================================
 * RUTAS DE FACTURACIÓN - HOTEL EL SOL
 * ============================================================
 */

/**
 * @route POST /api/facturacion/:id_reserva
 * @desc Generar o obtener factura de una reserva
 * @access Autenticado (Cliente o Admin)
 */
router.post('/:id_reserva', generarObtenerFactura);

/**
 * @route GET /api/facturacion/completa/:id_reserva
 * @desc Obtener factura completa con detalles de servicios
 * @access Autenticado (Cliente o Admin)
 */
router.get('/completa/:id_reserva', obtenerFacturaCompleta);

/**
 * @route GET /api/facturacion/todas
 * @desc Listar todas las facturas
 * @access Solo Administrador
 */
router.get('/todas', requireAdmin, listarTodasFacturas);

/**
 * @route GET /api/facturacion/usuario/:id_usuario
 * @desc Obtener facturas de un usuario específico
 * @access Autenticado (Cliente ve sus propias, Admin ve todas)
 */
router.get('/usuario/:id_usuario', obtenerFacturasUsuario);

/**
 * @route GET /api/facturacion/:id_factura
 * @desc Obtener factura por ID
 * @access Autenticado (Cliente o Admin)
 */
router.get('/:id_factura', obtenerFactura);

/**
 * @route PUT /api/facturacion/:id_factura/estado
 * @desc Cambiar estado de factura
 * @access Solo Administrador
 */
router.put('/:id_factura/estado', requireAdmin, cambiarEstadoFactura);

export default router;
