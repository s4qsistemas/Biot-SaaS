const express = require('express');
const router = express.Router();
const controller = require('../controllers/catalogos.controller');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Importamos nuestro llavero centralizado
const { PERMISOS } = require('../config/permissions'); 

// --- Materiales ---
router.get('/materiales', authenticate, authorize(PERMISOS.CATALOGOS_LEER), controller.getMateriales);
router.post('/materiales', authenticate, authorize(PERMISOS.CATALOGOS_ESCRIBIR), controller.createMaterial);
router.put('/materiales/:id', authenticate, authorize(PERMISOS.CATALOGOS_ESCRIBIR), controller.updateMaterial);

// --- Operarios ---
router.get('/operarios', authenticate, authorize(PERMISOS.CATALOGOS_LEER), controller.getOperarios);
router.post('/operarios', authenticate, authorize(PERMISOS.CATALOGOS_ESCRIBIR), controller.createOperario);
router.put('/operarios/:id', authenticate, authorize(PERMISOS.CATALOGOS_ESCRIBIR), controller.updateOperario);

// --- Equipos ---
router.get('/equipos', authenticate, authorize(PERMISOS.CATALOGOS_LEER), controller.getEquipos);
router.post('/equipos', authenticate, authorize(PERMISOS.CATALOGOS_ESCRIBIR), controller.createEquipo);
router.put('/equipos/:id', authenticate, authorize(PERMISOS.CATALOGOS_ESCRIBIR), controller.updateEquipo);

// --- Tareas ---
router.get('/tareas', authenticate, authorize(PERMISOS.CATALOGOS_LEER), controller.getTareas);
router.post('/tareas', authenticate, authorize(PERMISOS.CATALOGOS_ESCRIBIR), controller.createTarea);
router.put('/tareas/:id', authenticate, authorize(PERMISOS.CATALOGOS_ESCRIBIR), controller.updateTarea);

module.exports = router;