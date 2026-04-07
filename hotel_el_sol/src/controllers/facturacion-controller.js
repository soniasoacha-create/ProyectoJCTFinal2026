import * as FacturacionModel from '../models/facturacion-model.js';
import { dbPool } from '../config/database.js';

const canAccessOwnerData = (usuarioAutenticado, ownerId) => {
    if (usuarioAutenticado?.rol !== 'cliente') {
        return true;
    }
    return Number(usuarioAutenticado.id) === Number(ownerId);
};

/**
 * ✅ OBTENER O GENERAR FACTURA PARA UNA RESERVA
 * Si es la primera vez, se genera automáticamente
 */
export const generarObtenerFactura = async (req, res) => {
    const { id_reserva } = req.params;
    const usuarioAutenticado = req.user;

    try {
        const [reserva] = await dbPool.query(
            'SELECT id_usuario FROM reservas WHERE id_reserva = ? LIMIT 1',
            [id_reserva]
        );

        if (reserva.length === 0) {
            return res.status(404).json({
                message: "No se encontró la reserva especificada"
            });
        }

        if (!canAccessOwnerData(usuarioAutenticado, reserva[0].id_usuario)) {
            return res.status(403).json({
                message: "No tienes permiso para facturar esta reserva"
            });
        }

        const factura = await FacturacionModel.getOrCreateFactura(id_reserva);

        if (!factura) {
            return res.status(404).json({
                message: "No se encontró la reserva especificada"
            });
        }

        res.status(200).json({
            message: "Factura generada o recuperada exitosamente",
            data: factura
        });
    } catch (error) {
        console.error("Error en generarObtenerFactura:", error.message);
        res.status(500).json({
            message: "Error al generar la factura"
        });
    }
};

/**
 * ✅ OBTENER FACTURA POR ID
 */
export const obtenerFactura = async (req, res) => {
    const { id_factura } = req.params;
    const usuarioAutenticado = req.user;

    try {
        const factura = await FacturacionModel.getFacturaById(id_factura);

        if (!factura) {
            return res.status(404).json({
                message: "Factura no encontrada"
            });
        }

        if (!canAccessOwnerData(usuarioAutenticado, factura.id_usuario)) {
            return res.status(403).json({
                message: "No tienes permiso para ver esta factura"
            });
        }

        res.status(200).json({
            message: "Factura recuperada exitosamente",
            data: factura
        });
    } catch (error) {
        console.error("Error en obtenerFactura:", error.message);
        res.status(500).json({
            message: "Error al obtener la factura"
        });
    }
};

/**
 * ✅ OBTENER FACTURA COMPLETA CON SERVICIOS
 */
export const obtenerFacturaCompleta = async (req, res) => {
    const { id_reserva } = req.params;
    const usuarioAutenticado = req.user;

    try {
        const factura = await FacturacionModel.getFacturaCompleta(id_reserva);

        if (!factura) {
            return res.status(404).json({
                message: "No se encontró factura para esta reserva"
            });
        }

        if (!canAccessOwnerData(usuarioAutenticado, factura.id_usuario)) {
            return res.status(403).json({
                message: "No tienes permiso para ver esta factura"
            });
        }

        res.status(200).json({
            message: "Factura completa recuperada exitosamente",
            data: factura
        });
    } catch (error) {
        console.error("Error en obtenerFacturaCompleta:", error.message);
        res.status(500).json({
            message: "Error al obtener la factura completa"
        });
    }
};

/**
 * ✅ OBTENER TODAS LAS FACTURAS (Solo administrador)
 */
export const listarTodasFacturas = async (req, res) => {
    try {
        const facturas = await FacturacionModel.getAllFacturas();

        res.status(200).json({
            message: "Facturas obtenidas exitosamente",
            total: facturas.length,
            data: facturas
        });
    } catch (error) {
        console.error("Error en listarTodasFacturas:", error.message);
        res.status(500).json({
            message: "Error al listar facturas"
        });
    }
};

/**
 * ✅ OBTENER FACTURAS DE UN USUARIO
 */
export const obtenerFacturasUsuario = async (req, res) => {
    const { id_usuario } = req.params;
    const usuarioAutenticado = req.user;
    const idUsuarioNumerico = Number(id_usuario);

    if (!Number.isInteger(idUsuarioNumerico) || idUsuarioNumerico <= 0) {
        return res.status(400).json({
            message: "El id de usuario no es válido"
        });
    }

    try {
        // Validar que el usuario solo pueda ver sus propias facturas
        // (A menos que sea administrador)
        if (usuarioAutenticado.rol === 'cliente' && Number(usuarioAutenticado.id) !== idUsuarioNumerico) {
            return res.status(403).json({
                message: "No tienes permiso para ver las facturas de otro usuario"
            });
        }

        const facturas = await FacturacionModel.getFacturasByUsuario(idUsuarioNumerico);

        res.status(200).json({
            message: "Facturas del usuario obtenidas exitosamente",
            total: facturas.length,
            data: facturas
        });
    } catch (error) {
        console.error("Error en obtenerFacturasUsuario:", error.message);
        res.status(500).json({
            message: "Error al obtener facturas del usuario"
        });
    }
};

/**
 * ✅ CAMBIAR ESTADO DE FACTURA (Solo administrador)
 */
export const cambiarEstadoFactura = async (req, res) => {
    const { id_factura } = req.params;
    const { estado_factura } = req.body;

    // Validar que el estado sea válido
    const estadosValidos = ['generada', 'pagada', 'cancelada'];
    if (!estadosValidos.includes(estado_factura)) {
        return res.status(400).json({
            message: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`
        });
    }

    try {
        const actualizado = await FacturacionModel.updateEstadoFactura(id_factura, estado_factura);

        if (!actualizado) {
            return res.status(404).json({
                message: "Factura no encontrada"
            });
        }

        res.status(200).json({
            message: "Estado de factura actualizado exitosamente",
            estado: estado_factura
        });
    } catch (error) {
        console.error("Error en cambiarEstadoFactura:", error.message);
        res.status(500).json({
            message: "Error al actualizar el estado de la factura"
        });
    }
};

export default {
    generarObtenerFactura,
    obtenerFactura,
    obtenerFacturaCompleta,
    listarTodasFacturas,
    obtenerFacturasUsuario,
    cambiarEstadoFactura
};
