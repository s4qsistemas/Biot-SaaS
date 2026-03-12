// middleware/checkPasswordChange.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const checkPasswordChange = async (req, res, next) => {
    try {
        // Asume que authenticate ya corrió y req.user existe
        const user = await prisma.usuario.findUnique({
            where: { id: req.user.id },
            select: { debe_cambiar_password: true }
        });

        if (user && user.debe_cambiar_password) {
            return res.status(403).json({
                message: 'Acceso denegado. Estás en la jaula: debes cambiar tu contraseña genérica.'
            });
        }

        next(); // Si no debe cambiar clave, pasa al controlador normal
    } catch (error) {
        res.status(500).json({ message: 'Error validando estado de la cuenta.' });
    }
};

module.exports = checkPasswordChange;
