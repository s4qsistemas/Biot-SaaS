import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
    const { user } = useAuth();

    return (
        <div className="p-6 md:p-10 font-sans text-txt-primary">
            <div className="max-w-7xl mx-auto">

                {/* 1. Encabezado de Bienvenida */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Panel de Control
                    </h1>
                    <p className="text-txt-secondary">
                        Bienvenido al espacio de trabajo, <span className="text-brand font-semibold">{user?.nombre || 'Administrador'}</span>.
                    </p>
                </div>

                {/* 2. Tarjetas de Resumen (Métricas) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-dark-surface border border-dark-border p-6 rounded-2xl shadow-sm hover:border-brand/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-txt-secondary text-sm font-medium">Cotizaciones Activas</h3>
                            <span className="text-brand text-xl">📄</span>
                        </div>
                        <p className="text-4xl font-extrabold text-white">0</p>
                    </div>

                    <div className="bg-dark-surface border border-dark-border p-6 rounded-2xl shadow-sm hover:border-brand/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-txt-secondary text-sm font-medium">Órdenes en Curso (OT)</h3>
                            <span className="text-emerald-400 text-xl">⚙️</span>
                        </div>
                        <p className="text-4xl font-extrabold text-white">0</p>
                    </div>

                    <div className="bg-dark-surface border border-dark-border p-6 rounded-2xl shadow-sm hover:border-brand/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-txt-secondary text-sm font-medium">Alertas de Inventario</h3>
                            <span className="text-red-400 text-xl">⚠️</span>
                        </div>
                        <p className="text-4xl font-extrabold text-brand">0</p>
                    </div>
                </div>

                {/* 3. Accesos Directos (Acciones Rápidas) */}
                <h2 className="text-xl font-bold text-white mb-4">Accesos Rápidos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button className="p-5 bg-dark-bg border border-dark-border rounded-xl text-left hover:border-brand hover:bg-dark-surface transition-all group shadow-sm">
                        <div className="text-brand mb-3 text-2xl group-hover:scale-110 transition-transform w-min">📝</div>
                        <h4 className="font-semibold text-white text-sm">Crear Cotización</h4>
                        <p className="text-[11px] text-txt-secondary mt-1">Generar nuevo documento</p>
                    </button>

                    <button className="p-5 bg-dark-bg border border-dark-border rounded-xl text-left hover:border-brand hover:bg-dark-surface transition-all group shadow-sm">
                        <div className="text-emerald-400 mb-3 text-2xl group-hover:scale-110 transition-transform w-min">🔧</div>
                        <h4 className="font-semibold text-white text-sm">Nueva Orden (OT)</h4>
                        <p className="text-[11px] text-txt-secondary mt-1">Asignar tareas al taller</p>
                    </button>

                    <button className="p-5 bg-dark-bg border border-dark-border rounded-xl text-left hover:border-brand hover:bg-dark-surface transition-all group shadow-sm">
                        <div className="text-blue-400 mb-3 text-2xl group-hover:scale-110 transition-transform w-min">📦</div>
                        <h4 className="font-semibold text-white text-sm">Ingresar Material</h4>
                        <p className="text-[11px] text-txt-secondary mt-1">Actualizar stock de bodega</p>
                    </button>

                    <button className="p-5 bg-dark-bg border border-dark-border rounded-xl text-left hover:border-brand hover:bg-dark-surface transition-all group shadow-sm">
                        <div className="text-purple-400 mb-3 text-2xl group-hover:scale-110 transition-transform w-min">👥</div>
                        <h4 className="font-semibold text-white text-sm">Personal y Equipos</h4>
                        <p className="text-[11px] text-txt-secondary mt-1">Gestionar operarios</p>
                    </button>
                </div>

            </div>
        </div>
    );
}