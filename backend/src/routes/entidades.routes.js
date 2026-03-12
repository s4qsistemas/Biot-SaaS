const express = require('express');
const router = express.Router();
const controller = require('../controllers/entidades.controller');
const { authorize } = require('../middleware/authMiddleware');
const { PERMISOS } = require('../config/permissions');

router.get('/', authorize(PERMISOS.ENTIDADES_LEER), controller.getEntidades);
router.get('/:id', authorize(PERMISOS.ENTIDADES_LEER), controller.getEntidadById);

router.post('/', authorize(PERMISOS.ENTIDADES_ESCRIBIR), controller.createEntidad);
router.put('/:id', authorize(PERMISOS.ENTIDADES_ESCRIBIR), controller.updateEntidad);
router.delete('/:id', authorize(PERMISOS.ENTIDADES_ESCRIBIR), controller.deleteEntidad);

module.exports = router;