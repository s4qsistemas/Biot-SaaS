const express = require('express');
const router = express.Router();
const controller = require('../controllers/entidades.controller');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { PERMISOS } = require('../config/permissions');

// Rutas de Lectura (disponible para todos los roles)
router.get('/', authenticate, authorize(PERMISOS.ENTIDADES_LEER), controller.getEntidades);
router.get('/:id', authenticate, authorize(PERMISOS.ENTIDADES_LEER), controller.getEntidadById);

// Rutas de Escritura (restringido a Admin y Administrativo)
router.post('/', authenticate, authorize(PERMISOS.ENTIDADES_ESCRIBIR), controller.createEntidad);
router.put('/:id', authenticate, authorize(PERMISOS.ENTIDADES_ESCRIBIR), controller.updateEntidad);
router.delete('/:id', authenticate, authorize(PERMISOS.ENTIDADES_ESCRIBIR), controller.deleteEntidad);

module.exports = router;