import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
    // Leer el token del encabezado Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: "No se proporcionó un token de acceso" });
    }

    try {
        // Verificar que el token sea auténtico y no haya expirado
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hotel_sol_secret_2026');
        req.user = decoded; // Guardamos los datos del usuario en la petición
        next(); // Continuar a la siguiente función
    } catch (error) {
        return res.status(401).json({ message: "Token inválido o sesión expirada" });
    }
};

export default authMiddleware;