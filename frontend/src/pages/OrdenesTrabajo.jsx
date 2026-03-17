import React, { useState, useEffect, useRef } from 'react';
import { Wrench, CheckCircle, Clock, AlertTriangle, FileText, Plus, Search, DollarSign, Activity, PackageMinus, ChevronDown, Trash2, X } from 'lucide-react';
import api from '../utils/api';

// 🛡️ IMPORTACIONES DE SEGURIDAD FRONTEND
import { useAuth } from '../context/AuthContext';
import { tienePermiso, PERMISOS_FRONT } from '../config/permissions';

import ConfiguracionHorarioOT from '../components/ConfiguracionHorarioOT';
import { calcularHorasEfectivas } from '../utils/horarios';

// ==========================================
// 🚀 COMPONENTE UI: BUSCADOR INTELIGENTE
// ==========================================
const BuscadorInteligente = ({ value, onChange, options, placeholder }) => {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    const selectedOption = options.find(o => String(o.id) === String(value));
    const displayValue = selectedOption ? selectedOption.label : query;
    const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <input
                    type="text"
                    className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 pr-8 text-sm text-white focus:border-brand outline-none cursor-pointer"
                    placeholder={placeholder}
                    value={open ? query : displayValue || ''}
                    onChange={e => { setQuery(e.target.value); setOpen(true); onChange(''); }}
                    onFocus={() => { setOpen(true); setQuery(''); }}
                />
                <ChevronDown className={`absolute right-2.5 top-3 text-txt-secondary transition-transform ${open ? 'rotate-180' : ''}`} size={16} />
            </div>
            {open && (
                <ul className="absolute z-[100] w-full mt-1 max-h-48 overflow-y-auto bg-[#1e2330] border border-brand/50 rounded-lg shadow-2xl custom-scrollbar">
                    {filtered.length === 0 ? (
                        <li className="p-3 text-sm text-txt-secondary italic">No se encontraron resultados...</li>
                    ) : (
                        filtered.map(opt => (
                            <li
                                key={opt.id}
                                className={`p-2.5 hover:bg-brand/20 cursor-pointer text-sm text-white border-b border-dark-border/50 last:border-0 ${String(value) === String(opt.id) ? 'bg-brand/10 border-l-2 border-l-brand' : ''}`}
                                onClick={() => { onChange(opt.id); setQuery(''); setOpen(false); }}
                            >
                                {opt.label}
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
};

// ==========================================
// 🏭 COMPONENTE PRINCIPAL: ORDENES DE TRABAJO
// ==========================================
const OrdenesTrabajo = () => {
    const { user } = useAuth();

    // 🛡️ CANDADOS DE SEGURIDAD CENTRALIZADOS
    const puedeGestionarOT = tienePermiso(user?.rol, PERMISOS_FRONT.OT_FINANZAS);
    const puedeOperarTaller = tienePermiso(user?.rol, PERMISOS_FRONT.OT_TALLER_OPERAR);
    const puedeVerFinanzas = puedeGestionarOT;

    const [isOtEmailModalOpen, setIsOtEmailModalOpen] = useState(false);
    const [otEmailDestino, setOtEmailDestino] = useState('');
    const [isSendingOtPdf, setIsSendingOtPdf] = useState(false);
    const [correosHistorial, setCorreosHistorial] = useState([]);

    const cargarCorreosHistorial = async () => {
        try {
            const res = await api.get('/api/ordenes-trabajo/correos-internos');
            setCorreosHistorial(res.data);
        } catch (error) {
            console.error("Error al cargar historial de correos:", error);
        }
    };

    const handleEnviarPdfOT = async (e) => {
        e.preventDefault();
        if (!otEmailDestino) return alert("Ingresa un correo de destino.");

        setIsSendingOtPdf(true);
        try {
            await api.post(`/api/ordenes-trabajo/${selectedOT.id}/enviar`, { email_interno: otEmailDestino });
            setIsOtEmailModalOpen(false);
            cargarOTs();
            alert("✅ ¡Orden de Trabajo enviada exitosamente al taller!");
        } catch (error) {
            alert(error.response?.data?.message || "Ocurrió un error al enviar la OT.");
        } finally {
            setIsSendingOtPdf(false);
        }
    };

    const [ordenes, setOrdenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('');
    const [selectedOT, setSelectedOT] = useState(null);
    const [activeTab, setActiveTab] = useState(puedeVerFinanzas ? 'resumen' : 'tareas');

    const [isOtDirectaAlertOpen, setIsOtDirectaAlertOpen] = useState(false);
    const [aceptaRiesgoOt, setAceptaRiesgoOt] = useState(false);
    const [entidades, setEntidades] = useState([]);
    const [formOtDirecta, setFormOtDirecta] = useState({ entidad_id: '', precio_venta: '' });
    const [busquedaClienteOT, setBusquedaClienteOT] = useState('');
    const [clienteOTDropdownOpen, setClienteOTDropdownOpen] = useState(false);

    const [expandedTasks, setExpandedTasks] = useState({});
    const toggleTask = (taskId) => setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));

    const [operarios, setOperarios] = useState([]);
    const [catalogoEquipos, setCatalogoEquipos] = useState([]);
    const [catalogoTareas, setCatalogoTareas] = useState([]);
    const [inventario, setInventario] = useState([]);

    const [isTareaModalOpen, setIsTareaModalOpen] = useState(false);
    const [isSubmittingTarea, setIsSubmittingTarea] = useState(false);
    const [formDataTarea, setFormDataTarea] = useState({ nombre: '', tipo: '', operario_id: '', observaciones: '' });

    const [isCargarModalOpen, setIsCargarModalOpen] = useState(false);
    const [tareaActiva, setTareaActiva] = useState(null);
    const [isSubmittingConsumo, setIsSubmittingConsumo] = useState(false);
    const [formDataConsumo, setFormDataConsumo] = useState({ unidad_stock_id: '', cantidad: '' });

    const [isHorasModalOpen, setIsHorasModalOpen] = useState(false);
    const [tareaSeleccionadaHoras, setTareaSeleccionadaHoras] = useState(null);
    const [formHoras, setFormHoras] = useState({ tipo_recurso: 'operario', recurso_id: '', horas: '', descripcion: '' });

    const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
    const [motivoPausa, setMotivoPausa] = useState('');
    const [tareaPausando, setTareaPausando] = useState(null);

    useEffect(() => {
        cargarOTs();
        if (puedeOperarTaller || puedeGestionarOT) {
            cargarOperarios();
            cargarEquipos();
            cargarCatalogoTareas();
            cargarInventarioBodega();
            cargarEntidades();
        }
        if (puedeOperarTaller) cargarCorreosHistorial();
    }, [user]);

    const cargarOTs = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/ordenes-trabajo');
            setOrdenes(response.data);
        } catch (error) { console.error("Error cargando OTs:", error); setOrdenes([]); }
        finally { setLoading(false); }
    };

    const cargarEntidades = async () => {
        try { const res = await api.get('/api/entidades'); setEntidades(res.data.filter(e => ['cliente', 'mixto'].includes(e.tipo) && e.activo)); } catch (e) { }
    };
    const cargarOperarios = async () => {
        try { const res = await api.get('/api/catalogos/operarios'); setOperarios(res.data.filter(o => o.activo)); } catch (e) { }
    };
    const cargarEquipos = async () => {
        try { const res = await api.get('/api/catalogos/equipos'); setCatalogoEquipos(res.data.filter(e => e.activo)); } catch (e) { }
    };
    const cargarCatalogoTareas = async () => {
        try { const res = await api.get('/api/catalogos/tareas'); setCatalogoTareas(res.data.filter(t => t.activo)); } catch (e) { }
    };
    const cargarInventarioBodega = async () => {
        try { const res = await api.get('/api/inventario'); setInventario(res.data.filter(item => Number(item.cantidad_disponible) > 0)); } catch (e) { }
    };

    const abrirPanelOT = (ot) => {
        setSelectedOT(ot);
        setActiveTab(puedeVerFinanzas ? 'resumen' : 'tareas');
    };

    // Función auxiliar para actualizar la vista sin cerrar el modal
    const refrescarOTSeleccionada = async () => {
        const response = await api.get('/api/ordenes-trabajo');
        setOrdenes(response.data);
        if (selectedOT) {
            setSelectedOT(response.data.find(o => o.id === selectedOT.id) || selectedOT);
        }
    };

    // ==========================================
    // 🛠️ ACCIONES DE EXTORNOS Y TAREAS
    // ==========================================

    const handleEliminarTarea = async (tarea) => {
        if (!window.confirm(`¿Seguro que deseas eliminar la tarea "${tarea.nombre}"?`)) return;
        try {
            await api.delete(`/api/ordenes-trabajo/${selectedOT.id}/tareas/${tarea.id}`);
            await refrescarOTSeleccionada();
        } catch (error) { alert(error.response?.data?.message || "Error al eliminar la tarea."); }
    };

    const handleRevertirMaterial = async (tareaId, consumoId) => {
        if (!window.confirm("¿Devolver este material a la bodega?")) return;
        try {
            await api.delete(`/api/ordenes-trabajo/${selectedOT.id}/tareas/${tareaId}/materiales/${consumoId}`);
            await refrescarOTSeleccionada();
            cargarInventarioBodega();
        } catch (error) { alert(error.response?.data?.message || "Error al revertir material"); }
    };

    const handleRevertirHoras = async (tareaId, registroId) => {
        if (!window.confirm("¿Eliminar este registro de horas?")) return;
        try {
            await api.delete(`/api/ordenes-trabajo/${selectedOT.id}/tareas/${tareaId}/horas/${registroId}`);
            await refrescarOTSeleccionada();
        } catch (error) { alert(error.response?.data?.message || "Error al revertir horas"); }
    };

    const handleCrearOTDirecta = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/ordenes-trabajo/directa', formOtDirecta);
            setIsOtDirectaAlertOpen(false);
            setAceptaRiesgoOt(false);
            setFormOtDirecta({ entidad_id: '', precio_venta: '' });
            setBusquedaClienteOT('');
            cargarOTs();
        } catch (error) { alert(error.response?.data?.message || "Error al crear la OT Directa"); }
    };

    const handleCrearTarea = async (e) => {
        e.preventDefault();
        setIsSubmittingTarea(true);
        try {
            await api.post(`/api/ordenes-trabajo/${selectedOT.id}/tareas`, formDataTarea);
            setIsTareaModalOpen(false);
            await refrescarOTSeleccionada();
        } catch (error) { alert("Error al crear la tarea: " + (error.response?.data?.message || "")); }
        finally { setIsSubmittingTarea(false); }
    };

    const handleCargarHoras = async (e) => {
        e.preventDefault();
        try {
            const payload = { horas: parseFloat(formHoras.horas), descripcion: formHoras.descripcion };
            if (formHoras.tipo_recurso === 'operario') payload.operario_id = formHoras.recurso_id;
            else payload.equipo_id = formHoras.recurso_id;

            await api.post(`/api/ordenes-trabajo/${selectedOT.id}/tareas/${tareaSeleccionadaHoras.id}/horas`, payload);
            setIsHorasModalOpen(false);
            setFormHoras({ tipo_recurso: 'operario', recurso_id: '', horas: '', descripcion: '' });
            await refrescarOTSeleccionada();
        } catch (error) { alert(error.response?.data?.message || "Error al registrar las horas"); }
    };

    const abrirModalConsumo = (tarea) => {
        setTareaActiva(tarea);
        setFormDataConsumo({ unidad_stock_id: '', cantidad: '' });
        setIsCargarModalOpen(true);
    };

    const handleConsumirMaterial = async (e) => {
        e.preventDefault();

        // 🔒 NUEVO CANDADO: Evitar que se envíen IDs vacíos al backend
        if (!formDataConsumo.unidad_stock_id) {
            return alert("⚠️ Por favor, busca y selecciona un material disponible en bodega.");
        }

        setIsSubmittingConsumo(true);
        try {
            await api.post(`/api/ordenes-trabajo/${selectedOT.id}/tareas/${tareaActiva.id}/materiales`, {
                unidad_stock_id: formDataConsumo.unidad_stock_id,
                cantidad: formDataConsumo.cantidad
            });
            setIsCargarModalOpen(false);
            await refrescarOTSeleccionada();
            cargarInventarioBodega();
        } catch (error) { alert(error.response?.data?.message || "Error consumiendo material"); }
        finally { setIsSubmittingConsumo(false); }
    };

    const handleCambiarEstadoTarea = async (tarea, nuevoEstado, extras = {}) => {
        try {
            await api.patch(`/api/ordenes-trabajo/${selectedOT.id}/tareas/${tarea.id}/estado`, { estado: nuevoEstado, ...extras });
            await refrescarOTSeleccionada();
        } catch (error) { alert("Error al cambiar estado: " + (error.response?.data?.message || "")); }
    };

    const handlePausarTarea = async () => {
        try {
            await api.patch(`/api/ordenes-trabajo/${selectedOT.id}/tareas/${tareaPausando.id}/estado`, { estado: 'pausada', motivo: motivoPausa });
            setIsPauseModalOpen(false);
            setMotivoPausa('');
            setTareaPausando(null);
            await refrescarOTSeleccionada();
        } catch (error) { alert("Error al pausar: " + (error.response?.data?.message || "")); }
    };

    const handleCambiarEstadoOT = async (nuevoEstado) => {
        if (nuevoEstado === 'lista_para_entrega') {
            const tareasIncompletas = selectedOT.tareas?.filter(t => t.estado !== 'completada').length || 0;
            if (tareasIncompletas > 0) {
                if (!window.confirm(`Aún hay ${tareasIncompletas} tarea(s) sin finalizar. ¿Enviar a Oficina igual?`)) return;
            }
        }
        try {
            await api.patch(`/api/ordenes-trabajo/${selectedOT.id}/estado`, { estado: nuevoEstado });
            await refrescarOTSeleccionada();
        } catch (error) { alert("Error al cambiar estado OT: " + (error.response?.data?.message || "")); }
    };

    const clientesOTFiltrados = entidades.filter(e => {
        if (!busquedaClienteOT || busquedaClienteOT.length < 2) return true;
        return e.nombre.toLowerCase().includes(busquedaClienteOT.toLowerCase()) || e.rut?.toLowerCase().includes(busquedaClienteOT.toLowerCase());
    }).slice(0, 8);

    const calcularColorMargen = (porcentaje) => {
        if (porcentaje >= 40) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        if (porcentaje >= 15) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        return 'text-red-400 bg-red-500/10 border-red-500/20';
    };

    const getEstadoBadge = (estado) => {
        switch (estado) {
            case 'abierta': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'en_proceso': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'lista_para_entrega': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'entregada': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'facturada': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const otsFiltradas = ordenes.filter(ot =>
        ot.folio?.toLowerCase().includes(filtro.toLowerCase()) || ot.cliente_nombre?.toLowerCase().includes(filtro.toLowerCase())
    );

    const opcionesTareas = catalogoTareas.map(t => ({ id: t.codigo, label: `[${t.codigo}] ${t.nombre}` }));
    const opcionesOperarios = operarios.map(op => ({ id: op.id, label: `[${op.codigo || 'OPE.---.000'}] ${op.nombre} - ${op.especialidad}` }));
    const opcionesEquipos = catalogoEquipos.map(eq => ({ id: eq.id, label: `[${eq.codigo || 'MAQ.---.000'}] ${eq.nombre}` }));
    const opcionesMateriales = inventario.map(item => ({
        id: item.id,
        label: `[${item.producto?.codigo || 'MAT'}] ${item.producto?.nombre} (Bodega: ${Number(item.cantidad_disponible)} ${item.producto?.unidad_base})`
    }));

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-txt-primary flex items-center gap-2">
                        <Wrench className="text-brand" /> Órdenes de Trabajo (OT)
                    </h2>
                    <p className="text-txt-secondary">Control de producción, tareas y rentabilidad</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 text-txt-secondary" size={18} />
                        <input type="text" placeholder="Buscar folio o cliente..." className="w-full bg-dark-surface border border-dark-border rounded-lg pl-10 pr-4 py-2 text-txt-primary focus:border-brand outline-none" onChange={(e) => setFiltro(e.target.value)} />
                    </div>
                    {puedeOperarTaller && (
                        <button onClick={() => { setAceptaRiesgoOt(false); setIsOtDirectaAlertOpen(true); }} className="bg-dark-surface border border-brand text-brand hover:bg-brand/10 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shadow-lg shadow-brand/10">
                            <Plus size={20} /> OT Directa
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-dark-surface rounded-xl border border-dark-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-dark-bg/50 text-txt-secondary text-xs uppercase tracking-wider border-b border-dark-border">
                                <th className="p-4 font-medium">Folio OT</th>
                                <th className="p-4 font-medium">Cliente</th>
                                <th className="p-4 font-medium text-center">Estado</th>
                                <th className="p-4 font-medium text-center">Progreso</th>
                                <th className="p-4 font-medium">Tarea Activa</th>
                                {puedeVerFinanzas && <th className="p-4 font-medium text-right">Precio Venta</th>}
                                {puedeVerFinanzas && <th className="p-4 font-medium text-right">Costo Real</th>}
                                {puedeVerFinanzas && <th className="p-4 font-medium text-right">Rentabilidad</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                            {otsFiltradas.map((ot) => (
                                <tr key={ot.id} onClick={() => abrirPanelOT(ot)} className="hover:bg-dark-bg/30 transition-colors cursor-pointer group">
                                    <td className="p-4">
                                        <p className="font-bold text-brand group-hover:text-brand-hover">{ot.folio}</p>
                                        {(() => {
                                            if (!ot.horario_programado) return null;
                                            const config = typeof ot.horario_programado === 'string' ? JSON.parse(ot.horario_programado) : ot.horario_programado;

                                            if (config.fecha_entrega && !['entregada', 'facturada'].includes(ot.estado)) {
                                                const ahora = new Date();
                                                const limite = new Date(`${config.fecha_entrega}T18:00:00`);

                                                if (ahora >= limite) {
                                                    return <p className="text-[10px] font-bold text-red-500 mt-1 uppercase animate-pulse">🔴 Atrasada</p>;
                                                }

                                                const hhRestantes = calcularHorasEfectivas(ahora, limite, config);

                                                return (
                                                    <div className={`mt-1 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded w-max border ${hhRestantes < 15 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                                        ⏳ {hhRestantes.toFixed(1)} HH Rest.
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </td>

                                    <td className="p-4 text-white font-medium">{ot.cliente_nombre}</td>

                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${getEstadoBadge(ot.estado)}`}>
                                            {ot.estado}
                                        </span>
                                    </td>

                                    <td className="p-4 text-center">
                                        {(() => {
                                            const total = ot.tareas?.length || 0;
                                            const completadas = ot.tareas?.filter(t => t.estado === 'completada').length || 0;
                                            if (total === 0) return <span className="text-xs text-txt-secondary italic">Sin tareas</span>;
                                            const porcentaje = Math.round((completadas / total) * 100);
                                            return (
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="w-16 h-1.5 bg-dark-bg rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all ${completadas === total ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${porcentaje}%` }}></div>
                                                    </div>
                                                    <span className={`text-[10px] font-bold ${completadas === total ? 'text-emerald-400' : 'text-txt-secondary'}`}>{completadas}/{total}</span>
                                                </div>
                                            );
                                        })()}
                                    </td>

                                    <td className="p-4">
                                        {(() => {
                                            const enProceso = ot.tareas?.find(t => t.estado === 'en_proceso');
                                            const pendiente = ot.tareas?.find(t => t.estado === 'pendiente');
                                            const total = ot.tareas?.length || 0;
                                            const completadas = ot.tareas?.filter(t => t.estado === 'completada').length || 0;
                                            if (total === 0) return <span className="text-xs text-txt-secondary italic">—</span>;
                                            if (completadas === total) return <span className="text-xs text-emerald-400 font-medium">✅ Todo completado</span>;
                                            if (enProceso) return <span className="text-xs text-amber-400 font-medium">⚙️ {enProceso.nombre}</span>;
                                            if (pendiente) return <span className="text-xs text-slate-400 font-medium">▶️ {pendiente.nombre}</span>;
                                            return <span className="text-xs text-txt-secondary italic">—</span>;
                                        })()}
                                    </td>

                                    {puedeVerFinanzas && <td className="p-4 text-right text-txt-secondary font-mono">${Number(ot.precio_venta).toLocaleString('es-CL')}</td>}
                                    {puedeVerFinanzas && <td className="p-4 text-right text-txt-secondary font-mono">${Number(ot.costo_real).toLocaleString('es-CL')}</td>}
                                    {puedeVerFinanzas && (
                                        <td className="p-4 text-right">
                                            <span className={`px-2 py-1 rounded text-xs font-bold border ${calcularColorMargen(ot.margen_porcentaje)}`}>{ot.margen_porcentaje}%</span>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PANEL DETALLE OT */}
            {selectedOT && (
                <div className="fixed inset-0 z-[60] flex justify-center bg-black/80 backdrop-blur-sm p-4 py-10 animate-fadeIn overflow-y-auto">
                    <div className="bg-dark-surface border border-dark-border w-full max-w-6xl h-max my-auto rounded-xl shadow-2xl flex flex-col">
                        <div className="p-6 border-b border-dark-border bg-dark-bg/50 flex justify-between items-start rounded-t-xl">
                            <div>
                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                    <h3 className="text-xl md:text-2xl font-bold text-white">{selectedOT.folio}</h3>
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${getEstadoBadge(selectedOT.estado)}`}>{selectedOT.estado}</span>

                                    <div className="flex flex-wrap items-center gap-2 ml-2">
                                        {puedeOperarTaller && selectedOT.estado === 'abierta' && (<button onClick={() => handleCambiarEstadoOT('en_proceso')} className="text-[10px] bg-amber-600/20 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/30 px-3 py-1 rounded font-bold uppercase">🚀 Iniciar Producción</button>)}
                                        {puedeOperarTaller && selectedOT.estado === 'en_proceso' && (<button onClick={() => handleCambiarEstadoOT('lista_para_entrega')} className="text-[10px] bg-purple-600/20 hover:bg-purple-500 text-purple-400 hover:text-white border border-purple-500/30 px-3 py-1 rounded font-bold uppercase">🛎️ Lista para Entrega</button>)}
                                        {puedeGestionarOT && selectedOT.estado === 'lista_para_entrega' && (<><button onClick={() => handleCambiarEstadoOT('entregada')} className="text-[10px] bg-indigo-600/20 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/30 px-3 py-1 rounded font-bold uppercase">🚚 Marcar Entregada</button><button onClick={() => handleCambiarEstadoOT('en_proceso')} className="text-[10px] bg-red-600/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 px-3 py-1 rounded font-bold uppercase">❌ Rechazar (A Taller)</button></>)}
                                        {puedeGestionarOT && selectedOT.estado === 'entregada' && (<><button onClick={() => handleCambiarEstadoOT('facturada')} className="text-[10px] bg-emerald-600/20 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 px-3 py-1 rounded font-bold uppercase">✅ Cerrar y Facturar</button><button onClick={() => handleCambiarEstadoOT('en_proceso')} className="text-[10px] bg-red-600/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 px-3 py-1 rounded font-bold uppercase">⚠️ Retrabajo (A Taller)</button></>)}
                                    </div>
                                </div>
                                <p className="text-txt-secondary flex items-center gap-2 mt-2 text-sm"><FileText size={14} /> {selectedOT.cliente_nombre}</p>
                            </div>
                            <button onClick={() => setSelectedOT(null)} className="text-txt-secondary hover:text-white transition-colors">✕</button>
                        </div>

                        {puedeVerFinanzas && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-dark-bg border-b border-dark-border">
                                <div className="bg-dark-surface p-4 rounded-lg border border-dark-border">
                                    <p className="text-[10px] text-txt-secondary font-bold uppercase tracking-wider mb-1">Venta Aprobada (Meta)</p>
                                    <p className="text-2xl font-bold text-white font-mono">${Number(selectedOT.precio_venta).toLocaleString('es-CL')}</p>
                                </div>
                                <div className="bg-dark-surface p-4 rounded-lg border border-dark-border">
                                    <p className="text-[10px] text-txt-secondary font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Activity size={14} className="text-red-400" /> Costo Real Acumulado</p>
                                    <p className="text-2xl font-bold text-red-400 font-mono">${Number(selectedOT.costo_real).toLocaleString('es-CL')}</p>
                                </div>
                                <div className={`p-4 rounded-lg border ${calcularColorMargen(selectedOT.margen_porcentaje)}`}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1">Rentabilidad Actual</p>
                                    <div className="flex items-end gap-2">
                                        <p className="text-3xl font-black font-mono">{selectedOT.margen_porcentaje}%</p>
                                        <p className="text-sm font-medium mb-1 opacity-80 font-mono">(${Number(selectedOT.precio_venta - selectedOT.costo_real).toLocaleString('es-CL')})</p>
                                    </div>
                                    <div className="w-full bg-black/20 h-2 rounded-full mt-2 overflow-hidden"><div className="bg-current h-full transition-all" style={{ width: `${Math.max(0, Math.min(100, selectedOT.margen_porcentaje))}%` }}></div></div>
                                </div>
                            </div>
                        )}

                        <div className="flex px-6 pt-4 border-b border-dark-border bg-dark-surface overflow-x-auto custom-scrollbar">
                            {puedeVerFinanzas && <button onClick={() => setActiveTab('resumen')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'resumen' ? 'border-brand text-brand' : 'border-transparent text-txt-secondary hover:text-white'}`}>Resumen Comercial</button>}

                            <button onClick={() => setActiveTab('tareas')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'tareas' ? 'border-brand text-brand' : 'border-transparent text-txt-secondary hover:text-white'}`}>
                                Tareas de Taller <span className="bg-dark-bg border border-dark-border text-txt-secondary px-1.5 py-0.5 rounded text-[10px]">{selectedOT.tareas?.length || 0}</span>
                            </button>

                            {puedeVerFinanzas && (
                                <button onClick={() => setActiveTab('costos')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'costos' ? 'border-amber-500 text-amber-500' : 'border-transparent text-txt-secondary hover:text-white'}`}>
                                    <DollarSign size={16} /> Centro de Costos
                                </button>
                            )}

                            {puedeGestionarOT && (
                                <button onClick={() => setActiveTab('horarios')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'horarios' ? 'border-brand text-brand' : 'border-transparent text-txt-secondary hover:text-white'}`}>
                                    <Clock size={16} /> Horarios y Excepciones
                                </button>
                            )}
                        </div>

                        <div className="p-6 bg-dark-surface rounded-b-xl">

                            {/* PESTAÑA RESUMEN */}
                            {activeTab === 'resumen' && puedeVerFinanzas && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-dark-bg p-4 rounded-lg border border-dark-border">
                                        <div><p className="text-[10px] text-txt-secondary uppercase font-bold mb-1">Emisión OT</p><p className="text-white text-sm font-medium">{new Date(selectedOT.fecha_inicio).toLocaleDateString('es-CL')}</p></div>
                                        <div><p className="text-[10px] text-txt-secondary uppercase font-bold mb-1">Cotización Origen</p><p className="text-brand text-sm font-mono font-bold">{selectedOT.cotizacion?.folio || `COT-000${selectedOT.cotizacion_id || 'N/A'}`}</p></div>
                                        <div className="md:col-span-2"><p className="text-[10px] text-txt-secondary uppercase font-bold mb-1">Observaciones Comerciales</p><p className="text-white text-sm italic">{selectedOT.cotizacion?.observaciones || 'Sin observaciones.'}</p></div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Alcance del Proyecto</h4>
                                        <div className="bg-dark-bg rounded-lg border border-dark-border overflow-hidden">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-dark-surface border-b border-dark-border text-txt-secondary">
                                                    <tr>
                                                        <th className="p-3 w-32 font-semibold">Código</th>
                                                        <th className="p-3 font-semibold">Descripción (Cotizada)</th>
                                                        <th className="p-3 text-center w-24 font-semibold">Cant.</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-dark-border">
                                                    {selectedOT.cotizacion?.detalle_cotizaciones?.map((item) => {
                                                        const codigoIndustrial = item.producto?.codigo || item.operario?.codigo || item.equipo?.codigo;
                                                        return (
                                                            <tr key={item.id} className="hover:bg-dark-surface/50 transition-colors">
                                                                <td className="p-3 w-32">
                                                                    {codigoIndustrial ? (
                                                                        <span className="text-brand font-mono text-[10px] bg-brand/10 border border-brand/20 px-2 py-1 rounded font-bold tracking-wider">
                                                                            {codigoIndustrial}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-txt-secondary text-[10px] uppercase font-bold bg-dark-bg px-2 py-1 rounded border border-dark-border">
                                                                            Genérico
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="p-3 text-white font-medium">{item.descripcion}</td>
                                                                <td className="p-3 text-center text-txt-secondary font-mono">{Number(item.cantidad)}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {!selectedOT.cotizacion && (
                                                        <tr><td colSpan="3" className="p-8 text-center text-txt-secondary italic">OT Directa (Sin cotización previa vinculada)</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PESTAÑA COSTOS */}
                            {activeTab === 'costos' && puedeVerFinanzas && (() => {
                                let totalMateriales = 0; let totalHH = 0; let totalHM = 0;
                                selectedOT.tareas?.forEach(tarea => {
                                    tarea.consumo_ot?.forEach(c => { totalMateriales += Number(c.cantidad_utilizada) * Number(c.unidad_stock?.producto?.precio_compra || 0); });
                                    tarea.registro_tiempo?.forEach(r => { if (r.operario_id) totalHH += Number(r.costo_total); if (r.equipo_id) totalHM += Number(r.costo_total); });
                                });
                                const totalGastado = totalMateriales + totalHH + totalHM;
                                const pctMateriales = totalGastado > 0 ? (totalMateriales / totalGastado) * 100 : 0;
                                const pctHH = totalGastado > 0 ? (totalHH / totalGastado) * 100 : 0;
                                const pctHM = totalGastado > 0 ? (totalHM / totalGastado) * 100 : 0;

                                return (
                                    <div className="space-y-6 animate-fadeIn">
                                        <div className="bg-dark-bg border border-dark-border rounded-lg p-6">
                                            <div className="flex justify-between text-sm mb-3">
                                                <span className="text-txt-secondary font-bold uppercase tracking-wider text-xs">Composición del Costo Total</span>
                                                <span className="font-bold text-white text-lg font-mono">${totalGastado.toLocaleString('es-CL')}</span>
                                            </div>
                                            {totalGastado > 0 ? (
                                                <div className="w-full h-4 rounded-full flex overflow-hidden bg-dark-surface shadow-inner">
                                                    {pctMateriales > 0 && <div style={{ width: `${pctMateriales}%` }} className="bg-blue-500 hover:opacity-80 transition-opacity" title={`Materiales: ${pctMateriales.toFixed(1)}%`}></div>}
                                                    {pctHH > 0 && <div style={{ width: `${pctHH}%` }} className="bg-emerald-500 hover:opacity-80 transition-opacity" title={`Mano de Obra (HH): ${pctHH.toFixed(1)}%`}></div>}
                                                    {pctHM > 0 && <div style={{ width: `${pctHM}%` }} className="bg-purple-500 hover:opacity-80 transition-opacity" title={`Equipos (HM): ${pctHM.toFixed(1)}%`}></div>}
                                                </div>
                                            ) : (
                                                <div className="w-full h-4 rounded-full bg-dark-surface border border-dark-border"></div>
                                            )}
                                            <div className="flex flex-wrap gap-6 mt-5 text-xs font-medium justify-center">
                                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> <span className="text-slate-300">Materiales ({pctMateriales.toFixed(1)}%)</span></div>
                                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> <span className="text-slate-300">Mano de Obra ({pctHH.toFixed(1)}%)</span></div>
                                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500"></span> <span className="text-slate-300">Equipos ({pctHM.toFixed(1)}%)</span></div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-dark-bg border border-dark-border rounded-lg p-5 flex flex-col items-center text-center">
                                                <PackageMinus className="text-blue-400 mb-3" size={32} />
                                                <p className="text-[10px] text-txt-secondary uppercase font-bold mb-1 tracking-wider">Gasto Materiales</p>
                                                <p className="text-2xl font-bold text-white font-mono">${totalMateriales.toLocaleString('es-CL')}</p>
                                            </div>
                                            <div className="bg-dark-bg border border-dark-border rounded-lg p-5 flex flex-col items-center text-center">
                                                <Wrench className="text-emerald-400 mb-3" size={32} />
                                                <p className="text-[10px] text-txt-secondary uppercase font-bold mb-1 tracking-wider">Gasto Horas Hombre</p>
                                                <p className="text-2xl font-bold text-white font-mono">${totalHH.toLocaleString('es-CL')}</p>
                                            </div>
                                            <div className="bg-dark-bg border border-dark-border rounded-lg p-5 flex flex-col items-center text-center">
                                                <Clock className="text-purple-400 mb-3" size={32} />
                                                <p className="text-[10px] text-txt-secondary uppercase font-bold mb-1 tracking-wider">Gasto Máquinas</p>
                                                <p className="text-2xl font-bold text-white font-mono">${totalHM.toLocaleString('es-CL')}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* PESTAÑA TAREAS (TALLER) */}
                            {activeTab === 'tareas' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Ruta de Fabricación</h4>
                                        {puedeOperarTaller && !['entregada', 'facturada'].includes(selectedOT.estado) && (
                                            <button onClick={() => { setFormDataTarea({ nombre: '', tipo: '', operario_id: '', observaciones: '' }); setIsTareaModalOpen(true); }} className="text-xs bg-brand/20 border border-brand/30 text-brand px-3 py-1.5 rounded flex items-center gap-1 hover:bg-brand hover:text-white transition-colors font-medium">
                                                <Plus size={14} /> Nueva Tarea
                                            </button>
                                        )}
                                    </div>

                                    {selectedOT.tareas?.length === 0 ? (
                                        <div className="text-center p-10 border border-dashed border-dark-border rounded-lg text-txt-secondary">
                                            <Wrench size={32} className="mx-auto mb-3 opacity-30" />
                                            No hay tareas productivas asignadas a esta OT.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {selectedOT.tareas?.map(tarea => {
                                                const tieneCostos = tarea.consumo_ot?.length > 0 || tarea.registro_tiempo?.length > 0;

                                                return (
                                                    <div key={tarea.id} className="bg-dark-bg border border-dark-border rounded-lg overflow-hidden transition-colors shadow-sm">
                                                        <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-dark-surface/50">
                                                            <div className="flex items-start gap-3 w-full md:w-auto">
                                                                <button onClick={() => toggleTask(tarea.id)} className="text-txt-secondary hover:text-brand bg-dark-surface border border-dark-border p-1.5 rounded transition-colors mt-0.5">
                                                                    {expandedTasks[tarea.id] ? <ChevronDown size={16} className="rotate-180" /> : <ChevronDown size={16} />}
                                                                </button>
                                                                <div className="flex flex-col">

                                                                    <div className="flex items-center gap-2">
                                                                        <h5 className="font-bold text-white text-sm">{tarea.nombre}</h5>
                                                                        {/* 🧠 ELIMINAR TAREA (Condicional) */}
                                                                        {puedeOperarTaller && tarea.estado === 'pendiente' && (
                                                                            <div className="flex ml-2 border-l border-dark-border pl-2">
                                                                                {!tieneCostos ? (
                                                                                    <button onClick={() => handleEliminarTarea(tarea)} className="text-txt-secondary hover:text-red-400 transition-colors" title="Eliminar tarea vacía">
                                                                                        <Trash2 size={14} />
                                                                                    </button>
                                                                                ) : (
                                                                                    <button disabled className="text-dark-border cursor-not-allowed" title="No se puede borrar: Ya tiene materiales o tiempos descontados">
                                                                                        <Trash2 size={14} />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                                        <span className="text-[10px] text-txt-secondary font-mono bg-dark-surface border border-dark-border px-1.5 py-0.5 rounded">{tarea.tipo}</span>

                                                                        {puedeOperarTaller && selectedOT.estado === 'en_proceso' && tarea.estado === 'pendiente' && (<button onClick={(e) => { e.stopPropagation(); handleCambiarEstadoTarea(tarea, 'en_proceso'); }} className="text-[10px] bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/30 px-2 py-0.5 rounded transition-colors uppercase font-bold">▶️ Iniciar</button>)}
                                                                        {puedeOperarTaller && selectedOT.estado === 'en_proceso' && tarea.estado === 'en_proceso' && (<>
                                                                            <button onClick={(e) => { e.stopPropagation(); setTareaPausando(tarea); setIsPauseModalOpen(true); }} className="text-[10px] bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/30 px-2 py-0.5 rounded transition-colors uppercase font-bold">⏸️ Pausar</button>
                                                                            <button onClick={(e) => { e.stopPropagation(); handleCambiarEstadoTarea(tarea, 'completada'); }} className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 px-2 py-0.5 rounded transition-colors uppercase font-bold">✅ Finalizar</button>
                                                                        </>)}
                                                                        {puedeOperarTaller && selectedOT.estado === 'en_proceso' && tarea.estado === 'pausada' && (<>
                                                                            <button onClick={(e) => { e.stopPropagation(); handleCambiarEstadoTarea(tarea, 'en_proceso'); }} className="text-[10px] bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/30 px-2 py-0.5 rounded transition-colors uppercase font-bold">▶️ Reanudar</button>
                                                                        </>)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 self-end md:self-auto w-full md:w-auto justify-end">
                                                                <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded border ${tarea.estado === 'completada' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : tarea.estado === 'pausada' ? 'text-orange-400 border-orange-500/30 bg-orange-500/10' : tarea.estado === 'en_proceso' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10 animate-pulse' : 'text-blue-400 border-blue-500/30 bg-blue-500/10'}`}>
                                                                    {tarea.estado}
                                                                </span>

                                                                {puedeOperarTaller && !['entregada', 'facturada'].includes(selectedOT.estado) && (
                                                                    <>
                                                                        <button onClick={() => { setTareaSeleccionadaHoras(tarea); setIsHorasModalOpen(true); }} className="bg-dark-surface border border-blue-500/50 hover:bg-blue-500 text-blue-400 hover:text-white px-3 py-1.5 rounded text-xs transition-colors font-medium flex items-center gap-2">⏱️ Cargar HH</button>
                                                                        <button onClick={() => abrirModalConsumo(tarea)} className="bg-dark-surface border border-brand/50 hover:bg-brand text-brand hover:text-white px-3 py-1.5 rounded text-xs transition-colors font-medium flex items-center gap-2"><PackageMinus size={14} /> Material</button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {expandedTasks[tarea.id] && (
                                                            <div className="bg-dark-surface border-t border-dark-border p-5 animate-fadeIn">
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                                                    {/* 📦 BODEGA CONSUMIDA CON EXTORNO */}
                                                                    <div>
                                                                        <h6 className="text-[10px] font-bold text-txt-secondary uppercase mb-3 border-b border-dark-border pb-1">📦 Bodega Consumida</h6>
                                                                        {!tarea.consumo_ot?.length ? (<p className="text-xs text-slate-500 italic">Nada consumido aún.</p>) : (
                                                                            <ul className="space-y-2">
                                                                                {tarea.consumo_ot.map(c => (
                                                                                    <li key={c.id} className="text-xs flex flex-col gap-1 border-l-2 border-brand/30 pl-2 group">
                                                                                        <div className="flex justify-between items-center text-slate-300">
                                                                                            <span>{Number(c.cantidad_utilizada)}x {c.unidad_stock?.producto?.nombre}</span>

                                                                                            <div className="flex items-center gap-2">
                                                                                                {puedeVerFinanzas && (<span className="text-brand font-mono font-bold">${(Number(c.cantidad_utilizada) * Number(c.unidad_stock?.producto?.precio_compra || 0)).toLocaleString('es-CL')}</span>)}

                                                                                                {/* 🧠 BOTÓN EXTORNO MATERIAL */}
                                                                                                {puedeOperarTaller && !['entregada', 'facturada'].includes(selectedOT.estado) && (
                                                                                                    <button onClick={() => handleRevertirMaterial(tarea.id, c.id)} className="text-red-500/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all" title="Devolver a inventario">
                                                                                                        <X size={14} />
                                                                                                    </button>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                        <span className="text-[10px] text-txt-secondary font-mono">{c.unidad_stock?.producto?.codigo}</span>
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        )}
                                                                    </div>

                                                                    {/* ⏱️ HORAS INYECTADAS CON EXTORNO */}
                                                                    <div>
                                                                        <h6 className="text-[10px] font-bold text-txt-secondary uppercase mb-3 border-b border-dark-border pb-1">⏱️ Horas (HH/HM) Inyectadas</h6>
                                                                        {!tarea.registro_tiempo?.length ? (<p className="text-xs text-slate-500 italic">Sin registros de tiempo.</p>) : (
                                                                            <ul className="space-y-2">
                                                                                {tarea.registro_tiempo.map(t => (
                                                                                    <li key={t.id} className="text-xs flex flex-col gap-1 border-l-2 border-emerald-500/30 pl-2 group">
                                                                                        <div className="flex justify-between items-center text-slate-300">
                                                                                            <span><span className="font-bold">{Number(t.horas)}h</span> - {t.operario_id ? t.operario?.nombre : t.equipo?.nombre}</span>

                                                                                            <div className="flex items-center gap-2">
                                                                                                {puedeVerFinanzas && (<span className="text-amber-400 font-mono font-bold">${Number(t.costo_total).toLocaleString('es-CL')}</span>)}

                                                                                                {/* 🧠 BOTÓN EXTORNO HORAS */}
                                                                                                {puedeOperarTaller && !['entregada', 'facturada'].includes(selectedOT.estado) && (
                                                                                                    <button onClick={() => handleRevertirHoras(tarea.id, t.id)} className="text-red-500/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all" title="Eliminar horas cargadas">
                                                                                                        <X size={14} />
                                                                                                    </button>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                        {t.descripcion && <span className="text-[10px] text-txt-secondary italic">"{t.descripcion}"</span>}
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        )}
                                                                    </div>

                                                                    <div className="bg-dark-bg p-4 rounded-lg border border-dark-border shadow-inner">
                                                                        <h6 className="text-[10px] font-bold text-blue-400 uppercase mb-3 border-b border-dark-border pb-1 flex items-center gap-1">
                                                                            <Clock size={12} /> Cronómetro Operativo
                                                                        </h6>
                                                                        <div className="space-y-3">
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-[10px] text-txt-secondary uppercase">Inicio:</span>
                                                                                <span className="text-xs text-white font-mono">{tarea.fecha_inicio_real ? new Date(tarea.fecha_inicio_real).toLocaleString('es-CL') : <span className="text-slate-500 italic">No iniciada</span>}</span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-[10px] text-txt-secondary uppercase">Fin:</span>
                                                                                <span className="text-xs text-white font-mono">{tarea.fecha_fin_real ? new Date(tarea.fecha_fin_real).toLocaleString('es-CL') : <span className="text-slate-500 italic">Pendiente</span>}</span>
                                                                            </div>

                                                                            {tarea.fecha_inicio_real && tarea.fecha_fin_real && (() => {
                                                                                const tiempoTotalMs = new Date(tarea.fecha_fin_real) - new Date(tarea.fecha_inicio_real);
                                                                                const tiempoPausadoMs = (tarea.pausas_tarea || []).reduce((acc, p) => p.fecha_reanudacion ? acc + (new Date(p.fecha_reanudacion) - new Date(p.fecha_pausa)) : acc, 0);

                                                                                // Horas de reloj bruto (Calendario 24/7)
                                                                                const horasRelojTotales = (tiempoTotalMs - tiempoPausadoMs) / 3600000;

                                                                                // 🧠 Horas Hábiles (Cruzadas con el JSON de la OT)
                                                                                let horasHabilesEfectivas = calcularHorasEfectivas(tarea.fecha_inicio_real, tarea.fecha_fin_real, selectedOT.horario_programado);

                                                                                horasHabilesEfectivas = Math.max(0, horasHabilesEfectivas - (tiempoPausadoMs / 3600000));

                                                                                return (
                                                                                    <div className="pt-3 mt-3 border-t border-dark-border space-y-2">
                                                                                        <div className="flex justify-between items-center text-[10px] text-txt-secondary">
                                                                                            <span className="uppercase">Tiempo Reloj (24/7):</span>
                                                                                            <span className="font-mono">{horasRelojTotales.toFixed(1)}h</span>
                                                                                        </div>
                                                                                        <div className="flex justify-between items-center text-xs font-bold bg-blue-500/10 p-2 rounded border border-blue-500/20">
                                                                                            <span className="text-[10px] text-blue-400 uppercase">Tiempo Real (Hábil):</span>
                                                                                            <span className="text-blue-400 font-mono text-sm">{horasHabilesEfectivas.toFixed(1)}h</span>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })()}
                                                                        </div>

                                                                        {tarea.pausas_tarea?.length > 0 && (
                                                                            <div className="mt-4 pt-4 border-t border-dark-border">
                                                                                <div className="flex items-center gap-1.5 mb-2">
                                                                                    <span className="text-[10px] font-bold text-orange-400 uppercase">🚩 Historial de Pausas</span>
                                                                                    <span className="text-[10px] bg-orange-500/10 text-orange-400 px-1 rounded-full">{tarea.pausas_tarea.length}</span>
                                                                                </div>
                                                                                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                                                                    {tarea.pausas_tarea.map((p, idx) => (
                                                                                        <div key={idx} className="bg-dark-bg/50 border border-orange-500/10 p-2 rounded text-[10px] flex flex-col gap-1">
                                                                                            <div className="flex justify-between items-center text-txt-secondary">
                                                                                                <span>{new Date(p.fecha_pausa).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                                                                                {p.fecha_reanudacion ? (
                                                                                                    <span className="text-emerald-500">Reanudada: {new Date(p.fecha_reanudacion).toLocaleString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                                                                                                ) : (
                                                                                                    <span className="text-orange-500 font-bold animate-pulse">En curso</span>
                                                                                                )}
                                                                                            </div>
                                                                                            <p className="text-white italic">"{p.motivo}"</p>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'horarios' && puedeGestionarOT && (
                                <ConfiguracionHorarioOT ot={selectedOT} onUpdate={cargarOTs} />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL OT DIRECTA */}
            {isOtDirectaAlertOpen && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-dark-surface border-2 border-red-500/50 w-full max-w-lg rounded-xl shadow-2xl overflow-visible">
                        <div className="bg-red-500/10 p-6 flex items-start gap-4 border-b border-red-500/20">
                            <AlertTriangle className="text-red-500 shrink-0 mt-1" size={32} />
                            <div>
                                <h3 className="text-xl font-bold text-red-400 mb-2">Advertencia Financiera</h3>
                                <p className="text-sm text-slate-300 leading-relaxed">Estás a punto de crear una <strong>OT Directa</strong> sin Cotización previa. Los costos de taller se acumularán sin respaldo de venta garantizado.</p>
                            </div>
                        </div>
                        <form onSubmit={handleCrearOTDirecta} className="p-6 space-y-4">
                            <label className="flex items-start gap-3 cursor-pointer p-3 bg-dark-bg border border-dark-border rounded-lg hover:border-red-500/50 transition-colors">
                                <input type="checkbox" required className="mt-1 w-4 h-4 accent-red-500" checked={aceptaRiesgoOt} onChange={(e) => setAceptaRiesgoOt(e.target.checked)} />
                                <span className="text-sm text-slate-300">Confirmo autorización para iniciar producción directa.</span>
                            </label>
                            {aceptaRiesgoOt && (
                                <div className="space-y-4 pt-4 border-t border-dark-border animate-fadeIn">
                                    <div className="relative">
                                        <label className="block text-xs font-medium text-txt-secondary mb-1">Cliente a Facturar</label>
                                        <div className="relative">
                                            <input type="text" placeholder="Buscar por RUT o nombre..." className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-white focus:border-red-500 outline-none pl-8" value={busquedaClienteOT} onChange={(e) => { setBusquedaClienteOT(e.target.value); setClienteOTDropdownOpen(true); if (!e.target.value) setFormOtDirecta({ ...formOtDirecta, entidad_id: '' }); }} onFocus={() => setClienteOTDropdownOpen(true)} />
                                            <Search className="absolute left-2.5 top-3 text-txt-secondary" size={16} />
                                        </div>
                                        {clienteOTDropdownOpen && busquedaClienteOT.length >= 2 && clientesOTFiltrados.length > 0 && (
                                            <ul className="absolute z-[100] w-full mt-1 bg-[#1e2330] border border-red-500/50 rounded-lg shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                                                {clientesOTFiltrados.map(c => (
                                                    <li key={c.id} className="p-3 hover:bg-red-500/20 cursor-pointer border-b border-dark-border last:border-0" onClick={() => { setFormOtDirecta({ ...formOtDirecta, entidad_id: c.id }); setBusquedaClienteOT(`${c.rut} - ${c.nombre}`); setClienteOTDropdownOpen(false); }}>
                                                        <span className="text-sm text-white font-medium">{c.nombre}</span><span className="text-xs text-red-400 block mt-0.5">{c.rut}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-txt-secondary mb-1">Venta Acordada (Opcional)</label>
                                        <input type="number" min="0" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-white focus:border-red-500 outline-none" placeholder="Ej. 1500000" value={formOtDirecta.precio_venta} onChange={(e) => setFormOtDirecta({ ...formOtDirecta, precio_venta: e.target.value })} />
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => { setIsOtDirectaAlertOpen(false); setAceptaRiesgoOt(false); setBusquedaClienteOT(''); }} className="px-4 py-2 text-sm text-txt-secondary hover:text-white">Cancelar</button>
                                <button type="submit" disabled={!aceptaRiesgoOt || !formOtDirecta.entidad_id} className="bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-2 rounded-lg text-sm font-medium">Crear OT Directa</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODALES TALLER: CREAR TAREA, MATERIALES Y HH */}
            {isTareaModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-dark-surface border border-brand/50 w-full max-w-md rounded-xl shadow-2xl p-6 overflow-visible">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Plus size={18} className="text-brand" /> Nueva Tarea</h3>
                            <button onClick={() => setIsTareaModalOpen(false)} className="text-txt-secondary hover:text-white transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleCrearTarea} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-txt-secondary mb-1">Nombre Descriptivo</label>
                                <input type="text" required placeholder="Ej: Corte de Planchas" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-white focus:border-brand outline-none" value={formDataTarea.nombre} onChange={(e) => setFormDataTarea({ ...formDataTarea, nombre: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-txt-secondary mb-1">Tipo de Trabajo (Catálogo)</label>
                                <BuscadorInteligente options={opcionesTareas} value={formDataTarea.tipo} onChange={(val) => setFormDataTarea({ ...formDataTarea, tipo: val })} placeholder="Buscar código o tarea..." />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-dark-border">
                                <button type="button" onClick={() => setIsTareaModalOpen(false)} className="px-4 py-2 text-sm text-txt-secondary hover:text-white">Cancelar</button>
                                <button type="submit" disabled={isSubmittingTarea} className="bg-brand hover:bg-brand-dark text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50">Crear Tarea</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isCargarModalOpen && tareaActiva && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-dark-surface border border-brand/50 w-full max-w-md rounded-xl shadow-2xl p-6 overflow-visible">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-brand flex items-center gap-2"><PackageMinus size={18} /> Extraer de Bodega</h3>
                            <button onClick={() => setIsCargarModalOpen(false)} className="text-txt-secondary hover:text-white">✕</button>
                        </div>
                        <div className="mb-4 p-3 bg-dark-bg border border-dark-border rounded-lg">
                            <p className="text-xs text-txt-secondary uppercase">Cargando a la tarea:</p>
                            <p className="font-bold text-white text-sm">{tareaActiva.nombre}</p>
                        </div>
                        <form onSubmit={handleConsumirMaterial} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-txt-secondary mb-1">Buscar Material en Stock</label>
                                <BuscadorInteligente options={opcionesMateriales} value={formDataConsumo.unidad_stock_id} onChange={(val) => setFormDataConsumo({ ...formDataConsumo, unidad_stock_id: val })} placeholder="Buscar MAT..." />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-txt-secondary mb-1">Cantidad a Consumir</label>
                                <input type="number" min="0.01" step="0.01" required placeholder="Ej: 5" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-white focus:border-brand outline-none" value={formDataConsumo.cantidad} onChange={(e) => setFormDataConsumo({ ...formDataConsumo, cantidad: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-dark-border">
                                <button type="button" onClick={() => setIsCargarModalOpen(false)} className="px-4 py-2 text-sm text-txt-secondary hover:text-white">Cancelar</button>
                                <button type="submit" disabled={isSubmittingConsumo || !formDataConsumo.unidad_stock_id} className="bg-brand hover:bg-brand-dark text-white px-6 py-2 rounded-lg text-sm font-medium shadow-lg shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed">Extraer Material</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isHorasModalOpen && tareaSeleccionadaHoras && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-dark-surface border border-blue-500/50 w-full max-w-md rounded-xl shadow-2xl p-6 overflow-visible">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">⏱️ Inyectar Tiempos</h3>
                            <button onClick={() => setIsHorasModalOpen(false)} className="text-txt-secondary hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleCargarHoras} className="space-y-4">
                            <div>
                                <div className="flex gap-4 mb-4">
                                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer"><input type="radio" name="tipo_recurso" value="operario" checked={formHoras.tipo_recurso === 'operario'} onChange={(e) => setFormHoras({ ...formHoras, tipo_recurso: e.target.value, recurso_id: '' })} className="accent-blue-500" />👤 Mano de Obra (HH)</label>
                                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer"><input type="radio" name="tipo_recurso" value="equipo" checked={formHoras.tipo_recurso === 'equipo'} onChange={(e) => setFormHoras({ ...formHoras, tipo_recurso: e.target.value, recurso_id: '' })} className="accent-blue-500" />⚙️ Equipos (HM)</label>
                                </div>
                                <label className="block text-xs font-medium text-txt-secondary mb-1">Seleccionar Recurso</label>
                                <BuscadorInteligente options={formHoras.tipo_recurso === 'operario' ? opcionesOperarios : opcionesEquipos} value={formHoras.recurso_id} onChange={(val) => setFormHoras({ ...formHoras, recurso_id: val })} placeholder="Buscar OPE o MAQ..." />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-txt-secondary mb-1">Horas Trabajadas</label>
                                <input type="number" step="0.1" min="0.1" required placeholder="Ej: 2.5" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none" value={formHoras.horas} onChange={(e) => setFormHoras({ ...formHoras, horas: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-dark-border">
                                <button type="button" onClick={() => setIsHorasModalOpen(false)} className="px-4 py-2 text-sm text-txt-secondary hover:text-white">Cancelar</button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium">Registrar Costo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL PAUSAR TAREA */}
            {isPauseModalOpen && tareaPausando && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-dark-surface border border-orange-500/50 w-full max-w-md rounded-xl shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2">⏸️ Pausar Tarea</h3>
                            <button onClick={() => setIsPauseModalOpen(false)} className="text-txt-secondary hover:text-white transition-colors">✕</button>
                        </div>
                        <div className="mb-4 p-3 bg-dark-bg border border-dark-border rounded-lg">
                            <p className="text-xs text-txt-secondary uppercase">Tarea a pausar:</p>
                            <p className="font-bold text-white text-sm">{tareaPausando.nombre}</p>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handlePausarTarea(); }} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-txt-secondary mb-1">Motivo de la Pausa (Obligatorio)</label>
                                <textarea
                                    required
                                    rows="3"
                                    placeholder="Ej: Falta de material en bodega, esperando repuesto externo..."
                                    className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-white focus:border-orange-500 outline-none resize-none transition-all"
                                    value={motivoPausa}
                                    onChange={(e) => setMotivoPausa(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-dark-border">
                                <button type="button" onClick={() => setIsPauseModalOpen(false)} className="px-4 py-2 text-sm text-txt-secondary hover:text-white">Cancelar</button>
                                <button type="submit" disabled={!motivoPausa.trim()} className="bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-lg shadow-orange-900/20 transition-all">Detener Tarea</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdenesTrabajo;