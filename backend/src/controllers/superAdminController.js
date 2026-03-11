const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { validateRut, formatRutForDB } = require('../utils/rut');

const prisma = new PrismaClient();

const crearMaestranza = async (req, res) => {
    try {
        const { nombre_empresa, rut_empresa, alias, nombre_admin, email_admin, password_admin, plan_id } = req.body;

        if (!nombre_empresa || !rut_empresa || !alias || !email_admin || !plan_id) {
            return res.status(400).json({ message: 'Faltan campos obligatorios.' });
        }

        // 🛡️ 1. VALIDAR RUT ESTRICTO
        if (!validateRut(rut_empresa)) {
            return res.status(400).json({ message: 'El RUT proporcionado es inválido o corrupto.' });
        }

        // 🛡️ 2. FORMATEAR RUT PARA LA BASE DE DATOS (ej: 12345678-K)
        const rutFormateado = formatRutForDB(rut_empresa);

        // 🛡️ 3. REVISAR DUPLICIDAD DE RUT EN LA BASE DE DATOS
        const existeRut = await prisma.empresas.findUnique({ where: { rut: rutFormateado } });
        if (existeRut) return res.status(400).json({ message: 'Este RUT ya está registrado como empresa en la plataforma.' });

        // Revisar Alias y Correo...
        const existeAlias = await prisma.empresas.findUnique({ where: { alias } });
        if (existeAlias) return res.status(400).json({ message: 'El alias ya está en uso.' });

        const existeEmail = await prisma.usuarios.findUnique({ where: { email: email_admin } });
        if (existeEmail) return res.status(400).json({ message: 'Correo ya registrado.' });

        // 👇 GENERACIÓN AUTOMÁTICA DE CLAVE
        const passwordFinal = process.env.DEFAULT_PASSWORD || 'BiotSaaS2026*';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passwordFinal, salt);
        const debeCambiar = true;

        // ⏱️ LÓGICA DE VENCIMIENTO
        let fechaVencimiento = new Date();
        if (parseInt(plan_id) === 4) {
            // Si es Trial (ID 4), damos 14 días
            fechaVencimiento.setDate(fechaVencimiento.getDate() + 14);
        } else {
            // Si nace con un plan de pago, damos 30 días de vigencia inicial
            fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
        }

        // Transacción...
        const nuevaMaestranza = await prisma.$transaction(async (tx) => {
            const empresa = await tx.empresas.create({
                data: {
                    nombre: nombre_empresa,
                    rut: rutFormateado,
                    alias: alias,
                    activo: true,
                    plan_id: parseInt(plan_id),
                    fecha_vencimiento: fechaVencimiento // 👈 AHORA SÍ SE GUARDA LA FECHA
                }
            });

            const admin = await tx.usuarios.create({
                data: {
                    tenant_id: empresa.id,
                    nombre: nombre_admin,
                    email: email_admin,
                    password: hashedPassword,
                    rol: 'admin',
                    activo: true,
                    debe_cambiar_password: debeCambiar
                }
            });

            return { empresa, admin };
        });

        res.status(201).json({ ok: true, message: 'Maestranza creada con éxito' });

    } catch (error) {
        console.error('Error al crear maestranza:', error);
        res.status(500).json({ message: 'Error interno' });
    }
};

