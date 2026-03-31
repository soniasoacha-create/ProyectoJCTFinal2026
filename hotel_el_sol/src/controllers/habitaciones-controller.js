/**
 * ============================================================
 * CONTROLADOR DE HABITACIONES — HOTEL EL SOL (VERSIÓN INTEGRAL)
 * ------------------------------------------------------------
 * Sincronizado para eliminar 'descripcion' y 'capacidad'.
 * Maneja la lógica de negocio y comunicación con el Modelo.
 * ============================================================
 */

import * as habitacionesModel from '../models/habitaciones-model.js';

/**
 * ✅ 1. LISTADO GENERAL
 * Provee los datos para la tabla principal de habitaciones.
 */
export const getHabitaciones = async (req, res) => {
    try {
        const habitaciones = await habitacionesModel.getAllHabitaciones();
        res.status(200).json(habitaciones || []);
    } catch (error) {
        console.error("❌ Error en getHabitaciones [Controller]:", error.message);
        res.status(500).json({ 
            message: "Error al obtener el listado de habitaciones.",
            error: error.message 
        });
    }
};

/**
 * ✅ 2. CONSULTA DE DISPONIBILIDAD
 * Crucial para el módulo de reservas. Resuelve el error de rutas del servidor.
 */
export const getHabitacionesDisponibles = async (req, res) => {
    // Soporta parámetros desde query string: ?fecha_inicio=...&fecha_fin=...
    const { fecha_inicio, fecha_fin, inicio, fin } = req.query;
    
    // Normalización de parámetros para mayor flexibilidad
    const start = fecha_inicio || inicio;
    const end = fecha_fin || fin;

    if (!start || !end) {
        return res.status(400).json({ message: "Se requieren fechas de inicio y fin." });
    }

    try {
        const disponibles = await habitacionesModel.getHabitacionesDisponibles(start, end);
        res.status(200).json(disponibles);
    } catch (error) {
        console.error("❌ Error en getHabitacionesDisponibles [Controller]:", error.message);
        res.status(500).json({ message: "Error al consultar disponibilidad." });
    }
};

/**
 * ✅ 3. OBTENER UNA HABITACIÓN POR ID
 */
export const getHabitacionById = async (req, res) => {
    const { id } = req.params;
    try {
        const habitacion = await habitacionesModel.getHabitacionById(id);
        if (!habitacion) {
            return res.status(404).json({ message: "Habitación no encontrada." });
        }
        res.status(200).json(habitacion);
    } catch (error) {
        res.status(500).json({ message: "Error al buscar la habitación." });
    }
};

/**
 * ✅ 4. CREAR NUEVA HABITACIÓN
 * Solo procesa campos existentes en la BD según Workbench.
 */
export const crearHabitacion = async (req, res) => {
    const { numero_habitacion, id_tipo_habitacion, estado } = req.body;

    if (!numero_habitacion || !id_tipo_habitacion) {
        return res.status(400).json({ message: "Número y Tipo de habitación son obligatorios." });
    }

    try {
        // Validación de duplicados
        const existe = await habitacionesModel.checkExistingNumero(numero_habitacion);
        if (existe) {
            return res.status(400).json({ message: `La habitación ${numero_habitacion} ya existe.` });
        }

        const nueva = await habitacionesModel.createHabitacion({
            numero_habitacion,
            id_tipo_habitacion,
            estado: estado || 'disponible'
        });

        res.status(201).json({
            message: "Habitación creada con éxito.",
            data: nueva
        });
    } catch (error) {
        console.error("❌ Error en crearHabitacion [Controller]:", error.message);
        res.status(500).json({ message: "Error al registrar la habitación." });
    }
};

/**
 * ✅ 5. ACTUALIZAR HABITACIÓN
 */
export const updateHabitacion = async (req, res) => {
    const { id } = req.params;
    const datosActualizados = req.body;

    try {
        const resultado = await habitacionesModel.updateHabitacion(id, datosActualizados);
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ message: "No se encontró la habitación para actualizar." });
        }
        res.status(200).json({ message: "Habitación actualizada correctamente." });
    } catch (error) {
        console.error("❌ Error en updateHabitacion [Controller]:", error.message);
        res.status(500).json({ message: "Error al actualizar los datos." });
    }
};

/**
 * ✅ 6. ELIMINAR HABITACIÓN
 */
export const deleteHabitacion = async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await habitacionesModel.deleteHabitacion(id);
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ message: "La habitación no existe." });
        }
        res.status(200).json({ message: "Habitación eliminada satisfactoriamente." });
    } catch (error) {
        console.error("❌ Error en deleteHabitacion [Controller]:", error.message);
        res.status(500).json({ message: "Error al eliminar el registro." });
    }
};