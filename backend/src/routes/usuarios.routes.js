const express = require('express');
const router = express.Router();
const controller = require('../controllers/usuarios.controller');
const { authorize } = require('../middleware/authMiddleware');
const { PERMISOS } = require('../config/permissions');

// Solo Nivel Maestranza (El admin creando a su personal)
router.post('/empleado', authorize(PERMISOS.USUARIOS_CREAR_EMPLEADO), controller.registrarEmpleado);

module.exports = router;