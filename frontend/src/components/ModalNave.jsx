import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const ModalNave = ({ isOpen, onClose, naveData, onSaveSuccess }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        entidad_id: '' // 👈 Nuevo campo en el estado
    });
    const [entidades, setEntidades] = useState([]); // 👈 Estado para la lista de clientes
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Cargar la lista de entidades (clientes) al abrir el modal
        const fetchEntidades = async () => {
            try {
                const res = await api.get('/api/entidades');
                // Si tienes un campo 'tipo' para filtrar solo clientes, hazlo aquí. Ej: res.data.filter(e => e.tipo === 'cliente')
                setEntidades(res.data);
            } catch (err) {
                console.error("Error cargando entidades", err);
            }
        };

        if (isOpen) {
            fetchEntidades();
            if (naveData) {
                setFormData({
                    nombre: naveData.nombre || '',
                    descripcion: naveData.descripcion || '',
                    entidad_id: naveData.entidad_id || '' // 👈 Cargar si estamos editando
                });
            } else {
                setFormData({ nombre: '', descripcion: '', entidad_id: '' });
            }
            setError('');
        }
    }, [naveData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nombre.trim()) {
            setError('El nombre de la nave/equipo es obligatorio.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Limpiamos el entidad_id si quedó vacío para enviar null al backend
            const payload = {
                ...formData,
                entidad_id: formData.entidad_id === '' ? null : formData.entidad_id
            };

            if (naveData?.id) {
                await api.put(`/api/naves/${naveData.id}`, payload);
            } else {
                await api.post('/api/naves', payload);
            }

            onSaveSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Ocurrió un error al guardar los datos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp">

                <div className="flex justify-between items-center p-4 border-b border-dark-border bg-dark-bg/50">
                    <h2 className="text-lg font-bold text-white">
                        {naveData ? 'Editar Nave / Equipo' : 'Registrar Nueva Nave'}
                    </h2>
                    <button onClick={onClose} className="p-1 text-txt-secondary hover:text-white transition-colors rounded-lg hover:bg-dark-bg" disabled={loading}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg flex items-start gap-2 text-red-400 text-sm">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-txt-secondary mb-1">
                            Nombre de la Nave / Equipo <span className="text-brand">*</span>
                        </label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-white focus:outline-none focus:border-brand transition-all"
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    {/* 👇 EL NUEVO SELECT DE CLIENTES */}
                    <div>
                        <label className="block text-sm font-medium text-txt-secondary mb-1">
                            Asociar a Cliente (Opcional)
                        </label>
                        <select
                            name="entidad_id"
                            value={formData.entidad_id}
                            onChange={handleChange}
                            className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-white focus:outline-none focus:border-brand transition-all"
                            disabled={loading}
                        >
                            <option value="">-- Sin cliente asociado --</option>
                            {entidades.map(ent => (
                                <option key={ent.id} value={ent.id}>
                                    {ent.nombre} {ent.rut ? `(${ent.rut})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-txt-secondary mb-1">
                            Descripción (Opcional)
                        </label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            rows="3"
                            className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-white focus:outline-none focus:border-brand transition-all resize-none"
                            disabled={loading}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-dark-border mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-txt-secondary hover:text-white hover:bg-dark-bg transition-colors" disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand text-white hover:bg-brand/90 transition-colors disabled:opacity-50">
                            <Save size={16} />
                            {loading ? 'Guardando...' : 'Guardar Datos'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalNave;