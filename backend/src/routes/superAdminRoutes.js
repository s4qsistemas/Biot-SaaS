const express = require('express');
const router = express.Router();
// Asumiendo que importarás estos nuevos controladores
const {
    crearMaestranza, obtenerMaestranzas,
    editarDatosEmpresa, editarAdminEmpresa,
    cambiarEstadoEmpresa, cambiarPlanEmpresa, obtenerHistorialEmpresa,
    obtenerPlanes, crearPlan, editarPlan
} = require('../controllers/superAdminController');

// 🏢 RUTAS DE EMPRESAS (Atómicas)
router.post('/empresa', crearMaestranza);
router.get('/empresas', obtenerMaestranzas);

// Ediciones sin impacto comercial (No requieren justificación)
router.put('/empresa/:id/datos', editarDatosEmpresa); // Razón social y Alias
router.put('/empresa/:id/admin', editarAdminEmpresa); // Nombre, email y Reset de Clave

// Ediciones de impacto crítico (Requieren justificación y auditan)
router.put('/empresa/:id/estado', cambiarEstadoEmpresa); // Suspender o Activar
router.put('/empresa/:id/plan', cambiarPlanEmpresa);     // Upgrade de Plan (Bloquea downgrade a Trial)

// 📜 RUTA DE AUDITORÍA
router.get('/empresa/:id/auditoria', obtenerHistorialEmpresa);

// 💰 RUTAS DE PLANES
router.get('/planes', obtenerPlanes);
router.post('/plan', crearPlan);
router.put('/plan/:id', editarPlan);

module.exports = router;