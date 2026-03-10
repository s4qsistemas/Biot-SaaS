import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RoleGuard from './components/RoleGuard';
import { PERMISOS } from './config/permissions';

import DashboardLayout from './layouts/DashboardLayout';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

// 👇 IMPORTAMOS LAS NUEVAS PÁGINAS REALES
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

const DashboardTemporal = () => <div className="p-10 text-center font-bold text-gray-500">Dashboard Maestranza (En construcción)</div>;

const PrivateRoute = () => {
  const { loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-[#2E7D32] font-semibold">Cargando sesión...</div>;
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

          {/* 🔐 RUTAS PRIVADAS */}
          <Route element={<PrivateRoute />}>
            <Route element={<DashboardLayout />}>

              <Route element={<RoleGuard permiso={PERMISOS.SAAS_CREAR_EMPRESA} />}>
                <Route path="/root" element={<SuperAdminDashboard />} />
              </Route>

              <Route path="/dashboard" element={<DashboardTemporal />} />

              {/* Redirección por si escriben una URL que no existe */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />

            </Route>
          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;