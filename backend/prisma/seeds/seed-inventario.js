const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('📦 Sembrando Inventario Físico (Bodega de Empresa 1)...');

    const TENANT_ID = 2;

    // 1. Limpiar inventario anterior del tenant para no duplicar
    await prisma.movimiento.deleteMany({ where: { tenant_id: TENANT_ID } });
    await prisma.unidadStock.deleteMany({ where: { tenant_id: TENANT_ID } });
    console.log('🧹 Inventario de Empresa 1 limpiado.');

    // 2. Asegurar que exista la Bodega Central para esta empresa
    let bodega = await prisma.ubicacion.findFirst({
        where: { tenant_id: TENANT_ID, bodega: 'Bodega Central' }
    });

    if (!bodega) {
        bodega = await prisma.ubicacion.create({
            data: {
                tenant_id: TENANT_ID,
                centro: 'Nave Principal',
                bodega: 'Bodega Central',
                ubicacion: 'Estante A-01',
                nivel: '1'
            }
        });
    }
    console.log(`📍 Ubicación base lista: ${bodega.bodega}`);

    // 3. Buscar los productos en la BD de este tenant
    const codigosMateriales = [
        'MAT.CON.001',   // Electrodo
        'MAT.ACE.001',   // Plancha
        'MAT.PER.001',   // Perfil
        'MAT.CON.002',   // Disco de corte
        'MAT.GAS.001'    // Gas
    ];

    const productosDb = await prisma.producto.findMany({
        where: {
            tenant_id: TENANT_ID,
            codigo: { in: codigosMateriales }
        }
    });

    if (productosDb.length === 0) {
        console.error('❌ No se encontraron productos. Ejecuta primero el seed de Catálogos.');
        return;
    }

    // 4. Inyectar Stock Físico
    for (const prod of productosDb) {
        const esGranel = prod.codigo.includes('CON') || prod.codigo.includes('GAS');
        const cantidadInicial = esGranel ? 150 : 20;

        // Creamos la "caja" en bodega usando la nueva convención de singular
        const stock = await prisma.unidadStock.create({
            data: {
                tenant_id: TENANT_ID,
                producto_id: prod.id,
                ubicacion_id: bodega.id,
                cantidad_total: cantidadInicial,
                cantidad_disponible: cantidadInicial,
                cantidad_reservada: 0,
                tipo_unit: esGranel ? 'GRANEL' : 'LOTE',
                es_agregado: esGranel,
                estado: 'disponible'
            }
        });

        // Dejamos registro del movimiento atado al tenant
        await prisma.movimiento.create({
            data: {
                tenant_id: TENANT_ID,
                unidad_stock_id: stock.id,
                tipo: 'ENTRADA',
                cantidad_movida: cantidadInicial,
                referencia_tipo: 'SISTEMA',
                motivo: 'Inventario Inicial (Carga Automática)',
                usuario_id: null // Generado por el sistema
            }
        });

        console.log(`✅ Ingresado a bodega: [${prod.codigo}] ${prod.nombre} -> ${cantidadInicial} ${prod.unidad_base}`);
    }

    console.log('🏆 ¡Inventario físico inyectado con éxito!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });