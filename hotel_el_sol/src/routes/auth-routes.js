import { Router } from 'express';
// Importante: Agregar el .js al final y usar el nombre exacto de tu archivo
import * as authController from '../controllers/auth-controller.js';

const router = Router();

/**
 * RUTA: POST http://localhost:3000/api/auth/login
 * Esta ruta engrana con la lógica de validación de usuarios-model.js
 */
router.post('/login', authController.login);

/**
 * RUTA: POST http://localhost:3000/api/auth/register
 * Esta ruta maneja el registro de nuevos usuarios
 */
router.post('/register', authController.register);

// Exportación compatible con "type": "module"
export default router;