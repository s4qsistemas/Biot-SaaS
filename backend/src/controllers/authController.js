const { PrismaClient } = require('@prisma/client');
const { comparePassword, generateToken } = require('../utils/auth');

const prisma = new PrismaClient();

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Buscamos al usuario INCLUYENDO a su Empresa y el Plan de esa empresa
        const user = await prisma.usuarios.findUnique({
            where: { email: email },
            include: {
                empresas: {
                    include: {
                        planes: true
                    }
                }
            }
        });

        // 🔒 CANDADO 1: ¿Existe el usuario y está activo? (Evita ex-empleados)
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
            
            // 🔒 CANDADO 2: ¿La maestranza (tenant) está activa? (El botón de apagado del SaaS)
            if (!user.empresas || !user.empresas.activo) {
                return res.status(403).json({ message: 'El acceso para esta empresa ha sido suspendido. Contacte a soporte.' });
            }

            // 🔒 CANDADO 3: ¿Tienen un plan asignado y activo? (Validación comercial)
            if (!user.empresas.planes || !user.empresas.planes.activo) {
                return res.status(403).json({ message: 'No hay un plan activo asociado a esta empresa. Regularice su suscripción.' });
            }
        }

        // Si pasa todos los candados, generamos el pasaporte (Token)
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
                // Le mandamos al frontend la info de la empresa por si queremos mostrar el nombre en el Navbar
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
        // Aprovechamos de traer la info de la empresa y el plan al recargar la página (F5)
        const userFull = await prisma.usuarios.findUnique({
            where: { id: req.user.id },
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
            empresa: {
                nombre: userFull.empresas?.nombre,
                plan: userFull.empresas?.planes?.nombre || 'Sin Plan'
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener perfil' });
    }
};

module.exports = {
    login,
    getMe
};