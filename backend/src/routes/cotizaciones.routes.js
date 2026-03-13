const express = require('express');
const router = express.Router();
const controller = require('../controllers/cotizaciones.controller');
const { authorize } = require('../middleware/authMiddleware');
const { PERMISOS } = require('../config/permissions');

router.get('/', authorize(PERMISOS.COTIZACIONES_LEER), controller.getCotizaciones);
router.get('/:id', authorize(PERMISOS.COTIZACIONES_LEER), controller.getCotizacionById);
router.get('/:id/preview', authorize(PERMISOS.COTIZACIONES_LEER), controller.previewCotizacion);

router.post('/', authorize(PERMISOS.COTIZACIONES_ESCRIBIR), controller.createCotizacion);
router.put('/:id', authorize(PERMISOS.COTIZACIONES_ESCRIBIR), controller.updateCotizacion);
router.put('/:id/estado', authorize(PERMISOS.COTIZACIONES_ESCRIBIR), controller.updateEstado);
router.post('/:id/enviar', authorize(PERMISOS.COTIZACIONES_ESCRIBIR), controller.enviarCotizacion);
router.delete('/:id', authorize(PERMISOS.COTIZACIONES_ESCRIBIR), controller.deleteCotizacion);

module.exports = router;