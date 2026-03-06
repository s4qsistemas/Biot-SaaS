const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getEntidades = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id; // Inyección SaaS

        const entidades = await prisma.entidades.findMany({
            where: { tenant_id: tenant_id, activo: true }, // Solo clientes de ESTA empresa
            orderBy: { nombre: 'asc' }
        });
        res.json(entidades);
    } catch (error) {
        console.error("Error obteniendo entidades:", error);
        res.status(500).json({ message: "Error al obtener entidades" });
    }
};

const getEntidadById = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;

        // Usamos findFirst para exigir que coincida el ID y el TENANT_ID
        const entidad = await prisma.entidades.findFirst({
            where: { id: parseInt(id), tenant_id: tenant_id }
        });

        if (!entidad) return res.status(404).json({ message: "Entidad no encontrada o acceso denegado" });
        res.json(entidad);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createEntidad = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        
        // Forzamos el tenant_id por seguridad, ignorando si viene en el body
        const dataInsert = { ...req.body, tenant_id: tenant_id };

        const nuevaEntidad = await prisma.entidades.create({
            data: dataInsert
        });
        res.status(201).json(nuevaEntidad);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ message: "El RUT ya existe en sus registros" });
        }
        res.status(400).json({ message: error.message });
    }
};

const updateEntidad = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;

        // 1. Validar propiedad
        const existe = await prisma.entidades.findFirst({
            where: { id: parseInt(id), tenant_id: tenant_id }
        });

        if (!existe) return res.status(404).json({ message: "Entidad no encontrada o acceso denegado" });

        // 2. Limpiar payload
        const dataUpdate = { ...req.body };
        delete dataUpdate.tenant_id;
        delete dataUpdate.id;

        const entidadActualizada = await prisma.entidades.update({
            where: { id: parseInt(id) },
            data: dataUpdate
        });
        res.json(entidadActualizada);
    } catch (error) {
        res.status(400).json({ message: "Error al actualizar la entidad" });
    }
};

const deleteEntidad = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;

        // Validar propiedad antes de desactivar (Soft Delete)
        const existe = await prisma.entidades.findFirst({
            where: { id: parseInt(id), tenant_id: tenant_id }
        });

        if (!existe) return res.status(404).json({ message: "Entidad no encontrada o acceso denegado" });

        await prisma.entidades.update({
            where: { id: parseInt(id) },
            data: { activo: false }
        });
        res.json({ message: "Entidad desactivada correctamente" });
    } catch (error) {
        res.status(400).json({ message: "Error al eliminar la entidad" });
    }
};

module.exports = {
    getEntidades,
    getEntidadById,
    createEntidad,
    updateEntidad,
    deleteEntidad
};