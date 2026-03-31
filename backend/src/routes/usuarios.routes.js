const express = require('express');
const router = express.Router();
const controller = require('../controllers/usuarios.controller');
const { authorize } = require('../middleware/authMiddleware');
const { PERMISOS } = require('../config/permissions');

// Solo Nivel Maestranza
router.post('/empleado', authorize(PERMISOS.USUARIOS_CREAR_EMPLEADO), controller.registrarEmpleado);

router.get('/equipo', authorize(PERMISOS.USUARIOS_GESTION), controller.obtenerEquipo);
router.put('/empleado/:id', authorize(PERMISOS.USUARIOS_GESTION), controller.editarEmpleado);

module.exports = router;