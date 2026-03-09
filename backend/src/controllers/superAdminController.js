const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const crearMaestranza = async (req, res) => {
    try {
        // Cambiamos subdominio por alias
        const { nombre_empresa, rut_empresa, alias, nombre_admin, email_admin, password_admin, plan_id } = req.body;

        if (!nombre_empresa || !alias || !email_admin || !plan_id) {
            return res.status(400).json({ message: 'Faltan campos obligatorios.' });
        }

        const existeAlias = await prisma.empresas.findUnique({ where: { alias } });
        if (existeAlias) return res.status(400).json({ message: 'El alias ya está en uso.' });

        const existeEmail = await prisma.usuarios.findUnique({ where: { email: email_admin } });
        if (existeEmail) return res.status(400).json({ message: 'Correo ya registrado.' });

        const passwordFinal = password_admin || process.env.DEFAULT_PASSWORD || 'Cambiar123*';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passwordFinal, salt);
        const debeCambiar = !password_admin || password_admin.trim() === '';

        const nuevaMaestranza = await prisma.$transaction(async (tx) => {
            const empresa = await tx.empresas.create({
                data: {
                    nombre: nombre_empresa,
                    rut: rut_empresa,
                    alias: alias, // Guardamos como alias
                    activo: true,
                    plan_id: parseInt(plan_id) 
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
            include: {
                usuarios: { where: { rol: 'admin' }, take: 1 },
                planes: true
            },
            orderBy: { created_at: 'desc' }
        });

        const data = empresas.map(emp => ({
            id: emp.id,
            nombre: emp.nombre,
            rut: emp.rut || '',
            alias: emp.alias, // Devolvemos alias
            estado: emp.activo ? 'activa' : 'suspendida',
            plan_id: emp.plan_id || '',
            plan_nombre: emp.planes?.nombre || 'Sin Plan',
            admin_id: emp.usuarios[0]?.id || null,
            admin_nombre: emp.usuarios[0]?.nombre || '',
            admin_email: emp.usuarios[0]?.email || ''
        }));
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener empresas' });
    }
};

const editarMaestranza = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_empresa, rut_empresa, alias, activo, plan_id, admin_id, nombre_admin, email_admin, password_admin } = req.body;

        const existeAlias = await prisma.empresas.findFirst({
            where: { alias, NOT: { id: parseInt(id) } }
        });
        if (existeAlias) return res.status(400).json({ message: 'El alias ya está en uso.' });

        await prisma.$transaction(async (tx) => {
            await tx.empresas.update({
                where: { id: parseInt(id) },
                data: {
                    nombre: nombre_empresa,
                    rut: rut_empresa,
                    alias: alias, // Actualizamos alias
                    plan_id: plan_id ? parseInt(plan_id) : null,
                    activo: activo === 'true' || activo === true
                }
            });

            if (admin_id) {
                const adminData = { nombre: nombre_admin, email: email_admin };
                
                if (password_admin && password_admin.trim() !== '') {
                    const salt = await bcrypt.genSalt(10);
                    adminData.password = await bcrypt.hash(password_admin, salt);
                }

                await tx.usuarios.update({
                    where: { id: parseInt(admin_id) },
                    data: adminData
                });
            }
        });

        res.json({ ok: true, message: 'Maestranza y Administrador actualizados correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno al actualizar el Tenant' });
    }
};

module.exports = { crearMaestranza, obtenerMaestranzas, editarMaestranza };