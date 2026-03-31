// ==========================================
// 1. DEFINICIÓN ESTRICTA DE ROLES (BASE DE DATOS)
// ==========================================
const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',                 // El dueño de la maestranza
    GERENTE: 'gerente',             // Ve todo, mira plata, pero no opera el taller
    JEFE_TALLER: 'jefe_taller',     // Opera el taller, mueve inventario, NO ve plata
    ADMINISTRATIVO: 'administrativo',// Hace cotizaciones, facturas, ingresa compras
    OPERARIO: 'operario'            // Solo ejecuta tareas de taller, no ve plata
};

const TODOS = Object.values(ROLES);

// ==========================================
// 2. MATRIZ DE LLAVES Y CERRADURAS (RUTAS)
// ==========================================
const PERMISOS = {
    // 🏢 MÓDULO PLATAFORMA (Solo tú)
    SAAS_GESTION: [ROLES.SUPER_ADMIN],

    // 👥 MÓDULO USUARIOS
    USUARIOS_CREAR_EMPLEADO: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    USUARIOS_GESTION: [ROLES.SUPER_ADMIN, ROLES.ADMIN],

    // 🤝 MÓDULO ENTIDADES (Clientes y Proveedores)
    ENTIDADES_LEER: TODOS,
    ENTIDADES_ESCRIBIR: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ADMINISTRATIVO],

    // 📖 MÓDULO CATÁLOGOS (Materiales, Tareas, Máquinas)
    CATALOGOS_LEER: TODOS,
    CATALOGOS_ESCRIBIR: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.JEFE_TALLER, ROLES.ADMINISTRATIVO],

    // 📦 MÓDULO INVENTARIO
    INVENTARIO_LEER: TODOS,
    INVENTARIO_MOVER: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.JEFE_TALLER, ROLES.OPERARIO], // Mermas y Ajustes
    INVENTARIO_INICIALIZAR: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.JEFE_TALLER, ROLES.ADMINISTRATIVO], // Ingresar compras de stock

    // 📝 MÓDULO COTIZACIONES
    COTIZACIONES_LEER: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.JEFE_TALLER, ROLES.ADMINISTRATIVO],
    COTIZACIONES_ESCRIBIR: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ADMINISTRATIVO],

    // ⚙️ MÓDULO ÓRDENES DE TRABAJO
    OT_LEER: TODOS,
    OT_TALLER_OPERAR: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.JEFE_TALLER, ROLES.OPERARIO], // Play, pausas, cargar horas
    OT_GESTION_MAESTRA: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.JEFE_TALLER, ROLES.ADMINISTRATIVO], // Ver plata, aprobar
    OT_MODIFICAR_HORARIO: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.JEFE_TALLER] // Solo los que modifican excepción
};

module.exports = {
    ROLES,
    PERMISOS
};