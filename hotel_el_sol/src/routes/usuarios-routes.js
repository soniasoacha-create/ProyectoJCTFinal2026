/**
 * ============================================================
 * MÓDULO DE RUTAS: USUARIOS - HOTEL EL SOL
 * ------------------------------------------------------------
 * Este archivo actúa como el "enrutador" que dirige las 
 * peticiones HTTP provenientes del Frontend (React) hacia
 * la lógica de negocio en el Controlador.
 * ============================================================
 */

import { Router } from 'express';
import { requireAdminOrModerator, requireClientOrHigher } from '../middlewares/roleMiddleware.js';

import {
  listarUsuarios,    // GET  -> /api/usuarios
  crearUsuario,      // POST -> /api/usuarios
  getUsuarioById,    // GET  -> /api/usuarios/:id
  updateUsuario,     // PUT  -> /api/usuarios/:id
  deleteUsuario      // DELETE -> /api/usuarios/:id
} from '../controllers/usuarios-controller.js';

const router = Router();

/**
 * ✅ RUTA: LISTAR TODOS
 * Método: GET
 * Propósito: Recuperar la lista completa de usuarios para la tabla de UserList.js.
 */
router.get('/', requireAdminOrModerator, listarUsuarios);

/**
 * ✅ RUTA: OBTENER POR ID
 * Método: GET
 * Propósito: Consultar un usuario específico para cargar sus datos en el formulario de edición.
 */
router.get('/:id', requireClientOrHigher, getUsuarioById);

/**
 * ✅ RUTA: CREAR
 * Método: POST
 * Propósito: Recibir los datos del formulario de registro y persistirlos en la BD.
 * Dispara en el Frontend: Alerta de SweetAlert2 (Éxito/Error).
 */
router.post('/', requireAdminOrModerator, crearUsuario);

/**
 * ✅ RUTA: ACTUALIZAR
 * Método: PUT
 * Propósito: Modificar la información de un usuario existente mediante su ID.
 */
router.put('/:id', requireClientOrHigher, updateUsuario);

/**
 * ✅ RUTA: ELIMINAR
 * Método: DELETE
 * Propósito: Borrar un registro de la base de datos de forma permanente.
 */
router.delete('/:id', requireAdminOrModerator, deleteUsuario);

export default router;