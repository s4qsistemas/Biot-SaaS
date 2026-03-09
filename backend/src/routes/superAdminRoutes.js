const express = require('express');
const router = express.Router();
const { crearMaestranza, obtenerMaestranzas, editarMaestranza, obtenerPlanes, crearPlan, editarPlan } = require('../controllers/superAdminController');

// Rutas base: /api/superadmin/...
router.post('/empresa', crearMaestranza);
router.get('/empresas', obtenerMaestranzas);
router.put('/empresa/:id', editarMaestranza);

router.get('/planes', obtenerPlanes);
router.post('/plan', crearPlan);
router.put('/plan/:id', editarPlan);

module.exports = router;