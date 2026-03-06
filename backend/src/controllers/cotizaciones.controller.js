const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Importamos las funciones externas
const { generarTemplateCotizacion } = require('../utils/pdfTemplates');
const { generarPdfBase64 } = require('../services/pdf.service');
const { enviarWebhookN8n } = require('../services/n8n.service');

// 1. Obtener todas las cotizaciones (Para llenar la tabla principal)
const getCotizaciones = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id; // INYECCIÓN SAAS

        const cotizaciones = await prisma.cotizaciones.findMany({
            where: { tenant_id: tenant_id }, // FILTRO ESTRICTO
            orderBy: { id: 'desc' },
            include: {
                entidades: { select: { nombre: true, rut: true } }
            }
        });
        res.json(cotizaciones);
    } catch (error) {
        console.error('Error al obtener cotizaciones:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// 2. Obtener una cotización específica con sus detalles
const getCotizacionById = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;

        const cotizacion = await prisma.cotizaciones.findFirst({
            where: { id: parseInt(id), tenant_id: tenant_id }, // VALIDACIÓN DE PROPIEDAD
            include: {
                detalle_cotizaciones: true,
                entidades: true
            }
        });

        if (!cotizacion) return res.status(404).json({ message: 'Cotización no encontrada o acceso denegado' });
        res.json(cotizacion);
    } catch (error) {
        console.error('Error al obtener la cotización:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// 3. Crear Cotización + Detalles (Transacción Segura)
const createCotizacion = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id; // INYECCIÓN SAAS
        const { entidad_id, cliente_nombre, validez_dias, estado, observaciones, items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'La cotización debe tener al menos un ítem.' });
        }

        // 1. Validar que la Entidad (Cliente) a la que se le hace la cotización pertenezca a la empresa
        const clienteValido = await prisma.entidades.findFirst({
            where: { id: parseInt(entidad_id), tenant_id: tenant_id }
        });
        if (!clienteValido) {
            return res.status(404).json({ message: "El cliente seleccionado no es válido o pertenece a otra empresa" });
        }

        // 2. Cálculos
        let monto_neto = 0;
        const detallesData = items.map(item => {
            const cantidad = Number(item.cantidad);
            const unitario = Number(item.unitario);
            const totalItem = cantidad * unitario;
            monto_neto += totalItem;

            return {
                descripcion: item.descripcion,
                cantidad: cantidad,
                unitario: unitario,
                total: totalItem,
                tipo_item: item.tipo_item || 'servicio',
                producto_id: item.producto_id ? parseInt(item.producto_id) : null,
                operario_id: item.operario_id ? parseInt(item.operario_id) : null,
                equipo_id: item.equipo_id ? parseInt(item.equipo_id) : null
            };
        });

        const monto_iva = monto_neto * 0.19;
        const monto_total = monto_neto + monto_iva;

        // 3. Transacción
        const nuevaCotizacion = await prisma.cotizaciones.create({
            data: {
                tenant_id: tenant_id, // GATILLO SAAS
                entidad_id: parseInt(entidad_id),
                cliente_nombre: cliente_nombre,
                validez_dias: parseInt(validez_dias) || 15,
                estado: estado || 'borrador',
                observaciones: observaciones,
                monto_neto: monto_neto,
                monto_iva: monto_iva,
                monto_total: monto_total,
                detalle_cotizaciones: { create: detallesData }
            },
            include: { detalle_cotizaciones: true }
        });

        // 4. Folio
        const folioGenerado = `COT-${String(nuevaCotizacion.id).padStart(4, '0')}`;
        const cotizacionFinal = await prisma.cotizaciones.update({
            where: { id: nuevaCotizacion.id },
            data: { folio: folioGenerado },
            include: { detalle_cotizaciones: true }
        });

        res.status(201).json({ message: 'Cotización creada con éxito', data: cotizacionFinal });
    } catch (error) {
        console.error('Error al crear cotización:', error);
        res.status(500).json({ message: 'Error al procesar la cotización' });
    }
};

// 4. Cambiar el estado de la cotización y crear OT si es aceptada
const updateEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;
        const { estado, motivo_rechazo } = req.body;

        // Validar propiedad antes de modificar
        const existe = await prisma.cotizaciones.findFirst({
            where: { id: parseInt(id), tenant_id: tenant_id }
        });
        if (!existe) return res.status(404).json({ message: 'Cotización no encontrada o acceso denegado' });

        const resultado = await prisma.$transaction(async (tx) => {
            const cotizacionActualizada = await tx.cotizaciones.update({
                where: { id: parseInt(id) },
                data: {
                    estado: estado.toLowerCase(),
                    ...(estado.toLowerCase() === 'rechazada' && {
                        motivo_rechazo: motivo_rechazo,
                        fecha_rechazo: new Date()
                    })
                }
            });

            if (estado.toLowerCase() === 'aceptada') {
                const otExistente = await tx.ordenes_trabajo.findFirst({
                    where: { cotizacion_id: parseInt(id) }
                });

                if (!otExistente) {
                    await tx.ordenes_trabajo.create({
                        data: {
                            tenant_id: tenant_id, // INYECTAR TENANT A LA OT QUE NACE
                            cotizacion_id: cotizacionActualizada.id,
                            entidad_id: cotizacionActualizada.entidad_id,
                            cliente_nombre: cotizacionActualizada.cliente_nombre,
                            folio: `OT-${cotizacionActualizada.folio || cotizacionActualizada.id}`,
                            estado: 'abierta',
                            fecha_inicio: new Date(),
                            precio_venta: cotizacionActualizada.monto_neto,
                            costo_estimado: 0,
                            costo_real: 0,
                            margen_real: cotizacionActualizada.monto_neto,
                            margen_porcentaje: 100
                        }
                    });
                }
            }

            return cotizacionActualizada;
        });

        res.json({ message: 'Estado actualizado y OT procesada', data: resultado });
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({ message: 'Error al cambiar el estado de la cotización' });
    }
};

