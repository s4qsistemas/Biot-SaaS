const { PrismaClient } = require('@prisma/client');
const { comparePassword, generateToken } = require('../utils/auth');

const prisma = new PrismaClient();

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.usuarios.findUnique({
            where: { email: email }
        });

        if (!user || !user.activo) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = generateToken({
            id: user.id,
            rol: user.rol,
            nombre: user.nombre,
            tenant_id: user.tenant_id 
        });

        res.json({
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
                tenant_id: user.tenant_id
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

const getMe = async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener perfil' });
    }
};

module.exports = {
    login,
    getMe
};