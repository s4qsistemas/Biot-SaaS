const express = require('express');
const router = express.Router();
const { crearMaestranza, obtenerMaestranzas, editarMaestranza } = require('../controllers/superAdminController');

// Rutas base: /api/superadmin/...
router.post('/empresa', crearMaestranza);
router.get('/empresas', obtenerMaestranzas);
router.put('/empresa/:id', editarMaestranza); // 👈 Nueva ruta PUT

module.exports = router;