import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { EyeIcon, EyeSlashIcon } from '../components/Icons';

export default function CambiarClave() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/cambiar-clave', { nueva_password: password });
      
      // Forzamos actualización de la vista y sacamos al usuario al dashboard
      // El backend ya quitó la flag en la BD, necesitamos recargar para que AuthContext 
      // vuelva a hacer el fetch /api/auth/me y baje los datos nuevos sin la bandera
      window.location.href = '/dashboard';

    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error al cambiar la contraseña.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl text-brand">🔒</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white">Seguridad de la Cuenta</h2>
        <p className="mt-2 text-sm text-txt-secondary">
          Hola {user?.nombre}, por seguridad debes cambiar la contraseña temporal asignada a tu maestranza para poder acceder al sistema.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-dark-surface py-8 px-4 shadow-xl border border-brand/30 sm:rounded-2xl sm:px-10 relative overflow-hidden">
          
          {/* Decorative Top Border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand to-brand-light"></div>

          <form className="space-y-6" onSubmit={handleSubmit}>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-txt-primary">Nueva Contraseña</label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="appearance-none block w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-txt-primary placeholder-txt-secondary focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand sm:text-sm transition-colors pr-10"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-txt-secondary hover:text-txt-primary"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-txt-primary">Confirmar Nueva Contraseña</label>
              <div className="mt-1 relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="appearance-none block w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-txt-primary placeholder-txt-secondary focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand sm:text-sm transition-colors pr-10"
                  placeholder="Repite tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-txt-secondary hover:text-txt-primary"
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
                <p className="text-xs text-brand/80 text-center mb-4">
                    Al confirmar, serás redirigido automáticamente a tu Panel de Control.
                </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg focus:ring-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Actualizando...' : 'Actualizar y Entrar'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
