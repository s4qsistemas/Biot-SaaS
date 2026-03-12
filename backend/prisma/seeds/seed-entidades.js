const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Sembrando Entidades (SaaS - Empresa 1)...');

    const TENANT_ID = 2;

    const entidades = [
        // --- 1. PROVEEDOR (1 Activo) ---
        {
            tenant_id: TENANT_ID,
            rut: '65432198-1',
            nombre: 'Compañía Siderúrgica Huachipato S.A. (CAP)',
            tipo: 'proveedor',
            giro: 'Fabricación y venta de acero',
            direccion: 'Av. Gran Bretaña 2910',
            comuna: 'Talcahuano',
            ciudad: 'Talcahuano',
            telefono: '+56 41 250 3000',
            email: 'sigm4q@gmail.com',
            contacto_nombre: 'Marcela Silva',
            activo: true
        },
        // --- 2. CLIENTES (3 en total: 2 Activos, 1 Inactivo) ---
        {
            tenant_id: TENANT_ID,
            rut: '76543210-3',
            nombre: 'Astilleros y Maestranzas de la Armada (ASMAR)',
            tipo: 'cliente',
            giro: 'Construcción y reparación naval',
            direccion: 'Av. Jorge Alessandri 036',
            comuna: 'Talcahuano',
            ciudad: 'Talcahuano',
            telefono: '+56 41 274 4000',
            email: 'sigm4q@gmail.com',
            contacto_nombre: 'Roberto Gómez',
            activo: true
        },
        {
            tenant_id: TENANT_ID,
            rut: '99888777-K',
            nombre: 'Blumar Seafoods',
            tipo: 'cliente',
            giro: 'Industria pesquera',
            direccion: 'Av. Colón 2400',
            comuna: 'Talcahuano',
            ciudad: 'Talcahuano',
            telefono: '+56 41 226 8000',
            email: 'sigm4q@gmail.com',
            contacto_nombre: 'Felipe Arriagada',
            activo: true
        },
        // --- 3. MIXTOS (2 en total: 1 Activo, 1 Inactivo) ---
        {
            tenant_id: TENANT_ID,
            rut: '55444333-8',
            nombre: 'Orizon S.A.',
            tipo: 'mixto',
            giro: 'Pesca industrial y provisión naval',
            direccion: 'Av. La Marina 1500',
            comuna: 'Coronel',
            ciudad: 'Concepción',
            telefono: '+56 41 290 8800',
            email: 'sigm4q@gmail.com',
            contacto_nombre: 'Andrea Vergara',
            activo: true
        },
        {
            tenant_id: TENANT_ID,
            rut: '88777666-0',
            nombre: 'Servicios Marítimos Talcahuano E.I.R.L.',
            tipo: 'mixto',
            giro: 'Mantención de boyas y redes',
            direccion: 'Sector San Vicente Lote 4',
            comuna: 'Talcahuano',
            ciudad: 'Talcahuano',
            telefono: '+56 41 255 9999',
            email: 'sigm4q@gmail.com',
            contacto_nombre: 'Carlos Pinto',
            activo: false // ❌ INACTIVO
        }
    ];

    await prisma.entidad.createMany({
        data: entidades,
        skipDuplicates: true // Ignora si ya existe la combinación tenant_id + rut
    });

    console.log(`✅ Registradas ${entidades.length} entidades de prueba.`);
    console.log('🏆 ¡Entidades inyectadas con éxito!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });