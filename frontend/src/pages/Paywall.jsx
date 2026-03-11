import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Paywall() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Estados para el formulario del Admin
    const [archivo, setArchivo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mensajeExito, setMensajeExito] = useState('');
    const [error, setError] = useState('');

    const isAdmin = user?.rol === 'admin';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleFileChange = (e) => {
        setArchivo(e.target.files[0]);
        setError('');
    };

    const handleSubmitAdmin = async (e) => {
        e.preventDefault();
        if (!archivo) {
            setError('Por favor, adjunta un archivo válido (PDF o Imagen).');
            return;
        }

        setLoading(true);
        setError('');

        // SIMULACIÓN (MVP): Aquí conectaremos el endpoint en el Paso 3
        setTimeout(() => {
            setLoading(false);
            setMensajeExito('Comprobante enviado con éxito. Nuestro equipo de ventas validará el pago y reactivará la cuenta de tu maestranza a la brevedad.');
            setArchivo(null);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-dark-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">

            {/* CABECERA UNIVERSAL */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="mx-auto w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                    <span className="text-4xl">🛑</span>
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                    {isAdmin ? 'Suscripción Expirada' : 'Acceso Suspendido'}
                </h2>
                <p className="mt-3 text-base text-txt-secondary leading-relaxed">
                    Hola <span className="text-white font-medium">{user?.nombre}</span>. El tiempo de acceso para la maestranza <span className="text-brand font-bold">{user?.empresa?.nombre}</span> ha finalizado.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-dark-surface py-8 px-6 shadow-2xl border border-dark-border sm:rounded-2xl relative overflow-hidden">

                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>

                    {/* ========================================= */}
                    {/* VISTA PARA EL ADMINISTRADOR (Formulario)  */}
                    {/* ========================================= */}
                    {isAdmin ? (
                        <div className="space-y-6">
                            <div className="bg-dark-bg p-4 rounded-xl border border-dark-border text-center">
                                <p className="text-xs text-txt-secondary uppercase tracking-widest font-semibold mb-1">Plan a Regularizar</p>
                                <p className="text-xl font-bold text-brand">{user?.empresa?.plan || 'Desconocido'}</p>
                            </div>

                            {!mensajeExito ? (
                                <form onSubmit={handleSubmitAdmin} className="space-y-4">
                                    <p className="text-sm text-txt-secondary text-center">
                                        Tus datos y configuraciones están seguros. Para restaurar el acceso de todos tus usuarios, adjunta el comprobante de transferencia bancaria.
                                    </p>

                                    {error && <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-sm text-red-400 text-center">{error}</div>}

                                    <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dark-border border-dashed rounded-lg bg-dark-bg hover:border-brand/50 transition-colors">
                                        <div className="space-y-1 text-center">
                                            <svg className="mx-auto h-12 w-12 text-txt-secondary" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <div className="flex text-sm text-txt-secondary justify-center">
                                                <label htmlFor="file-upload" className="relative cursor-pointer bg-dark-bg rounded-md font-medium text-brand hover:text-brand-light focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand">
                                                    <span>Subir archivo</span>
                                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf,image/png,image/jpeg,image/webp" onChange={handleFileChange} />
                                                </label>
                                                <p className="pl-1">o arrastrar y soltar</p>
                                            </div>
                                            <p className="text-xs text-txt-secondary">
                                                {archivo ? <span className="text-emerald-400 font-bold">{archivo.name}</span> : 'PNG, JPG, PDF hasta 5MB'}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !archivo}
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-brand hover:bg-brand-dark transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Enviando...' : 'Enviar Comprobante'}
                                    </button>
                                </form>
                            ) : (
                                <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-lg text-center">
                                    <span className="text-3xl block mb-2">✅</span>
                                    <p className="text-sm text-emerald-400 font-medium">{mensajeExito}</p>
                                </div>
                            )}
                        </div>
                    ) : (

                        /* ========================================= */
                        /* VISTA PARA OPERARIOS/EMPLEADOS (Cerrada)  */
                        /* ========================================= */
                        <div className="space-y-6 text-center">
                            <p className="text-sm text-txt-secondary leading-relaxed">
                                La plataforma se encuentra temporalmente pausada por motivos administrativos. Tus datos y tareas están respaldados de forma segura.
                            </p>
                            <div className="p-4 bg-orange-900/10 border border-orange-500/30 rounded-lg">
                                <p className="text-sm font-semibold text-orange-400">
                                    Por favor, contacta al administrador de tu maestranza para regularizar el acceso.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* BOTÓN UNIVERSAL DE SALIDA */}
                    <div className="mt-6 pt-4 border-t border-dark-border">
                        <button
                            onClick={handleLogout}
                            className="w-full flex justify-center py-2 px-4 border border-dark-border rounded-lg text-sm font-medium text-txt-secondary hover:text-white hover:bg-dark-bg transition-colors"
                        >
                            Cerrar sesión
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}