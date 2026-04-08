const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CREAR
const crearNave = async (req, res) => {
    try {
        const { nombre, descripcion, entidad_id } = req.body;
        // 👇 CORRECCIÓN: req.user en lugar de req.usuario
        const tenant_id = req.user.tenant_id;

        const nuevaNave = await prisma.nave.create({
            data: {
                tenant_id,
                nombre,
                descripcion,
                entidad_id: entidad_id ? Number(entidad_id) : null
            }
        });

        res.status(201).json(nuevaNave);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Ya existe una nave con ese nombre en tu empresa.' });
        }
        console.error("Error al crear nave:", error);
        res.status(500).json({ error: 'Error al crear la nave', detalle: error.message });
    }
};

// LISTAR TODAS
const obtenerNaves = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const naves = await prisma.nave.findMany({
            where: { tenant_id },
            include: {
                entidad: { select: { nombre: true } } // 👈 ESTO HACE QUE SE MUESTRE EL DUEÑO EN LA TABLA
            },
            orderBy: { nombre: 'asc' }
        });
        res.json(naves);
    } catch (error) {
        console.error("Error al obtener naves:", error);
        res.status(500).json({ error: 'Error al obtener naves' });
    }
};

// EDITAR
const actualizarNave = async (req, res) => {
    try {
        const { id } = req.params;
        // 👇 AHORA SÍ RECIBE EL entidad_id
        const { nombre, descripcion, activo, entidad_id } = req.body;
        const tenant_id = req.user.tenant_id;

        const naveActualizada = await prisma.nave.updateMany({
            where: { id: Number(id), tenant_id },
            data: {
                nombre,
                descripcion,
                activo,
                // 👇 AHORA SÍ LO GUARDA EN LA BD
                entidad_id: entidad_id ? Number(entidad_id) : null
            }
        });

        if (naveActualizada.count === 0) return res.status(404).json({ error: 'Nave no encontrada' });
        res.json({ mensaje: 'Nave actualizada correctamente' });
    } catch (error) {
        console.error("Error al actualizar nave:", error);
        res.status(500).json({ error: 'Error al actualizar nave' });
    }
};

module.exports = {
    crearNave,
    obtenerNaves,
    actualizarNave
};