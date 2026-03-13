const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAdminMetrics = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;

        // 1. Cotizaciones Activas (Borrador o Enviada)
        const cotizacionesActivas = await prisma.cotizacion.count({
            where: {
                tenant_id,
                estado: { in: ['borrador', 'enviada'] }
            }
        });

        // 2. Órdenes en Curso (Abierta o En Proceso)
        const ordenesEnCurso = await prisma.ordenTrabajo.count({
            where: {
                tenant_id,
                estado: { in: ['abierta', 'en_proceso'] }
            }
        });

        // 3. Alertas de Inventario (Bajo Stock o Sin Stock)
        // Usamos la misma lógica que en los controladores para mantener consistencia
        const alertasInventario = await prisma.unidadStock.count({
            where: {
                tenant_id,
                estado: { in: ['bajo_stock', 'sin_stock'] }
            }
        });

        res.json({
            cotizacionesActivas,
            ordenesEnCurso,
            alertasInventario
        });
    } catch (error) {
        console.error('Error al obtener métricas del dashboard:', error);
        res.status(500).json({ error: 'Error al obtener métricas' });
    }
};

module.exports = {
    getAdminMetrics
};
