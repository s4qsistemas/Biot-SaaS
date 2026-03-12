const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { hashPassword } = require('../utils/auth');
const { ROLES } = require('../config/permissions');

// ==========================================
// 👷‍♂️ FLUJO: ADMIN CREA A SU PERSONAL (EMPLEADOS)
// ==========================================
const registrarEmpleado = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id; // INYECCIÓN SAAS: El creador define la jaula
        const { nombre, email, password, rol } = req.body;

        // 1. Validar que el Admin no intente crear a otro Admin o a un Super Admin (Escalamiento de privilegios)
        const rolesPermitidosParaCrear = [ROLES.GERENTE, ROLES.JEFE_TALLER, ROLES.ADMINISTRATIVO, ROLES.OPERARIO];

        if (!rolesPermitidosParaCrear.includes(rol)) {
            return res.status(403).json({ message: "No tiene permisos para crear usuarios con este nivel de acceso." });
        }

        // 2. Encriptar contraseña
        const hashedPassword = await hashPassword(password);

        // 3. Crear empleado
        const nuevoEmpleado = await prisma.usuario.create({
            data: {
                tenant_id: tenant_id, // GATILLO: Amarrado a la maestranza del creador
                nombre: nombre,
                email: email,
                password: hashedPassword,
                rol: rol
            },
            // Excluimos la contraseña de la respuesta por seguridad
            select: { id: true, nombre: true, email: true, rol: true, activo: true }
        });

        res.status(201).json({ message: 'Empleado registrado con éxito', data: nuevoEmpleado });

    } catch (error) {
        console.error("Error al registrar empleado:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ message: "Este correo electrónico ya está registrado en el sistema." });
        }
        res.status(500).json({ message: "Error interno al registrar el empleado." });
    }
};

module.exports = {
    registrarEmpleado
};