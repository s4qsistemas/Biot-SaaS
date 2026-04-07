const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. ACTUALIZAR FIRMA (Para cualquier usuario logueado)
const actualizarFirmaUsuario = async (req, res) => {
    try {
        const usuario_id = req.user.id;
        const { firma_base64 } = req.body;

        await prisma.usuario.update({
            where: { id: usuario_id },
            data: { firma_url: firma_base64 }
        });

        res.json({ message: 'Firma actualizada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar firma' });
    }
};

// 2. ACTUALIZAR LOGO (Solo para el Admin del Tenant)
const actualizarLogoEmpresa = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const { logo_base64 } = req.body;

        await prisma.empresa.update({
            where: { id: tenant_id },
            data: { logo_url: logo_base64 }
        });

        res.json({ message: 'Logo actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar el logo' });
    }
};

module.exports = { actualizarFirmaUsuario, actualizarLogoEmpresa };