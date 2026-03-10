const express = require('express');
const router = express.Router();
const { registrarEmpresa, procesarContacto } = require('../controllers/publicController');

router.post('/registro', registrarEmpresa);
router.post('/contacto', procesarContacto);

module.exports = router;