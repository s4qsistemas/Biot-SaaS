const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getInventario = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const inventario = await prisma.unidadStock.findMany({
            where: { tenant_id: tenant_id },
            include: { producto: true, ubicacion: true },
            orderBy: { producto: { nombre: 'asc' } }
        });
        res.json(inventario);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener inventario' });
    }
};

const getHistorial = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;

        const historial = await prisma.movimiento.findMany({
            where: { unidad_stock_id: parseInt(id), tenant_id: tenant_id },
            include: { usuario: { select: { nombre: true } } },
            orderBy: { created_at: 'desc' }
        });
        res.json(historial);
    } catch (error) {
        res.status(500).json({ message: 'Error al cargar el historial' });
    }
};

const registrarMovimiento = async (req, res) => {
    try {
        const { inventario_id, tipo_movimiento, cantidad, motivo } = req.body;
        const tenant_id = req.user.tenant_id;
        const usuario_id = req.user.id;
        const cantidadMovimiento = Number(cantidad);

        if (cantidadMovimiento <= 0) return res.status(400).json({ message: 'Cantidad inválida' });

        const itemActual = await prisma.unidadStock.findFirst({
            where: { id: parseInt(inventario_id), tenant_id: tenant_id },
            include: { producto: true }
        });

        if (!itemActual) return res.status(404).json({ message: 'Item no encontrado' });

        if (tipo_movimiento === 'SALIDA' && Number(itemActual.cantidad_disponible) < cantidadMovimiento) {
            return res.status(400).json({ message: 'Stock insuficiente' });
        }

        const operacionAtomica = tipo_movimiento === 'ENTRADA'
            ? { increment: cantidadMovimiento }
            : { decrement: cantidadMovimiento };

        // Transacción Interactiva para asegurar integridad atómica y recalcular estado
        const stockFinal = await prisma.$transaction(async (tx) => {
            const stockActualizado = await tx.unidadStock.update({
                where: { id: parseInt(inventario_id) },
                data: { cantidad_disponible: operacionAtomica }
            });

            // Recalcular estado basado en el resultado atómico real
            let nuevoEstado = 'disponible';
            if (Number(stockActualizado.cantidad_disponible) <= 0) {
                nuevoEstado = 'sin_stock';
            } else if (Number(stockActualizado.cantidad_disponible) <= Number(itemActual.producto?.stock_minimo || 0)) {
                nuevoEstado = 'bajo_stock';
            }

            if (stockActualizado.estado !== nuevoEstado) {
                await tx.unidadStock.update({
                    where: { id: parseInt(inventario_id) },
                    data: { estado: nuevoEstado }
                });
            }

            await tx.movimiento.create({
                data: {
                    tenant_id,
                    unidad_stock_id: parseInt(inventario_id),
                    usuario_id: parseInt(usuario_id),
                    tipo: tipo_movimiento,
                    cantidad_movida: cantidadMovimiento,
                    motivo,
                    referencia_tipo: 'MANUAL',
                }
            });

            return stockActualizado;
        });

        res.json({ message: 'Movimiento registrado', nuevo_stock: stockFinal.cantidad_disponible });
    } catch (error) {
        console.error('Error al registrar movimiento:', error);
        res.status(500).json({ message: 'Error procesando el movimiento' });
    }
};

const inicializarStock = async (req, res) => {
    try {
        const { producto_id, tipo_unidad, cantidad, ubicacion_id } = req.body;
        const tenant_id = req.user.tenant_id;

        if (!producto_id || !cantidad) return res.status(400).json({ message: "Faltan datos obligatorios" });

        const productoValido = await prisma.producto.findFirst({
            where: { id: parseInt(producto_id), tenant_id: tenant_id }
        });

        if (!productoValido) return res.status(404).json({ message: "Producto no válido" });

        // Calcular estado inicial basado en stock mínimo del producto
        let nuevoEstado = 'disponible';
        const stockMinimo = Number(productoValido.stock_minimo || 0);
        const cantidadInicial = parseFloat(cantidad);

        if (cantidadInicial <= 0) {
            nuevoEstado = 'sin_stock';
        } else if (cantidadInicial <= stockMinimo) {
            nuevoEstado = 'bajo_stock';
        }

        // Simplificación de llaves foráneas usando IDs escalares
        const nuevoStock = await prisma.unidadStock.create({
            data: {
                tenant_id,
                producto_id: parseInt(producto_id),
                ubicacion_id: ubicacion_id ? parseInt(ubicacion_id) : null,
                cantidad_total: cantidadInicial,
                cantidad_disponible: cantidadInicial,
                cantidad_reservada: 0,
                tipo_unit: tipo_unidad || 'GRANEL',
                es_agregado: tipo_unidad === 'GRANEL',
                estado: nuevoEstado,
            }
        });

        res.status(201).json(nuevoStock);
    } catch (error) {
        console.error("Error al inicializar stock:", error);
        res.status(500).json({ message: 'Error interno' });
    }
};

module.exports = { getInventario, getHistorial, registrarMovimiento, inicializarStock };