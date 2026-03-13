const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/* ==========================================
   📦 MATERIALES (Tabla: Producto)
========================================== */
const getMateriales = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const materiales = await prisma.producto.findMany({
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
        const { codigo, nombre, tipo_medicion, unidad_base, permite_retazo, precio_compra, precio_venta, stock_minimo } = req.body;

        // --- VALIDACIÓN DE PRECIOS ---
        const costo = Number(precio_compra) || 0;
        const venta = Number(precio_venta) || 0;

        if (costo <= 0) {
            return res.status(400).json({ message: 'El precio de costo debe ser mayor a cero' });
        }
        if (venta < costo) {
            return res.status(400).json({ message: 'El precio de venta no puede ser menor al costo de adquisición' });
        }

        const nuevo = await prisma.producto.create({
            data: { tenant_id, codigo, nombre, tipo_medicion, unidad_base, permite_retazo, precio_compra, precio_venta, stock_minimo }
        });
        res.status(201).json(nuevo);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ message: 'El código de producto ya existe en su inventario.' });
        console.error("Error creando material:", error);
        res.status(500).json({ message: 'Error interno al crear material' });
    }
};

const updateMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;
        const { codigo, nombre, tipo_medicion, unidad_base, permite_retazo, precio_compra, precio_venta, stock_minimo, activo } = req.body;

        const existe = await prisma.producto.findFirst({
            where: { id: parseInt(id), tenant_id: tenant_id }
        });

        if (!existe) return res.status(404).json({ message: 'Material no encontrado o acceso denegado' });

        // --- VALIDACIÓN DE PRECIOS ---
        const costo = Number(precio_compra) || 0;
        const venta = Number(precio_venta) || 0;

        if (costo <= 0) {
            return res.status(400).json({ message: 'El precio de costo debe ser mayor a cero' });
        }
        if (venta < costo) {
            return res.status(400).json({ message: 'El precio de venta no puede ser menor al costo de adquisición' });
        }

        const actualizado = await prisma.producto.update({
            where: { id: parseInt(id) },
            data: { codigo, nombre, tipo_medicion, unidad_base, permite_retazo, precio_compra, precio_venta, stock_minimo, activo }
        });
        res.json(actualizado);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ message: 'El código de producto ya existe.' });
        console.error("Error actualizando material:", error);
        res.status(500).json({ message: 'Error al actualizar material' });
    }
};

/* ==========================================
   👷‍♂️ MANO DE OBRA (Tabla: Operario)
========================================== */
const getOperarios = async (req, res) => {
    try {
        const operarios = await prisma.operario.findMany({
            where: { tenant_id: req.user.tenant_id },
            orderBy: { nombre: 'asc' }
        });
        res.json(operarios);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener operarios' });
    }
};

const createOperario = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const { codigo, nombre, especialidad, valor_hora, email, celular } = req.body;

        const nuevo = await prisma.operario.create({
            data: { tenant_id, codigo, nombre, especialidad, valor_hora, email, celular }
        });
        res.status(201).json(nuevo);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ message: 'El código de operario ya existe.' });
        res.status(500).json({ message: 'Error al crear operario' });
    }
};

const updateOperario = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;
        const { codigo, nombre, especialidad, valor_hora, email, celular, activo } = req.body;

        const existe = await prisma.operario.findFirst({ where: { id: parseInt(id), tenant_id } });
        if (!existe) return res.status(404).json({ message: 'Operario no encontrado o acceso denegado' });

        const actualizado = await prisma.operario.update({
            where: { id: parseInt(id) },
            data: { codigo, nombre, especialidad, valor_hora, email, celular, activo }
        });
        res.json(actualizado);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ message: 'El código de operario ya existe.' });
        res.status(500).json({ message: 'Error al actualizar operario' });
    }
};

/* ==========================================
   ⚙️ EQUIPOS (Tabla: Equipo)
========================================== */
const getEquipos = async (req, res) => {
    try {
        const equipos = await prisma.equipo.findMany({
            where: { tenant_id: req.user.tenant_id },
            orderBy: { nombre: 'asc' }
        });
        res.json(equipos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener equipos' });
    }
};

const createEquipo = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const { codigo, nombre, tipo, valor_hora, ubicacion } = req.body;

        const nuevo = await prisma.equipo.create({
            data: { tenant_id, codigo, nombre, tipo, valor_hora, ubicacion }
        });
        res.status(201).json(nuevo);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ message: 'El código de equipo ya existe.' });
        res.status(500).json({ message: 'Error al crear equipo' });
    }
};

const updateEquipo = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;
        const { codigo, nombre, tipo, valor_hora, ubicacion, activo } = req.body;

        const existe = await prisma.equipo.findFirst({ where: { id: parseInt(id), tenant_id } });
        if (!existe) return res.status(404).json({ message: 'Equipo no encontrado' });

        const actualizado = await prisma.equipo.update({
            where: { id: parseInt(id) },
            data: { codigo, nombre, tipo, valor_hora, ubicacion, activo }
        });
        res.json(actualizado);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ message: 'El código de equipo ya existe.' });
        res.status(500).json({ message: 'Error al actualizar equipo' });
    }
};

/* ==========================================
   📋 TIPOS DE TAREA (Tabla: CatalogoTarea)
========================================== */
const getTareas = async (req, res) => {
    try {
        const tareas = await prisma.catalogoTarea.findMany({
            where: { tenant_id: req.user.tenant_id },
            orderBy: { codigo: 'asc' }
        });
        res.json(tareas);
    } catch (error) {
        res.status(500).json({ message: "Error interno" });
    }
};

const createTarea = async (req, res) => {
    try {
        const { codigo, nombre, descripcion } = req.body;
        const nuevaTarea = await prisma.catalogoTarea.create({
            data: { tenant_id: req.user.tenant_id, codigo, nombre, descripcion }
        });
        res.status(201).json(nuevaTarea);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ message: 'El código de tarea ya existe.' });
        res.status(500).json({ message: "Error al crear tarea" });
    }
};

const updateTarea = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user.tenant_id;
        const { codigo, nombre, descripcion, activo } = req.body;

        const existe = await prisma.catalogoTarea.findFirst({ where: { id: parseInt(id), tenant_id } });
        if (!existe) return res.status(404).json({ message: 'Tarea no encontrada' });

        const tareaActualizada = await prisma.catalogoTarea.update({
            where: { id: parseInt(id) },
            data: { codigo, nombre, descripcion, activo }
        });
        res.json(tareaActualizada);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ message: 'El código de tarea ya existe.' });
        res.status(500).json({ message: "Error al actualizar tarea" });
    }
};

module.exports = {
    getMateriales, createMaterial, updateMaterial,
    getOperarios, createOperario, updateOperario,
    getEquipos, createEquipo, updateEquipo,
    getTareas, createTarea, updateTarea
};