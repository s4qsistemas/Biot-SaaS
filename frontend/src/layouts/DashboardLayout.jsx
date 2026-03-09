import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col font-sans">
      
      {/* Top Navbar (El nuevo Menú Superior) */}
      <nav className="bg-dark-surface border-b border-dark-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <p className="text-txt-primary font-medium leading-none">{user?.nombre || 'Administrador'}</p>
                <p className="text-txt-secondary text-xs mt-1 capitalize">{user?.rol?.replace('_', ' ') || ''}</p>
              </div>
              
              <div className="h-8 w-px bg-dark-border mx-1"></div> {/* Separador vertical */}

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

      {/* Contenido Principal (Aquí se inyectan las páginas hijas como SuperAdminDashboard) */}
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>
      
    </div>
  );
}