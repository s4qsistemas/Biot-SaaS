require('dotenv').config();
const app = require('./app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

async function main() {
    try {
        await prisma.$connect();
        console.log('✅ Base de datos conectada correctamente (SaaS PostgreSQL + Prisma)');

        app.listen(PORT, () => {
            console.log(`🚀 Server SaaS is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Unable to start server:', error);
        process.exit(1);
    }
}

main();

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    console.log('Base de datos desconectada por cierre del servidor');
    process.exit(0);
});