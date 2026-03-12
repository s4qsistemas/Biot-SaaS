import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

  const diasRestantes = calcularDiasRestantes();
  const isAdmin = user?.rol === 'admin';
  const isTrial = user?.empresa?.plan?.toLowerCase().includes('trial');

  // 🛡️ REGLAS DE VISUALIZACIÓN DEL BANNER
  // Solo se muestra si no es super_admin, le quedan días (si es <=0 lo agarra el Paywall),
  // y: (Es Trial) O (Cualquier plan al que le queden 5 días o menos).
  const mostrarBanner = user?.rol !== 'super_admin' &&
    diasRestantes !== null &&
    diasRestantes > 0 &&
    (isTrial || diasRestantes <= 5);

  const esUrgente = diasRestantes <= 5;

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col font-sans">

      {/* Top Navbar */}
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

          {/* 👑 BOTÓN EXCLUSIVO PARA ADMINISTRADORES */}
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

      {/* Contenido Principal */}
      <main className="flex-grow flex flex-col relative">
        <Outlet />
      </main>

    </div>
  );
}