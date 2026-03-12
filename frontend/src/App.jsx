import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RoleGuard from './components/RoleGuard';
import { PERMISOS } from './config/permissions';

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

// 🛡️ GUARDIA DE SEGURIDAD PARA RUTAS PRIVADAS
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

  // 1. LÓGICA DE DÍAS RESTANTES (PAYWALL)
  // ⏱️ LÓGICA DE DÍAS (Calendario Estricto / Regla de la Medianoche)
  const calcularDiasRestantes = (fecha) => {
    if (!fecha) return null;

    // 1. Tomamos la fecha de hoy y le podamos las horas (00:00:00)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // 2. Tomamos la fecha de vencimiento y le podamos las horas (00:00:00)
    const vencimiento = new Date(fecha);
    vencimiento.setHours(0, 0, 0, 0);

    // 3. Diferencia exacta en milisegundos
    const diferenciaMs = vencimiento - hoy;

    // 4. Calculamos días limpios
    return Math.round(diferenciaMs / (1000 * 60 * 60 * 24));
  };

  const diasRestantes = calcularDiasRestantes(user.fecha_vencimiento);
  // ¿Es cliente, tiene fecha y se le acabó el tiempo (0 o negativo)?
  const estaExpirado = user.rol !== 'super_admin' && diasRestantes !== null && diasRestantes <= 0;

  // 2. RUTAS ACTUALES
  const isCambiarClavePath = location.pathname === '/cambiar-clave';
  const isPaywallPath = location.pathname === '/paywall';

  // 🛑 TRAMPA 1: JAULA DE CLAVE (Prioridad Máxima)
  if (user.debe_cambiar_password && !isCambiarClavePath) {
    return <Navigate to="/cambiar-clave" replace />;
  }
  if (!user.debe_cambiar_password && isCambiarClavePath) {
    return <Navigate to="/dashboard" replace />;
  }

  // 🛑 TRAMPA 2: MURO DE PAGO (Si ya cambió la clave, evaluamos si expiró)
  if (!user.debe_cambiar_password) {
    if (estaExpirado && !isPaywallPath) {
      return <Navigate to="/paywall" replace />; // 👈 Secuestro automático
    }
    if (!estaExpirado && isPaywallPath) {
      return <Navigate to="/dashboard" replace />; // 👈 Si pagó, lo sacamos del muro
    }
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

          {/* 🔐 RUTAS PRIVADAS (Blindadas por PrivateRoute) */}
          <Route element={<PrivateRoute />}>

            {/* 🛑 JAULA 1: Cambio de Clave Obligatorio */}
            <Route path="/cambiar-clave" element={<CambiarClave />} />

            {/* 🛑 JAULA 2: Muro de Pago / Facturación */}
            <Route path="/paywall" element={<Paywall />} />

            <Route element={<DashboardLayout />}>

              {/* Acceso exclusivo SuperAdmin */}
              <Route element={<RoleGuard permiso={PERMISOS.SAAS_CREAR_EMPRESA} />}>
                <Route path="/root" element={<SuperAdminDashboard />} />
              </Route>

              {/* Dashboard general de las Maestranzas */}
              <Route path="/dashboard" element={<AdminDashboard />} />

              {/* 💸 NUEVA RUTA: Portal Interno de Planes */}
              <Route path="/dashboard/planes" element={<PortalPlanes />} />

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