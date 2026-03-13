const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generarTemplateCotizacion } = require('../utils/pdfTemplates');
const { generarPdfBase64 } = require('../services/pdf.service');
const { enviarWebhookN8n } = require('../services/n8n.service');

const getCotizaciones = async (req, res) => {
    try {
        const cotizaciones = await prisma.cotizacion.findMany({
            where: { tenant_id: req.user.tenant_id },
            orderBy: { id: 'desc' },
            include: { entidad: { select: { nombre: true, rut: true } } }
        });
        res.json(cotizaciones);
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

const getCotizacionById = async (req, res) => {
    try {
        const { id } = req.params;
        const cotizacion = await prisma.cotizacion.findFirst({
            where: { id: parseInt(id), tenant_id: req.user.tenant_id },
            include: { detalle_cotizaciones: true, entidad: true }
        });
        if (!cotizacion) return res.status(404).json({ message: 'Cotización no encontrada' });
        res.json(cotizacion);
    } catch (error) {
        res.status(500).json({ message: 'Error interno' });
    }
};

const createCotizacion = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const { entidad_id, cliente_nombre, validez_dias, estado, observaciones, items } = req.body;

        if (!items || items.length === 0) return res.status(400).json({ message: 'Debe tener al menos un ítem.' });

        const clienteValido = await prisma.entidad.findFirst({ where: { id: parseInt(entidad_id), tenant_id } });
        if (!clienteValido) return res.status(404).json({ message: "Cliente no válido" });

        let monto_neto = 0;
        const detallesData = items.map(item => {
            const cantidad = Number(item.cantidad);
            const unitario = Number(item.unitario);
            const totalItem = cantidad * unitario;
            monto_neto += totalItem;

            return {
                descripcion: item.descripcion, cantidad, unitario, total: totalItem,
                tipo_item: item.tipo_item || 'servicio',
                producto_id: item.producto_id ? parseInt(item.producto_id) : null,
                operario_id: item.operario_id ? parseInt(item.operario_id) : null,
                equipo_id: item.equipo_id ? parseInt(item.equipo_id) : null
            };
        });

        const monto_iva = monto_neto * 0.19;
        const monto_total = monto_neto + monto_iva;

        const nuevaCotizacion = await prisma.cotizacion.create({
            data: {
                tenant_id, entidad_id: parseInt(entidad_id), cliente_nombre,
                validez_dias: parseInt(validez_dias) || 15, estado: estado || 'borrador',
                observaciones, monto_neto, monto_iva, monto_total,
                detalle_cotizaciones: { create: detallesData }
            }
        });

        const folioGenerado = `COT-${String(nuevaCotizacion.id).padStart(4, '0')}`;
        const cotizacionFinal = await prisma.cotizacion.update({
            where: { id: nuevaCotizacion.id },
            data: { folio: folioGenerado },
            include: { detalle_cotizaciones: true }
        });

        res.status(201).json({ message: 'Cotización creada', data: cotizacionFinal });
    } catch (error) {
        res.status(500).json({ message: 'Error al procesar la cotización' });
    }
};

const updateEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;
        const { estado, motivo_rechazo } = req.body;

        const existe = await prisma.cotizacion.findFirst({ where: { id: parseInt(id), tenant_id } });
        if (!existe) return res.status(404).json({ message: 'Cotización no encontrada' });

        const resultado = await prisma.$transaction(async (tx) => {
            const cotizacionActualizada = await tx.cotizacion.update({
                where: { id: parseInt(id) },
                data: {
                    estado: estado.toLowerCase(),
                    ...(estado.toLowerCase() === 'rechazada' && { motivo_rechazo, fecha_rechazo: new Date() })
                }
            });

            if (estado.toLowerCase() === 'aceptada') {
                const otExistente = await tx.ordenTrabajo.findFirst({ where: { cotizacion_id: parseInt(id) } });
                if (!otExistente) {
                    await tx.ordenTrabajo.create({
                        data: {
                            tenant_id, cotizacion_id: cotizacionActualizada.id,
                            entidad_id: cotizacionActualizada.entidad_id,
                            cliente_nombre: cotizacionActualizada.cliente_nombre,
                            folio: `OT-${cotizacionActualizada.folio || cotizacionActualizada.id}`,
                            estado: 'abierta', fecha_inicio: new Date(),
                            precio_venta: cotizacionActualizada.monto_neto,
                            costo_estimado: 0, costo_real: 0,
                            margen_real: cotizacionActualizada.monto_neto, margen_porcentaje: 100
                        }
                    });
                }
            }
            return cotizacionActualizada;
        });

        res.json({ message: 'Estado actualizado', data: resultado });
    } catch (error) {
        res.status(500).json({ message: 'Error al cambiar el estado' });
    }
};

