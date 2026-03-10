import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatRut, validateRut } from '../utils/rut';
import { EyeIcon, EyeSlashIcon } from '../components/Icons';

export default function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nombre_empresa: '', rut_empresa: '', alias: '',
        nombre_admin: '', email_admin: '', password_admin: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        let { name, value } = e.target;
        if (name === 'rut_empresa') {
            value = formatRut(value);
            setError('');
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateRut(formData.rut_empresa)) {
            setError('El RUT ingresado no es válido.');
            return;
        }

        if (formData.password_admin.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        try {
            setLoading(true);
            // Golpeamos el endpoint público que acabamos de crear
            await api.post('/api/public/registro', formData);
            alert('¡Cuenta creada con éxito! Ahora puedes iniciar sesión para comenzar tus 14 días de prueba.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Hubo un error al crear la cuenta.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <Link to="/" className="text-3xl font-extrabold text-brand">Biot SaaS</Link>
                <h2 className="mt-6 text-2xl font-bold text-txt-primary">Comienza tu prueba gratis</h2>
                <p className="mt-2 text-sm text-txt-secondary">14 días de acceso total. Sin tarjeta de crédito.</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
                <div className="bg-dark-surface py-8 px-4 shadow-xl border border-dark-border sm:rounded-2xl sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>

                        {error && (
                            <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <h3 className="text-sm font-bold text-brand border-b border-dark-border pb-2 mb-4">1. Datos de tu Maestranza</h3>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-txt-primary mb-1">Razón Social</label>
                                <input type="text" name="nombre_empresa" value={formData.nombre_empresa} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" placeholder="Ej: Maestranza SpA" />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-txt-primary mb-1">RUT Empresa</label>
                                <input type="text" name="rut_empresa" value={formData.rut_empresa} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" placeholder="76.000.000-K" />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-txt-primary mb-1">Alias (Nombre de Fantasía)</label>
                                <input type="text" name="alias" value={formData.alias} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" placeholder="mi-empresa" />
                            </div>

                            <div className="sm:col-span-2 mt-2">
                                <h3 className="text-sm font-bold text-brand border-b border-dark-border pb-2 mb-4">2. Tu Cuenta de Administrador</h3>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-txt-primary mb-1">Tu Nombre</label>
                                <input type="text" name="nombre_admin" value={formData.nombre_admin} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" placeholder="Juan Pérez" />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-txt-primary mb-1">Correo Electrónico</label>
                                <input type="email" name="email_admin" value={formData.email_admin} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" placeholder="juan@empresa.cl" />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-txt-primary mb-1">Crea una Contraseña</label>
                                <div className="relative">
                                    <input type={showPassword ? "text" : "password"} name="password_admin" value={formData.password_admin} onChange={handleChange} required minLength={6} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand pr-10" placeholder="••••••••" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-txt-secondary hover:text-txt-primary"
                                    >
                                        {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand hover:bg-brand-dark focus:outline-none transition-colors disabled:opacity-50">
                                {loading ? 'Creando cuenta...' : 'Crear cuenta y comenzar'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-txt-secondary">
                            ¿Ya tienes una cuenta? <Link to="/login" className="font-medium text-brand hover:text-brand-dark">Inicia sesión aquí</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}