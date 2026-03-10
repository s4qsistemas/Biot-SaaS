const express = require('express');
const router = express.Router();
const { registrarEmpresa } = require('../controllers/publicController');

router.post('/registro', registrarEmpresa);

module.exports = router;