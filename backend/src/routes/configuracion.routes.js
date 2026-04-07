const express = require('express');
const router = express.Router();
const controller = require('../controllers/configuracion.controller');
const { authorize } = require('../middleware/authMiddleware');
const { PERMISOS } = require('../config/permissions');

// 🟢 Firma: Cualquiera que esté autenticado (el authenticate de app.js basta)
router.put('/firma', controller.actualizarFirmaUsuario);

// 🔴 Logo: Solo administradores (AQUÍ ESTÁ LA SEGURIDAD REAL)
router.put('/logo', authorize(PERMISOS.CONFIGURACION_EMPRESA), controller.actualizarLogoEmpresa);

module.exports = router;