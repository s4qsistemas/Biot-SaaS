const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { validateRut, formatRutForDB } = require('../utils/rut');
const { generateToken } = require('../utils/auth');

const prisma = new PrismaClient();

const crearMaestranza = async (req, res) => {
    try {
        const { nombre_empresa, rut_empresa, alias, nombre_admin, email_admin, password_admin, plan_id, giro, email_contacto, telefono } = req.body;

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
        const existeRut = await prisma.empresa.findUnique({ where: { rut: rutFormateado } });
        if (existeRut) return res.status(400).json({ message: 'Este RUT ya está registrado como empresa en la plataforma.' });

        // Revisar Alias y Correo...
        const existeAlias = await prisma.empresa.findUnique({ where: { alias } });
        if (existeAlias) return res.status(400).json({ message: 'El alias ya está en uso.' });

        const existeEmail = await prisma.usuario.findUnique({ where: { email: email_admin } });
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

        const planInfo = await prisma.plan.findUnique({ where: { id: parseInt(plan_id) } });

        // Transacción...
        const nuevaMaestranza = await prisma.$transaction(async (tx) => {
            const empresa = await tx.empresa.create({
                data: {
                    nombre: nombre_empresa,
                    rut: rutFormateado,
                    alias: alias,
                    giro: giro || null,
                    email_contacto: email_contacto || null,
                    telefono: telefono || null,
                    activo: true,
                    plan_id: parseInt(plan_id),
                    fecha_vencimiento: fechaVencimiento
                }
            });

            const admin = await tx.usuario.create({
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

            // 👇 NUEVO: Registro del Big Bang (Nacimiento de la empresa)
            await tx.auditoriaEmpresa.create({
                data: {
                    empresa_id: empresa.id,
                    tipo_evento: 'CAMBIO_PLAN',
                    valor_anterior: 'Nueva Maestranza',
                    valor_nuevo: planInfo.nombre,
                    justificacion: 'Asignación de plan inicial durante la creación de la cuenta.',
                    modificado_por_id: req.user.id // El SuperAdmin que está creando la cuenta
                }
            });

            return { empresa, admin };
        });

        res.status(201).json({ ok: true, message: 'Maestranza creada con éxito', password_generica: passwordFinal });

    } catch (error) {
        console.error('Error al crear maestranza:', error);
        res.status(500).json({ message: 'Error interno' });
    }
};

const obtenerMaestranzas = async (req, res) => {
    try {
        const empresas = await prisma.empresa.findMany({
            where: { rut: { not: '99999999-9' } },
            include: {
                usuarios: { where: { rol: { in: ['admin', 'super_admin'] } }, take: 1 }, // 👈 CORRECCIÓN A PLURAL
                plan: true
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
                plan_nombre: emp.plan?.nombre || 'Sin Plan',
                giro: emp.giro || '',
                email_contacto: emp.email_contacto || '',
                telefono: emp.telefono || '',
                fecha_vencimiento: emp.fecha_vencimiento,
                dias_restantes: dias_restantes,
                admin_id: emp.usuarios[0]?.id || null, // 👈 CORRECCIÓN A PLURAL
                admin_nombre: emp.usuarios[0]?.nombre || '', // 👈 CORRECCIÓN A PLURAL
                admin_email: emp.usuarios[0]?.email || '' // 👈 CORRECCIÓN A PLURAL
            };
        });
        res.json(data);
    } catch (error) {
        console.error('🔥 Error crítico en obtenerMaestranzas:', error); // 👈 OBSERVABILIDAD AÑADIDA
        res.status(500).json({ message: 'Error al obtener empresas' });
    }
};

// ==========================================
// MÓDULO DE PLANES SAAS
// ==========================================

const obtenerPlanes = async (req, res) => {
    try {
        const planes = await prisma.plan.findMany({
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

        const nuevoPlan = await prisma.plan.create({
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

        const planActualizado = await prisma.plan.update({
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

        const empresaActual = await prisma.empresa.findUnique({
            where: { id: parseInt(id) },
            include: { plan: true }
        });

        if (!empresaActual) {
            return res.status(404).json({ message: 'Empresa no encontrada.' });
        }
        if (!empresaActual.activo) {
            return res.status(403).json({ message: 'Operación denegada. No es posible modificar el plan de una empresa que se encuentra suspendida.' });
        }

        const nuevoPlanInfo = await prisma.plan.findUnique({ where: { id: parseInt(nuevo_plan_id) } });

        // Calculamos 30 días de vigencia para el nuevo plan de pago
        const nuevaFechaVencimiento = new Date();
        nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + 30);

        await prisma.$transaction(async (tx) => {
            // 1. Cambiamos el plan
            await tx.empresa.update({
                where: { id: parseInt(id) },
                data: {
                    plan_id: parseInt(nuevo_plan_id),
                    fecha_vencimiento: nuevaFechaVencimiento
                }
            });

            // 2. Dejamos el registro inmutable en Auditoría
            await tx.auditoriaEmpresa.create({
                data: {
                    empresa_id: parseInt(id),
                    tipo_evento: 'CAMBIO_PLAN',
                    valor_anterior: empresaActual.plan?.nombre || 'Sin Plan',
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
        const { nombre_empresa, alias, giro, email_contacto, telefono } = req.body;

        const existeAlias = await prisma.empresa.findFirst({
            where: { alias, NOT: { id: parseInt(id) } }
        });
        if (existeAlias) return res.status(400).json({ message: 'El alias ya está en uso por otra empresa.' });

        const empresaActual = await prisma.empresa.findUnique({ where: { id: parseInt(id) } });
        if (!empresaActual) return res.status(404).json({ message: 'Empresa no encontrada.' });
        if (!empresaActual.activo) return res.status(403).json({ message: 'Operación denegada. No es posible modificar una empresa que se encuentra suspendida.' });

        await prisma.empresa.update({
            where: { id: parseInt(id) },
            data: { 
                nombre: nombre_empresa, 
                alias: alias,
                giro: giro || null,
                email_contacto: email_contacto || null,
                telefono: telefono || null
            }
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

        const empresaActual = await prisma.empresa.findUnique({ where: { id: parseInt(id) } });
        if (!empresaActual) return res.status(404).json({ message: 'Empresa no encontrada.' });
        if (!empresaActual.activo) return res.status(403).json({ message: 'Operación denegada. No es posible modificar una empresa que se encuentra suspendida.' });

        const adminData = { nombre: nombre_admin, email: email_admin };

        // 🛑 EL RESET DE CLAVE
        if (reset_password === true || reset_password === 'true') {
            const passwordFinal = process.env.DEFAULT_PASSWORD || 'BiotSaaS2026*';
            const salt = await bcrypt.genSalt(10);
            adminData.password = await bcrypt.hash(passwordFinal, salt);
            adminData.debe_cambiar_password = true;
        }

        await prisma.usuario.update({
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

        const empresaActual = await prisma.empresa.findUnique({ where: { id: parseInt(id) } });
        const nuevoEstado = activo === true || activo === 'true';

        if (empresaActual.activo === nuevoEstado) {
            return res.status(400).json({ message: 'La empresa ya se encuentra en ese estado.' });
        }

        await prisma.$transaction(async (tx) => {
            await tx.empresa.update({
                where: { id: parseInt(id) },
                data: { activo: nuevoEstado }
            });

            await tx.auditoriaEmpresa.create({
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
        const historial = await prisma.auditoriaEmpresa.findMany({
            where: { empresa_id: parseInt(id) },
            include: {
                usuario: { select: { nombre: true, email: true } } // Traemos quién hizo el cambio
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(historial);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el historial de auditoría.' });
    }
};

// ==========================================
// MÓDULO DE SUPLANTACIÓN (IMPERSONATION)
// ==========================================
const impersonarEmpresa = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Buscamos al administrador real de la empresa destino
        const adminDestino = await prisma.usuario.findFirst({
            where: { tenant_id: parseInt(id), rol: 'admin', activo: true },
            include: { empresa: { include: { plan: true } } }
        });

        if (!adminDestino) {
            return res.status(404).json({ message: 'Esta empresa no tiene un administrador activo para suplantar.' });
        }

        // 2. Generamos un token idéntico al de él
        const token = generateToken({
            id: adminDestino.id,
            rol: adminDestino.rol,
            nombre: adminDestino.nombre,
            tenant_id: adminDestino.tenant_id
        });

        // 3. Devolvemos la estructura de login
        res.json({
            token,
            user: {
                id: adminDestino.id,
                nombre: adminDestino.nombre,
                email: adminDestino.email,
                rol: adminDestino.rol,
                tenant_id: adminDestino.tenant_id,
                fecha_vencimiento: adminDestino.empresa?.fecha_vencimiento,
                empresa: {
                    nombre: adminDestino.empresa?.nombre,
                    plan: adminDestino.empresa?.plan?.nombre || 'Sin Plan'
                }
            }
        });

    } catch (error) {
        console.error("Error al impersonar:", error);
        res.status(500).json({ message: 'Error interno al intentar acceder a la empresa.' });
    }
};

module.exports = {
    crearMaestranza,
    obtenerMaestranzas,
    obtenerPlanes,
    crearPlan,
    editarPlan,
    cambiarPlanEmpresa,
    editarDatosEmpresa,
    editarAdminEmpresa,
    cambiarEstadoEmpresa,
    obtenerHistorialEmpresa,
    impersonarEmpresa
};