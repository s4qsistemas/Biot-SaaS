const express = require('express');
const router = express.Router();
const { registrarEmpresa, procesarContacto, obtenerPlanesPublicos } = require('../controllers/publicController');

router.post('/registro', registrarEmpresa);
router.post('/contacto', procesarContacto);
router.get('/planes', obtenerPlanesPublicos);

module.exports = router;