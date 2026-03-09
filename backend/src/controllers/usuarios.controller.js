const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { hashPassword } = require('../utils/auth'); // Tu encriptador
const { ROLES } = require('../config/permissions'); // Tu diccionario de roles

// ==========================================
// 🏢 FLUJO 1: SUPER ADMIN CREA CLIENTE (EMPRESA + ADMIN)
// ==========================================
const registrarEmpresaYAdmin = async (req, res) => {
    try {
        const { nombre_empresa, rut_empresa, alias, nombre_admin, email_admin, password_admin } = req.body;

        // 1. Encriptar la contraseña del nuevo cliente
        const hashedPassword = await hashPassword(password_admin);

        // 2. Transacción: Creamos la Empresa y su Usuario Admin amarrado
        const resultado = await prisma.$transaction(async (tx) => {
            
            // A. Nace el Tenant (Empresa)
            const nuevaEmpresa = await tx.empresas.create({
                data: {
                    nombre: nombre_empresa,
                    rut: rut_empresa,
                    alias: alias
                }
            });

            // B. Nace el Admin inyectándole el ID del Tenant recién creado
            const nuevoAdmin = await tx.usuarios.create({
                data: {
                    tenant_id: nuevaEmpresa.id,
                    nombre: nombre_admin,
                    email: email_admin,
                    password: hashedPassword,
                    rol: ROLES.ADMIN // Rol fijado por arquitectura
                }
            });

            return { empresa: nuevaEmpresa, admin: { email: nuevoAdmin.email, id: nuevoAdmin.id } };
        });

        res.status(201).json({ message: 'Maestranza dada de alta con éxito en el SaaS', data: resultado });

    } catch (error) {
        console.error("Error al registrar empresa:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ message: "El email del admin o el alias ya están en uso." });
        }
        res.status(500).json({ message: "Error interno al crear el cliente." });
    }
};

// ==========================================
// 👷‍♂️ FLUJO 2: ADMIN CREA A SU PERSONAL (EMPLEADOS)
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
        const nuevoEmpleado = await prisma.usuarios.create({
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
    registrarEmpresaYAdmin,
    registrarEmpleado
};