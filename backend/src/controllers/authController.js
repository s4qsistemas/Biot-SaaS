const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { comparePassword, generateToken } = require('../utils/auth');

const prisma = new PrismaClient();

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.usuarios.findUnique({
            where: { email: email },
            include: {
                empresas: {
                    include: { planes: true }
                }
            }
        });

        // 🔒 CANDADO 1: ¿Existe el usuario y está activo?
        if (!user || !user.activo) {
            return res.status(401).json({ message: 'Credenciales inválidas o cuenta de usuario desactivada.' });
        }

        // 🔑 Validar contraseña
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 🛡️ EXCEPCIÓN ARQUITECTÓNICA: El Super Admin siempre puede entrar
        if (user.rol !== 'super_admin') {

            // 🔒 CANDADO 2: ¿La maestranza está activa?
            if (!user.empresas || !user.empresas.activo) {
                return res.status(403).json({ message: 'El acceso para esta empresa ha sido suspendido. Contacte a soporte.' });
            }

            // 🔒 CANDADO 3 CORREGIDO: Solo validamos que TENGA un plan (ignorar si el plan se vende o no)
            if (!user.empresas.planes) {
                return res.status(403).json({ message: 'No hay un plan asociado a esta empresa. Regularice su suscripción.' });
            }
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
                tenant_id: user.tenant_id,
                debe_cambiar_password: user.debe_cambiar_password, // 👈 INYECTADO PARA LA JAULA
                fecha_vencimiento: user.empresas?.fecha_vencimiento, // 👈 INYECTADO PARA EL BANNER
                empresa: {
                    nombre: user.empresas?.nombre,
                    plan: user.empresas?.planes?.nombre || 'Sin Plan'
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error interno en el servidor.' });
    }
};

const getMe = async (req, res) => {
    try {
        const userFull = await prisma.usuarios.findUnique({
            where: { id: req.user.id }, // Ojo: Verifica que tu middleware setea req.user (o req.usuario)
            include: {
                empresas: { include: { planes: true } }
            }
        });

        res.json({
            id: userFull.id,
            nombre: userFull.nombre,
            email: userFull.email,
            rol: userFull.rol,
            tenant_id: userFull.tenant_id,
            debe_cambiar_password: userFull.debe_cambiar_password, // 👈 INYECTADO
            fecha_vencimiento: userFull.empresas?.fecha_vencimiento, // 👈 INYECTADO
            empresa: {
                nombre: userFull.empresas?.nombre,
                plan: userFull.empresas?.planes?.nombre || 'Sin Plan'
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener perfil' });
    }
};

// 🛡️ NUEVO: FUNCIÓN PARA SALIR DE LA JAULA
const cambiarClaveObligatoria = async (req, res) => {
    try {
        // Asumiendo que tu middleware de JWT guarda los datos en req.user
        const usuarioId = req.user.id;
        const { nueva_password } = req.body;

        if (!nueva_password || nueva_password.length < 6) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nueva_password, salt);

        await prisma.usuarios.update({
            where: { id: usuarioId },
            data: {
                password: hashedPassword,
                debe_cambiar_password: false // 👈 Lo liberamos
            }
        });

        res.json({ ok: true, message: 'Contraseña actualizada correctamente.' });
    } catch (error) {
        console.error('Error al cambiar clave:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

module.exports = {
    login,
    getMe,
    cambiarClaveObligatoria
};