import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar'; // Asegúrate de tener este componente

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // 👈 El espía de la URL

  // Estado para la sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ⏱️ LÓGICA DE DÍAS (Calendario Estricto / Regla de las 23:59:59)
  const calcularDiasRestantes = (fecha) => {
    if (!fecha) return null;
    const hoy = new Date();
    const vencimiento = new Date(fecha);
    vencimiento.setHours(23, 59, 59, 999);
    const diferenciaMs = vencimiento.getTime() - hoy.getTime();
    return Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
  };

  const diasRestantes = calcularDiasRestantes(user?.fecha_vencimiento);
  const isAdmin = user?.rol === 'admin';
  const isTrial = user?.empresa?.plan?.toLowerCase().includes('trial');

  // 🛡️ REGLAS DE VISUALIZACIÓN DEL BANNER
  const mostrarBanner = user?.rol !== 'super_admin' &&
    diasRestantes !== null &&
    diasRestantes > 0 &&
    (isTrial || diasRestantes <= 5);

  const esUrgente = diasRestantes <= 5;

  // 🛡️ REGLA DE NAVEGACIÓN: Si estamos en el home del dashboard, ocultamos la sidebar
  const isMainDashboard = location.pathname === '/dashboard' || location.pathname === '/dashboard/';

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col font-sans">

      {/* Top Navbar */}
      <nav className="bg-dark-surface border-b border-dark-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between h-16 items-center">

            {/* Izquierda: Logo / Título */}
            <div className="flex-shrink-0 flex items-center gap-3">
              <span className="font-extrabold text-xl text-brand tracking-tight">Biot SaaS</span>
              <span className="px-2 py-0.5 rounded-md bg-dark-bg border border-dark-border text-[10px] uppercase font-bold text-txt-secondary tracking-wider hidden sm:block">
                {user?.rol === 'super_admin' ? 'Root Mode' : 'Portal Maestranza'}
              </span>
            </div>

            {/* Derecha: Perfil / Acciones */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-right hidden sm:block">
                <p className="text-txt-primary font-medium leading-none">{user?.nombre || 'Usuario'}</p>
                <p className="text-txt-secondary text-xs mt-1 capitalize">{user?.rol?.replace('_', ' ') || ''}</p>
              </div>

              <div className="h-8 w-px bg-dark-border mx-1"></div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-dark-bg border border-dark-border text-txt-secondary hover:text-red-400 hover:border-red-900 transition-colors"
                title="Cerrar sesión"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* 🚀 BANNER INTELIGENTE DE SUSCRIPCIÓN */}
      {mostrarBanner && (
        <div className={`w-full px-4 py-2.5 text-center text-sm font-medium transition-colors ${esUrgente
          ? 'bg-red-900/30 border-b border-red-500/30 text-red-400'
          : 'bg-brand/10 border-b border-brand/20 text-brand'
          }`}>

          {esUrgente && <span className="mr-2">⚠️</span>}

          {isTrial ? (
            <span>Tu período de prueba finaliza en <strong>{diasRestantes} {diasRestantes === 1 ? 'día' : 'días'}</strong>.</span>
          ) : (
            <span>Tu suscripción actual ({user?.empresa?.plan}) caduca en <strong>{diasRestantes} {diasRestantes === 1 ? 'día' : 'días'}</strong>.</span>
          )}

          {isAdmin && (
            <button
              onClick={() => navigate('/dashboard/planes')}
              className={`ml-3 font-bold underline transition-colors ${esUrgente ? 'hover:text-red-200' : 'hover:text-white'}`}
            >
              {isTrial ? 'Mejorar Plan ahora' : 'Renovar ahora'}
            </button>
          )}
        </div>
      )}

      {/* 🚀 ESTRUCTURA DIVIDIDA: Contenedor Flex para Sidebar y Contenido */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Renderizado Condicional de la Sidebar */}
        {!isMainDashboard && (
          <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        )}

        {/* Contenido Principal */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-dark-bg">
          <Outlet />
        </main>

      </div>
    </div>
  );
}