const obtenerMaestranzas = async (req, res) => {
    try {
        const empresas = await prisma.empresas.findMany({
            where: { rut: { not: '99999999-9' } },
            include: {
                usuarios: { where: { rol: { in: ['admin', 'super_admin'] } }, take: 1 },
                planes: true
            },
            orderBy: { created_at: 'desc' }
        });

        const data = empresas.map(emp => {
            // ⏱️ CÁLCULO DE DÍAS RESTANTES
            let dias_restantes = null;
            if (emp.fecha_vencimiento) {
                const hoy = new Date();
                const vencimiento = new Date(emp.fecha_vencimiento);
                const diferenciaMs = vencimiento - hoy;
                dias_restantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
            }

            return {
                id: emp.id,
                nombre: emp.nombre,
                rut: emp.rut || '',
                alias: emp.alias,
                estado: emp.activo ? 'activa' : 'suspendida',
                plan_id: emp.plan_id || '',
                plan_nombre: emp.planes?.nombre || 'Sin Plan',
                fecha_vencimiento: emp.fecha_vencimiento,
                dias_restantes: dias_restantes, // 👈 Se envía a React
                admin_id: emp.usuarios[0]?.id || null,
                admin_nombre: emp.usuarios[0]?.nombre || '',
                admin_email: emp.usuarios[0]?.email || ''
            };
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener empresas' });
    }
};

// ==========================================
// MÓDULO DE PLANES SAAS
// ==========================================

const obtenerPlanes = async (req, res) => {
    try {
        const planes = await prisma.planes.findMany({
            orderBy: { precio_mensual: 'asc' }
        });
        res.json(planes);
    } catch (error) {
        console.error('Error al obtener planes:', error);
        res.status(500).json({ message: 'Error al cargar los planes' });
    }
};

const crearPlan = async (req, res) => {
    try {
        const { nombre, limite_usuarios, precio_mensual } = req.body;
        if (!nombre || limite_usuarios == null || precio_mensual == null) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }

        const nuevoPlan = await prisma.planes.create({
            data: {
                nombre,
                limite_usuarios: parseInt(limite_usuarios),
                precio_mensual: parseFloat(precio_mensual),
                activo: true
            }
        });
        res.status(201).json({ ok: true, data: nuevoPlan });
    } catch (error) {
        console.error('Error al crear plan:', error);
        res.status(500).json({ message: 'Error interno al crear el plan' });
    }
};

const editarPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, limite_usuarios, precio_mensual, activo } = req.body;

        const planActualizado = await prisma.planes.update({
            where: { id: parseInt(id) },
            data: {
                nombre,
                limite_usuarios: parseInt(limite_usuarios),
                precio_mensual: parseFloat(precio_mensual),
                activo: activo === 'true' || activo === true
            }
        });
        res.json({ ok: true, data: planActualizado });
    } catch (error) {
        console.error('Error al editar plan:', error);
        res.status(500).json({ message: 'Error al actualizar el plan' });
    }
};

const cambiarPlanEmpresa = async (req, res) => {
    try {
        const { id } = req.params;
        const { nuevo_plan_id, justificacion } = req.body;
        const adminId = req.user.id; // Requiere que tu middleware inyecte req.user

        if (!justificacion || justificacion.trim().length < 10) {
            return res.status(400).json({ message: 'Debe ingresar una justificación válida (mín. 10 caracteres).' });
        }

        // 🛡️ REGLA DE ORO: Jamás permitir downgrade a Trial (ID 4)
        if (parseInt(nuevo_plan_id) === 4) {
            return res.status(403).json({ message: 'Operación denegada. No está permitido asignar el Plan Trial a una empresa existente.' });
        }

        const empresaActual = await prisma.empresas.findUnique({
            where: { id: parseInt(id) },
            include: { planes: true }
        });

        const nuevoPlanInfo = await prisma.planes.findUnique({ where: { id: parseInt(nuevo_plan_id) } });

        // Calculamos 30 días de vigencia para el nuevo plan de pago
        const nuevaFechaVencimiento = new Date();
        nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + 30);

        await prisma.$transaction(async (tx) => {
            // 1. Cambiamos el plan (y limpiamos fecha_vencimiento asumiendo suscripción indefinida, o le sumas 30 días si es prepago)
            await tx.empresas.update({
                where: { id: parseInt(id) },
                data: {
                    plan_id: parseInt(nuevo_plan_id),
                    fecha_vencimiento: nuevaFechaVencimiento
                }
            });

            // 2. Dejamos el registro inmutable en Auditoría
            await tx.auditoria_empresas.create({
                data: {
                    empresa_id: parseInt(id),
                    tipo_evento: 'CAMBIO_PLAN',
                    valor_anterior: empresaActual.planes?.nombre || 'Sin Plan',
                    valor_nuevo: nuevoPlanInfo.nombre,
                    justificacion: justificacion,
                    modificado_por_id: adminId
                }
            });
        });

        res.json({ ok: true, message: 'Plan actualizado y auditado correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno al cambiar el plan.' });
    }
};

