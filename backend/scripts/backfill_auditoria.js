const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMissingBigBangs() {
    console.log('Iniciando script de migración para backfill de Big Bangs en auditoría...');

    try {
        // 1. Obtener todas las empresas que están activas
        const empresas = await prisma.empresas.findMany({
            where: {
                // Excluyendo a la empresa fantasma 99999999-9 si existe
                rut: { not: '99999999-9' }
            },
            include: {
                planes: true,
                usuarios: {
                    where: { rol: { in: ['admin', 'super_admin'] } },
                    take: 1
                },
                auditoria_empresas: {
                    where: { tipo_evento: 'CAMBIO_PLAN' }
                }
            }
        });

        console.log(`Encontradas ${empresas.length} empresas en total.`);
        let agregados = 0;

        for (const empresa of empresas) {
            // 2. Revisar si la empresa NO tiene ningún evento de CAMBIO_PLAN
            if (empresa.auditoria_empresas.length === 0) {
                console.log(`[+] La empresa ${empresa.nombre} (${empresa.rut}) no tiene Big Bang. Creando...`);
                
                // Necesitamos a alguien que haya "hecho" esto (para respetar la constraint de DB)
                const adminResponsable = empresa.usuarios[0];
                let adminId = adminResponsable ? adminResponsable.id : null;

                // Si por algún motivo raro no hay un admin, intentamos buscar un super admin genérico
                if (!adminId) {
                     const superAdmin = await prisma.usuarios.findFirst({ where: { rol: 'super_admin' } });
                     if (superAdmin) adminId = superAdmin.id;
                }

                if (!adminId) {
                    console.log(`    ⚠️ No se encontró un usuario responsable para ${empresa.nombre}. Saltando...`);
                    continue;
                }

                // Determinar el plan inicial con el que cuenta
                const nombrePlan = empresa.planes ? empresa.planes.nombre : 'Plan Trial (14 días)';

                // 3. Insertar el evento de auditoría retroactivamente, pero manteniendo created_at actual para no romper la BD en casos raros
                await prisma.auditoria_empresas.create({
                    data: {
                        empresa_id: empresa.id,
                        tipo_evento: 'CAMBIO_PLAN',
                        valor_anterior: 'Migración Interna / No Registrado',
                        valor_nuevo: nombrePlan,
                        justificacion: 'Registro retroactivo del evento "Big Bang" (Nacimiento de la empresa en SaaS).',
                        modificado_por_id: adminId,
                        created_at: empresa.created_at // Le ponemos la fecha original de cuando nació la empresa
                    }
                });

                agregados++;
            }
        }

        console.log(`\nMigración completada. Se añadieron ${agregados} registros de Big Bang a empresas antiguas.`);
    } catch (error) {
        console.error('Error durante la migración:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addMissingBigBangs();
