import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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

// 🛡️ GUARDIA DE SEGURIDAD PARA RUTAS PRIVADAS
const PrivateRoute = () => {
  const { user, loading } = useAuth();
  
  // OJO: usar href para evitar hooks dentro de condicionales extraños
  const isCambiarClavePath = window.location.pathname === '/cambiar-clave';

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

  // 🛑 SI ESTÁ EN LA JAULA Y QUIERE IR AL DASHBOARD
  if (user.debe_cambiar_password && !isCambiarClavePath) {
    return <Navigate to="/cambiar-clave" replace />;
  }

  // 🔓 SI YA NO ESTÁ EN LA JAULA Y QUIERE VOLVER A CAMBIAR CLAVE
  if (!user.debe_cambiar_password && isCambiarClavePath) {
    return <Navigate to="/dashboard" replace />;
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
            
            {/* 🛑 JAULA: Cambio de Clave Obligatorio (Sin el Layout del Dashboard) */}
            <Route path="/cambiar-clave" element={<CambiarClave />} />

            <Route element={<DashboardLayout />}>

              {/* Acceso exclusivo SuperAdmin */}
              <Route element={<RoleGuard permiso={PERMISOS.SAAS_CREAR_EMPRESA} />}>
                <Route path="/root" element={<SuperAdminDashboard />} />
              </Route>

              {/* Dashboard general de las Maestranzas */}
              <Route path="/dashboard" element={<AdminDashboard />} />

              {/* Redirección salvavidas: Si inventan una URL, van al dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />

            </Route>
          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;