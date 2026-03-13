const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/authMiddleware');

const {
    crearMaestranza, obtenerMaestranzas,
    editarDatosEmpresa, editarAdminEmpresa,
    cambiarEstadoEmpresa, cambiarPlanEmpresa, obtenerHistorialEmpresa,
    obtenerPlanes, crearPlan, editarPlan,
    impersonarEmpresa // 👈 NO OLVIDES IMPORTARLA
} = require('../controllers/superAdminController');

const { PERMISOS } = require('../config/permissions');

// 🔒 CANDADO ABSOLUTO: Usa el diccionario centralizado
router.use(authorize(PERMISOS.SAAS_GESTION));

// 🎭 RUTA DEL DISFRAZ (IMPERSONATION)
router.post('/empresa/:id/impersonate', impersonarEmpresa); // 👈 AGREGA ESTA LÍNEA

// 🏢 RUTAS DE EMPRESAS (Atómicas)
router.post('/empresa', crearMaestranza);
router.get('/empresas', obtenerMaestranzas);

// Ediciones sin impacto comercial
router.put('/empresa/:id/datos', editarDatosEmpresa);
router.put('/empresa/:id/admin', editarAdminEmpresa);

// Ediciones de impacto crítico
router.put('/empresa/:id/estado', cambiarEstadoEmpresa);
router.put('/empresa/:id/plan', cambiarPlanEmpresa);

// 📜 RUTA DE AUDITORÍA
router.get('/empresa/:id/auditoria', obtenerHistorialEmpresa);

// 💰 RUTAS DE PLANES
router.get('/planes', obtenerPlanes);
router.post('/plan', crearPlan);
router.put('/plan/:id', editarPlan);

module.exports = router;