// ==========================================
// FUNCIONES ATÓMICAS DE EDICIÓN
// ==========================================

const editarDatosEmpresa = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_empresa, alias } = req.body;

        const existeAlias = await prisma.empresas.findFirst({
            where: { alias, NOT: { id: parseInt(id) } }
        });
        if (existeAlias) return res.status(400).json({ message: 'El alias ya está en uso por otra empresa.' });

        await prisma.empresas.update({
            where: { id: parseInt(id) },
            data: { nombre: nombre_empresa, alias: alias }
        });

        res.json({ ok: true, message: 'Datos básicos de la empresa actualizados.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar datos de la empresa.' });
    }
};

const editarAdminEmpresa = async (req, res) => {
    try {
        const { id } = req.params; // ID de la empresa (lo recibimos pero actualizamos al admin)
        const { admin_id, nombre_admin, email_admin, reset_password } = req.body;

        if (!admin_id) return res.status(400).json({ message: 'ID de administrador no proporcionado.' });

        const adminData = { nombre: nombre_admin, email: email_admin };

        // 🛑 EL RESET DE CLAVE
        if (reset_password === true || reset_password === 'true') {
            const passwordFinal = process.env.DEFAULT_PASSWORD || 'BiotSaaS2026*';
            const salt = await bcrypt.genSalt(10);
            adminData.password = await bcrypt.hash(passwordFinal, salt);
            adminData.debe_cambiar_password = true;
        }

        await prisma.usuarios.update({
            where: { id: parseInt(admin_id) },
            data: adminData
        });

        res.json({ ok: true, message: 'Datos del administrador actualizados.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar el administrador.' });
    }
};

const cambiarEstadoEmpresa = async (req, res) => {
    try {
        const { id } = req.params;
        const { activo, justificacion } = req.body;
        const adminId = req.user.id; // Requiere JWT middleware

        if (!justificacion || justificacion.trim().length < 10) {
            return res.status(400).json({ message: 'Debe ingresar una justificación válida (mín. 10 caracteres).' });
        }

        const empresaActual = await prisma.empresas.findUnique({ where: { id: parseInt(id) } });
        const nuevoEstado = activo === true || activo === 'true';

        if (empresaActual.activo === nuevoEstado) {
            return res.status(400).json({ message: 'La empresa ya se encuentra en ese estado.' });
        }

        await prisma.$transaction(async (tx) => {
            await tx.empresas.update({
                where: { id: parseInt(id) },
                data: { activo: nuevoEstado }
            });

            await tx.auditoria_empresas.create({
                data: {
                    empresa_id: parseInt(id),
                    tipo_evento: 'CAMBIO_ESTADO',
                    valor_anterior: empresaActual.activo ? 'Activa' : 'Suspendida',
                    valor_nuevo: nuevoEstado ? 'Activa' : 'Suspendida',
                    justificacion: justificacion,
                    modificado_por_id: adminId
                }
            });
        });

        res.json({ ok: true, message: `Empresa ${nuevoEstado ? 'activada' : 'suspendida'} correctamente.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cambiar el estado de la empresa.' });
    }
};

const obtenerHistorialEmpresa = async (req, res) => {
    try {
        const { id } = req.params;
        const historial = await prisma.auditoria_empresas.findMany({
            where: { empresa_id: parseInt(id) },
            include: {
                usuarios: { select: { nombre: true, email: true } } // Traemos quién hizo el cambio
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(historial);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el historial de auditoría.' });
    }
};

module.exports = { crearMaestranza, obtenerMaestranzas, obtenerPlanes, crearPlan, editarPlan, cambiarPlanEmpresa, editarDatosEmpresa, editarAdminEmpresa, cambiarEstadoEmpresa, obtenerHistorialEmpresa };