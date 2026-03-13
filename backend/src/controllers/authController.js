const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { comparePassword, generateToken } = require('../utils/auth');

const prisma = new PrismaClient();

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.usuario.findUnique({
            where: { email: email },
            include: { empresa: { include: { plan: true } } }
        });

        if (!user) return res.status(401).json({ message: 'Credenciales inválidas.' });

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Credenciales inválidas.' });

        // Credenciales correctas, ahora validamos estados
        if (!user.activo) return res.status(403).json({ message: 'Tu cuenta de usuario ha sido desactivada.' });

        if (user.rol !== 'super_admin') {
            if (!user.empresa || !user.empresa.activo) return res.status(403).json({ message: 'El acceso para esta empresa ha sido suspendido.' });
            if (!user.empresa.plan) return res.status(403).json({ message: 'No hay un plan asociado a esta empresa.' });
        }

        const token = generateToken({ id: user.id, rol: user.rol, nombre: user.nombre, tenant_id: user.tenant_id });

        res.json({
            token,
            user: {
                id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, tenant_id: user.tenant_id,
                debe_cambiar_password: user.debe_cambiar_password, fecha_vencimiento: user.empresa?.fecha_vencimiento,
                empresa: { nombre: user.empresa?.nombre, plan: user.empresa?.plan?.nombre || 'Sin Plan' }
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error interno en el servidor.' });
    }
};

const getMe = async (req, res) => {
    try {
        const userFull = await prisma.usuario.findUnique({
            where: { id: req.user.id },
            include: { empresa: { include: { plan: true } } }
        });

        res.json({
            id: userFull.id, nombre: userFull.nombre, email: userFull.email, rol: userFull.rol, tenant_id: userFull.tenant_id,
            debe_cambiar_password: userFull.debe_cambiar_password, fecha_vencimiento: userFull.empresa?.fecha_vencimiento,
            empresa: { nombre: userFull.empresa?.nombre, plan: userFull.empresa?.plan?.nombre || 'Sin Plan' }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener perfil' });
    }
};

const cambiarClaveObligatoria = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const { nueva_password } = req.body;

        if (!nueva_password || nueva_password.length < 6) return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nueva_password, salt);

        await prisma.usuario.update({
            where: { id: usuarioId },
            data: { password: hashedPassword, debe_cambiar_password: false }
        });

        res.json({ ok: true, message: 'Contraseña actualizada correctamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

module.exports = { login, getMe, cambiarClaveObligatoria };