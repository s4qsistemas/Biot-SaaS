const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando inyección de datos (Seed)...');

    // 1. GENERAR CONTRASEÑA UNIVERSAL (123456)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // 2. CREAR PLANES COMERCIALES
    // Al crearlos en este orden, Trial será el ID 4 (como lo tienes programado en el controller)
    const planBasico = await prisma.planes.create({ data: { nombre: 'Básico', limite_usuarios: 5, precio_mensual: 15000, activo: true } });
    const planPro = await prisma.planes.create({ data: { nombre: 'Pro', limite_usuarios: 20, precio_mensual: 50000, activo: true } });
    const planEnterprise = await prisma.planes.create({ data: { nombre: 'Enterprise', limite_usuarios: 999, precio_mensual: 150000, activo: true } });
    const planTrial = await prisma.planes.create({ data: { nombre: 'Trial 14 Días', limite_usuarios: 5, precio_mensual: 0, activo: true } });

    // 3. FECHAS CLAVE PARA TESTEAR EL ENRUTADOR
    const hoy = new Date();
    const en10Dias = new Date(hoy); en10Dias.setDate(hoy.getDate() + 10);
    const en2Dias = new Date(hoy); en2Dias.setDate(hoy.getDate() + 2);
    const hace2Dias = new Date(hoy); hace2Dias.setDate(hoy.getDate() - 2);

    // ==========================================
    // USUARIO ROOT (INMUNE AL PAYWALL)
    // ==========================================
    const empresaRoot = await prisma.empresas.create({
        data: { nombre: 'Biot SaaS (Admin)', rut: '99999999-9', alias: 'root', activo: true }
    });
    await prisma.usuarios.create({
        data: { tenant_id: empresaRoot.id, email: 'superadmin@biot.cl', nombre: 'Super Admin', password: hashedPassword, rol: 'super_admin', activo: true, debe_cambiar_password: false }
    });

    // ==========================================
    // CASO 1: CLIENTE NORMAL (Trial con tiempo de sobra)
    // RESULTADO ESPERADO: Entra directo. Ve banner Azul.
    // ==========================================
    const emp1 = await prisma.empresas.create({
        data: { nombre: 'Empresa 1 (Trial Sano)', rut: '11111111-1', alias: 'empresa1', activo: true, plan_id: planTrial.id, fecha_vencimiento: en10Dias }
    });
    await prisma.usuarios.create({
        data: { tenant_id: emp1.id, email: 'admin1@empresa1.cl', nombre: 'Admin 1', password: hashedPassword, rol: 'admin', activo: true, debe_cambiar_password: false }
    });

    // ==========================================
    // CASO 2: CLIENTE URGENTE (Plan de pago, quedan 2 días)
    // RESULTADO ESPERADO: Entra directo. Ve banner Rojo de advertencia.
    // ==========================================
    const emp2 = await prisma.empresas.create({
        data: { nombre: 'Empresa 2 (Alerta 3 Días)', rut: '22222222-2', alias: 'empresa2', activo: true, plan_id: planBasico.id, fecha_vencimiento: en2Dias }
    });
    await prisma.usuarios.create({
        data: { tenant_id: emp2.id, email: 'admin2@empresa2.cl', nombre: 'Admin 2', password: hashedPassword, rol: 'admin', activo: true, debe_cambiar_password: false }
    });

    // ==========================================
    // CASO 3: CLIENTE EXPIRADO (Paywall para el Admin)
    // RESULTADO ESPERADO: Secuestro a /paywall. Ve formulario de transferencia.
    // ==========================================
    const emp3 = await prisma.empresas.create({
        data: { nombre: 'Empresa 3 (Expirada)', rut: '33333333-3', alias: 'empresa3', activo: true, plan_id: planPro.id, fecha_vencimiento: hace2Dias }
    });
    await prisma.usuarios.create({
        data: { tenant_id: emp3.id, email: 'admin3@empresa3.cl', nombre: 'Admin 3', password: hashedPassword, rol: 'admin', activo: true, debe_cambiar_password: false }
    });
    // Agregamos un operario aquí para testear la vista sin formulario de pago
    await prisma.usuarios.create({
        data: { tenant_id: emp3.id, email: 'operario@empresa3.cl', nombre: 'Operario 3', password: hashedPassword, rol: 'operario', activo: true, debe_cambiar_password: false }
    });

    // ==========================================
    // CASO 4: CLIENTE SUSPENDIDO MANUALMENTE
    // RESULTADO ESPERADO: No puede ni hacer login (Rebota en el backend).
    // ==========================================
    const emp4 = await prisma.empresas.create({
        data: { nombre: 'Empresa 4 (Suspendida por SuperAdmin)', rut: '44444444-4', alias: 'empresa4', activo: false, plan_id: planEnterprise.id, fecha_vencimiento: en10Dias }
    });
    await prisma.usuarios.create({
        data: { tenant_id: emp4.id, email: 'admin4@empresa4.cl', nombre: 'Admin 4', password: hashedPassword, rol: 'admin', activo: true, debe_cambiar_password: false }
    });

    // ==========================================
    // CASO 5: JAULA DE SEGURIDAD (Cambio de Clave Obligatorio)
    // RESULTADO ESPERADO: Secuestro a /cambiar-clave. No ve paywall hasta cambiarla.
    // ==========================================
    const emp5 = await prisma.empresas.create({
        data: { nombre: 'Empresa 5 (Debe Cambiar Clave)', rut: '55555555-5', alias: 'empresa5', activo: true, plan_id: planBasico.id, fecha_vencimiento: hace2Dias } // Expirado, pero el cambio de clave tiene prioridad
    });
    await prisma.usuarios.create({
        data: { tenant_id: emp5.id, email: 'admin5@empresa5.cl', nombre: 'Admin 5', password: hashedPassword, rol: 'admin', activo: true, debe_cambiar_password: true }
    });

    console.log('✅ Simulación de empresas completada. Contraseña general: 123456');
}

main()
    .catch((e) => {
        console.error('❌ Error inyectando datos:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });