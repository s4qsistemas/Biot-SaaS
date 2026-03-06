const express = require('express');
const router = express.Router();
const controller = require('../controllers/cotizaciones.controller');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { PERMISOS } = require('../config/permissions');

// Rutas de Lectura (disponible para Admin, Gerente, Jefe y Administrativo)
router.get('/', authenticate, authorize(PERMISOS.COTIZACIONES_LEER), controller.getCotizaciones);
router.get('/:id', authenticate, authorize(PERMISOS.COTIZACIONES_LEER), controller.getCotizacionById);
router.get('/:id/preview', authenticate, authorize(PERMISOS.COTIZACIONES_LEER), controller.previewCotizacion);

// Rutas de Escritura y Operación (Gerente y Operario bloqueados)
router.post('/', authenticate, authorize(PERMISOS.COTIZACIONES_ESCRIBIR), controller.createCotizacion);
router.put('/:id', authenticate, authorize(PERMISOS.COTIZACIONES_ESCRIBIR), controller.updateCotizacion);
router.put('/:id/estado', authenticate, authorize(PERMISOS.COTIZACIONES_ESCRIBIR), controller.updateEstado);
router.post('/:id/enviar', authenticate, authorize(PERMISOS.COTIZACIONES_ESCRIBIR), controller.enviarCotizacion);

module.exports = router;