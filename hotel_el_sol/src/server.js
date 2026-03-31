import dotenv from 'dotenv';
dotenv.config(); // PRIMERA LÍNEA SIEMPRE

import express from 'express';
import cors from 'cors';

// Importar todas las rutas
import authRoutes from './routes/auth-routes.js';
import usuariosRoutes from './routes/usuarios-routes.js';
import habitacionesRoutes from './routes/habitaciones-routes.js';
import reservasRoutes from './routes/reservas-routes.js';
import serviciosRoutes from './routes/servicios-routes.js';
import tiposHabitacionRoutes from './routes/tipos-habitacion-routes.js';
import reservaServiciosRoutes from './routes/reserva-servicios-routes.js';
import facturacionRoutes from './routes/facturacion-routes.js';

// Importar middleware
import { authMiddleware } from './middlewares/authMiddleware.js';
import { authenticate, requireAdminOrModerator } from './middlewares/roleMiddleware.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARES GLOBALES
// ============================================================
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001', 
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// RUTAS PÚBLICAS (Sin autenticación)
// ============================================================
app.use('/api/auth', authRoutes);

// ============================================================
// RUTAS PRIVADAS (Requieren autenticación)
// ============================================================
app.use('/api/usuarios', authenticate, usuariosRoutes);
app.use('/api/habitaciones', authenticate, habitacionesRoutes);
app.use('/api/reservas', authenticate, reservasRoutes);
app.use('/api/servicios', authenticate, serviciosRoutes);
app.use('/api/tipos-habitacion', authenticate, tiposHabitacionRoutes);
app.use('/api/reserva-servicios', authenticate, reservaServiciosRoutes);
app.use('/api/facturacion', authenticate, facturacionRoutes);

// ============================================================
// RUTA DE PRUEBA (Health Check)
// ============================================================
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'Servidor activo - Hotel El Sol',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================================================
// MANEJO DE ERRORES 404
// ============================================================
app.use((req, res) => {
  res.status(404).json({ 
    message: "Ruta no encontrada",
    path: req.path,
    method: req.method
  });
});

// ============================================================
// MANEJO GLOBAL DE ERRORES
// ============================================================
app.use((err, req, res, next) => {
  console.error('❌ Error global:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL base: http://localhost:${PORT}`);
  console.log('✅ Presiona Ctrl+C para detener el servidor\n');
});

export default app;