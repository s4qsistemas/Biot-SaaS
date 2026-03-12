const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generarTemplateOT } = require('../utils/pdfTemplates');
const { generarPdfBase64 } = require('../services/pdf.service');
const { enviarWebhookN8n } = require('../services/n8n.service');

const getOrdenesTrabajo = async (req, res) => {
    try {
        const ordenes = await prisma.ordenTrabajo.findMany({
            where: { tenant_id: req.user.tenant_id },
            include: {
                cotizacion: { include: { detalle_cotizaciones: { include: { producto: true, operario: true, equipo: true } } } },
                tareas: {
                    include: {
                        consumo_ot: { include: { unidad_stock: { include: { producto: true } } } },
                        registro_tiempo: { include: { operario: true, equipo: true } },
                        pausas_tarea: { orderBy: { fecha_pausa: 'desc' } }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(ordenes);
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

const createTarea = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;
        const { nombre, tipo, operario_id, observaciones, dependencia_id } = req.body;

        const ot = await prisma.ordenTrabajo.findFirst({ where: { id: parseInt(id), tenant_id } });
        if (!ot) return res.status(404).json({ message: "OT no encontrada" });

        const nuevaTarea = await prisma.tarea.create({
            data: {
                tenant_id, ot_id: parseInt(id), nombre, tipo: tipo || 'general',
                estado: dependencia_id ? 'bloqueada' : 'pendiente',
                operario_id: operario_id ? parseInt(operario_id) : null,
                dependencia_id: dependencia_id ? parseInt(dependencia_id) : null,
                observaciones: observaciones || ''
            },
            include: { operario: true }
        });
        res.status(201).json({ message: "Tarea agregada", data: nuevaTarea });
    } catch (error) {
        res.status(500).json({ message: "Error interno" });
    }
};

const cargarMaterial = async (req, res) => {
    try {
        const { id, tareaId } = req.params;
        const tenant_id = req.user.tenant_id;
        const { unidad_stock_id, cantidad, usuario_id } = req.body;
        const cantidadNumerica = Number(cantidad);

        if (cantidadNumerica <= 0) return res.status(400).json({ message: "Cantidad inválida" });

        const ot = await prisma.ordenTrabajo.findFirst({ where: { id: parseInt(id), tenant_id } });
        const tarea = await prisma.tarea.findFirst({ where: { id: parseInt(tareaId), tenant_id } });
        if (!ot || !tarea) return res.status(404).json({ message: "OT/Tarea no encontrada" });

        const resultado = await prisma.$transaction(async (tx) => {
            const stockActual = await tx.unidadStock.findFirst({
                where: { id: parseInt(unidad_stock_id), tenant_id },
                include: { producto: true }
            });

            if (!stockActual || Number(stockActual.cantidad_disponible) < cantidadNumerica) {
                throw new Error("Stock insuficiente.");
            }

            // 1. Descuento atómico de stock
            const stockActualizado = await tx.unidadStock.update({
                where: { id: parseInt(unidad_stock_id) },
                data: { cantidad_disponible: { decrement: cantidadNumerica } }
            });

            let nuevoEstadoStock = 'disponible';
            if (Number(stockActualizado.cantidad_disponible) <= 0) nuevoEstadoStock = 'sin_stock';
            else if (Number(stockActualizado.cantidad_disponible) <= Number(stockActual.producto.stock_minimo)) nuevoEstadoStock = 'bajo_stock';

            await tx.unidadStock.update({ where: { id: stockActualizado.id }, data: { estado: nuevoEstadoStock } });

            await tx.movimiento.create({
                data: {
                    tenant_id, unidad_stock_id: stockActualizado.id, tipo: 'SALIDA',
                    cantidad_movida: cantidadNumerica, referencia_tipo: 'OT', referencia_id: parseInt(id),
                    usuario_id: usuario_id ? parseInt(usuario_id) : null,
                    motivo: `Consumo en OT-${ot.folio}, Tarea-${tareaId}`
                }
            });

            const consumo = await tx.consumoOt.create({
                data: { tarea_id: parseInt(tareaId), unidad_stock_id: stockActualizado.id, cantidad_utilizada: cantidadNumerica }
            });

            // 2. Incremento atómico de costos para evitar Race Conditions
            const costoAdicional = cantidadNumerica * Number(stockActual.producto.precio_compra);

            const otConCosto = await tx.ordenTrabajo.update({
                where: { id: parseInt(id) },
                data: { costo_real: { increment: costoAdicional } }
            });

            // 3. Recálculo de márgenes basado en el valor atómico resultante
            const nuevoMargenReal = Number(otConCosto.precio_venta) - Number(otConCosto.costo_real);
            let nuevoMargenPorcentaje = Number(otConCosto.precio_venta) > 0 ? (nuevoMargenReal / Number(otConCosto.precio_venta)) * 100 : (Number(otConCosto.costo_real) > 0 ? -100 : 0);

            const otFinal = await tx.ordenTrabajo.update({
                where: { id: parseInt(id) },
                data: { margen_real: nuevoMargenReal, margen_porcentaje: nuevoMargenPorcentaje }
            });

            return { consumo, otActualizada: otFinal };
        });

        res.status(201).json({ message: "Material consumido", data: resultado });
    } catch (error) {
        res.status(error.message.includes("Stock") ? 400 : 500).json({ message: error.message || "Error interno" });
    }
};

const cargarHoras = async (req, res) => {
    try {
        const { id, tareaId } = req.params;
        const tenant_id = req.user.tenant_id;
        const { operario_id, equipo_id, horas, descripcion } = req.body;
        const horasNumericas = Number(horas);

        if (horasNumericas <= 0) return res.status(400).json({ message: "Horas inválidas" });
        if (!operario_id && !equipo_id) return res.status(400).json({ message: "Falta recurso" });

        const ot = await prisma.ordenTrabajo.findFirst({ where: { id: parseInt(id), tenant_id } });
        const tarea = await prisma.tarea.findFirst({ where: { id: parseInt(tareaId), tenant_id } });
        if (!ot || !tarea) return res.status(404).json({ message: "OT/Tarea no encontrada" });

        const resultado = await prisma.$transaction(async (tx) => {
            let tarifa_hora = 0;

            if (operario_id) {
                const operario = await tx.operario.findFirst({ where: { id: parseInt(operario_id), tenant_id } });
                if (!operario) throw new Error("Recurso no válido.");
                tarifa_hora = Number(operario.valor_hora || 0);
            } else if (equipo_id) {
                const equipo = await tx.equipo.findFirst({ where: { id: parseInt(equipo_id), tenant_id } });
                if (!equipo) throw new Error("Recurso no válido.");
                tarifa_hora = Number(equipo.valor_hora || 0);
            }

            if (tarifa_hora <= 0) throw new Error(`El recurso no tiene tarifa (> 0).`);
            const costoTotalHoras = horasNumericas * tarifa_hora;

            const registro = await tx.registroTiempo.create({
                data: {
                    tarea_id: parseInt(tareaId), operario_id: operario_id ? parseInt(operario_id) : null,
                    equipo_id: equipo_id ? parseInt(equipo_id) : null, horas: horasNumericas,
                    costo_total: costoTotalHoras, descripcion: descripcion || `Carga manual`
                }
            });

            // Incremento atómico
            const otConCosto = await tx.ordenTrabajo.update({
                where: { id: parseInt(id) },
                data: { costo_real: { increment: costoTotalHoras } }
            });

            const nuevoMargenReal = Number(otConCosto.precio_venta) - Number(otConCosto.costo_real);
            let nuevoMargenPorcentaje = Number(otConCosto.precio_venta) > 0 ? (nuevoMargenReal / Number(otConCosto.precio_venta)) * 100 : (Number(otConCosto.costo_real) > 0 ? -100 : 0);

            const otFinal = await tx.ordenTrabajo.update({
                where: { id: parseInt(id) },
                data: { margen_real: nuevoMargenReal, margen_porcentaje: nuevoMargenPorcentaje }
            });

            return { registro, otActualizada: otFinal };
        });

        res.status(201).json({ message: "Horas registradas", data: resultado });
    } catch (error) {
        res.status(error.message.includes("no") ? 400 : 500).json({ message: error.message || "Error interno" });
    }
};

const actualizarEstadoTarea = async (req, res) => {
    try {
        const { tareaId } = req.params;
        const tenant_id = req.user.tenant_id;
        const { estado, motivo } = req.body;

        const estadosValidos = ['bloqueada', 'pendiente', 'en_proceso', 'pausada', 'completada'];
        if (!estadosValidos.includes(estado)) return res.status(400).json({ message: "Estado no válido." });

        const tareaActual = await prisma.tarea.findFirst({ where: { id: parseInt(tareaId), tenant_id } });
        if (!tareaActual) return res.status(404).json({ message: "Tarea no encontrada." });

        let dataToUpdate = { estado };

        if (estado === 'en_proceso' || estado === 'completada') {
            if (!tareaActual.fecha_inicio_real) dataToUpdate.fecha_inicio_real = new Date();
            if (tareaActual.estado === 'pausada') {
                await prisma.pausaTarea.updateMany({
                    where: { tarea_id: parseInt(tareaId), fecha_reanudacion: null },
                    data: { fecha_reanudacion: new Date() }
                });
            }
            if (estado === 'completada') dataToUpdate.fecha_fin_real = new Date();
        } else if (estado === 'pausada') {
            if (!motivo || !motivo.trim()) return res.status(400).json({ message: "El motivo es obligatorio." });
            await prisma.pausaTarea.create({ data: { tarea_id: parseInt(tareaId), motivo: motivo.trim() } });
        }

        const tareaActualizada = await prisma.tarea.update({ where: { id: parseInt(tareaId) }, data: dataToUpdate });

        if (estado === 'completada') {
            await prisma.tarea.updateMany({
                where: { dependencia_id: parseInt(tareaId), estado: 'bloqueada', tenant_id },
                data: { estado: 'pendiente' }
            });
        }

        res.json({ message: `Tarea marcada como ${estado}`, data: tareaActualizada });
    } catch (error) {
        res.status(500).json({ message: "Error interno" });
    }
};

const createOTDirecta = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const { entidad_id, precio_venta } = req.body;

        const cliente = await prisma.entidad.findFirst({ where: { id: parseInt(entidad_id), tenant_id } });
        if (!cliente) return res.status(404).json({ message: "Cliente no válido" });

        const cantidadDirectas = await prisma.ordenTrabajo.count({
            where: { tenant_id: tenant_id, folio: { startsWith: 'OT-DIR-' } }
        });

        const precio = precio_venta ? Number(precio_venta) : 0;

        // Manejo de Colisión por Race Condition en Folio
        let nuevaOT;
        try {
            nuevaOT = await prisma.ordenTrabajo.create({
                data: {
                    tenant_id, folio: `OT-DIR-${(cantidadDirectas + 1).toString().padStart(4, '0')}`,
                    entidad_id: cliente.id, cliente_nombre: cliente.nombre, estado: 'abierta',
                    fecha_inicio: new Date(), precio_venta: precio, costo_real: 0,
                    margen_real: precio, margen_porcentaje: precio > 0 ? 100 : 0
                }
            });
        } catch (e) {
            if (e.code === 'P2002') {
                nuevaOT = await prisma.ordenTrabajo.create({
                    data: {
                        tenant_id, folio: `OT-DIR-R-${Date.now()}`, // Fallback si dos personas crean a la vez
                        entidad_id: cliente.id, cliente_nombre: cliente.nombre, estado: 'abierta',
                        fecha_inicio: new Date(), precio_venta: precio, costo_real: 0,
                        margen_real: precio, margen_porcentaje: precio > 0 ? 100 : 0
                    }
                });
            } else throw e;
        }

        res.status(201).json({ message: "OT Directa creada", data: nuevaOT });
    } catch (error) {
        console.error("Error en createOTDirecta:", error);
        res.status(500).json({ message: "Error interno." });
    }
};

const actualizarEstadoOT = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;
        const { estado } = req.body;

        const estadosValidos = ['abierta', 'en_proceso', 'lista_para_entrega', 'entregada', 'facturada', 'anulada'];
        if (!estadosValidos.includes(estado)) return res.status(400).json({ message: "Estado no válido." });

        const existe = await prisma.ordenTrabajo.findFirst({ where: { id: parseInt(id), tenant_id } });
        if (!existe) return res.status(404).json({ message: "OT no encontrada." });

        let dataToUpdate = { estado };
        if (estado === 'facturada') dataToUpdate.fecha_fin = new Date();

        const otActualizada = await prisma.ordenTrabajo.update({ where: { id: parseInt(id) }, data: dataToUpdate });
        res.json({ message: `OT movida a: ${estado}`, data: otActualizada });
    } catch (error) {
        res.status(500).json({ message: "Error interno." });
    }
};

const enviarOT = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;
        const { email_interno } = req.body;

        if (!email_interno) return res.status(400).json({ message: "Se requiere correo." });

        const correoExiste = await prisma.correoInterno.findFirst({ where: { tenant_id, email: email_interno } });
        if (correoExiste) await prisma.correoInterno.update({ where: { id: correoExiste.id }, data: { ultimo_uso: new Date() } });
        else await prisma.correoInterno.create({ data: { tenant_id, email: email_interno, nombre: email_interno.split('@')[0], empresa: 'Interno' } });

        const ot = await prisma.ordenTrabajo.findFirst({
            where: { id: parseInt(id), tenant_id },
            include: {
                tareas: { include: { operario: true }, orderBy: { id: 'asc' } },
                cotizacion: { include: { detalle_cotizaciones: { include: { producto: true, operario: true, equipo: true } } } }
            }
        });

        if (!ot) return res.status(404).json({ message: "OT no encontrada" });

        const htmlContent = generarTemplateOT(ot);
        const pdfBase64 = await generarPdfBase64(htmlContent);

        await enviarWebhookN8n({
            tipo_documento: "orden_trabajo", folio: ot.folio,
            cliente_nombre: ot.cliente_nombre || "Uso Interno", email_destino: email_interno, pdf_base64
        });

        const otActualizada = await prisma.ordenTrabajo.update({ where: { id: parseInt(id) }, data: { pdf_base64 } });
        res.status(200).json({ message: "OT enviada", ot: otActualizada });
    } catch (error) {
        res.status(500).json({ message: "Error al enviar PDF" });
    }
};

const getCorreosInternos = async (req, res) => {
    try {
        const correos = await prisma.correoInterno.findMany({
            where: { tenant_id: req.user.tenant_id },
            orderBy: { ultimo_uso: 'desc' }, take: 10
        });
        res.status(200).json(correos);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener historial" });
    }
};

module.exports = { getOrdenesTrabajo, createTarea, cargarMaterial, cargarHoras, actualizarEstadoTarea, createOTDirecta, actualizarEstadoOT, enviarOT, getCorreosInternos };