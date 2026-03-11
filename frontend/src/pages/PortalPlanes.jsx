import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PricingCards from '../components/PricingCards';

export default function PortalPlanes() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Estados para manejar el flujo de compra/upgrade
    const [planSeleccionado, setPlanSeleccionado] = useState(null);
    const [archivo, setArchivo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mensajeExito, setMensajeExito] = useState('');
    const [error, setError] = useState('');

    // 🛡️ SEGURIDAD: Solo el Admin puede ver esta pantalla
    if (user?.rol !== 'admin') {
        return (
            <div className="p-8 text-center text-txt-secondary">
                <span className="text-4xl block mb-4">🔒</span>
                <h2 className="text-xl font-bold text-white mb-2">Acceso Restringido</h2>
                <p>Solo el administrador de la maestranza puede gestionar la facturación.</p>
                <button onClick={() => navigate('/dashboard')} className="mt-6 text-brand hover:underline">
                    Volver al Inicio
                </button>
            </div>
        );
    }

    const handleFileChange = (e) => {
        setArchivo(e.target.files[0]);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!archivo) {
            setError('Por favor, adjunta un comprobante válido (PDF o Imagen).');
            return;
        }

        setLoading(true);
        setError('');

        // SIMULACIÓN MVP: Aquí conectaremos el endpoint en el siguiente paso
        setTimeout(() => {
            setLoading(false);
            setMensajeExito(`¡Solicitud enviada! Nuestro equipo validará tu comprobante y activará el plan ${planSeleccionado.nombre} a la brevedad.`);
            setArchivo(null);
        }, 1500);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full font-sans">

            {/* CABECERA */}
            <div className="mb-8 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Suscripción y Planes</h1>
                <p className="mt-2 text-sm text-txt-secondary">
                    Gestiona el plan de tu maestranza. Tu plan actual es <span className="text-brand font-bold">{user?.empresa?.plan}</span>.
                </p>
            </div>

            {/* FLUJO 1: MOSTRAR TARJETAS */}
            {!planSeleccionado && !mensajeExito && (
                <div className="mt-8">
                    <PricingCards
                        modo="internal"
                        onSelectPlan={(plan) => setPlanSeleccionado(plan)}
                    />
                </div>
            )}

            {/* FLUJO 2: FORMULARIO DE TRANSFERENCIA (Se revela al elegir un plan) */}
            {planSeleccionado && !mensajeExito && (
                <div className="max-w-2xl mx-auto mt-8">
                    <button
                        onClick={() => setPlanSeleccionado(null)}
                        className="mb-6 text-sm text-txt-secondary hover:text-white flex items-center gap-2 transition-colors"
                    >
                        <span>←</span> Volver a los planes
                    </button>

                    <div className="bg-dark-surface p-6 sm:p-8 shadow-2xl border border-dark-border rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand to-brand-light"></div>

                        <h2 className="text-xl font-bold text-white text-center mb-2">
                            Solicitar Plan {planSeleccionado.nombre}
                        </h2>
                        <p className="text-sm text-txt-secondary text-center mb-6">
                            El valor mensual es de <strong>${Number(planSeleccionado.precio_mensual).toLocaleString('es-CL')}</strong>. Por favor, realiza la transferencia a nuestra cuenta y adjunta el comprobante.
                        </p>

                        {/* Datos Bancarios (Simulados) */}
                        <div className="bg-dark-bg p-4 rounded-xl border border-dark-border mb-6 text-sm text-txt-secondary text-center space-y-1">
                            <p><strong>Banco:</strong> Banco Santander</p>
                            <p><strong>Tipo de Cuenta:</strong> Cuenta Corriente</p>
                            <p><strong>Número:</strong> 123456789-0</p>
                            <p><strong>RUT:</strong> 76.000.000-K</p>
                            <p><strong>Correo:</strong> pagos@biot.cl</p>
                        </div>

                        {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-sm text-red-400 text-center">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-dark-border border-dashed rounded-lg bg-dark-bg hover:border-brand/50 transition-colors">
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-txt-secondary" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="flex text-sm text-txt-secondary justify-center">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-dark-bg rounded-md font-medium text-brand hover:text-brand-light focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand">
                                            <span>Subir comprobante</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf,image/png,image/jpeg,image/webp" onChange={handleFileChange} />
                                        </label>
                                    </div>
                                    <p className="text-xs text-txt-secondary mt-2">
                                        {archivo ? <span className="text-emerald-400 font-bold">{archivo.name}</span> : 'PNG, JPG, PDF hasta 5MB'}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !archivo}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-dark-bg bg-brand hover:bg-brand-light transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Enviando comprobante...' : 'Enviar Solicitud de Upgrade'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* FLUJO 3: MENSAJE DE ÉXITO */}
            {mensajeExito && (
                <div className="max-w-md mx-auto mt-12 bg-emerald-900/20 border border-emerald-500/30 p-8 rounded-2xl text-center shadow-lg">
                    <span className="text-5xl block mb-4">✅</span>
                    <h3 className="text-xl font-bold text-white mb-2">¡Todo listo!</h3>
                    <p className="text-sm text-emerald-400 font-medium mb-6">{mensajeExito}</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="py-2 px-6 rounded-lg text-sm font-bold text-dark-bg bg-emerald-500 hover:bg-emerald-400 transition-colors"
                    >
                        Volver al Inicio
                    </button>
                </div>
            )}

        </div>
    );
}