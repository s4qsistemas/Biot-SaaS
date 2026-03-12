import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function PricingCards({ modo = 'public', onSelectPlan }) {
    const [planes, setPlanes] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const cargarPlanes = async () => {
            try {
                // Usamos la ruta pública que acabamos de crear
                const { data } = await api.get('/api/public/planes');

                // Si estamos en modo interno (Upgrade), ocultamos el plan Trial (ID 4)
                if (modo === 'internal') {
                    setPlanes(data.filter(p => p.id !== 4));
                } else {
                    setPlanes(data);
                }
            } catch (error) {
                console.error('Error al cargar planes:', error);
            } finally {
                setLoading(false);
            }
        };
        cargarPlanes();
    }, [modo]);

    if (loading) {
        return <div className="text-center py-10 text-brand animate-pulse">Cargando planes...</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
            {planes.map((plan) => {
                const esPro = plan.nombre.toLowerCase() === 'pro';

                return (
                    <div
                        key={plan.id}
                        className={`relative flex flex-col p-8 rounded-2xl border ${esPro
                            ? 'bg-dark-surface border-brand shadow-[0_0_30px_rgba(0,212,255,0.15)] transform md:-translate-y-4'
                            : 'bg-dark-bg border-dark-border hover:border-dark-border/80'
                            } transition-all duration-300`}
                    >
                        {esPro && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <span className="bg-brand text-dark-bg text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-full">
                                    Más Popular
                                </span>
                            </div>
                        )}

                        <div className="text-center mb-6">
                            <h3 className={`text-xl font-bold ${esPro ? 'text-brand' : 'text-white'}`}>
                                {plan.nombre}
                            </h3>
                            <div className="mt-4 flex justify-center items-baseline text-4xl font-extrabold text-white">
                                ${Number(plan.precio_mensual).toLocaleString('es-CL')}
                                <span className="ml-1 text-xl font-medium text-txt-secondary">/mes</span>
                            </div>
                        </div>

                        <ul className="flex-grow space-y-4 text-sm text-txt-secondary mb-8">
                            <li className="flex items-center gap-3">
                                <span className="text-emerald-400">✓</span>
                                Hasta <strong>{plan.limite_usuarios}</strong> usuarios
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-emerald-400">✓</span>
                                Soporte técnico
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-emerald-400">✓</span>
                                Todas las herramientas operativas
                            </li>
                        </ul>

                        <button
                            onClick={() => {
                                if (modo === 'internal') {
                                    onSelectPlan && onSelectPlan(plan);
                                } else {
                                    navigate('/register');
                                }
                            }}
                            className={`w-full py-3 px-4 rounded-lg font-bold text-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg ${esPro
                                ? 'bg-brand text-dark-bg hover:bg-brand-light focus:ring-brand'
                                : 'bg-dark-surface border border-dark-border text-white hover:bg-dark-border focus:ring-dark-border'
                                }`}
                        >
                            {modo === 'internal' ? 'Seleccionar este Plan' : 'Comenzar Prueba'}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}