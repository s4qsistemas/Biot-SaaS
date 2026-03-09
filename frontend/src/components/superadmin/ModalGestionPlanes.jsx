import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function ModalGestionPlanes({ isOpen, onClose }) {
    const [planes, setPlanes] = useState([]);
    const [cargando, setCargando] = useState(true);

    const [modoEdicion, setModoEdicion] = useState(false);
    const [formData, setFormData] = useState({ id: null, nombre: '', limite_usuarios: '', precio_mensual: '', activo: true });

    const cargarPlanes = async () => {
        try {
            setCargando(true);
            const { data } = await api.get('/api/superadmin/planes');
            setPlanes(data);
        } catch (error) {
            console.error('Error al cargar planes:', error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (isOpen) cargarPlanes();
    }, [isOpen]);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const iniciarEdicion = (plan) => {
        setModoEdicion(true);
        setFormData({
            id: plan.id,
            nombre: plan.nombre,
            limite_usuarios: plan.limite_usuarios,
            precio_mensual: plan.precio_mensual,
            activo: plan.activo
        });
    };

    const cancelarEdicion = () => {
        setModoEdicion(false);
        setFormData({ id: null, nombre: '', limite_usuarios: '', precio_mensual: '', activo: true });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modoEdicion) {
                await api.put(`/api/superadmin/plan/${formData.id}`, formData);
            } else {
                await api.post('/api/superadmin/plan', formData);
            }
            cancelarEdicion();
            cargarPlanes();
        } catch (error) {
            alert(error.response?.data?.message || 'Error al guardar el plan');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-dark-surface border border-dark-border rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-auto max-h-[90vh]">

                {/* COLUMNA IZQUIERDA: Lista de Planes */}
                <div className="w-full md:w-3/5 border-r border-dark-border flex flex-col">
                    <div className="px-6 py-4 border-b border-dark-border bg-dark-bg/50">
                        <h3 className="text-lg font-bold text-txt-primary">Planes de Suscripción</h3>
                    </div>
                    <div className="p-4 flex-grow overflow-y-auto bg-dark-bg">
                        {cargando ? <p className="text-txt-secondary text-center py-4">Cargando...</p> : (
                            <div className="space-y-3">
                                {planes.map(plan => (
                                    <div key={plan.id} className="bg-dark-surface border border-dark-border p-4 rounded-xl flex justify-between items-center hover:border-brand transition-colors">
                                        <div>
                                            <h4 className="font-bold text-txt-primary flex items-center gap-2">
                                                {plan.nombre}
                                                {!plan.activo && <span className="text-[10px] px-2 py-0.5 bg-red-900/30 text-red-400 rounded-md">Inactivo</span>}
                                            </h4>
                                            <p className="text-xs text-txt-secondary mt-1">
                                                Límite: <span className="text-brand">{plan.limite_usuarios} usuarios</span> • Precio: <span className="text-emerald-400">${Number(plan.precio_mensual).toLocaleString('es-CL')}</span>
                                            </p>
                                        </div>
                                        <button onClick={() => iniciarEdicion(plan)} className="px-3 py-1.5 text-xs font-medium bg-dark-bg border border-dark-border rounded-lg text-txt-secondary hover:text-brand hover:border-brand transition-colors">
                                            Editar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA: Formulario */}
                <div className="w-full md:w-2/5 flex flex-col bg-dark-surface">
                    <div className="px-6 py-4 border-b border-dark-border flex justify-between items-center bg-dark-bg/50">
                        <h3 className="text-md font-bold text-brand">{modoEdicion ? 'Editar Plan' : 'Crear Nuevo Plan'}</h3>
                        <button onClick={onClose} className="text-txt-secondary hover:text-red-400">✕</button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-txt-primary mb-1">Nombre del Plan</label>
                            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" placeholder="Ej: Premium" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-txt-primary mb-1">Límite de Usuarios</label>
                            <input type="number" name="limite_usuarios" value={formData.limite_usuarios} onChange={handleChange} required min="1" className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-txt-primary mb-1">Precio Mensual (CLP)</label>
                            <input type="number" name="precio_mensual" value={formData.precio_mensual} onChange={handleChange} required min="0" step="any" className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" />
                        </div>

                        {modoEdicion && (
                            <div className="pt-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} className="w-4 h-4 rounded bg-dark-bg border-dark-border text-brand focus:ring-brand" />
                                    <span className={`text-sm font-medium ${formData.activo ? 'text-txt-primary' : 'text-red-400'}`}>Plan Activo (Visible en ventas)</span>
                                </label>
                            </div>
                        )}

                        <div className="pt-6 flex gap-2">
                            {modoEdicion && (
                                <button type="button" onClick={cancelarEdicion} className="flex-1 py-2 text-sm font-medium text-txt-secondary bg-dark-bg border border-dark-border rounded-lg hover:bg-dark-surface transition-colors">Cancelar</button>
                            )}
                            <button type="submit" className="flex-1 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
                                {modoEdicion ? 'Guardar Cambios' : 'Crear Plan'}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}