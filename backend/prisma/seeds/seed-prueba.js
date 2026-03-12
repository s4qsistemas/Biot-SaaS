// ==========================================
// PRUEBA DE FUEGO: NÚCLEO OPERATIVO (Empresa 1)
// ==========================================
console.log('⚙️ Inyectando núcleo operativo para Empresa 1...');

// 1. Crear Entidad (Cliente)
const cliente = await prisma.entidad.create({
    data: {
        tenant_id: emp1.id,
        nombre: 'Constructora Acero Sur',
        rut: '77777777-7',
        tipo: 'cliente',
        giro: 'Construcción',
        activo: true
    }
});

// 2. Crear Catálogos (Producto, Operario, Equipo)
const producto = await prisma.producto.create({
    data: {
        tenant_id: emp1.id,
        codigo: 'VIGA-IPN-200',
        nombre: 'Viga IPN 200mm',
        precio_compra: 45000,
        precio_venta: 65000,
        activo: true
    }
});

const operario = await prisma.operario.create({
    data: {
        tenant_id: emp1.id,
        codigo: 'OP-001',
        nombre: 'Carlos Soldador',
        especialidad: 'Soldadura TIG',
        valor_hora: 8500,
        activo: true
    }
});

const equipo = await prisma.equipo.create({
    data: {
        tenant_id: emp1.id,
        codigo: 'MAQ-01',
        nombre: 'Torno CNC',
        valor_hora: 15000,
        activo: true
    }
});

// 3. Crear Cotización (Requiere entidad_id obligatorio por el refactor)
const cotizacion = await prisma.cotizacion.create({
    data: {
        tenant_id: emp1.id,
        entidad_id: cliente.id, // AHORA OBLIGATORIO
        cliente_nombre: cliente.nombre,
        folio: 'COT-2026-001',
        monto_neto: 150000,
        monto_iva: 28500,
        monto_total: 178500,
        estado: 'aprobada'
    }
});

// 4. Crear Detalle de Cotización (Requiere IDs obligatorios)
await prisma.detalleCotizacion.create({
    data: {
        cotizacion_id: cotizacion.id,
        tipo_item: 'producto',
        producto_id: producto.id, // AHORA OBLIGATORIO
        descripcion: 'Viga principal dimensionada',
        cantidad: 2,
        unitario: 65000,
        total: 130000
    }
});

// 5. Crear Orden de Trabajo (Depende de Cotización y Entidad)
await prisma.ordenTrabajo.create({
    data: {
        tenant_id: emp1.id,
        cotizacion_id: cotizacion.id, // AHORA OBLIGATORIO
        entidad_id: cliente.id,       // AHORA OBLIGATORIO
        folio: 'OT-2026-001',
        cliente_nombre: cliente.nombre,
        estado: 'en_progreso',
        costo_estimado: 90000,
        precio_venta: 178500
    }
});