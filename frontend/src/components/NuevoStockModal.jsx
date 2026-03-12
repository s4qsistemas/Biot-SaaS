import React, { useState, useEffect } from 'react';
import { getMateriales } from '../services/catalogos.service';

// 👇 1. Recibimos la prop 'materialesExistentes' por defecto vacía para no romper nada
const NuevoStockModal = ({ isOpen, onClose, onSave, materialesExistentes = [] }) => {
    const [materiales, setMateriales] = useState([]);
    const [formData, setFormData] = useState({
        producto_id: '',
        bodega: 'Bodega Central',
        ubicacion: '',
        tipo_unidad: 'GRANEL',
        cantidad: 0
    });

    // Cargar el diccionario de materiales al abrir el modal
    useEffect(() => {
        if (isOpen) {
            getMateriales().then(data => setMateriales(data)).catch(console.error);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    // 👇 2. EL BLINDAJE LÓGICO: Filtramos el catálogo
    // Solo dejamos los materiales cuyo ID NO esté en la lista negra (materialesExistentes)
    const materialesDisponibles = materiales.filter(
        mat => !materialesExistentes.includes(mat.id)
    );

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-surface rounded-xl flex flex-col w-full max-w-md border border-dark-border shadow-2xl">
                <div className="p-6 border-b border-dark-border flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Ingresar Nuevo Material</h3>
                    <button onClick={onClose} className="text-txt-secondary hover:text-white">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-txt-secondary mb-1">Seleccionar del Catálogo</label>
                        <select
                            required
                            className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-sm text-white focus:border-brand outline-none disabled:opacity-50"
                            onChange={(e) => setFormData({ ...formData, producto_id: e.target.value })}
                            disabled={materialesDisponibles.length === 0}
                        >
                            <option value="">-- Elige un material --</option>
                            {/* 👇 3. Iteramos solo sobre los que están disponibles 👇 */}
                            {materialesDisponibles.map(m => (
                                <option key={m.id} value={m.id}>[{m.codigo}] {m.nombre}</option>
                            ))}
                        </select>

                        {/* Mensaje inteligente si el catálogo ya está todo en bodega */}
                        {materiales.length > 0 && materialesDisponibles.length === 0 && (
                            <p className="text-xs text-amber-500 mt-2 font-medium">
                                Todos los materiales del catálogo ya tienen stock asignado en bodega. Usa el botón [+] en la tabla para registrar una entrada.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-txt-secondary mb-1">Bodega</label>
                            <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-sm text-white" value={formData.bodega} onChange={(e) => setFormData({ ...formData, bodega: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-txt-secondary mb-1">Ubicación (Estante)</label>
                            <input type="text" placeholder="Ej: A-05" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-sm text-white" onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-txt-secondary mb-1">Tipo</label>
                            <select className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-sm text-white" onChange={(e) => setFormData({ ...formData, tipo_unidad: e.target.value })}>
                                <option value="GRANEL">Granel (Insumo)</option>
                                <option value="LOTE">Lote (Trazable)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-txt-secondary mb-1">Cantidad Inicial</label>
                            <input type="number" min="0" step="0.01" required className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-sm text-white" onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-dark-border mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-txt-secondary hover:text-white">Cancelar</button>
                        <button
                            type="submit"
                            disabled={materialesDisponibles.length === 0}
                            className="bg-brand hover:bg-brand-hover text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Registrar Ingreso
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NuevoStockModal;