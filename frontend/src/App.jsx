import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RoleGuard from './components/RoleGuard';

// 🛡️ IMPORTAR EL NUEVO DICCIONARIO
import { PERMISOS_FRONT } from './config/permissions';

// Layouts & Pages
import DashboardLayout from './layouts/DashboardLayout';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Contacto from './pages/Contacto';
import AdminDashboard from './pages/AdminDashboard';
import CambiarClave from './pages/CambiarClave';
import Paywall from './pages/Paywall';
import PortalPlanes from './pages/PortalPlanes';
import Catalogos from './pages/Catalogos';
import Entidades from './pages/Entidades';
import Inventario from './pages/Inventario';
import Cotizaciones from './pages/Cotizaciones';
import OrdenesTrabajo from './pages/OrdenesTrabajo';
import Equipo from './pages/Equipo';

// 🛡️ GUARDIA DE SEGURIDAD PARA RUTAS PRIVADAS (Jaula y Paywall)
const PrivateRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center text-brand font-semibold">
        <span className="animate-pulse">Cargando plataforma...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 🛡️ DETECCIÓN DEL DISFRAZ (INMUNIDAD)
  const isImpersonating = !!localStorage.getItem('super_admin_token');

  // ⏱️ LÓGICA DE DÍAS
  const calcularDiasRestantes = (fecha) => {
    if (!fecha) return null;
    const hoy = new Date();
    const vencimiento = new Date(fecha);
    vencimiento.setHours(23, 59, 59, 999);
    const diferenciaMs = vencimiento.getTime() - hoy.getTime();
    return Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
  };

  const diasRestantes = calcularDiasRestantes(user.fecha_vencimiento);
  const estaExpirado = user.rol !== 'super_admin' && diasRestantes !== null && diasRestantes <= 0;

  const isCambiarClavePath = location.pathname === '/cambiar-clave';
  const isPaywallPath = location.pathname === '/paywall';

  // 🛑 TRAMPA 1: JAULA DE CLAVE (El SuperAdmin disfrazado es inmune)
  if (user.debe_cambiar_password && !isCambiarClavePath && !isImpersonating) {
    return <Navigate to="/cambiar-clave" replace />;
  }
  if (!user.debe_cambiar_password && isCambiarClavePath) {
    return <Navigate to="/dashboard" replace />;
  }

  // 🛑 TRAMPA 2: MURO DE PAGO (El SuperAdmin disfrazado es inmune)
  if (!user.debe_cambiar_password || isImpersonating) {
    if (estaExpirado && !isPaywallPath && !isImpersonating) {
      return <Navigate to="/paywall" replace />;
    }
    if (!estaExpirado && isPaywallPath) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 👑 REDIRECCIÓN RAÍZ DEL SUPER ADMIN
  // Si entra a /dashboard sin disfraz, lo mandamos a su panel de empresas
  if (user.rol === 'super_admin' && !isImpersonating && (location.pathname === '/dashboard' || location.pathname === '/dashboard/')) {
    return <Navigate to="/root" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* 🌍 RUTAS PÚBLICAS */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/contacto" element={<Contacto />} />

          {/* 🔐 RUTAS PRIVADAS */}
          <Route element={<PrivateRoute />}>
            <Route path="/cambiar-clave" element={<CambiarClave />} />
            <Route path="/paywall" element={<Paywall />} />

            <Route element={<DashboardLayout />}>

              {/* 👑 ROOT: Solo SuperAdmin */}
              <Route element={<RoleGuard permiso={PERMISOS_FRONT.SAAS_GESTION} />}>
                <Route path="/root" element={<SuperAdminDashboard />} />
              </Route>

              {/* 🏢 Dashboard general */}
              <Route path="/dashboard" element={<AdminDashboard />} />

              {/* 👥 MÓDULO EQUIPO */}
              <Route element={<RoleGuard permiso={PERMISOS_FRONT.USUARIOS_GESTION} />}>
                <Route path="/dashboard/equipo" element={<Equipo />} />
              </Route>

              {/* 💸 FACTURACIÓN */}
              <Route element={<RoleGuard permiso={PERMISOS_FRONT.USUARIOS_CREAR_EMPLEADO} />}>
                <Route path="/dashboard/planes" element={<PortalPlanes />} />
              </Route>

              {/* 🛡️ RUTAS OPERATIVAS */}
              <Route element={<RoleGuard permiso={PERMISOS_FRONT.CATALOGOS_LEER} />}>
                <Route path="/dashboard/catalogos" element={<Catalogos />} />
              </Route>

              <Route element={<RoleGuard permiso={PERMISOS_FRONT.ENTIDADES_LEER} />}>
                <Route path="/dashboard/entidades" element={<Entidades />} />
              </Route>

              <Route element={<RoleGuard permiso={PERMISOS_FRONT.INVENTARIO_LEER} />}>
                <Route path="/dashboard/inventario" element={<Inventario />} />
              </Route>

              <Route element={<RoleGuard permiso={PERMISOS_FRONT.COTIZACIONES_LEER} />}>
                <Route path="/dashboard/cotizaciones" element={<Cotizaciones />} />
              </Route>

              <Route element={<RoleGuard permiso={PERMISOS_FRONT.OT_LEER} />}>
                <Route path="/dashboard/ordenes-trabajo" element={<OrdenesTrabajo />} />
              </Route>

              {/* Redirección salvavidas */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />

            </Route>
          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;