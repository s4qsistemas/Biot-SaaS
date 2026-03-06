const express = require('express');
const router = express.Router();
const controller = require('../controllers/ordenes_trabajo.controller');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Importamos el llavero
const { PERMISOS } = require('../config/permissions');

// 👁️ LECTURA
router.get('/', authenticate, authorize(PERMISOS.OT_LEER), controller.getOrdenesTrabajo);

// 🛠️ OPERACIÓN DE TALLER (Tareas, Tiempos, Materiales, Correos)
router.post('/directa', authenticate, authorize(PERMISOS.OT_OPERACION_TALLER), controller.createOTDirecta);
router.get('/correos-internos', authenticate, authorize(PERMISOS.OT_OPERACION_TALLER), controller.getCorreosInternos);
router.post('/:id/tareas', authenticate, authorize(PERMISOS.OT_OPERACION_TALLER), controller.createTarea);
router.post('/:id/tareas/:tareaId/materiales', authenticate, authorize(PERMISOS.OT_OPERACION_TALLER), controller.cargarMaterial);
router.post('/:id/tareas/:tareaId/horas', authenticate, authorize(PERMISOS.OT_OPERACION_TALLER), controller.cargarHoras);
router.post('/:id/enviar', authenticate, authorize(PERMISOS.OT_OPERACION_TALLER), controller.enviarOT);
router.patch('/:id/tareas/:tareaId/estado', authenticate, authorize(PERMISOS.OT_OPERACION_TALLER), controller.actualizarEstadoTarea);

// 👔 GESTIÓN MAESTRA (Workflow principal de la OT)
router.patch('/:id/estado', authenticate, authorize(PERMISOS.OT_GESTION_MAESTRA), controller.actualizarEstadoOT);

module.exports = router;