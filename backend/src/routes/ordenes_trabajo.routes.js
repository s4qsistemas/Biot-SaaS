const express = require('express');
const router = express.Router();
const controller = require('../controllers/ordenes_trabajo.controller');
const { authorize } = require('../middleware/authMiddleware');
const { PERMISOS } = require('../config/permissions');

router.get('/', authorize(PERMISOS.OT_LEER), controller.getOrdenesTrabajo);

router.post('/directa', authorize(PERMISOS.OT_TALLER_OPERAR), controller.createOTDirecta);
router.get('/correos-internos', authorize(PERMISOS.OT_TALLER_OPERAR), controller.getCorreosInternos);
router.post('/:id/tareas', authorize(PERMISOS.OT_TALLER_OPERAR), controller.createTarea);
router.post('/:id/tareas/:tareaId/materiales', authorize(PERMISOS.OT_TALLER_OPERAR), controller.cargarMaterial);
router.post('/:id/tareas/:tareaId/horas', authorize(PERMISOS.OT_TALLER_OPERAR), controller.cargarHoras);
router.post('/:id/enviar', authorize(PERMISOS.OT_TALLER_OPERAR), controller.enviarOT);
router.patch('/:id/tareas/:tareaId/estado', authorize(PERMISOS.OT_TALLER_OPERAR), controller.actualizarEstadoTarea);

router.patch('/:id/estado', authorize(PERMISOS.OT_GESTION_MAESTRA), controller.actualizarEstadoOT);
router.patch('/:id/horario', authorize(PERMISOS.OT_GESTION_MAESTRA), controller.actualizarHorarioOT);

// Gestión de tareas y extornos
router.delete('/:id/tareas/:tareaId', authorize(PERMISOS.OT_TALLER_OPERAR), controller.eliminarTarea);
router.delete('/:id/tareas/:tareaId/materiales/:consumoId', authorize(PERMISOS.OT_TALLER_OPERAR), controller.revertirMaterial);
router.delete('/:id/tareas/:tareaId/horas/:registroId', authorize(PERMISOS.OT_TALLER_OPERAR), controller.revertirHoras);

module.exports = router;