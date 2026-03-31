import * as tiposHabitacionModel from '../models/tipos-habitacion-model.js';

/**
 * ✅ READ ALL
 * Obtiene todos los tipos de habitación registrados.
 */
export const getAllTiposHabitacion = async (req, res) => {
  try {
    const tipos = await tiposHabitacionModel.getAllTiposHabitacion();
    res.status(200).json(tipos);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: 'No se pudo cargar la lista de tipos de habitación.',
      error: error.message
    });
  }
};

/**
 * ✅ READ ONE
 * Busca un tipo de habitación específico por su ID.
 */
export const getTipoHabitacionById = async (req, res) => {
  const { id } = req.params;
  try {
    const tipo = await tiposHabitacionModel.getTipoHabitacionById(id);
    if (!tipo) {
      return res.status(404).json({
        status: "error",
        message: `El tipo de habitación con ID ${id} no fue encontrado.`
      });
    }
    res.status(200).json(tipo);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: 'Error al consultar los detalles de la habitación.',
      error: error.message
    });
  }
};

/**
 * ✅ CREATE
 * Registra un nuevo tipo de habitación validando duplicidad de nombres de variables.
 */
export const crearTipoHabitacion = async (req, res) => {
  const {
    nombre_tipo, nombreTipo, 
    descripcion, descripcionTipo,
    capacidad_maxima, capacidadMaxima, 
    precio_noche, precioNoche
  } = req.body;

  // Mapeo flexible para soportar ambos estilos de nomenclatura
  const nombreFinal = nombre_tipo || nombreTipo;
  const descripcionFinal = descripcion || descripcionTipo || "";
  const capacidadFinal = capacidad_maxima ?? capacidadMaxima;
  const precioFinal = precio_noche ?? precioNoche;

  // Validación de campos obligatorios
  if (!nombreFinal || capacidadFinal === undefined || !precioFinal) {
    return res.status(400).json({
      status: "error",
      message: "Faltan datos obligatorios (Nombre, Capacidad o Precio) para el registro."
    });
  }

  try {
    const nuevoTipo = await tiposHabitacionModel.crearTipoHabitacion({
      nombre_tipo: nombreFinal,
      descripcion: descripcionFinal,
      capacidad_maxima: capacidadFinal,
      precio_noche: precioFinal
    });

    res.status(201).json({
      status: "success",
      message: "¡Nuevo tipo de habitación registrado exitosamente!",
      data: nuevoTipo
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "No se pudo crear el registro en el sistema.",
      error: error.message
    });
  }
};

/**
 * ✅ UPDATE
 * Actualiza un registro existente mapeando las variables del Frontend a la Base de Datos.
 */
export const updateTipoHabitacion = async (req, res) => {
  const { id } = req.params;
  const { 
    nombre_tipo, nombreTipo, 
    descripcion, 
    capacidad_maxima, capacidadMaxima, 
    precio_noche, precioNoche 
  } = req.body;

  try {
    // 1. Verificar si el registro existe antes de intentar actualizar
    const existe = await tiposHabitacionModel.getTipoHabitacionById(id);
    if (!existe) {
      return res.status(404).json({
        status: "error",
        message: "El tipo de habitación que intentas editar ya no existe."
      });
    }

    // 2. Mapear datos recibidos a los nombres de columnas de MySQL
    const updateData = {
      nombre_tipo: nombre_tipo || nombreTipo,
      descripcion: descripcion,
      capacidad_maxima: capacidad_maxima ?? capacidadMaxima,
      precio_noche: precio_noche ?? precioNoche
    };

    // 3. Limpiar valores undefined para no sobreescribir con nulos accidentalmente
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const result = await tiposHabitacionModel.updateTipoHabitacion(id, updateData);

    // 4. Respuesta basada en si hubo cambios reales o no
    if (result && result.affectedRows > 0) {
      res.status(200).json({
        status: "success",
        message: '¡Datos actualizados correctamente!',
        id_tipo_habitacion: id
      });
    } else {
      res.status(200).json({
        status: "info",
        message: "No se detectaron cambios nuevos para guardar.",
        id_tipo_habitacion: id
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: 'Error interno al intentar actualizar el registro.',
      error: error.message
    });
  }
};

/**
 * ✅ DELETE
 * Elimina un tipo de habitación. Maneja errores de integridad referencial.
 */
export const deleteTipoHabitacion = async (req, res) => {
  const { id } = req.params;
  try {
    const existe = await tiposHabitacionModel.getTipoHabitacionById(id);
    if (!existe) {
      return res.status(404).json({
        status: "error",
        message: "El registro ya ha sido eliminado o no existe."
      });
    }

    const result = await tiposHabitacionModel.deleteTipoHabitacion(id);

    if (result && result.affectedRows > 0) {
      res.status(200).json({
        status: "success",
        message: 'El tipo de habitación ha sido borrado del sistema.',
        id_tipo_habitacion: id
      });
    } else {
      res.status(400).json({
        status: "error",
        message: "No se pudo completar la eliminación."
      });
    }
  } catch (error) {
    // Error común: La FK está siendo usada en la tabla 'habitaciones'
    res.status(500).json({
      status: "error",
      message: 'No se puede eliminar: este tipo de habitación está asignado a habitaciones existentes.',
      error: error.message
    });
  }
};