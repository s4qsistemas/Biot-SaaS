const express = require('express');
const router = express.Router();
const controller = require('../controllers/inventario.controller');
const { authorize } = require('../middleware/authMiddleware');
const { PERMISOS } = require('../config/permissions');

router.get('/', authorize(PERMISOS.INVENTARIO_LEER), controller.getInventario);
router.get('/:id/historial', authorize(PERMISOS.INVENTARIO_LEER), controller.getHistorial);
router.post('/movimiento', authorize(PERMISOS.INVENTARIO_MOVER), controller.registrarMovimiento);
router.post('/inicializar', authorize(PERMISOS.INVENTARIO_INICIALIZAR), controller.inicializarStock);

module.exports = router;