const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getEntidades = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const entidades = await prisma.entidad.findMany({
            where: { tenant_id: tenant_id },
            orderBy: { nombre: 'asc' }
        });
        res.json(entidades);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener entidades" });
    }
};

const getEntidadById = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;

        const entidad = await prisma.entidad.findFirst({
            where: { id: parseInt(id), tenant_id: tenant_id }
        });

        if (!entidad) return res.status(404).json({ message: "Entidad no encontrada" });
        res.json(entidad);
    } catch (error) {
        res.status(500).json({ message: "Error interno" });
    }
};

const createEntidad = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        // Whitelisting explícito
        const { nombre, rut, tipo, giro, direccion, comuna, ciudad, email, telefono, contacto_nombre } = req.body;

        const nuevaEntidad = await prisma.entidad.create({
            data: { tenant_id, nombre, rut, tipo, giro, direccion, comuna, ciudad, email, telefono, contacto_nombre }
        });
        res.status(201).json(nuevaEntidad);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ message: "El RUT ya existe en sus registros" });
        res.status(500).json({ message: "Error al crear entidad" });
    }
};

const updateEntidad = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;
        const { nombre, rut, tipo, giro, direccion, comuna, ciudad, email, telefono, contacto_nombre, activo } = req.body;

        const existe = await prisma.entidad.findFirst({
            where: { id: parseInt(id), tenant_id: tenant_id }
        });

        if (!existe) return res.status(404).json({ message: "Entidad no encontrada" });

        // 🛡️ RESTRICCIÓN: No desactivar si tiene cotizaciones en BORRADOR
        if (activo === false && existe.activo === true) {
            const tieneBorradores = await prisma.cotizacion.findFirst({
                where: { entidad_id: parseInt(id), estado: 'borrador', tenant_id }
            });
            if (tieneBorradores) {
                return res.status(400).json({ 
                    message: "No se puede desactivar la entidad porque tiene cotizaciones en estado BORRADOR." 
                });
            }
        }

        const entidadActualizada = await prisma.entidad.update({
            where: { id: parseInt(id) },
            data: { nombre, rut, tipo, giro, direccion, comuna, ciudad, email, telefono, contacto_nombre, activo }
        });
        res.json(entidadActualizada);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ message: "El RUT ingresado ya existe" });
        res.status(500).json({ message: "Error al actualizar la entidad" });
    }
};

const deleteEntidad = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;

        const existe = await prisma.entidad.findFirst({
            where: { id: parseInt(id), tenant_id: tenant_id }
        });

        if (!existe) return res.status(404).json({ message: "Entidad no encontrada" });

        // 🛡️ RESTRICCIÓN: No desactivar si tiene cotizaciones en BORRADOR
        const tieneBorradores = await prisma.cotizacion.findFirst({
            where: { entidad_id: parseInt(id), estado: 'borrador', tenant_id }
        });
        if (tieneBorradores) {
            return res.status(400).json({ 
                message: "No se puede desactivar la entidad porque tiene cotizaciones en estado BORRADOR." 
            });
        }

        await prisma.entidad.update({
            where: { id: parseInt(id) },
            data: { activo: false } // Soft Delete
        });
        res.json({ message: "Entidad desactivada correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar la entidad" });
    }
};

module.exports = { getEntidades, getEntidadById, createEntidad, updateEntidad, deleteEntidad };