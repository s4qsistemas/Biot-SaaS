// ==========================================
// 1. DEFINICIÓN ESTRICTA DE ROLES
// ==========================================
export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    GERENTE: 'gerente',
    JEFE_TALLER: 'jefe_taller',
    ADMINISTRATIVO: 'administrativo',
    OPERARIO: 'operario'
};

const TODOS = Object.values(ROLES);

// ==========================================
// 2. MATRIZ DE LLAVES Y CERRADURAS (FRONTEND)
// ==========================================
export const PERMISOS_FRONT = {
    SAAS_GESTION: [ROLES.SUPER_ADMIN],
    USUARIOS_CREAR_EMPLEADO: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    USUARIOS_GESTION: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    ENTIDADES_LEER: TODOS,
    ENTIDADES_ESCRIBIR: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ADMINISTRATIVO],
    CATALOGOS_LEER: TODOS,
    CATALOGOS_ESCRIBIR: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.JEFE_TALLER, ROLES.ADMINISTRATIVO],

    // Aquí el frontend es aún más granular para apagar/encender botones específicos
    INVENTARIO_LEER: TODOS,
    INVENTARIO_RESTAR: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.JEFE_TALLER, ROLES.OPERARIO],
    INVENTARIO_SUMAR: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ADMINISTRATIVO],

    COTIZACIONES_LEER: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.ADMINISTRATIVO],
    COTIZACIONES_ESCRIBIR: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ADMINISTRATIVO],

    OT_LEER: TODOS,
    OT_TALLER_OPERAR: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.JEFE_TALLER, ROLES.OPERARIO],
    OT_FINANZAS: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.ADMINISTRATIVO]
};

// ==========================================
// 3. MOTOR DE EVALUACIÓN VISUAL
// ==========================================
export const tienePermiso = (userRole, accionPermitida) => {
    if (!userRole || !accionPermitida || !Array.isArray(accionPermitida)) return false;

    // 👑 Pase VIP: El SuperAdmin ignora las reglas visuales
    if (userRole === ROLES.SUPER_ADMIN) return true;

    return accionPermitida.includes(userRole);
};