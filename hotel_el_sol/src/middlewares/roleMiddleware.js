import jwt from 'jsonwebtoken';

/**
 * ✅ MIDDLEWARE DE AUTENTICACIÓN BÁSICA
 * Verifica que el usuario tenga un token válido
 */
export const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: "No se proporcionó un token de acceso" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hotel_sol_secret_2026');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token inválido o sesión expirada" });
    }
};

/**
 * ✅ MIDDLEWARE DE AUTORIZACIÓN - SOLO ADMIN
 * Verifica que el usuario sea administrador
 */
export const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(403).json({ message: "No autenticado" });
    }

    if (req.user.rol !== 'administrador') {
        return res.status(403).json({ 
            message: "Acceso denegado: Solo administradores pueden realizar esta acción" 
        });
    }

    next();
};

/**
 * ✅ MIDDLEWARE DE AUTORIZACIÓN - ADMIN O MODERADOR
 * Verifica que el usuario sea administrador o moderador
 */
export const requireAdminOrModerator = (req, res, next) => {
    if (!req.user) {
        return res.status(403).json({ message: "No autenticado" });
    }

    const allowedRoles = ['administrador', 'moderador'];
    
    if (!allowedRoles.includes(req.user.rol)) {
        return res.status(403).json({ 
            message: "Acceso denegado: Solo administradores y moderadores pueden realizar esta acción" 
        });
    }

    next();
};

/**
 * ✅ MIDDLEWARE DE AUTORIZACIÓN - CLIENTE O SUPERIOR
 * El cliente puede ver solo sus propios datos
 * Admin y moderador pueden ver todos los datos
 */
export const requireClientOrHigher = (req, res, next) => {
    if (!req.user) {
        return res.status(403).json({ message: "No autenticado" });
    }

    const adminRoles = ['administrador', 'moderador'];
    const isAdmin = adminRoles.includes(req.user.rol);
    
    // Si es cliente, lo dejamos pasar (se validará en el controlador que solo vea sus datos)
    // Si es admin/moderador, también lo dejamos pasar
    if (req.user.rol === 'cliente' || isAdmin) {
        next();
    } else {
        return res.status(403).json({ 
            message: "Acceso denegado: Usuario no autorizado" 
        });
    }
};

export default { authenticate, requireAdmin, requireAdminOrModerator, requireClientOrHigher };
