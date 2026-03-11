import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function ModalCambiarEstado({ isOpen, onClose, empresaData, onUpdateSuccess }) {
    const [justificacion, setJustificacion] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Determinar qué acción estamos tomando según el estado actual
    const isActiva = empresaData?.estado === 'activa';
    const nuevoEstado = !isActiva;

    useEffect(() => {
        if (isOpen) {
            setJustificacion('');
            setError('');
        }
    }, [isOpen]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (justificacion.trim().length < 10) {
            return setError('La justificación debe tener al menos 10 caracteres.');
        }

        try {
            setLoading(true);
            await api.put(`/api/superadmin/empresa/${empresaData.id}/estado`, {
                activo: nuevoEstado,
                justificacion: justificacion
            });
            alert(`¡Empresa ${nuevoEstado ? 'activada' : 'suspendida'} y evento auditado con éxito!`);
            onUpdateSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cambiar el estado');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-dark-surface border border-dark-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-dark-border flex justify-between items-center bg-dark-bg/50">
                    <h3 className="text-lg font-bold text-txt-primary">
                        {isActiva ? 'Suspender Empresa' : 'Activar Empresa'}
                    </h3>
                    <button onClick={onClose} className="text-txt-secondary hover:text-white transition-colors">✕</button>
                </div>

                <form onSubmit={handleFormSubmit} className="p-6 space-y-5">

                    {/* INFO Y ALERTA DINÁMICA */}
                    <div className={`p-4 rounded-xl border flex flex-col gap-1 ${isActiva ? 'bg-red-900/10 border-red-900/50' : 'bg-emerald-900/10 border-emerald-900/50'}`}>
                        <span className="text-xs text-txt-secondary uppercase tracking-wider font-semibold">Empresa a modificar</span>
                        <span className="text-white font-bold text-lg">{empresaData?.nombre}</span>
                        <div className="mt-2 text-sm">
                            {isActiva ? (
                                <p className="text-red-400">⚠️ Al suspender la empresa, <strong>ningún usuario</strong> (incluyendo el administrador) podrá acceder a la plataforma. Sus datos se mantendrán intactos en la base de datos.</p>
                            ) : (
                                <p className="text-emerald-400">✅ Al activar la empresa, se restaurará el acceso inmediato a la plataforma para todos sus usuarios.</p>
                            )}
                        </div>
                    </div>

                    {/* JUSTIFICACIÓN (AUDITORÍA) */}
                    <div>
                        <label className="block text-xs font-medium text-txt-primary mb-1">Justificación del Cambio (Auditoría) *</label>
                        <textarea
                            value={justificacion}
                            onChange={(e) => setJustificacion(e.target.value)}
                            required
                            rows="3"
                            placeholder={isActiva ? "Ej: Falta de pago de factura mensual..." : "Ej: Pago regularizado el día de hoy..."}
                            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-brand resize-none"
                        ></textarea>
                        <p className="text-[10px] text-txt-secondary mt-1">
                            Este comentario quedará registrado de forma inmutable bajo tu usuario ({justificacion.length}/10 min).
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-sm text-red-400 text-center">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                        <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-txt-secondary hover:text-white transition-colors">Cancelar</button>
                        <button type="submit" disabled={loading} className={`px-6 py-2 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 ${isActiva ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                            {loading ? 'Procesando...' : isActiva ? 'Confirmar Suspensión' : 'Confirmar Activación'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}