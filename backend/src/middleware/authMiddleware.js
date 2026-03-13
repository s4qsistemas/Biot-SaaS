const { verifyToken } = require('../utils/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyToken(token);

        const user = await prisma.usuario.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, rol: true, nombre: true, tenant_id: true }
        });

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        // 👑 LLAVE MAESTRA: El SuperAdmin es inmune a las restricciones de rol
        if (req.user.rol === 'super_admin') {
            return next();
        }

        // Para los demás, validamos si su rol está en el arreglo de permisos
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ message: 'Prohibido: No tienes los permisos necesarios' });
        }

        next();
    };
};

module.exports = {
    authenticate,
    authorize
};