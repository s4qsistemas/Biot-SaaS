const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { validateRut, formatRutForDB } = require('../utils/rut');
const { enviarContactoN8n } = require('../services/n8n.service');

const prisma = new PrismaClient();

const registrarEmpresa = async (req, res) => {
    try {
        const { nombre_empresa, rut_empresa, alias, nombre_admin, email_admin, password_admin } = req.body;

        if (!nombre_empresa || !rut_empresa || !alias || !nombre_admin || !email_admin || !password_admin) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
        }

        if (!validateRut(rut_empresa)) return res.status(400).json({ message: 'RUT inválido.' });
        const rutFormateado = formatRutForDB(rut_empresa);

        const existeRut = await prisma.empresas.findUnique({ where: { rut: rutFormateado } });
        if (existeRut) return res.status(400).json({ message: 'Esta empresa ya está registrada.' });

        const existeAlias = await prisma.empresas.findUnique({ where: { alias } });
        if (existeAlias) return res.status(400).json({ message: 'El alias no está disponible.' });

        const existeEmail = await prisma.usuarios.findUnique({ where: { email: email_admin } });
        if (existeEmail) return res.status(400).json({ message: 'El correo ya está registrado.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password_admin, salt);

        // ⏱️ LÓGICA DE TRIAL: 14 Días a partir de hoy
        const fechaVencimiento = new Date();
        fechaVencimiento.setDate(fechaVencimiento.getDate() + 14);

        await prisma.$transaction(async (tx) => {
            const empresa = await tx.empresas.create({
                data: {
                    nombre: nombre_empresa,
                    rut: rutFormateado,
                    alias: alias,
                    activo: true,
                    plan_id: 1, // 👈 Se asigna Plan Básico (Asegúrate de que el ID 1 exista)
                    fecha_vencimiento: fechaVencimiento // 👈 Comienza el Trial
                }
            });

            await tx.usuarios.create({
                data: {
                    tenant_id: empresa.id,
                    nombre: nombre_admin,
                    email: email_admin,
                    password: hashedPassword,
                    rol: 'admin',
                    activo: true,
                    debe_cambiar_password: false // Como la creó él mismo, no necesita cambiarla
                }
            });
        });

        res.status(201).json({ ok: true, message: '¡Cuenta creada con éxito! Tienes 14 días de prueba.' });

    } catch (error) {
        console.error('Error en registro público:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

const procesarContacto = async (req, res) => {
    try {
        const { nombre, email, telefono, mensaje } = req.body;

        if (!nombre || !email || !mensaje) {
            return res.status(400).json({ message: 'El nombre, email y mensaje son obligatorios.' });
        }

        // Armamos el payload limpio para N8N
        const payloadN8n = {
            origen: 'Formulario Web Biot SaaS',
            fecha: new Date().toISOString(),
            contacto: { nombre, email, telefono: telefono || 'No provisto' },
            mensaje: mensaje
        };

        // Disparamos el webhook
        await enviarContactoN8n(payloadN8n);

        res.status(200).json({ ok: true, message: '¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.' });

    } catch (error) {
        console.error('Error en procesarContacto:', error);
        res.status(500).json({ message: 'Hubo un error al enviar el mensaje.' });
    }
};

module.exports = { registrarEmpresa, procesarContacto };