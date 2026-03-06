const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==========================================
// 📦 Obtener todo el inventario (Stock físico)
// ==========================================
const getInventario = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;

        const inventario = await prisma.unidades_stock.findMany({
            where: { tenant_id: tenant_id },
            include: {
                productos: true,
                ubicaciones: true
            },
            orderBy: {
                productos: { nombre: 'asc' }
            }
        });
        res.json(inventario);
    } catch (error) {
        console.error("Error al obtener inventario:", error);
        res.status(500).json({ error: 'Error al obtener inventario' });
    }
};

// ==========================================
// 📜 Obtener historial de movimientos
// ==========================================
const getHistorial = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;

        const historial = await prisma.movimientos.findMany({
            where: {
                unidad_stock_id: parseInt(id),
                tenant_id: tenant_id
            },
            include: {
                usuario: { select: { nombre: true } }
            },
            orderBy: { created_at: 'desc' }
        });

        res.json(historial);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ message: 'Error interno al cargar el historial' });
    }
};

// ==========================================
// 🔄 Registrar movimiento (Entrada/Salida)
// ==========================================
const registrarMovimiento = async (req, res) => {
    try {
        const { inventario_id, tipo_movimiento, cantidad, motivo } = req.body;
        const tenant_id = req.user.tenant_id;
        const usuario_id = req.user.id;

        // 1. Validar que el item exista y PERTENEZCA a la empresa actual
        const itemActual = await prisma.unidades_stock.findFirst({
            where: { id: parseInt(inventario_id), tenant_id: tenant_id },
            include: { productos: true }
        });

        if (!itemActual) {
            return res.status(404).json({ message: 'Item no encontrado en su bodega o acceso denegado' });
        }

        // 2. Calculamos la matemática del nuevo stock
        let nuevoStock = Number(itemActual.cantidad_disponible);
        const cantidadMovimiento = Number(cantidad);

        if (tipo_movimiento === 'ENTRADA') {
            nuevoStock += cantidadMovimiento;
        } else if (tipo_movimiento === 'SALIDA') {
            if (nuevoStock < cantidadMovimiento) {
                return res.status(400).json({ message: 'Stock insuficiente para realizar esta salida' });
            }
            nuevoStock -= cantidadMovimiento;
        } else {
            return res.status(400).json({ message: 'Tipo de movimiento inválido' });
        }

        // 3. 🛡️ TRANSACCIÓN: Actualizamos stock Y creamos historial (ambos amarrados al tenant)
        const resultado = await prisma.$transaction([
            prisma.unidades_stock.update({
                where: { id: parseInt(inventario_id) },
                data: {
                    cantidad_disponible: nuevoStock,
                    estado: nuevoStock <= 0 ? 'sin_stock'
                        : nuevoStock <= Number(itemActual.productos?.stock_minimo || 0) ? 'bajo_stock'
                            : 'disponible'
                }
            }),

            prisma.movimientos.create({
                data: {
                    tenant_id: tenant_id,
                    unidad_stock_id: parseInt(inventario_id),
                    usuario_id: parseInt(usuario_id),
                    tipo: tipo_movimiento,
                    cantidad_movida: cantidadMovimiento,
                    motivo: motivo,
                    referencia_tipo: 'MANUAL',
                }
            })
        ]);

        res.json({
            message: 'Movimiento registrado con éxito',
            nuevo_stock: resultado[0].cantidad_disponible
        });

    } catch (error) {
        console.error('Error al registrar movimiento:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar el movimiento' });
    }
};

// ==========================================
// 📦 Inicializar stock (Crear nueva caja/lote)
// ==========================================
const inicializarStock = async (req, res) => {
    try {
        const { producto_id, tipo_unidad, cantidad, ubicacion_id } = req.body;
        const tenant_id = req.user.tenant_id;

        if (!producto_id || !cantidad) {
            return res.status(400).json({ message: "Faltan datos obligatorios" });
        }

        // 1. Validar que el producto al que le van a crear stock pertenece a SU empresa
        const productoValido = await prisma.productos.findFirst({
            where: { id: parseInt(producto_id), tenant_id: tenant_id }
        });

        if (!productoValido) {
            return res.status(404).json({ message: "El producto no existe o pertenece a otra empresa" });
        }

        // 2. Armar el objeto de inserción
        const dataInsert = {
            tenant_id: tenant_id,
            productos: { connect: { id: parseInt(producto_id) } },
            cantidad_total: parseFloat(cantidad),
            cantidad_disponible: parseFloat(cantidad),
            cantidad_reservada: 0,
            tipo_unit: tipo_unidad || 'GRANEL',
            es_agregado: tipo_unidad === 'GRANEL',
            estado: 'disponible',
        };

        if (ubicacion_id) {
            dataInsert.ubicaciones = { connect: { id: parseInt(ubicacion_id) } };
        }

        const nuevoStock = await prisma.unidades_stock.create({
            data: dataInsert
        });

        res.status(201).json(nuevoStock);
    } catch (error) {
        console.error("🔥 Error al inicializar stock:", error);
        res.status(500).json({ message: 'Error interno al inicializar stock', error: error.message });
    }
};

module.exports = {
    getInventario,
    getHistorial,
    registrarMovimiento,
    inicializarStock
};