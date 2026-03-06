const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { generarTemplateOT } = require('../utils/pdfTemplates');
const { generarPdfBase64 } = require('../services/pdf.service');
const { enviarWebhookN8n } = require('../services/n8n.service');

const getOrdenesTrabajo = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id; // INYECCIÓN SAAS

        const ordenes = await prisma.ordenes_trabajo.findMany({
            where: { tenant_id: tenant_id }, // FILTRO SAAS
            include: {
                cotizaciones: {
                    include: {
                        detalle_cotizaciones: { include: { productos: true, operarios: true, equipos: true } }
                    }
                },
                tareas: {
                    include: {
                        consumo_ot: { include: { unidades_stock: { include: { productos: true } } } },
                        registro_tiempo: { include: { operarios: true, equipos: true } },
                        pausas_tarea: { orderBy: { fecha_pausa: 'desc' } }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(ordenes);
    } catch (error) {
        console.error("Error obteniendo OTs:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

const createTarea = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;
        const { nombre, tipo, operario_id, observaciones, dependencia_id } = req.body;

        // Validar propiedad de la OT
        const ot = await prisma.ordenes_trabajo.findFirst({
            where: { id: parseInt(id), tenant_id: tenant_id }
        });
        if (!ot) return res.status(404).json({ message: "Orden de Trabajo no encontrada o acceso denegado" });

        const estadoInicial = dependencia_id ? 'bloqueada' : 'pendiente';

        const nuevaTarea = await prisma.tareas.create({
            data: {
                tenant_id: tenant_id, // INYECCIÓN SAAS A LA TAREA
                ot_id: parseInt(id),
                nombre: nombre,
                tipo: tipo || 'general',
                estado: estadoInicial,
                operario_id: operario_id ? parseInt(operario_id) : null,
                dependencia_id: dependencia_id ? parseInt(dependencia_id) : null,
                observaciones: observaciones || ''
            },
            include: { operarios: true }
        });

        res.status(201).json({ message: "Tarea agregada con éxito", data: nuevaTarea });
    } catch (error) {
        console.error("Error al crear tarea:", error);
        res.status(500).json({ message: "Error interno al crear la tarea" });
    }
};

const cargarMaterial = async (req, res) => {
    try {
        const { id, tareaId } = req.params;
        const tenant_id = req.user.tenant_id;
        const { unidad_stock_id, cantidad, usuario_id } = req.body;
        const cantidadNumerica = Number(cantidad);

        if (cantidadNumerica <= 0) return res.status(400).json({ message: "La cantidad debe ser mayor a 0" });

        // Validar propiedad de la OT y Tarea
        const ot = await prisma.ordenes_trabajo.findFirst({ where: { id: parseInt(id), tenant_id } });
        const tarea = await prisma.tareas.findFirst({ where: { id: parseInt(tareaId), tenant_id } });
        
        if (!ot || !tarea) return res.status(404).json({ message: "OT o Tarea no encontrada / Acceso denegado" });

        const resultado = await prisma.$transaction(async (tx) => {
            const stockActual = await tx.unidades_stock.findFirst({
                where: { id: parseInt(unidad_stock_id), tenant_id: tenant_id }, // VALIDAR PROPIEDAD DEL STOCK
                include: { productos: true }
            });

            if (!stockActual || Number(stockActual.cantidad_disponible) < cantidadNumerica) {
                throw new Error(`Stock insuficiente. Disponible: ${stockActual ? stockActual.cantidad_disponible : 0}`);
            }

            const stockActualizado = await tx.unidades_stock.update({
                where: { id: parseInt(unidad_stock_id) },
                data: {
                    cantidad_disponible: Number(stockActual.cantidad_disponible) - cantidadNumerica,
                    estado: (Number(stockActual.cantidad_disponible) - cantidadNumerica) <= 0 ? 'sin_stock' :
                        (Number(stockActual.cantidad_disponible) - cantidadNumerica) <= Number(stockActual.productos.stock_minimo) ? 'bajo_stock' : 'disponible'
                }
            });

            await tx.movimientos.create({
                data: {
                    tenant_id: tenant_id, // INYECTAR TENANT_ID AL HISTORIAL
                    unidad_stock_id: stockActualizado.id,
                    tipo: 'SALIDA',
                    cantidad_movida: cantidadNumerica,
                    referencia_tipo: 'OT',
                    referencia_id: parseInt(id),
                    usuario_id: usuario_id ? parseInt(usuario_id) : null,
                    motivo: `Consumo en OT-${ot.folio}, Tarea-${tareaId}`
                }
            });

            const consumo = await tx.consumo_ot.create({
                data: { tarea_id: parseInt(tareaId), unidad_stock_id: stockActualizado.id, cantidad_utilizada: cantidadNumerica }
            });

            const costoAdicional = cantidadNumerica * Number(stockActual.productos.precio_compra);
            const nuevoCostoReal = Number(ot.costo_real) + costoAdicional;
            const nuevoMargenReal = Number(ot.precio_venta) - nuevoCostoReal;
            
            let nuevoMargenPorcentaje = 0;
            if (Number(ot.precio_venta) > 0) nuevoMargenPorcentaje = (nuevoMargenReal / Number(ot.precio_venta)) * 100;
            else if (nuevoCostoReal > 0) nuevoMargenPorcentaje = -100;

            const otActualizada = await tx.ordenes_trabajo.update({
                where: { id: parseInt(id) },
                data: { costo_real: nuevoCostoReal, margen_real: nuevoMargenReal, margen_porcentaje: nuevoMargenPorcentaje }
            });

            return { consumo, otActualizada, stockActualizado };
        });

        res.status(201).json({ message: "Material consumido", data: resultado });
    } catch (error) {
        console.error("Error al cargar material:", error);
        res.status(error.message.includes("Stock") ? 400 : 500).json({ message: error.message || "Error interno" });
    }
};

const cargarHoras = async (req, res) => {
    try {
        const { id, tareaId } = req.params;
        const tenant_id = req.user.tenant_id;
        const { operario_id, equipo_id, horas, descripcion } = req.body;
        const horasNumericas = Number(horas);

        if (horasNumericas <= 0) return res.status(400).json({ message: "La cantidad de horas debe ser mayor a 0" });
        if (!operario_id && !equipo_id) return res.status(400).json({ message: "Envía operario_id o equipo_id" });

        const ot = await prisma.ordenes_trabajo.findFirst({ where: { id: parseInt(id), tenant_id } });
        const tarea = await prisma.tareas.findFirst({ where: { id: parseInt(tareaId), tenant_id } });
        if (!ot || !tarea) return res.status(404).json({ message: "OT/Tarea no encontrada" });

        const resultado = await prisma.$transaction(async (tx) => {
            let tarifa_hora = 0;
            let tipo_registro = "";

            if (operario_id) {
                const operario = await tx.operarios.findFirst({ where: { id: parseInt(operario_id), tenant_id } });
                if (!operario) throw new Error("Operario no pertenece a esta empresa.");
                tarifa_hora = Number(operario.valor_hora || 0);
                tipo_registro = "HH";
            } else if (equipo_id) {
                const equipo = await tx.equipos.findFirst({ where: { id: parseInt(equipo_id), tenant_id } });
                if (!equipo) throw new Error("Máquina no pertenece a esta empresa.");
                tarifa_hora = Number(equipo.valor_hora || 0);
                tipo_registro = "HM";
            }

            if (tarifa_hora <= 0) throw new Error(`El recurso no tiene tarifa (> 0).`);

            const costoTotalHoras = horasNumericas * tarifa_hora;

            const registro = await tx.registro_tiempo.create({
                data: {
                    tarea_id: parseInt(tareaId), operario_id: operario_id ? parseInt(operario_id) : null,
                    equipo_id: equipo_id ? parseInt(equipo_id) : null, horas: horasNumericas,
                    costo_total: costoTotalHoras, descripcion: descripcion || `Carga manual de ${tipo_registro}`
                }
            });

            const nuevoCostoReal = Number(ot.costo_real || 0) + costoTotalHoras;
            const precioVenta = Number(ot.precio_venta || 0);
            const nuevoMargenReal = precioVenta - nuevoCostoReal;
            
            let nuevoMargenPorcentaje = 0;
            if (precioVenta > 0) nuevoMargenPorcentaje = (nuevoMargenReal / precioVenta) * 100;
            else if (nuevoCostoReal > 0) nuevoMargenPorcentaje = -100;

            const otActualizada = await tx.ordenes_trabajo.update({
                where: { id: parseInt(id) },
                data: { costo_real: nuevoCostoReal, margen_real: nuevoMargenReal, margen_porcentaje: nuevoMargenPorcentaje }
            });

            return { registro, otActualizada };
        });

        res.status(201).json({ message: "Horas registradas", data: resultado });
    } catch (error) {
        console.error("Error en carga de horas:", error);
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

        const tareaActual = await prisma.tareas.findFirst({ where: { id: parseInt(tareaId), tenant_id } });
        if (!tareaActual) return res.status(404).json({ message: "Tarea no encontrada." });

        let dataToUpdate = { estado };

        if (estado === 'en_proceso') {
            if (!tareaActual.fecha_inicio_real) dataToUpdate.fecha_inicio_real = new Date();
            if (tareaActual.estado === 'pausada') {
                await prisma.pausas_tarea.updateMany({
                    where: { tarea_id: parseInt(tareaId), fecha_reanudacion: null },
                    data: { fecha_reanudacion: new Date() }
                });
            }
        } else if (estado === 'pausada') {
            if (!motivo || !motivo.trim()) return res.status(400).json({ message: "El motivo de pausa es obligatorio." });
            await prisma.pausas_tarea.create({ data: { tarea_id: parseInt(tareaId), motivo: motivo.trim() } });
        } else if (estado === 'completada') {
            dataToUpdate.fecha_fin_real = new Date();
            if (!tareaActual.fecha_inicio_real) dataToUpdate.fecha_inicio_real = new Date();
            if (tareaActual.estado === 'pausada') {
                await prisma.pausas_tarea.updateMany({
                    where: { tarea_id: parseInt(tareaId), fecha_reanudacion: null },
                    data: { fecha_reanudacion: new Date() }
                });
            }
        }

        const tareaActualizada = await prisma.tareas.update({ where: { id: parseInt(tareaId) }, data: dataToUpdate });

        if (estado === 'completada') {
            await prisma.tareas.updateMany({
                where: { dependencia_id: parseInt(tareaId), estado: 'bloqueada', tenant_id: tenant_id },
                data: { estado: 'pendiente' }
            });
        }

        res.json({ message: `Tarea marcada como ${estado}`, data: tareaActualizada });
    } catch (error) {
        console.error("Error al actualizar estado:", error);
        res.status(500).json({ message: "Error interno al cambiar el estado." });
    }
};

const createOTDirecta = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const { entidad_id, precio_venta } = req.body;

        if (!entidad_id) return res.status(400).json({ message: "Debe seleccionar un cliente." });

        const cliente = await prisma.entidades.findFirst({ where: { id: parseInt(entidad_id), tenant_id } });
        if (!cliente) return res.status(404).json({ message: "Cliente no pertenece a esta empresa." });

        // Aislamiento de folio: Solo cuenta las OTs directas de ESTA empresa
        const cantidadDirectas = await prisma.ordenes_trabajo.count({
            where: { tenant_id: tenant_id, folio: { startsWith: 'OT-DIR-' } }
        });

        const correlativo = (cantidadDirectas + 1).toString().padStart(4, '0');
        const nuevoFolio = `OT-DIR-${correlativo}`;
        const precio = precio_venta ? Number(precio_venta) : 0;

        const nuevaOT = await prisma.ordenes_trabajo.create({
            data: {
                tenant_id: tenant_id, // INYECCIÓN SAAS VITAL
                folio: nuevoFolio,
                entidad_id: cliente.id,
                cliente_nombre: cliente.nombre,
                estado: 'abierta',
                fecha_inicio: new Date(),
                precio_venta: precio,
                costo_real: 0,
                margen_real: precio,
                margen_porcentaje: precio > 0 ? 100 : 0
            }
        });

        res.status(201).json({ message: "OT Directa creada", data: nuevaOT });
    } catch (error) {
        console.error("Error al crear OT Directa:", error);
        res.status(500).json({ message: "Error interno." });
    }
};

const actualizarEstadoOT = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;
        const { estado } = req.body;

        const estadosValidos = ['abierta', 'en_proceso', 'lista_para_entrega', 'entregada', 'facturada', 'anulada'];
        if (!estadosValidos.includes(estado)) return res.status(400).json({ message: "Estado de OT no válido." });

        // Validar propiedad antes de modificar
        const existe = await prisma.ordenes_trabajo.findFirst({ where: { id: parseInt(id), tenant_id } });
        if (!existe) return res.status(404).json({ message: "OT no encontrada." });

        let dataToUpdate = { estado };
        if (estado === 'facturada') dataToUpdate.fecha_fin = new Date();

        const otActualizada = await prisma.ordenes_trabajo.update({
            where: { id: parseInt(id) },
            data: dataToUpdate
        });

        res.json({ message: `OT movida a: ${estado}`, data: otActualizada });
    } catch (error) {
        console.error("Error Workflow OT:", error);
        res.status(500).json({ message: "Error interno." });
    }
};

