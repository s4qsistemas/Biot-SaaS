const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/* ==========================================
   📦 MATERIALES (Tabla: productos)
========================================== */
const getMateriales = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;

        const materiales = await prisma.productos.findMany({
            where: { tenant_id: tenant_id },
            orderBy: { nombre: 'asc' }
        });
        res.json(materiales);
    } catch (error) {
        console.error("Error obteniendo materiales:", error);
        res.status(500).json({ message: 'Error al obtener materiales' });
    }
};

const createMaterial = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        
        const data = { ...req.body, tenant_id: tenant_id }; 
        
        const nuevo = await prisma.productos.create({ data });
        res.status(201).json(nuevo);
    } catch (error) {
        console.error("Error creando material:", error);
        res.status(500).json({ message: 'Error al crear material', error: error.message });
    }
};

const updateMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;

        // 1. Validar que el producto exista y pertenezca ESTRICTAMENTE a la empresa del usuario
        const existe = await prisma.productos.findFirst({
            where: { id: parseInt(id), tenant_id: tenant_id }
        });

        if (!existe) {
            return res.status(404).json({ message: 'Material no encontrado o acceso denegado' });
        }

        // 2. Limpiar el body para evitar que un hacker intente reasignar el producto a otra empresa
        const dataToUpdate = { ...req.body };
        delete dataToUpdate.tenant_id;
        delete dataToUpdate.id;

        // 3. Actualizar
        const actualizado = await prisma.productos.update({
            where: { id: parseInt(id) },
            data: dataToUpdate
        });
        res.json(actualizado);
    } catch (error) {
        console.error("Error actualizando material:", error);
        res.status(500).json({ message: 'Error al actualizar material' });
    }
};

/* ==========================================
   👷‍♂️ MANO DE OBRA / HH (Tabla: operarios)
========================================== */
const getOperarios = async (req, res) => {
    try {
        const operarios = await prisma.operarios.findMany({
            where: { tenant_id: req.user.tenant_id },
            orderBy: { nombre: 'asc' }
        });
        res.json(operarios);
    } catch (error) {
        console.error("Error obteniendo operarios:", error);
        res.status(500).json({ message: 'Error al obtener operarios' });
    }
};

const createOperario = async (req, res) => {
    try {
        const data = { ...req.body, tenant_id: req.user.tenant_id };
        const nuevo = await prisma.operarios.create({ data });
        res.status(201).json(nuevo);
    } catch (error) {
        console.error("Error creando operario:", error);
        res.status(500).json({ message: 'Error al crear operario' });
    }
};

const updateOperario = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;

        const existe = await prisma.operarios.findFirst({
            where: { id: parseInt(id), tenant_id: tenant_id }
        });

        if (!existe) return res.status(404).json({ message: 'Operario no encontrado o acceso denegado' });

        const dataToUpdate = { ...req.body };
        delete dataToUpdate.tenant_id;
        delete dataToUpdate.id;

        const actualizado = await prisma.operarios.update({
            where: { id: parseInt(id) },
            data: dataToUpdate
        });
        res.json(actualizado);
    } catch (error) {
        console.error("Error actualizando operario:", error);
        res.status(500).json({ message: 'Error al actualizar operario' });
    }
};

/* ==========================================
   ⚙️ EQUIPOS / HM (Tabla: equipos)
========================================== */
const getEquipos = async (req, res) => {
    try {
        const equipos = await prisma.equipos.findMany({
            where: { tenant_id: req.user.tenant_id },
            orderBy: { nombre: 'asc' }
        });
        res.json(equipos);
    } catch (error) {
        console.error("Error obteniendo equipos:", error);
        res.status(500).json({ message: 'Error al obtener equipos' });
    }
};

const createEquipo = async (req, res) => {
    try {
        const data = { ...req.body, tenant_id: req.user.tenant_id };
        const nuevo = await prisma.equipos.create({ data });
        res.status(201).json(nuevo);
    } catch (error) {
        console.error("Error creando equipo:", error);
        res.status(500).json({ message: 'Error al crear equipo' });
    }
};

const updateEquipo = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;

        const existe = await prisma.equipos.findFirst({
            where: { id: parseInt(id), tenant_id: tenant_id }
        });

        if (!existe) return res.status(404).json({ message: 'Equipo no encontrado o acceso denegado' });

        const dataToUpdate = { ...req.body };
        delete dataToUpdate.tenant_id;
        delete dataToUpdate.id;

        const actualizado = await prisma.equipos.update({
            where: { id: parseInt(id) },
            data: dataToUpdate
        });
        res.json(actualizado);
    } catch (error) {
        console.error("Error actualizando equipo:", error);
        res.status(500).json({ message: 'Error al actualizar equipo' });
    }
};

/* ==========================================
   📋 TIPOS DE TAREA (TAR)
========================================== */
const getTareas = async (req, res) => {
    try {
        const tareas = await prisma.catalogo_tareas.findMany({
            where: { tenant_id: req.user.tenant_id },
            orderBy: { codigo: 'asc' }
        });
        res.json(tareas);
    } catch (error) {
        console.error("Error obteniendo tareas maestras:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

const createTarea = async (req, res) => {
    try {
        const { codigo, nombre, descripcion, activo } = req.body;
        const nuevaTarea = await prisma.catalogo_tareas.create({
            data: { 
                tenant_id: req.user.tenant_id, 
                codigo, 
                nombre, 
                descripcion, 
                activo 
            }
        });
        res.status(201).json(nuevaTarea);
    } catch (error) {
        console.error("Error creando tarea maestra:", error);
        res.status(500).json({ message: "Error al crear la tarea maestra" });
    }
};

const updateTarea = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;
        const { nombre, descripcion, activo } = req.body;

        const existe = await prisma.catalogo_tareas.findFirst({
            where: { id: parseInt(id), tenant_id: tenant_id }
        });

        if (!existe) return res.status(404).json({ message: 'Tarea no encontrada o acceso denegado' });

        const tareaActualizada = await prisma.catalogo_tareas.update({
            where: { id: parseInt(id) },
            data: { nombre, descripcion, activo }
        });
        res.json(tareaActualizada);
    } catch (error) {
        console.error("Error actualizando tarea maestra:", error);
        res.status(500).json({ message: "Error al actualizar la tarea" });
    }
};

// ==========================================
// 🚀 EXPORTACIÓN ÚNICA (Estructurada)
// ==========================================
module.exports = {
    getMateriales, createMaterial, updateMaterial,
    getOperarios, createOperario, updateOperario,
    getEquipos, createEquipo, updateEquipo,
    getTareas, createTarea, updateTarea
};