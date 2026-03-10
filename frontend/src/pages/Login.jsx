import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '../components/Icons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      const user = await login(email, password);

      if (user.rol === 'super_admin') {
        navigate('/root');
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      setError("Error al iniciar sesión. Revisa tus credenciales.");
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-extrabold text-brand">Biot SaaS</h2>
        <p className="mt-2 text-sm text-txt-secondary">Ingresa a tu panel de control</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-dark-surface py-8 px-4 shadow-xl border border-dark-border sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-txt-primary">Correo electrónico</label>
              <div className="mt-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="appearance-none block w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-txt-primary placeholder-txt-secondary focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand sm:text-sm transition-colors"
                  placeholder="admin@biot.cl"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-txt-primary">Contraseña</label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="appearance-none block w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-txt-primary placeholder-txt-secondary focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand sm:text-sm transition-colors pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-txt-secondary hover:text-txt-primary"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg focus:ring-brand transition-colors"
              >
                Ingresar al sistema
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-txt-secondary">
              ¿No tienes una cuenta? <Link to="/register" className="font-medium text-brand hover:text-brand-dark">Regístrate aquí</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}