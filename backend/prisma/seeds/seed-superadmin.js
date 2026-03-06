const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando siembra de Infraestructura SaaS (Tenant Maestro y Super Admin)...');

    // 1. CAPTURAR Y VALIDAR LA CONTRASEÑA DEL .ENV
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!adminPassword) {
        console.error('🚨 ERROR FATAL: La variable SUPER_ADMIN_PASSWORD no está definida en el archivo .env');
        process.exit(1);
    }

    // 2. CREAR EL TENANT MAESTRO
    const masterTenant = await prisma.empresas.upsert({
        where: { subdominio: 'admin-biot' },
        update: {},
        create: {
            nombre: 'Biot SaaS (Plataforma Central)',
            rut: '00000000-0',
            subdominio: 'admin-biot',
            activo: true
        }
    });

    console.log(`🏢 Tenant Maestro asegurado: ${masterTenant.nombre} (ID: ${masterTenant.id})`);

    // 3. ENCRIPTAR LA CONTRASEÑA DINÁMICA
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // 4. CREAR AL SUPER ADMIN
    const superAdmin = await prisma.usuarios.upsert({
        where: { email: 'sadmin@biot.cl' },
        update: {
            rol: 'super_admin',
            password: passwordHash
        },
        create: {
            tenant_id: masterTenant.id,
            nombre: 'Super Admin',
            email: 'sadmin@biot.cl',
            password: passwordHash,
            rol: 'super_admin',
            activo: true
        },
    });

    console.log(`👑 Super Admin ha entrado al servidor: ${superAdmin.nombre} (${superAdmin.rol})`);
    console.log(`🔒 Contraseña cargada de forma segura desde el entorno local.`);
}

main()
    .catch(e => {
        console.error('❌ Error crítico en la siembra:', e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());