const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Sembrando Catálogos Maestros (Nomenclatura 3x3) para Empresa 1...');

    // 🛡️ INYECCIÓN SAAS: Todo debe pertenecer a un inquilino
    const TENANT_ID = 2;

    // ==========================================
    // 1. CATÁLOGO DE MATERIALES (MAT)
    // ==========================================
    const materiales = [
        { tenant_id: TENANT_ID, codigo: 'MAT.CON.001', nombre: 'Electrodo Celulósico 6011 3/32" INDURA', tipo_medicion: 'PESO', unidad_base: 'KG', precio_compra: 4500, precio_venta: 8500, stock_minimo: 15, permite_retazo: false, activo: true },
        { tenant_id: TENANT_ID, codigo: 'MAT.ACE.001', nombre: 'Plancha Acero Carbono ASTM A36 5mm', tipo_medicion: 'UNIDAD', unidad_base: 'UN', precio_compra: 45000, precio_venta: 75000, stock_minimo: 5, permite_retazo: true, activo: true },
        { tenant_id: TENANT_ID, codigo: 'MAT.PER.001', nombre: 'Perfil Cuadrado Acero 100x100x3mm', tipo_medicion: 'LONGITUD', unidad_base: 'TIRA', precio_compra: 22000, precio_venta: 38000, stock_minimo: 10, permite_retazo: true, activo: true },
        { tenant_id: TENANT_ID, codigo: 'MAT.CON.002', nombre: 'Disco de Corte Inox 4.5" Makita', tipo_medicion: 'UNIDAD', unidad_base: 'UN', precio_compra: 1200, precio_venta: 2500, stock_minimo: 50, permite_retazo: false, activo: true },
        { tenant_id: TENANT_ID, codigo: 'MAT.GAS.001', nombre: 'Cilindro Gas Argón Indura (Recarga)', tipo_medicion: 'UNIDAD', unidad_base: 'CIL', precio_compra: 35000, precio_venta: 55000, stock_minimo: 2, permite_retazo: false, activo: true }
    ];

    await prisma.producto.createMany({ data: materiales, skipDuplicates: true });
    console.log(`✅ Registrados Materiales (MAT).`);

    // ==========================================
    // 2. CATÁLOGO DE MANO DE OBRA (HH)
    // ==========================================
    const operarios = [
        { tenant_id: TENANT_ID, codigo: 'OPE.SOL.001', nombre: 'Juan Pérez', especialidad: 'Soldador Calificado 6G', email: 'sigm4q@gmail.com', valor_hora: 8500, celular: '+56911111111', activo: true },
        { tenant_id: TENANT_ID, codigo: 'OPE.MEC.001', nombre: 'Carlos Soto', especialidad: 'Tornero CNC', email: 'sigm4q@gmail.com', valor_hora: 9500, celular: '+56922222222', activo: true },
        { tenant_id: TENANT_ID, codigo: 'OPE.AYU.001', nombre: 'Luis Tapia', especialidad: 'Ayudante Estructural', email: 'sigm4q@gmail.com', valor_hora: 5000, celular: '+56933333333', activo: true }
    ];

    await prisma.operario.createMany({ data: operarios, skipDuplicates: true });
    console.log(`✅ Registrados Operarios (OPE).`);

    // ==========================================
    // 3. CATÁLOGO DE EQUIPOS (HM)
    // ==========================================
    const equipos = [
        { tenant_id: TENANT_ID, codigo: 'MAQ.SOL.001', nombre: 'Soldadora Inverter Kemppi 250A', tipo: 'Soldadura', valor_hora: 4500, ubicacion: 'Taller 1', activo: true },
        { tenant_id: TENANT_ID, codigo: 'MAQ.CNC.001', nombre: 'Torno CNC Haas', tipo: 'Mecanizado', valor_hora: 18000, ubicacion: 'Taller de Precisión', activo: true },
        { tenant_id: TENANT_ID, codigo: 'MAQ.COR.001', nombre: 'Pantógrafo Plasma Hypertherm', tipo: 'Corte', valor_hora: 12000, ubicacion: 'Nave de Corte', activo: true }
    ];

    await prisma.equipo.createMany({ data: equipos, skipDuplicates: true });
    console.log(`✅ Registrados Equipos (MAQ).`);

    // ==========================================
    // 4. CATÁLOGO DE TAREAS (TAR)
    // ==========================================
    const tareas = [
        { tenant_id: TENANT_ID, codigo: 'TAR.DIS.001', nombre: 'Diseño CAD y Planos', descripcion: 'Modelado 3D y generación de planos de fabricación.', activo: true },
        { tenant_id: TENANT_ID, codigo: 'TAR.FAB.001', nombre: 'Fabricación y Armado', descripcion: 'Corte, dimensionado y punteo de estructuras.', activo: true },
        { tenant_id: TENANT_ID, codigo: 'TAR.MEC.001', nombre: 'Mecanizado de Precisión', descripcion: 'Tornería, fresado y ajuste de piezas.', activo: true },
        { tenant_id: TENANT_ID, codigo: 'TAR.SOL.001', nombre: 'Soldadura Estructural', descripcion: 'Aplicación de cordones de soldadura según plano.', activo: true },
        { tenant_id: TENANT_ID, codigo: 'TAR.CAL.001', nombre: 'Control de Calidad', descripcion: 'Pruebas no destructivas y medición de tolerancias.', activo: true }
    ];

    await prisma.catalogoTarea.createMany({ data: tareas, skipDuplicates: true });
    console.log(`✅ Registrados Tipos de Tareas (TAR).`);

    console.log('🏆 ¡Catálogos inyectados con éxito en Empresa 1!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });