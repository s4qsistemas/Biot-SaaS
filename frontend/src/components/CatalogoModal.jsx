import React, { useState, useEffect } from 'react';
import { getMateriales, getOperarios, getEquipos, getTareas } from '../services/catalogos.service';
import { ShieldCheck, Activity } from 'lucide-react';

// Diccionario de Subcategorías Estándar (3 Letras)
const subcategorias = {
    materiales: [
        { code: 'ACE', label: 'Acero (Planchas)' },
        { code: 'PER', label: 'Perfiles y Tubos' },
        { code: 'CON', label: 'Consumibles (Discos, Electrodos)' },
        { code: 'GAS', label: 'Gases Industriales' },
        { code: 'OTR', label: 'Otro Material' }
    ],
    hh: [
        { code: 'SOL', label: 'Soldador' },
        { code: 'MEC', label: 'Mecánico / Tornero' },
        { code: 'EST', label: 'Estructurero / Armador' },
        { code: 'AYU', label: 'Ayudante General' },
        { code: 'DIS', label: 'Diseñador / Ingeniería' },
        { code: 'OTR', label: 'Otro Perfil' }
    ],
    hm: [
        { code: 'CNC', label: 'Control Numérico (CNC)' },
        { code: 'SOL', label: 'Equipos de Soldadura' },
        { code: 'COR', label: 'Equipos de Corte (Plasma, Pantógrafo)' },
        { code: 'CON', label: 'Conformado (Plegadoras, Cilindradoras)' },
        { code: 'OTR', label: 'Otra Máquina' }
    ],
    tareas: [
        { code: 'DIS', label: 'Diseño e Ingeniería' },
        { code: 'FAB', label: 'Fabricación y Armado' },
        { code: 'MEC', label: 'Mecanizado' },
        { code: 'SOL', label: 'Soldadura' },
        { code: 'CAL', label: 'Control de Calidad' },
        { code: 'OTR', label: 'Otro Proceso' }
    ]
};

const CatalogoModal = ({ isOpen, onClose, onSave, activeTab, itemToEdit }) => {
    const [formData, setFormData] = useState({});
    const [itemsExistentes, setItemsExistentes] = useState([]);
    const [subCatElegida, setSubCatElegida] = useState('');
    const [cargandoLista, setCargandoLista] = useState(false);

    // 1. Determinar el Prefijo Maestro según la pestaña
    const familiaPrefix = activeTab === 'materiales' ? 'MAT' : activeTab === 'hh' ? 'OPE' : activeTab === 'hm' ? 'MAQ' : 'TAR';

    // 2. Al abrir el modal, cargamos los datos existentes para calcular el correlativo
    useEffect(() => {
        const fetchItems = async () => {
            setCargandoLista(true);
            try {
                let data = [];
                if (activeTab === 'materiales') data = await getMateriales();
                else if (activeTab === 'hh') data = await getOperarios();
                else if (activeTab === 'hm') data = await getEquipos();
                else if (activeTab === 'tareas') data = await getTareas();
                setItemsExistentes(data || []);
            } catch (error) {
                console.error("Error leyendo catálogo maestro", error);
            } finally {
                setCargandoLista(false);
            }
        };

        if (isOpen && !itemToEdit) {
            fetchItems();
        }
    }, [isOpen, activeTab, itemToEdit]);

    // 3. Setup inicial de valores
    useEffect(() => {
        if (itemToEdit) {
            setFormData(itemToEdit);
            // Si estamos editando, extraemos la subcategoría del código existente (ej: MAT.ACE.001 -> ACE)
            if (itemToEdit.codigo) {
                const partes = itemToEdit.codigo.split('.');
                if (partes.length === 3) setSubCatElegida(partes[1]);
            }
        } else {
            setSubCatElegida('');
            if (activeTab === 'materiales') setFormData({ codigo: '', nombre: '', tipo_medicion: 'UNIDAD', unidad_base: 'UN', precio_compra: 0, precio_venta: 0, stock_minimo: 0 });
            else if (activeTab === 'hh') setFormData({ codigo: '', nombre: '', especialidad: '', valor_hora: 0, activo: true });
            else if (activeTab === 'hm') setFormData({ codigo: '', nombre: '', tipo: '', valor_hora: 0, activo: true });
            else if (activeTab === 'tareas') setFormData({ codigo: '', nombre: '', descripcion: '', activo: true });
        }
    }, [itemToEdit, activeTab, isOpen]);

    // 4. El Cerebro: Autogenerador del Código 3x3
    useEffect(() => {
        if (!itemToEdit && subCatElegida && itemsExistentes.length >= 0) {
            const prefijoBusqueda = `${familiaPrefix}.${subCatElegida}.`;

            // Buscar todos los items de esta subcategoría
            const itemsMismaSubCat = itemsExistentes.filter(item => item.codigo && item.codigo.startsWith(prefijoBusqueda));

            let maxCorrelativo = 0;
            itemsMismaSubCat.forEach(item => {
                const partes = item.codigo.split('.');
                if (partes.length === 3) {
                    const numero = parseInt(partes[2], 10);
                    if (!isNaN(numero) && numero > maxCorrelativo) {
                        maxCorrelativo = numero;
                    }
                }
            });

            // Generar el siguiente número (ej: 005 -> 006)
            const siguienteNumero = String(maxCorrelativo + 1).padStart(3, '0');
            const codigoFinal = `${prefijoBusqueda}${siguienteNumero}`;

            setFormData(prev => ({ ...prev, codigo: codigoFinal }));
        }
    }, [subCatElegida, itemsExistentes, familiaPrefix, itemToEdit]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.codigo) {
            alert("Debe seleccionar una subcategoría para generar el código.");
            return;
        }

        const processedData = { ...formData };
        if (processedData.precio_compra) processedData.precio_compra = Number(processedData.precio_compra);
        if (processedData.precio_venta) processedData.precio_venta = Number(processedData.precio_venta);
        if (processedData.stock_minimo) processedData.stock_minimo = Number(processedData.stock_minimo);
        if (processedData.valor_hora) processedData.valor_hora = Number(processedData.valor_hora);

        // --- VALIDACIÓN DE PRECIOS (Solo para Materiales) ---
        if (activeTab === 'materiales') {
            const costo = processedData.precio_compra || 0;
            const venta = processedData.precio_venta || 0;

            if (costo <= 0) {
                alert("El precio de costo debe ser mayor a cero.");
                return;
            }
            if (venta < costo) {
                alert("El precio de venta no puede ser menor al costo de adquisición.");
                return;
            }
        }

        onSave(processedData);
    };

    const titulos = { materiales: 'Material', hh: 'Operario', hm: 'Equipo', tareas: 'Tipo de Tarea' };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-dark-surface rounded-xl flex flex-col w-full max-w-2xl max-h-[90vh] border border-dark-border shadow-2xl">

                <div className="p-6 border-b border-dark-border flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {itemToEdit ? <Activity className="text-amber-400" /> : <ShieldCheck className="text-emerald-400" />}
                        {itemToEdit ? 'Editar ' : 'Registrar Nuevo '} {titulos[activeTab]}
                    </h3>
                    <button onClick={onClose} className="text-txt-secondary hover:text-white transition-colors">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">

                    {/* PANEL DE NOMENCLATURA 3x3 AUTOMÁTICO */}
                    <div className="bg-dark-bg p-4 rounded-lg border border-dark-border grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div>
                            <label className="block text-xs font-bold text-txt-secondary uppercase mb-2">Clasificación (Categoría)</label>
                            <select
                                required
                                disabled={!!itemToEdit} // No se puede cambiar la familia si ya existe
                                className="w-full bg-dark-surface border border-dark-border rounded-lg p-2.5 text-sm text-white focus:border-brand outline-none disabled:opacity-50"
                                value={subCatElegida}
                                onChange={(e) => setSubCatElegida(e.target.value)}
                            >
                                <option value="">-- Seleccione especialidad --</option>
                                {subcategorias[activeTab].map(sub => (
                                    <option key={sub.code} value={sub.code}>{sub.label} ({sub.code})</option>
                                ))}
                            </select>
                        </div>
                        <div className="text-center md:text-right">
                            <label className="block text-xs font-bold text-txt-secondary uppercase mb-2">Código Maestro Generado</label>
                            {cargandoLista ? (
                                <div className="text-sm text-txt-secondary animate-pulse">Calculando correlativo...</div>
                            ) : (
                                <div className={`text-2xl font-black tracking-widest ${formData.codigo ? 'text-emerald-400' : 'text-txt-secondary opacity-30'}`}>
                                    {formData.codigo || 'XXX.YYY.000'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CAMPOS DINÁMICOS SEGÚN LA PESTAÑA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* 📦 MATERIALES */}
                        {activeTab === 'materiales' && (
                            <>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-txt-secondary mb-1">Nombre del Material</label>
                                    <input type="text" name="nombre" required placeholder="Ej: Plancha de Acero A36 5mm" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-sm text-white focus:border-brand outline-none" value={formData.nombre || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-secondary mb-1">Unidad Base</label>
                                    <select name="unidad_base" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-sm text-white focus:border-brand outline-none" value={formData.unidad_base || 'UN'} onChange={handleChange}>
                                        <option value="UN">Unidades (UN)</option>
                                        <option value="KG">Kilogramos (KG)</option>
                                        <option value="TIRA">Tiras (TIRA)</option>
                                        <option value="CIL">Cilindros (CIL)</option>
                                        <option value="LTR">Litros (LTR)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-secondary mb-1">Stock Mínimo (Alerta)</label>
                                    <input type="number" name="stock_minimo" min="0" required className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-sm text-white focus:border-brand outline-none" value={formData.stock_minimo || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-secondary mb-1">Precio Costo Neto</label>
                                    <input type="number" name="precio_compra" min="0" required className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-sm text-white focus:border-brand outline-none" value={formData.precio_compra || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-secondary mb-1">Precio Venta Público</label>
                                    <input type="number" name="precio_venta" min="0" required className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-sm text-white focus:border-emerald-500 outline-none" value={formData.precio_venta || ''} onChange={handleChange} />
                                </div>
                            </>
                        )}

                        {/* 👷‍♂️ MANO DE OBRA */}
                        {activeTab === 'hh' && (
                            <>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-txt-secondary mb-1">Nombre Completo del Operario</label>
                                    <input type="text" name="nombre" required placeholder="Ej: Juan Pérez" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-sm text-white focus:border-brand outline-none" value={formData.nombre || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-secondary mb-1">Especialidad Detallada</label>
                                    <input type="text" name="especialidad" placeholder="Ej: Soldador 6G" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-sm text-white focus:border-brand outline-none" value={formData.especialidad || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-secondary mb-1">Costo por Hora (HH)</label>
                                    <input type="number" name="valor_hora" min="0" required className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-sm text-white focus:border-brand outline-none" value={formData.valor_hora || ''} onChange={handleChange} />
                                </div>
                            </>
                        )}

                        {/* ⚙️ EQUIPOS */}
                        {activeTab === 'hm' && (
                            <>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-txt-secondary mb-1">Nombre de la Máquina</label>
                                    <input type="text" name="nombre" required placeholder="Ej: Torno CNC Hass" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-sm text-white focus:border-brand outline-none" value={formData.nombre || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-secondary mb-1">Tipo de Máquina</label>
                                    <input type="text" name="tipo" placeholder="Ej: Mecanizado" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-sm text-white focus:border-brand outline-none" value={formData.tipo || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-secondary mb-1">Costo por Hora (HM)</label>
                                    <input type="number" name="valor_hora" min="0" required className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-sm text-white focus:border-brand outline-none" value={formData.valor_hora || ''} onChange={handleChange} />
                                </div>
                            </>
                        )}

                        {/* 📋 TAREAS (NUEVO) */}
                        {activeTab === 'tareas' && (
                            <>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-txt-secondary mb-1">Nombre del Proceso / Tarea</label>
                                    <input type="text" name="nombre" required placeholder="Ej: Soldadura TIG" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-sm text-white focus:border-brand outline-none" value={formData.nombre || ''} onChange={handleChange} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-txt-secondary mb-1">Descripción del trabajo</label>
                                    <textarea name="descripcion" rows="2" placeholder="Ej: Aplicación de cordones de soldadura..." className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-sm text-white focus:border-brand outline-none resize-none" value={formData.descripcion || ''} onChange={handleChange}></textarea>
                                </div>
                            </>
                        )}

                        {/* Toggle de Estado General (Aplica a todas las pestañas menos materiales) */}
                        {activeTab !== 'materiales' && (
                            <div className="md:col-span-2 flex items-center mt-2 p-3 bg-dark-bg/50 rounded-lg border border-dark-border">
                                <label className="flex items-center gap-3 text-sm text-white cursor-pointer w-full">
                                    <input type="checkbox" name="activo" className="w-4 h-4 accent-brand" checked={formData.activo !== false} onChange={handleChange} />
                                    <span className="font-medium">Recurso Activo y disponible para Órdenes de Trabajo</span>
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-dark-border">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-txt-secondary hover:text-white transition-colors">Cancelar</button>
                        <button type="submit" disabled={!formData.codigo} className="bg-brand hover:bg-brand-hover text-white px-8 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand/20">
                            Guardar Registro
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CatalogoModal;