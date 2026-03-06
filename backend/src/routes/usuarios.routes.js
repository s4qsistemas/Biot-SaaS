const express = require('express');
const router = express.Router();
const controller = require('../controllers/usuarios.controller');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { PERMISOS } = require('../config/permissions');

// 1. Nivel Plataforma (Tú creando clientes)
router.post('/empresa', authenticate, authorize(PERMISOS.SAAS_CREAR_EMPRESA), controller.registrarEmpresaYAdmin);

// 2. Nivel Maestranza (El cliente creando su personal)
router.post('/empleado', authenticate, authorize(PERMISOS.USUARIOS_CREAR_EMPLEADO), controller.registrarEmpleado);

module.exports = router;