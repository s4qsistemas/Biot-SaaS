const express = require('express');
const router = express.Router();
const controller = require('../controllers/naves.controller');
const { authorize } = require('../middleware/authMiddleware');
const { PERMISOS } = require('../config/permissions');

// Protegemos cada ruta con su respectivo nivel de permiso
router.get('/', authorize(PERMISOS.ENTIDADES_LEER), controller.obtenerNaves);
router.post('/', authorize(PERMISOS.ENTIDADES_ESCRIBIR), controller.crearNave);
router.put('/:id', authorize(PERMISOS.ENTIDADES_ESCRIBIR), controller.actualizarNave);

module.exports = router;