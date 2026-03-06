// frontend/src/utils/permissions.js
// En React, debes replicar este mismo concepto. No hagas if (user.role === 'operario') en tus botones.

export const PERMISOS_FRONT = {
    INVENTARIO_MOVER: ['super_admin', 'admin', 'gerente', 'jefe_taller'],
    // ... los mismos arreglos que en el backend
};

// Función de utilidad global
export const tienePermiso = (userRole, accionPermitida) => {
    if (!userRole) return false;
    return accionPermitida.includes(userRole);
};

// En tus páginas, usas esta función para ocultar o deshabilitar cosas con Tailwind de forma limpia.
import { tienePermiso, PERMISOS_FRONT } from '../utils/permissions';
import { useAuth } from '../context/AuthContext'; // Tu contexto actual

const BodegaPage = () => {
    const { user } = useAuth();

    return (
        <div>
            <h1>Inventario</h1>
            
            {/* El botón solo existe en el DOM si el rol del usuario está en el arreglo INVENTARIO_MOVER */}
            {tienePermiso(user.rol, PERMISOS_FRONT.INVENTARIO_MOVER) && (
                <button className="bg-blue-500 text-white p-2 rounded">
                    Registrar Salida
                </button>
            )}
            
            {/* Opción B: Mostrar el botón pero deshabilitado visualmente (mejor UX a veces) */}
            <button 
                disabled={!tienePermiso(user.rol, PERMISOS_FRONT.INVENTARIO_MOVER)}
                className={`p-2 rounded ${tienePermiso(user.rol, PERMISOS_FRONT.INVENTARIO_MOVER) ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300 cursor-not-allowed opacity-50'}`}
            >
                Inicializar Stock
            </button>
        </div>
    );
};

// En tu App.jsx, tu RoleGuard también debe dejar de preguntar por roles específicos y empezar a preguntar por la constante del diccionario
<Route 
    path="/inventario/nuevo" 
    element={
        <RoleGuard rolesPermitidos={PERMISOS_FRONT.INVENTARIO_INICIALIZAR}>
            <NuevoStockPage />
        </RoleGuard>
    } 
/>