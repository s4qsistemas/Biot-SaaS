import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function ModalCambiarPlan({ isOpen, onClose, empresaData, onUpdateSuccess }) {
    const [planes, setPlanes] = useState([]);
    const [formData, setFormData] = useState({
        nuevo_plan_id: '',
        justificacion: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (empresaData && isOpen) {
            setFormData({ nuevo_plan_id: '', justificacion: '' });
            setError('');

            // Cargar planes disponibles
            const cargarPlanes = async () => {
                try {
                    const { data } = await api.get('/api/superadmin/planes');
                    // 🛡️ REGLA DE NEGOCIO: Mostrar solo activos y JAMÁS permitir volver a Trial (ID 4)
                    setPlanes(data.filter(p => p.activo && p.id !== 4));
                } catch (err) {
                    console.error('Error al cargar planes:', err);
                }
            };
            cargarPlanes();
        }
    }, [empresaData, isOpen]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.justificacion.trim().length < 10) {
            return setError('La justificación debe tener al menos 10 caracteres.');
        }

        if (parseInt(formData.nuevo_plan_id) === empresaData.plan_id) {
            return setError('La empresa ya tiene este plan asignado.');
        }

        try {
            setLoading(true);
            await api.put(`/api/superadmin/empresa/${empresaData.id}/plan`, formData);
            alert('¡Plan actualizado y evento auditado con éxito!');
            onUpdateSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cambiar el plan');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-dark-surface border border-dark-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

                <div className="px-6 py-4 border-b border-dark-border flex justify-between items-center bg-dark-bg/50">
                    <h3 className="text-lg font-bold text-txt-primary">Cambiar Plan de Suscripción</h3>
                    <button onClick={onClose} className="text-txt-secondary hover:text-white transition-colors">✕</button>
                </div>

                <form onSubmit={handleFormSubmit} className="p-6 space-y-5">

                    {/* INFO DE LA EMPRESA */}
                    <div className="bg-dark-bg p-4 rounded-xl border border-dark-border flex flex-col gap-1">
                        <span className="text-xs text-txt-secondary uppercase tracking-wider font-semibold">Empresa a modificar</span>
                        <span className="text-brand font-bold text-lg">{empresaData?.nombre}</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-txt-primary">Plan Actual:</span>
                            <span className="px-2 py-0.5 bg-dark-surface border border-dark-border rounded text-xs text-txt-secondary">
                                {empresaData?.plan_nombre || 'Sin Plan'}
                            </span>
                        </div>
                    </div>

                    {/* SELECTOR DE PLAN Y AVISO LEGAL */}
                    <div>
                        <label className="block text-xs font-medium text-txt-primary mb-1">Nuevo Plan a Asignar *</label>
                        <select
                            value={formData.nuevo_plan_id}
                            onChange={(e) => setFormData({ ...formData, nuevo_plan_id: e.target.value })}
                            required
                            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-brand"
                        >
                            <option value="" disabled>Seleccione el nuevo plan...</option>
                            {planes.map(plan => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.nombre} ({plan.limite_usuarios} usr) - ${Number(plan.precio_mensual).toLocaleString('es-CL')}
                                </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-red-400 mt-2 italic flex items-start gap-1">
                            <span>⚠️</span>
                            Atención: El cambio de plan anulará cualquier período de prueba y aplicará los nuevos límites de la plataforma inmediatamente.
                        </p>
                    </div>

                    {/* JUSTIFICACIÓN (AUDITORÍA) */}
                    <div>
                        <label className="block text-xs font-medium text-txt-primary mb-1">Justificación del Cambio (Auditoría) *</label>
                        <textarea
                            value={formData.justificacion}
                            onChange={(e) => setFormData({ ...formData, justificacion: e.target.value })}
                            required
                            rows="3"
                            placeholder="Ej: Cliente realizó pago de anualidad vía transferencia el día de hoy..."
                            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-brand resize-none"
                        ></textarea>
                        <p className="text-[10px] text-txt-secondary mt-1">
                            Este comentario quedará registrado de forma inmutable bajo tu usuario ({formData.justificacion.length}/10 min).
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-sm text-red-400 text-center">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                        <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-txt-secondary hover:text-white transition-colors">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-brand text-white text-sm font-bold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50">
                            {loading ? 'Guardando...' : 'Confirmar y Auditar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}