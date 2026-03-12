const express = require('express');
const router = express.Router();
const controller = require('../controllers/catalogos.controller');
const { authorize } = require('../middleware/authMiddleware');
const { PERMISOS } = require('../config/permissions');

// --- Materiales ---
router.get('/materiales', authorize(PERMISOS.CATALOGOS_LEER), controller.getMateriales);
router.post('/materiales', authorize(PERMISOS.CATALOGOS_ESCRIBIR), controller.createMaterial);
router.put('/materiales/:id', authorize(PERMISOS.CATALOGOS_ESCRIBIR), controller.updateMaterial);

// --- Operarios ---
router.get('/operarios', authorize(PERMISOS.CATALOGOS_LEER), controller.getOperarios);
router.post('/operarios', authorize(PERMISOS.CATALOGOS_ESCRIBIR), controller.createOperario);
router.put('/operarios/:id', authorize(PERMISOS.CATALOGOS_ESCRIBIR), controller.updateOperario);

// --- Equipos ---
router.get('/equipos', authorize(PERMISOS.CATALOGOS_LEER), controller.getEquipos);
router.post('/equipos', authorize(PERMISOS.CATALOGOS_ESCRIBIR), controller.createEquipo);
router.put('/equipos/:id', authorize(PERMISOS.CATALOGOS_ESCRIBIR), controller.updateEquipo);

// --- Tareas ---
router.get('/tareas', authorize(PERMISOS.CATALOGOS_LEER), controller.getTareas);
router.post('/tareas', authorize(PERMISOS.CATALOGOS_ESCRIBIR), controller.createTarea);
router.put('/tareas/:id', authorize(PERMISOS.CATALOGOS_ESCRIBIR), controller.updateTarea);

module.exports = router;