const updateCotizacion = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;
        const { entidad_id, cliente_nombre, validez_dias, observaciones, items } = req.body;

        const existe = await prisma.cotizacion.findFirst({ where: { id: parseInt(id), tenant_id } });
        if (!existe) return res.status(404).json({ message: 'Cotización no encontrada' });
        if (!items || items.length === 0) return res.status(400).json({ message: 'Debe tener al menos un ítem.' });

        let monto_neto = 0;
        const detallesData = items.map(item => {
            const cantidad = Number(item.cantidad);
            const unitario = Number(item.unitario);
            const totalItem = cantidad * unitario;
            monto_neto += totalItem;

            return {
                descripcion: item.descripcion, cantidad, unitario, total: totalItem,
                tipo_item: item.tipo_item || 'servicio',
                producto_id: item.producto_id ? parseInt(item.producto_id) : null,
                operario_id: item.operario_id ? parseInt(item.operario_id) : null,
                equipo_id: item.equipo_id ? parseInt(item.equipo_id) : null
            };
        });

        const monto_iva = monto_neto * 0.19;
        const monto_total = monto_neto + monto_iva;

        const transaccion = await prisma.$transaction([
            prisma.detalleCotizacion.deleteMany({ where: { cotizacion_id: parseInt(id) } }),
            prisma.cotizacion.update({
                where: { id: parseInt(id) },
                data: {
                    entidad_id: parseInt(entidad_id), cliente_nombre, validez_dias: parseInt(validez_dias),
                    observaciones, monto_neto, monto_iva, monto_total,
                    detalle_cotizaciones: { create: detallesData }
                }
            })
        ]);

        res.json({ message: 'Cotización actualizada', data: transaccion[1] });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar' });
    }
};

const enviarCotizacion = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;
        const { email_destino } = req.body;

        if (!email_destino) return res.status(400).json({ message: "Se requiere un correo." });

        const cotizacion = await prisma.cotizacion.findFirst({
            where: { id: parseInt(id), tenant_id },
            include: { entidad: true, detalle_cotizaciones: { include: { producto: true, operario: true, equipo: true } } }
        });

        if (!cotizacion) return res.status(404).json({ message: "Cotización no encontrada" });

        const htmlContent = generarTemplateCotizacion(cotizacion);
        const pdfBase64 = await generarPdfBase64(htmlContent);

        await enviarWebhookN8n({
            tipo_documento: "cotizacion", folio: cotizacion.folio,
            cliente_nombre: cotizacion.entidad?.nombre || cotizacion.cliente_nombre,
            email_destino, pdf_base64: pdfBase64
        });

        const estadoNuevo = cotizacion.estado === 'borrador' ? 'enviada' : cotizacion.estado;

        const cotizacionActualizada = await prisma.cotizacion.update({
            where: { id: parseInt(id) },
            data: { estado: estadoNuevo, fecha_ultimo_envio: new Date(), pdf_base64: pdfBase64 }
        });

        res.status(200).json({ message: "Enviada exitosamente", cotizacion: cotizacionActualizada });
    } catch (error) {
        console.error("Error en enviarCotizacion:", error);
        res.status(500).json({ message: "Error al enviar PDF" });
    }
};

const previewCotizacion = async (req, res) => {
    try {
        const { id } = req.params;
        const cotizacion = await prisma.cotizacion.findFirst({
            where: { id: parseInt(id), tenant_id: req.user.tenant_id },
            include: { entidad: true, detalle_cotizaciones: { include: { producto: true, operario: true, equipo: true } } }
        });

        if (!cotizacion) return res.status(404).json({ message: "Cotización no encontrada" });

        let pdfBuffer;
        if (['enviada', 'aceptada', 'rechazada'].includes(cotizacion.estado) && cotizacion.pdf_base64) {
            pdfBuffer = Buffer.from(cotizacion.pdf_base64, 'base64');
        } else {
            const htmlContent = generarTemplateCotizacion(cotizacion);
            const pdfBase64 = await generarPdfBase64(htmlContent);
            pdfBuffer = Buffer.from(pdfBase64, 'base64');
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Cotizacion_${cotizacion.folio}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ message: "Error al generar vista previa" });
    }
};

const deleteCotizacion = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;

        const cotizacion = await prisma.cotizacion.findFirst({
            where: { id: parseInt(id), tenant_id }
        });

        if (!cotizacion) return res.status(404).json({ message: 'Cotización no encontrada' });
        if (cotizacion.estado !== 'borrador') {
            return res.status(403).json({ message: 'Solo se pueden eliminar cotizaciones en estado borrador.' });
        }

        await prisma.cotizacion.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Cotización eliminada correctamente' });
    } catch (error) {
        console.error("Error al eliminar cotización:", error);
        res.status(500).json({ message: 'Error al eliminar la cotización' });
    }
};

module.exports = { getCotizaciones, getCotizacionById, createCotizacion, updateEstado, updateCotizacion, enviarCotizacion, previewCotizacion, deleteCotizacion };