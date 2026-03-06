import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RoleGuard from './components/RoleGuard';
import { PERMISOS } from './config/permissions'; // 👈 Importamos el llavero

// Layouts y Pages
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Entidades from './pages/Entidades';
import Inventario from './pages/Inventario';
import Cotizaciones from './pages/Cotizaciones';
import Catalogos from './pages/Catalogos';
import Dashboard from './pages/Dashboard';
import OrdenesTrabajo from './pages/OrdenesTrabajo';

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center text-brand">
        Cargando sesión...
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* 🔓 Ruta Pública */}
          <Route path="/login" element={<Login />} />

          {/* 🔐 Rutas Privadas */}
          <Route element={<PrivateRoute />}>
            <Route element={<DashboardLayout />}>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Módulos de Lectura Global (Todos pueden entrar a la vista, incluso Operarios) */}
              <Route element={<RoleGuard permiso={PERMISOS.INVENTARIO_LEER} />}>
                <Route path="/inventario" element={<Inventario />} />
              </Route>

              <Route element={<RoleGuard permiso={PERMISOS.CATALOGOS_LEER} />}>
                <Route path="/catalogos" element={<Catalogos />} />
              </Route>

              <Route element={<RoleGuard permiso={PERMISOS.ENTIDADES_LEER} />}>
                <Route path="/entidades" element={<Entidades />} />
              </Route>

              <Route element={<RoleGuard permiso={PERMISOS.OT_LEER} />}>
                <Route path="/ordenes-trabajo" element={<OrdenesTrabajo />} />
              </Route>

              {/* Módulo Restringido (Operarios bloqueados de ver esta pantalla) */}
              <Route element={<RoleGuard permiso={PERMISOS.COTIZACIONES_LEER} />}>
                <Route path="/cotizaciones" element={<Cotizaciones />} />
              </Route>

            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;