const express = require('express');
const router = express.Router();
const controller = require('../controllers/inventario.controller');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Importamos el mismo llavero
const { PERMISOS } = require('../config/permissions');

// Rutas con sus llaves específicas
router.get('/', authenticate, authorize(PERMISOS.INVENTARIO_LEER), controller.getInventario);
router.get('/:id/historial', authenticate, authorize(PERMISOS.INVENTARIO_LEER), controller.getHistorial);
router.post('/movimiento', authenticate, authorize(PERMISOS.INVENTARIO_MOVER), controller.registrarMovimiento);
router.post('/inicializar', authenticate, authorize(PERMISOS.INVENTARIO_INICIALIZAR), controller.inicializarStock);

module.exports = router;