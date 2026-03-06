// Definimos los roles exactos que existen en tu base de datos (Prisma)
const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    GERENTE: 'gerente',
    JEFE_TALLER: 'jefe_taller',
    ADMINISTRATIVO: 'administrativo',
    OPERARIO: 'operario'
};

// Definimos las "Llaves" (Permisos) y quiénes las tienen
const PERMISOS = {
    // --- MÓDULO CATÁLOGOS ---
    // Llave para ver el catálogo (Todos la tienen)
    CATALOGOS_LEER: Object.values(ROLES), 
    // Llave para crear/editar catálogo (Operario NO la tiene)
    CATALOGOS_ESCRIBIR: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.JEFE_TALLER, ROLES.ADMINISTRATIVO],

    // --- MÓDULO INVENTARIO ---
    // Llave para ver qué hay en bodega
    INVENTARIO_LEER: Object.values(ROLES),
    // Llave para registrar que sacaste un tornillo (Fase 1: Operario NO la tiene)
    INVENTARIO_MOVER: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.JEFE_TALLER, ROLES.ADMINISTRATIVO],
    // Llave para ingresar 10 cajas nuevas de capital
    INVENTARIO_INICIALIZAR: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.JEFE_TALLER],

    // === MÓDULO ENTIDADES (CLIENTES) ===
    ENTIDADES_LEER: Object.values(ROLES), // Todos pueden leer
    // Fase 1: Operario, Gerente y Jefe de Taller EXCLUIDOS de modificar clientes
    ENTIDADES_ESCRIBIR: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ADMINISTRATIVO],

    // === MÓDULO COTIZACIONES ===
    // Leer: Todos menos el operario
    COTIZACIONES_LEER: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.JEFE_TALLER, ROLES.ADMINISTRATIVO],
    // Escribir/Operar: Gerente y Operario EXCLUIDOS
    COTIZACIONES_ESCRIBIR: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.JEFE_TALLER, ROLES.ADMINISTRATIVO],

    // === MÓDULO ÓRDENES DE TRABAJO (OT) ===
    // Todos pueden ver las OTs
    OT_LEER: Object.values(ROLES),
    // Cambiar estados principales de la OT (Facturada, Entregada)
    OT_GESTION_MAESTRA: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.JEFE_TALLER, ROLES.ADMINISTRATIVO],
    // Todo lo que es "taller puro" (Tareas, Materiales, HH, HM, OT Directa)
    OT_OPERACION_TALLER: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GERENTE, ROLES.JEFE_TALLER],

    // === MÓDULO USUARIOS Y SAAS ===
    // Solo tú (El dueño del SaaS) puedes dar de alta una nueva maestranza
    SAAS_CREAR_EMPRESA: [ROLES.SUPER_ADMIN],
    
    // Solo el Admin de la maestranza puede contratar/crear empleados en su sistema
    // (Opcional: puedes agregar al ADMINISTRATIVO aquí si el Admin delega esta tarea en RRHH)
    USUARIOS_CREAR_EMPLEADO: [ROLES.ADMIN]

};

module.exports = { PERMISOS, ROLES };