// 5. Actualizar una cotización completa
const updateCotizacion = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;
        const { entidad_id, cliente_nombre, validez_dias, observaciones, items } = req.body;

        // 1. Validar propiedad
        const existe = await prisma.cotizaciones.findFirst({
            where: { id: parseInt(id), tenant_id: tenant_id }
        });
        if (!existe) return res.status(404).json({ message: 'Cotización no encontrada o acceso denegado' });

        if (!items || items.length === 0) return res.status(400).json({ message: 'Debe tener al menos un ítem.' });

        let monto_neto = 0;
        const detallesData = items.map(item => {
            const cantidad = Number(item.cantidad);
            const unitario = Number(item.unitario);
            const totalItem = cantidad * unitario;
            monto_neto += totalItem;

            return {
                descripcion: item.descripcion,
                cantidad, unitario, total: totalItem,
                tipo_item: item.tipo_item || 'servicio',
                producto_id: item.producto_id ? parseInt(item.producto_id) : null,
                operario_id: item.operario_id ? parseInt(item.operario_id) : null,
                equipo_id: item.equipo_id ? parseInt(item.equipo_id) : null
            };
        });

        const monto_iva = monto_neto * 0.19;
        const monto_total = monto_neto + monto_iva;

        const transaccion = await prisma.$transaction([
            prisma.detalle_cotizaciones.deleteMany({ where: { cotizacion_id: parseInt(id) } }),
            prisma.cotizaciones.update({
                where: { id: parseInt(id) },
                data: {
                    entidad_id: parseInt(entidad_id),
                    cliente_nombre, validez_dias: parseInt(validez_dias),
                    observaciones, monto_neto, monto_iva, monto_total,
                    detalle_cotizaciones: { create: detallesData }
                }
            })
        ]);

        res.json({ message: 'Cotización actualizada', data: transaccion[1] });
    } catch (error) {
        console.error('Error al actualizar cotización:', error);
        res.status(500).json({ message: 'Error al actualizar la cotización' });
    }
};

// 6. Generar PDF Base64 y disparar n8n
const enviarCotizacion = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;
        const { email_destino } = req.body;

        if (!email_destino) return res.status(400).json({ message: "Se requiere un correo de destino." });

        const cotizacion = await prisma.cotizaciones.findFirst({
            where: { id: parseInt(id), tenant_id: tenant_id }, // VALIDACIÓN
            include: {
                entidades: true,
                detalle_cotizaciones: { include: { productos: true, operarios: true, equipos: true } }
            }
        });

        if (!cotizacion) return res.status(404).json({ message: "Cotización no encontrada o acceso denegado" });

        if (cotizacion.entidad_id && cotizacion.entidades?.email !== email_destino) {
            await prisma.entidades.update({
                where: { id: cotizacion.entidad_id },
                data: { email: email_destino }
            });
        }

        const htmlContent = generarTemplateCotizacion(cotizacion);
        const pdfBase64 = await generarPdfBase64(htmlContent);

        const payloadN8n = {
            tipo_documento: "cotizacion",
            folio: cotizacion.folio,
            cliente_nombre: cotizacion.entidades?.nombre || cotizacion.cliente_nombre,
            email_destino: email_destino,
            pdf_base64: pdfBase64
        };

        await enviarWebhookN8n(payloadN8n);

        const estadoNuevo = cotizacion.estado === 'borrador' ? 'enviada' : cotizacion.estado;

        const cotizacionActualizada = await prisma.cotizaciones.update({
            where: { id: parseInt(id) },
            data: { estado: estadoNuevo, fecha_ultimo_envio: new Date(), pdf_base64: pdfBase64 }
        });

        res.status(200).json({ message: "Cotización enviada exitosamente", cotizacion: cotizacionActualizada });
    } catch (error) {
        console.error("Error en enviarCotizacion:", error);
        res.status(500).json({ message: "Error al enviar el PDF", error: error.message });
    }
};

// 7. Endpoint de Vista Previa PDF
const previewCotizacion = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;

        const cotizacion = await prisma.cotizaciones.findFirst({
            where: { id: parseInt(id), tenant_id: tenant_id }, // VALIDACIÓN
            include: {
                entidades: true,
                detalle_cotizaciones: { include: { productos: true, operarios: true, equipos: true } }
            }
        });

        if (!cotizacion) return res.status(404).json({ message: "Cotización no encontrada o acceso denegado" });

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
        console.error("Error en previewCotizacion:", error);
        res.status(500).json({ message: "Error al generar la vista previa", error: error.message });
    }
};

module.exports = { getCotizaciones, getCotizacionById, createCotizacion, updateEstado, updateCotizacion, enviarCotizacion, previewCotizacion };