const express = require('express');
const router = express.Router();
const controller = require('../controllers/usuarios.controller');
const { authorize } = require('../middleware/authMiddleware');
const { PERMISOS } = require('../config/permissions');

// Nivel Maestranza (El cliente creando su propio personal)
// La autenticación ya está garantizada por app.js
router.post('/empleado', authorize(PERMISOS.USUARIOS_CREAR_EMPLEADO), controller.registrarEmpleado);

module.exports = router;