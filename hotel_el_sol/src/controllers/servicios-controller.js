import * as serviciosModel from '../models/servicios-model.js';

/**
 * ✅ OBTENER TODOS LOS SERVICIOS (Read All)
 * Provee la lista para la tabla del frontend.
 */
export const getServicios = async (req, res) => {
  try {
    const servicios = await serviciosModel.getAllServicios();
    res.status(200).json(servicios);
  } catch (error) {
    console.error("❌ Error en getServicios:", error);
    res.status(500).json({
      status: "error",
      message: 'Error al obtener el catálogo de servicios.',
      error: error.message
    });
  }
};

/**
 * ✅ OBTENER SERVICIO POR ID (Read One)
 * Nombre corregido para evitar el SyntaxError en las rutas.
 */
export const getServicioById = async (req, res) => {
  const { id } = req.params;
  try {
    const servicio = await serviciosModel.getServicioById(id);
    if (!servicio) {
      return res.status(404).json({
        status: "error",
        message: `Servicio con ID ${id} no encontrado.`
      });
    }
    res.status(200).json(servicio);
  } catch (error) {
    console.error(`❌ Error en getServicioById (${id}):`, error);
    res.status(500).json({
      status: "error",
      message: 'Error interno al consultar el servicio.',
      error: error.message
    });
  }
};

/**
 * ✅ CREAR SERVICIO (Create)
 * Normaliza 'nombreServicio' del frontend a 'nombre_servicio' de la BD.
 */
export const createServicio = async (req, res) => {
  const { nombreServicio, nombre_servicio, descripcion, precio } = req.body;
  
  // Mapeo flexible para asegurar compatibilidad
  const nombreFinal = nombre_servicio || nombreServicio;

  if (!nombreFinal || precio === undefined) {
    return res.status(400).json({
      status: "error",
      message: "El nombre del servicio y el precio son campos obligatorios."
    });
  }

  try {
    const nuevo = await serviciosModel.createServicio({
      nombre_servicio: nombreFinal,
      descripcion: descripcion || "",
      precio: Number(precio)
    });

    res.status(201).json({
      status: "success",
      message: "¡Servicio creado exitosamente!",
      data: nuevo
    });
  } catch (error) {
    console.error("❌ Error en createServicio:", error);
    res.status(500).json({
      status: "error",
      message: 'Error al registrar el servicio.',
      error: error.message
    });
  }
};

/**
 * ✅ ACTUALIZAR SERVICIO (Update)
 */
export const updateServicio = async (req, res) => {
  const { id } = req.params;
  const { nombreServicio, nombre_servicio, descripcion, precio } = req.body;

  try {
    // 1. Verificar existencia
    const existe = await serviciosModel.getServicioById(id);
    if (!existe) {
      return res.status(404).json({
        status: "error",
        message: "El servicio que intenta actualizar no existe."
      });
    }

    // 2. Preparar datos (mapeo dinámico)
    const updateData = {
      nombre_servicio: nombre_servicio || nombreServicio,
      descripcion,
      precio: precio !== undefined ? Number(precio) : undefined
    };

    // Limpiar campos undefined para no sobreescribir con nulos
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const result = await serviciosModel.updateServicio(id, updateData);

    if (result && result.affectedRows > 0) {
      res.status(200).json({
        status: "success",
        message: '¡Servicio actualizado correctamente!',
        id_servicio: id
      });
    } else {
      res.status(200).json({
        status: "info",
        message: "No se realizaron cambios en los datos.",
        id_servicio: id
      });
    }
  } catch (error) {
    console.error(`❌ Error en updateServicio (${id}):`, error);
    res.status(500).json({
      status: "error",
      message: 'Error al intentar actualizar el servicio.',
      error: error.message
    });
  }
};

/**
 * ✅ ELIMINAR SERVICIO (Delete)
 */
export const deleteServicio = async (req, res) => {
  const { id } = req.params;

  try {
    const existe = await serviciosModel.getServicioById(id);
    if (!existe) {
      return res.status(404).json({
        status: "error",
        message: "El servicio ya ha sido eliminado o no existe."
      });
    }

    const result = await serviciosModel.deleteServicio(id);

    if (result && result.affectedRows > 0) {
      res.status(200).json({
        status: "success",
        message: 'Servicio eliminado correctamente.',
        id_servicio: id
      });
    } else {
      res.status(400).json({
        status: "error",
        message: "No se pudo completar la eliminación."
      });
    }
  } catch (error) {
    console.error(`❌ Error en deleteServicio (${id}):`, error);
    res.status(500).json({
      status: "error",
      message: 'No se puede eliminar: el servicio podría estar vinculado a una reserva.',
      error: error.message
    });
  }
};