const enviarOT = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;
        const { email_interno } = req.body;

        if (!email_interno) return res.status(400).json({ message: "Se requiere un correo." });

        // Aislamiento al guardar historial de correos
        const nombreGenerado = email_interno.split('@')[0];
        
        // Buscamos si el correo existe para esta empresa
        const correoExiste = await prisma.correos_internos.findFirst({
            where: { tenant_id: tenant_id, email: email_interno }
        });

        if (correoExiste) {
            await prisma.correos_internos.update({
                where: { id: correoExiste.id },
                data: { ultimo_uso: new Date() }
            });
        } else {
            await prisma.correos_internos.create({
                data: { tenant_id: tenant_id, email: email_interno, nombre: nombreGenerado, empresa: 'Interno' }
            });
        }

        const ot = await prisma.ordenes_trabajo.findFirst({
            where: { id: parseInt(id), tenant_id: tenant_id },
            include: {
                tareas: { include: { operarios: true }, orderBy: { id: 'asc' } },
                cotizaciones: { include: { detalle_cotizaciones: { include: { productos: true, operarios: true, equipos: true } } } }
            }
        });

        if (!ot) return res.status(404).json({ message: "OT no encontrada" });

        const htmlContent = generarTemplateOT(ot);
        const pdfBase64 = await generarPdfBase64(htmlContent);

        const payloadN8n = {
            tipo_documento: "orden_trabajo", folio: ot.folio,
            cliente_nombre: ot.cliente_nombre || "Uso Interno",
            email_destino: email_interno, pdf_base64: pdfBase64
        };

        await enviarWebhookN8n(payloadN8n);

        const otActualizada = await prisma.ordenes_trabajo.update({
            where: { id: parseInt(id) },
            data: { pdf_base64: pdfBase64 }
        });

        res.status(200).json({ message: "OT enviada", ot: otActualizada });
    } catch (error) {
        console.error("Error en enviarOT:", error);
        res.status(500).json({ message: "Error al enviar PDF", error: error.message });
    }
};

const getCorreosInternos = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const correos = await prisma.correos_internos.findMany({
            where: { tenant_id: tenant_id }, // AISLAMIENTO SAAS
            orderBy: { ultimo_uso: 'desc' },
            take: 10
        });
        res.status(200).json(correos);
    } catch (error) {
        console.error("Error al obtener correos:", error);
        res.status(500).json({ message: "Error al obtener historial" });
    }
};

module.exports = { getOrdenesTrabajo, createTarea, cargarMaterial, cargarHoras, actualizarEstadoTarea, createOTDirecta, actualizarEstadoOT, enviarOT, getCorreosInternos };