const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando siembra de Infraestructura SaaS...');

    const adminPassword = process.env.SUPER_ADMIN_PASSWORD;
    if (!adminPassword) {
        console.error('🚨 ERROR FATAL: SUPER_ADMIN_PASSWORD no está definida en .env');
        process.exit(1);
    }

    // 1. CREAR PLANES POR DEFECTO
    console.log('📦 Creando planes de suscripción...');
    const planBasico = await prisma.planes.upsert({ where: { id: 1 }, update: {}, create: { id: 1, nombre: 'Básico', limite_usuarios: 5, precio_mensual: 0 } });
    const planPro = await prisma.planes.upsert({ where: { id: 2 }, update: {}, create: { id: 2, nombre: 'Pro', limite_usuarios: 20, precio_mensual: 50000 } });
    const planEnterprise = await prisma.planes.upsert({ where: { id: 3 }, update: {}, create: { id: 3, nombre: 'Enterprise', limite_usuarios: 999, precio_mensual: 150000 } });

    await prisma.$executeRaw`SELECT setval('planes_id_seq', (SELECT MAX(id) FROM planes))`;
    console.log('✅ Contador de IDs de planes sincronizado.');

    // 2. CREAR EL TENANT MAESTRO (Asignándole el Plan Enterprise)
    const masterTenant = await prisma.empresas.upsert({
        where: { alias: 'biot' },
        update: {},
        create: { nombre: 'BIOT Master', rut: '99999999-9', alias: 'biot', activo: true, plan_id: planEnterprise.id }
    });

    console.log(`🏢 Tenant Maestro asegurado: ${masterTenant.nombre}`);

    // 3. CREAR AL SUPER ADMIN
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const superAdmin = await prisma.usuarios.upsert({
        where: { email: 'sadmin@biot.cl' },
        update: { rol: 'super_admin', password: passwordHash },
        create: { tenant_id: masterTenant.id, nombre: 'Super Admin', email: 'sadmin@biot.cl', password: passwordHash, rol: 'super_admin', activo: true },
    });

    console.log(`👑 Super Admin ha entrado al servidor.`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => await prisma.$disconnect());