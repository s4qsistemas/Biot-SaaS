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
        const { nombre, email, rol } = req.body;

        // 1. Validar que el Admin no intente crear a otro Admin o a un Super Admin (Escalamiento de privilegios)
        const rolesPermitidosParaCrear = [ROLES.GERENTE, ROLES.JEFE_TALLER, ROLES.ADMINISTRATIVO, ROLES.OPERARIO];

        if (!rolesPermitidosParaCrear.includes(rol)) {
            return res.status(403).json({ message: "No tiene permisos para crear usuarios con este nivel de acceso." });
        }

        // 2. Encriptar contraseña genérica
        const passwordGenerica = process.env.DEFAULT_PASSWORD || 'BiotSaaS2026*';
        const hashedPassword = await hashPassword(passwordGenerica);

        // 3. Crear empleado
        const nuevoEmpleado = await prisma.usuario.create({
            data: {
                tenant_id: tenant_id, // GATILLO: Amarrado a la maestranza del creador
                nombre: nombre,
                email: email,
                password: hashedPassword,
                rol: rol,
                debe_cambiar_password: true // Forzar cambio en primer login
            },
            // Excluimos la contraseña de la respuesta por seguridad
            select: { id: true, nombre: true, email: true, rol: true, activo: true }
        });

        res.status(201).json({ message: 'Empleado registrado con éxito', password_generica: passwordGenerica, data: nuevoEmpleado });

    } catch (error) {
        console.error("Error al registrar empleado:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ message: "Este correo electrónico ya está registrado en el sistema." });
        }
        res.status(500).json({ message: "Error interno al registrar el empleado." });
    }
};

// ==========================================
// 📋 FLUJO: LISTAR EQUIPO DEL TENANT
// ==========================================
const obtenerEquipo = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;

        const equipo = await prisma.usuario.findMany({
            where: {
                tenant_id: tenant_id,
            },
            select: {
                id: true,
                nombre: true,
                email: true,
                rol: true,
                activo: true,
                created_at: true
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        res.json(equipo);
    } catch (error) {
        console.error("Error al obtener equipo:", error);
        res.status(500).json({ message: "Error interno al obtener el equipo." });
    }
};

// ==========================================
// ✏️ FLUJO: EDITAR / SUSPENDER EMPLEADO
// ==========================================
const editarEmpleado = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;
        const { nombre, rol, activo, reset_password } = req.body;

        // 1. Validar que el empleado pertenece al mismo tenant
        const empleadoExistente = await prisma.usuario.findFirst({
            where: { id: parseInt(id), tenant_id: tenant_id }
        });

        if (!empleadoExistente) {
            return res.status(404).json({ message: 'Empleado no encontrado en esta maestranza.' });
        }

        // 2. Proteger escalamiento o modificación de Admin's o Super Admin's
        if (empleadoExistente.rol === ROLES.SUPER_ADMIN || empleadoExistente.rol === ROLES.ADMIN) {
            return res.status(403).json({ message: 'No se puede modificar o suspender a administradores de mayor nivel desde este módulo.' });
        }

        const rolesPermitidos = [ROLES.GERENTE, ROLES.JEFE_TALLER, ROLES.ADMINISTRATIVO, ROLES.OPERARIO];
        if (rol && !rolesPermitidos.includes(rol)) {
            return res.status(403).json({ message: 'Rol inválido o no permitido.' });
        }

        const dataUpdate = {};
        if (nombre !== undefined) dataUpdate.nombre = nombre;
        if (rol !== undefined) dataUpdate.rol = rol;
        if (activo !== undefined) dataUpdate.activo = activo;

        // 3. Reset de contraseña a la genérica
        if (reset_password === true || reset_password === 'true') {
            const passwordGenerica = process.env.DEFAULT_PASSWORD || 'BiotSaaS2026*';
            dataUpdate.password = await hashPassword(passwordGenerica);
            dataUpdate.debe_cambiar_password = true;
        }

        const empleadoEditado = await prisma.usuario.update({
            where: { id: parseInt(id) },
            data: dataUpdate,
            select: { id: true, nombre: true, email: true, rol: true, activo: true }
        });

        res.json({ message: 'Empleado actualizado con éxito.', data: empleadoEditado });

    } catch (error) {
        console.error("Error al editar empleado:", error);
        res.status(500).json({ message: "Error interno al actualizar el empleado." });
    }
};

module.exports = {
    registrarEmpleado,
    obtenerEquipo,
    editarEmpleado
};