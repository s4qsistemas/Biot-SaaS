import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function ModalAuditoria({ isOpen, onClose, empresaData }) {
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && empresaData) {
            const cargarHistorial = async () => {
                try {
                    setLoading(true);
                    const { data } = await api.get(`/api/superadmin/empresa/${empresaData.id}/auditoria`);
                    setHistorial(data);
                } catch (error) {
                    console.error('Error al cargar historial:', error);
                } finally {
                    setLoading(false);
                }
            };
            cargarHistorial();
        }
    }, [isOpen, empresaData]);

    if (!isOpen) return null;

    const formatFecha = (fecha) => {
        return new Intl.DateTimeFormat('es-CL', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(new Date(fecha));
    };

    const getBadgeStyle = (tipo) => {
        switch (tipo) {
            case 'CAMBIO_PLAN': return 'bg-blue-900/30 text-blue-400 border-blue-800';
            case 'CAMBIO_ESTADO': return 'bg-orange-900/30 text-orange-400 border-orange-800';
            default: return 'bg-dark-surface text-txt-secondary border-dark-border';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-dark-surface border border-dark-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">

                <div className="px-6 py-4 border-b border-dark-border flex justify-between items-center bg-dark-bg/50">
                    <div>
                        <h3 className="text-lg font-bold text-txt-primary">Historial de Auditoría</h3>
                        <p className="text-xs text-brand font-mono mt-0.5">{empresaData?.nombre}</p>
                    </div>
                    <button onClick={onClose} className="text-txt-secondary hover:text-white transition-colors">✕</button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow bg-dark-bg">
                    {loading ? (
                        <div className="text-center py-10 text-txt-secondary animate-pulse">Cargando registros...</div>
                    ) : historial.length === 0 ? (
                        <div className="text-center py-10">
                            <span className="text-4xl block mb-2 opacity-50">📭</span>
                            <p className="text-txt-secondary text-sm">No hay eventos críticos registrados para esta empresa.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-dark-border before:to-transparent">
                            {historial.map((evento, index) => (
                                <div key={evento.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    {/* Icono del Timeline */}
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-dark-bg bg-dark-surface text-txt-secondary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                                        {evento.tipo_evento === 'CAMBIO_PLAN' ? '💳' : evento.tipo_evento === 'CAMBIO_ESTADO' ? '🛑' : '⚡'}
                                    </div>

                                    {/* Tarjeta de Evento */}
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-dark-border bg-dark-surface shadow-sm transition-colors hover:border-brand/50">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${getBadgeStyle(evento.tipo_evento)}`}>
                                                {evento.tipo_evento.replace('_', ' ')}
                                            </span>
                                            <span className="text-[10px] text-txt-secondary font-mono">{formatFecha(evento.created_at)}</span>
                                        </div>

                                        <div className="mb-3">
                                            <p className="text-xs text-txt-primary flex items-center gap-2">
                                                <span className="line-through opacity-50">{evento.valor_anterior}</span>
                                                <span className="text-brand">→</span>
                                                <span className="font-bold">{evento.valor_nuevo}</span>
                                            </p>
                                        </div>

                                        <div className="p-2.5 bg-dark-bg rounded border border-dark-border/50">
                                            <p className="text-[11px] text-txt-secondary italic leading-relaxed">
                                                "{evento.justificacion}"
                                            </p>
                                        </div>

                                        <div className="mt-2 text-right">
                                            <span className="text-[9px] text-txt-secondary uppercase tracking-wider">
                                                Por: <span className="text-txt-primary font-semibold">{evento.usuarios?.nombre || 'Sistema'}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}