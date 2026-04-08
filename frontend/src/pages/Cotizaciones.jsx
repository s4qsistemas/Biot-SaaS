import React, { useState, useEffect } from 'react';
import { PlusCircle, FileText, Trash2, Plus, Eye, Send, CheckCircle, XCircle, Pencil, Search } from 'lucide-react';
import { getCotizaciones, createCotizacion, getCotizacionById, updateEstadoCotizacion, updateCotizacionCompleta, deleteCotizacion } from '../services/cotizaciones.service';
import { getMateriales, getOperarios, getEquipos } from '../services/catalogos.service';
import api from '../utils/api';

// 🛡️ IMPORTACIONES DE SEGURIDAD FRONTEND
import { useAuth } from '../context/AuthContext';
import { tienePermiso, PERMISOS_FRONT } from '../config/permissions';
import { formatRut } from '../utils/rut';

const Cotizaciones = () => {
    const { user } = useAuth();
    // 🛡️ CANDADO DE ESCRITURA Y VARIABLE POLIMÓRFICA
    const puedeEscribir = tienePermiso(user?.rol, PERMISOS_FRONT.COTIZACIONES_ESCRIBIR);
    const esNaviero = user?.empresa?.modulo_naves_activo; // 👈 La llave maestra

    const [cotizaciones, setCotizaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Estados para Naves (Exclusivo Naviero)
    const [navesCliente, setNavesCliente] = useState([]);

    // Estados para el Buscador Fantasma
    const [catalogoMaestro, setCatalogoMaestro] = useState([]);
    const [busquedaActiva, setBusquedaActiva] = useState(null);
    const [sugerencias, setSugerencias] = useState([]);

    // Estados para el Buscador de Clientes
    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [clienteDropdownOpen, setClienteDropdownOpen] = useState(false);

    // 👇 formData actualizado con los campos nuevos
    const [formData, setFormData] = useState({
        entidad_id: '',
        validez_dias: 15,
        observaciones: '',
        nave_id: '',
        solicitud_cotizacion: '',
        plazo_entrega: '',
        descripcion_general: ''
    });

    const [items, setItems] = useState([
        { descripcion: '', cantidad: 1, unitario: 0, tipo_item: 'servicio', producto_id: null, operario_id: null, equipo_id: null }
    ]);

    const [selectedCotizacion, setSelectedCotizacion] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailDestino, setEmailDestino] = useState('');
    const [isSendingPdf, setIsSendingPdf] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [motivoRechazo, setMotivoRechazo] = useState('');

    const esCotizacionVencida = (cot) => {
        if (!cot || cot.estado !== 'enviada') return false;
        const fechaEmision = new Date(cot.fecha_emision);
        const diasValidez = cot.validez_dias || 15;
        const fechaVencimiento = new Date(fechaEmision.setDate(fechaEmision.getDate() + diasValidez));
        return new Date() > fechaVencimiento;
    };

    useEffect(() => {
        cargarCotizaciones();
        cargarClientes();
        cargarCatalogosMaestros();
    }, []);

    // 👇 EFECTO EN CASCADA: Buscar naves cuando cambia el cliente seleccionado (solo navieros)
    useEffect(() => {
        const fetchNavesDelCliente = async () => {
            if (esNaviero && formData.entidad_id) {
                try {
                    const res = await api.get('/api/naves');
                    // Filtramos en frontend por el cliente seleccionado y que estén activas
                    const navesAsociadas = res.data.filter(n => n.entidad_id === Number(formData.entidad_id) && n.activo);
                    setNavesCliente(navesAsociadas);
                } catch (error) {
                    console.error("Error al cargar naves del cliente:", error);
                }
            } else {
                setNavesCliente([]);
                setFormData(prev => ({ ...prev, nave_id: '' })); // Reset si quita el cliente
            }
        };
        fetchNavesDelCliente();
    }, [formData.entidad_id, esNaviero]);

    const cargarCotizaciones = async () => {
        try {
            setLoading(true);
            const data = await getCotizaciones();
            setCotizaciones(data);
        } catch (error) {
            console.error("Error al cargar cotizaciones:", error);
        } finally {
            setLoading(false);
        }
    };

    const cargarClientes = async () => {
        try {
            const response = await api.get('/api/entidades');
            setClientes(response.data.filter(c => c.activo));
        } catch (error) {
            console.error("Error al cargar clientes:", error);
        }
    };

    const cargarCatalogosMaestros = async () => {
        const [resMat, resHH, resHM] = await Promise.all([
            getMateriales(), getOperarios(), getEquipos()
        ]);

        const catalogoUnificado = [
            ...resMat.filter(m => m.activo).map(m => ({
                id: m.id, codigo: m.codigo, nombreBuscador: `[${m.codigo}] ${m.nombre}`, nombreCliente: m.nombre, precio: m.precio_venta, tipo_item: 'material', etiqueta: '📦 MAT'
            })),
            ...resHH.filter(h => h.activo).map(h => ({
                id: h.id, codigo: h.codigo || '', nombreBuscador: `[${h.codigo || 'OPE.---.000'}] ${h.nombre} - ${h.especialidad}`, nombreCliente: `${h.especialidad || 'Operario'} (${h.nombre})`, precio: h.valor_hora, tipo_item: 'hh', etiqueta: '👷‍♂️ OPE'
            })),
            ...resHM.filter(e => e.activo).map(e => ({
                id: e.id, codigo: e.codigo || '', nombreBuscador: `[${e.codigo || 'MAQ.---.000'}] ${e.nombre}`, nombreCliente: e.nombre, precio: e.valor_hora, tipo_item: 'hm', etiqueta: '⚙️ MAQ'
            }))
        ];
        setCatalogoMaestro(catalogoUnificado);
    };

    const handleVerDetalle = async (id) => {
        try {
            const data = await getCotizacionById(id);
            setSelectedCotizacion(data);
            setIsDetailModalOpen(true);
        } catch (error) {
            console.error("Error cargando detalle:", error);
            alert("No se pudo cargar el detalle de la cotización.");
        }
    };

    const handlePreviewPDF = async (idCotizacion) => {
        setIsGeneratingPdf(true);
        try {
            const response = await api.get(`/api/cotizaciones/${idCotizacion}/preview`, { responseType: 'blob' });
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, '_blank');
            setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
        } catch (error) {
            console.error("Error al generar vista previa:", error);
            alert("No se pudo generar la vista previa del documento.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleEditar = async (id) => {
        try {
            const dataCompleta = await getCotizacionById(id);
            // 👇 Llenamos todos los campos mutantes
            setFormData({
                entidad_id: dataCompleta.entidad_id,
                validez_dias: dataCompleta.validez_dias || 15,
                observaciones: dataCompleta.observaciones || '',
                nave_id: dataCompleta.nave_id || '',
                solicitud_cotizacion: dataCompleta.solicitud_cotizacion || '',
                plazo_entrega: dataCompleta.plazo_entrega || '',
                descripcion_general: dataCompleta.descripcion_general || ''
            });
            const clienteEdit = clientes.find(c => c.id === dataCompleta.entidad_id);
            setBusquedaCliente(clienteEdit ? `${formatRut(clienteEdit.rut)} - ${clienteEdit.nombre}` : dataCompleta.cliente_nombre || '');
            setItems(dataCompleta.detalle_cotizaciones.map(i => ({
                descripcion: i.descripcion,
                cantidad: i.cantidad,
                unitario: i.unitario,
                tipo_item: i.tipo_item || 'servicio',
                producto_id: i.producto_id || null,
                operario_id: i.operario_id || null,
                equipo_id: i.equipo_id || null
            })));
            setEditingId(id);
            setIsModalOpen(true);
        } catch (error) {
            console.error("Error al cargar para edición:", error);
            alert("No se pudo cargar la cotización para editar.");
        }
    };

    const abrirModalNuevo = () => {
        setEditingId(null);
        // 👇 Reseteo de campos extendidos
        setFormData({
            entidad_id: '', validez_dias: 15, observaciones: '',
            nave_id: '', solicitud_cotizacion: '', plazo_entrega: '', descripcion_general: ''
        });
        setBusquedaCliente('');
        setItems([{ descripcion: '', cantidad: 1, unitario: 0, tipo_item: 'servicio', producto_id: null, operario_id: null, equipo_id: null }]);
        setIsModalOpen(true);
    };

    const handleCambiarEstado = async (id, nuevoEstado, extras = {}) => {
        if (!window.confirm(`¿Estás seguro de cambiar el estado a ${nuevoEstado.toUpperCase()}?`)) return;
        try {
            await updateEstadoCotizacion(id, nuevoEstado, extras);
            setIsDetailModalOpen(false);
            cargarCotizaciones();
        } catch (error) {
            console.error("Error cambiando estado:", error);
            alert("Error al actualizar el estado.");
        }
    };

    const handleRechazar = async () => {
        if (!motivoRechazo.trim()) return alert("Debes ingresar un motivo de rechazo.");
        try {
            await updateEstadoCotizacion(selectedCotizacion.id, 'rechazada', { motivo_rechazo: motivoRechazo });
            setIsRejectModalOpen(false);
            setMotivoRechazo('');
            setIsDetailModalOpen(false);
            cargarCotizaciones();
        } catch (error) {
            console.error("Error al rechazar:", error);
            alert("Error al rechazar la cotización.");
        }
    };

    const handleDescripcionChange = (index, value) => {
        const nuevosItems = [...items];
        nuevosItems[index].descripcion = value;
        nuevosItems[index].tipo_item = 'servicio';
        nuevosItems[index].producto_id = null;
        nuevosItems[index].operario_id = null;
        nuevosItems[index].equipo_id = null;
        setItems(nuevosItems);

        if (value.length >= 2) {
            const term = value.toLowerCase();
            const resultados = catalogoMaestro.filter(item => item.nombreBuscador.toLowerCase().includes(term)).slice(0, 8);
            setSugerencias(resultados);
            setBusquedaActiva(index);
        } else {
            setBusquedaActiva(null);
        }
    };

    const handleEnviarPdf = async (e) => {
        e.preventDefault();
        if (!emailDestino) return alert("Por favor, ingresa un correo de destino.");
        setIsSendingPdf(true);
        try {
            await api.post(`/api/cotizaciones/${selectedCotizacion.id}/enviar`, { email_destino: emailDestino });
            setIsEmailModalOpen(false);
            cargarCotizaciones();
            const res = await api.get(`/api/cotizaciones/${selectedCotizacion.id}`);
            setSelectedCotizacion(res.data);
            alert("✅ ¡Cotización enviada exitosamente al cliente vía n8n!");
        } catch (error) {
            console.error("Error al enviar PDF:", error);
            alert(error.response?.data?.message || "Ocurrió un error al enviar la cotización.");
        } finally {
            setIsSendingPdf(false);
        }
    };

    const abrirModalEnvio = () => {
        setEmailDestino(selectedCotizacion.entidad?.email || '');
        setIsEmailModalOpen(true);
    };

    const seleccionarSugerencia = (index, sugerencia) => {
        const nuevosItems = [...items];
        nuevosItems[index].descripcion = sugerencia.nombreCliente;
        nuevosItems[index].unitario = sugerencia.precio;
        nuevosItems[index].tipo_item = sugerencia.tipo_item;

        if (sugerencia.tipo_item === 'material') nuevosItems[index].producto_id = sugerencia.id;
        if (sugerencia.tipo_item === 'hh') nuevosItems[index].operario_id = sugerencia.id;
        if (sugerencia.tipo_item === 'hm') nuevosItems[index].equipo_id = sugerencia.id;

        setItems(nuevosItems);
        setBusquedaActiva(null);
    };

    const handleItemChange = (index, field, value) => {
        const nuevosItems = [...items];
        nuevosItems[index][field] = value;
        setItems(nuevosItems);
    };

    const agregarFila = () => setItems([...items, { descripcion: '', cantidad: 1, unitario: 0, tipo_item: 'servicio', producto_id: null, operario_id: null, equipo_id: null }]);
    
    const insertarFila = (index) => {
        const nuevosItems = [...items];
        nuevosItems.splice(index + 1, 0, { descripcion: '', cantidad: 1, unitario: 0, tipo_item: 'servicio', producto_id: null, operario_id: null, equipo_id: null });
        setItems(nuevosItems);
    };

    const eliminarFila = (index) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const calcularTotales = () => {
        const neto = items.reduce((suma, item) => suma + (Number(item.cantidad) * Number(item.unitario)), 0);
        const iva = neto * 0.19;
        return { neto, iva, total: neto + iva };
    };

    const totales = calcularTotales();

    const clientesFiltrados = clientes
        .filter(c => c.activo && ['cliente', 'mixto'].includes(c.tipo))
        .filter(c => {
            if (!busquedaCliente || busquedaCliente.length < 2) return true;
            const term = busquedaCliente.toLowerCase();
            return c.nombre.toLowerCase().includes(term) || c.rut?.toLowerCase().includes(term);
        }).slice(0, 8);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.entidad_id) return alert("Debes seleccionar un cliente");
        if (items.some(i => !i.descripcion.trim() || i.cantidad <= 0 || i.unitario < 0)) return alert("Revisa que todos los ítems tengan descripción, cantidad y precio válido.");

        setIsSubmitting(true);
        try {
            const clienteSeleccionado = clientes.find(c => c.id === Number(formData.entidad_id));

            // 👇 Payload con los campos nuevos integrados
            const payload = {
                entidad_id: formData.entidad_id,
                cliente_nombre: clienteSeleccionado?.nombre || 'Cliente Desconocido',
                validez_dias: formData.validez_dias,
                observaciones: formData.observaciones,
                items: items,
                nave_id: formData.nave_id ? Number(formData.nave_id) : null,
                solicitud_cotizacion: formData.solicitud_cotizacion,
                plazo_entrega: formData.plazo_entrega,
                descripcion_general: formData.descripcion_general
            };

            if (editingId) await updateCotizacionCompleta(editingId, payload);
            else await createCotizacion(payload);

            setIsModalOpen(false);
            setEditingId(null);
            cargarCotizaciones();
        } catch (error) {
            console.error("Error guardando cotización:", error);
            alert("Error del servidor: " + (error.response?.data?.message || "Revisa la consola"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEliminar = async (id) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este borrador? Esta acción no se puede deshacer.")) return;

        try {
            await deleteCotizacion(id);
            cargarCotizaciones();
        } catch (error) {
            console.error("Error al eliminar cotización:", error);
            alert("Error al eliminar: " + (error.response?.data?.message || "Revisa la consola"));
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-txt-primary flex items-center gap-2">
                        <FileText className="text-brand" />
                        Cotizaciones
                    </h2>
                    <p className="text-txt-secondary">Gestión de presupuestos comerciales</p>
                </div>
                {puedeEscribir && (
                    <button
                        onClick={abrirModalNuevo}
                        className="bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-lg shadow-brand/20"
                    >
                        <PlusCircle size={20} />
                        Nueva Cotización
                    </button>
                )}
            </div>

            <div className="bg-dark-surface rounded-xl border border-dark-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-dark-bg/50 border-b border-dark-border text-xs uppercase text-txt-secondary">
                            <tr>
                                <th className="p-4 font-semibold">Folio</th>
                                <th className="p-4 font-semibold">Cliente</th>
                                <th className="p-4 font-semibold">Fecha</th>
                                <th className="p-4 font-semibold text-center">Estado</th>
                                <th className="p-4 font-semibold text-right">Total</th>
                                <th className="p-4 font-semibold text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-txt-secondary">Cargando cotizaciones...</td></tr>
                            ) : cotizaciones.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-txt-secondary">No hay cotizaciones registradas.</td></tr>
                            ) : (
                                cotizaciones.map((cot) => (
                                    <tr key={cot.id} className="hover:bg-dark-bg/30 transition-colors">
                                        <td className="p-4 font-medium text-brand">{cot.folio || `COT-000${cot.id}`}</td>
                                        <td className="p-4 text-white font-medium">{cot.cliente_nombre}</td>
                                        <td className="p-4 text-txt-secondary text-sm">{new Date(cot.fecha_emision).toLocaleDateString('es-CL')}</td>
                                        <td className="p-4 text-center">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase border
                                                ${cot.estado === 'borrador' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : ''}
                                                ${cot.estado === 'enviada' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''}
                                                ${cot.estado === 'aceptada' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                                                ${cot.estado === 'rechazada' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                                            `}>
                                                {cot.estado}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-white">${Number(cot.monto_total).toLocaleString('es-CL')}</td>
                                        <td className="p-4 text-center flex justify-center gap-2">
                                            {puedeEscribir && cot.estado === 'borrador' && (
                                                <button onClick={() => handleEditar(cot.id)} className="text-yellow-500 hover:text-yellow-400 p-2 hover:bg-yellow-500/10 rounded-lg transition-colors" title="Editar Cotización">
                                                    <Pencil size={18} />
                                                </button>
                                            )}
                                            <button onClick={() => handleVerDetalle(cot.id)} className="text-txt-secondary hover:text-brand p-2 hover:bg-brand/10 rounded-lg transition-colors" title="Ver Detalle">
                                                <Eye size={18} />
                                            </button>

                                            {puedeEscribir && cot.estado === 'borrador' && (
                                                <button onClick={() => handleEliminar(cot.id)} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar Borrador">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CREAR / EDITAR */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 animate-fadeIn">
                    <div className="bg-dark-surface rounded-xl flex flex-col w-full max-w-5xl max-h-[90vh] border border-dark-border shadow-2xl">
                        <div className="p-6 border-b border-dark-border flex justify-between items-center bg-dark-bg/50">
                            <h3 className="text-xl font-bold text-white">{editingId ? 'Editar Borrador' : 'Nueva Cotización'}</h3>
                            <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="text-txt-secondary hover:text-white transition-colors">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-dark-bg p-4 rounded-lg border border-dark-border">
                                <div className="relative">
                                    <label className="block text-xs font-medium text-txt-secondary mb-1">Cliente</label>
                                    <div className="relative">
                                        <input type="text" placeholder="Buscar por RUT o nombre..." className="w-full bg-dark-surface border border-dark-border rounded-lg p-2 text-sm text-txt-primary focus:border-brand outline-none pl-8" value={busquedaCliente} onChange={(e) => { setBusquedaCliente(e.target.value); setClienteDropdownOpen(true); if (!e.target.value) setFormData({ ...formData, entidad_id: '' }); }} onFocus={() => setClienteDropdownOpen(true)} onBlur={() => setTimeout(() => setClienteDropdownOpen(false), 200)} />
                                        <Search className="absolute left-2.5 top-2.5 text-txt-secondary" size={16} />
                                    </div>
                                    {clienteDropdownOpen && busquedaCliente.length >= 2 && clientesFiltrados.length > 0 && (
                                        <ul className="absolute z-[70] w-full mt-1 bg-[#1e2330] border border-brand/50 rounded-lg shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                                            {clientesFiltrados.map(c => (
                                                <li key={c.id} className="p-3 hover:bg-brand/20 cursor-pointer border-b border-dark-border last:border-0 transition-colors" onMouseDown={(e) => e.preventDefault()} onClick={() => { setFormData({ ...formData, entidad_id: c.id }); setBusquedaCliente(`${formatRut(c.rut)} - ${c.nombre}`); setClienteDropdownOpen(false); }}>
                                                    <span className="text-sm text-white font-medium">{c.nombre}</span><span className="text-xs text-brand block mt-0.5">{formatRut(c.rut)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-secondary mb-1">Validez (Días)</label>
                                    <input type="number" min="1" className="w-full bg-dark-surface border border-dark-border rounded-lg p-2 text-sm text-txt-primary focus:border-brand outline-none" value={formData.validez_dias} onChange={(e) => setFormData({ ...formData, validez_dias: e.target.value })} />
                                </div>
                            </div>

                            {/* 👇 BLOQUE EXCLUSIVO NAVIERO A CONTINUACIÓN DE CLIENTES */}
                            {esNaviero && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-brand/5 p-4 rounded-lg border border-brand/20 mt-4">
                                    <div>
                                        <label className="block text-xs font-medium text-txt-secondary mb-1">Nave / Equipo (Opcional)</label>
                                        <select
                                            className="w-full bg-dark-surface border border-dark-border rounded-lg p-2 text-sm text-txt-primary focus:border-brand outline-none"
                                            value={formData.nave_id}
                                            onChange={(e) => setFormData({ ...formData, nave_id: e.target.value })}
                                            disabled={!formData.entidad_id || navesCliente.length === 0}
                                        >
                                            <option value="">-- Trabajo en tierra / Sin nave --</option>
                                            {navesCliente.map(nave => (
                                                <option key={nave.id} value={nave.id}>{nave.nombre}</option>
                                            ))}
                                        </select>
                                        {formData.entidad_id && navesCliente.length === 0 && (
                                            <p className="text-[10px] text-yellow-500 mt-1">Este cliente no tiene naves.</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-txt-secondary mb-1">Nº Solicitud</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: 3024260093R02"
                                            className="w-full bg-dark-surface border border-dark-border rounded-lg p-2 text-sm text-txt-primary focus:border-brand outline-none"
                                            value={formData.solicitud_cotizacion}
                                            onChange={(e) => setFormData({ ...formData, solicitud_cotizacion: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-txt-secondary mb-1">Plazo de Entrega</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: 15 días hábiles"
                                            className="w-full bg-dark-surface border border-dark-border rounded-lg p-2 text-sm text-txt-primary focus:border-brand outline-none"
                                            value={formData.plazo_entrega}
                                            onChange={(e) => setFormData({ ...formData, plazo_entrega: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                            {/* 👆 FIN BLOQUE NAVIERO */}

                            <div>
                                <div className="sticky top-0 z-20 bg-dark-surface py-2 mb-2 flex justify-between items-center border-b border-dark-border/50 backdrop-blur-md">
                                    <h4 className="font-semibold text-white">Ítems a Cotizar</h4>
                                    <button type="button" onClick={agregarFila} className="text-xs bg-brand/20 text-brand px-3 py-1 rounded flex items-center gap-1 hover:bg-brand/30 transition-all active:scale-95 shadow-lg shadow-brand/10">
                                        <Plus size={14} /> Agregar Línea
                                    </button>
                                </div>
                                <div className="flex gap-2 items-center px-3 mb-1 mt-4 text-[10px] font-bold text-txt-secondary uppercase tracking-wider">
                                    <div className="flex-1">Descripción del Servicio/Producto</div><div className="w-24 text-center">Cantidad</div><div className="w-32 text-right">Precio Unit.</div><div className="w-32 text-right pr-20">Subtotal</div>
                                </div>
                                <div className="space-y-2">
                                    {items.map((item, index) => (
                                        <div key={index} className="flex gap-2 items-start bg-dark-bg p-3 rounded-lg border border-dark-border group/row hover:border-brand/30 transition-colors">
                                            <div className="flex-1 relative">
                                                <div className="relative">
                                                    <input type="text" placeholder="Descripción libre o busca en el catálogo..." className="w-full bg-dark-surface border border-dark-border rounded p-2 text-sm text-txt-primary focus:border-brand outline-none pl-8" value={item.descripcion} onChange={(e) => handleDescripcionChange(index, e.target.value)} onFocus={() => { if (item.descripcion.length >= 2) setBusquedaActiva(index) }} onBlur={() => setTimeout(() => setBusquedaActiva(null), 200)} />
                                                    <Search className="absolute left-2.5 top-2.5 text-txt-secondary" size={16} />
                                                </div>
                                                {busquedaActiva === index && sugerencias.length > 0 && (
                                                    <ul className="absolute z-[70] w-full mt-1 bg-[#1e2330] border border-brand/50 rounded-lg shadow-2xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                                                        {sugerencias.map((sug, i) => (
                                                            <li key={i} className="p-3 hover:bg-brand/20 cursor-pointer border-b border-dark-border last:border-0 transition-colors" onMouseDown={(e) => e.preventDefault()} onClick={() => seleccionarSugerencia(index, sug)}>
                                                                <div className="flex justify-between items-center">
                                                                    <div><span className="text-[10px] font-bold bg-dark-bg text-txt-secondary px-2 py-1 rounded mr-2 uppercase border border-dark-border">{sug.etiqueta}</span><span className="text-sm text-white font-medium">{sug.nombreCliente}</span>{sug.codigo && <span className="text-xs text-brand block mt-0.5">{sug.codigo}</span>}</div>
                                                                    <div className="text-brand font-mono font-bold text-sm">${Number(sug.precio).toLocaleString('es-CL')}</div>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                            <div className="w-24"><input type="number" min="0.1" step="0.1" placeholder="Cant." className="w-full bg-dark-surface border border-dark-border rounded p-2 text-sm text-txt-primary focus:border-brand outline-none text-center" value={item.cantidad} onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)} /></div>
                                            <div className="w-32"><input type="number" min="0" placeholder="Precio Unit." className="w-full bg-dark-surface border border-dark-border rounded p-2 text-sm text-txt-primary focus:border-brand outline-none text-right" value={item.unitario} onChange={(e) => handleItemChange(index, 'unitario', e.target.value)} /></div>
                                            <div className="w-32 pt-2 text-right font-mono text-sm font-semibold text-white">${(Number(item.cantidad) * Number(item.unitario)).toLocaleString('es-CL')}</div>
                                            
                                            <div className="flex flex-col gap-1">
                                                <button 
                                                    type="button" 
                                                    onClick={() => insertarFila(index)} 
                                                    className="p-1.5 text-brand hover:bg-brand/10 rounded-md transition-all opacity-0 group-hover/row:opacity-100 hover:scale-110" 
                                                    title="Insertar línea debajo"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => eliminarFila(index)} 
                                                    className={`p-1.5 rounded-md transition-all ${items.length === 1 ? 'text-dark-border cursor-not-allowed' : 'text-red-400 hover:bg-red-500/10 hover:scale-110'}`} 
                                                    disabled={items.length === 1}
                                                    title="Eliminar línea"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={agregarFila}
                                        className="w-full py-4 mt-4 border-2 border-dashed border-dark-border rounded-xl text-txt-secondary hover:text-brand hover:border-brand/40 hover:bg-brand/5 transition-all flex items-center justify-center gap-3 group/add"
                                    >
                                        <PlusCircle size={22} className="group-hover/add:scale-110 transition-transform text-dark-border group-hover/add:text-brand" />
                                        <span className="font-semibold text-sm">Agregar Nueva Línea de Servicio o Producto</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row gap-6 pt-4 border-t border-dark-border">
                                <div className="flex-1">
                                    {/* 👇 TEXTAREA CONDICIONAL 👇 */}
                                    {!esNaviero ? (
                                        <>
                                            <label className="block text-xs font-medium text-txt-secondary mb-1">Observaciones</label>
                                            <textarea className="w-full bg-dark-surface border border-dark-border rounded-lg p-2 text-sm text-txt-primary focus:border-brand outline-none h-24 custom-scrollbar" placeholder="Términos y condiciones..." value={formData.observaciones} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}></textarea>
                                        </>
                                    ) : (
                                        <>
                                            <label className="block text-xs font-medium text-txt-secondary mb-1">Descripción General</label>
                                            <textarea className="w-full bg-dark-surface border border-dark-border rounded-lg p-2 text-sm text-txt-primary focus:border-brand outline-none h-24 custom-scrollbar" placeholder="Resumen del trabajo a realizar..." value={formData.descripcion_general} onChange={(e) => setFormData({ ...formData, descripcion_general: e.target.value })}></textarea>
                                        </>
                                    )}
                                </div>
                                <div className="w-full md:w-64 bg-dark-bg p-4 rounded-xl border border-dark-border space-y-2">
                                    <div className="flex justify-between text-sm text-txt-secondary"><span>Neto:</span><span>${totales.neto.toLocaleString('es-CL')}</span></div>
                                    <div className="flex justify-between text-sm text-txt-secondary"><span>IVA (19%):</span><span>${totales.iva.toLocaleString('es-CL')}</span></div>
                                    <div className="flex justify-between text-lg font-bold text-brand pt-2 border-t border-dark-border"><span>TOTAL:</span><span>${totales.total.toLocaleString('es-CL')}</span></div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="px-6 py-2 text-txt-secondary hover:text-white transition-colors">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="bg-brand hover:bg-brand-dark text-white px-8 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                                    {isSubmitting ? 'Guardando...' : 'Guardar Cotización'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DETALLE */}
            {isDetailModalOpen && selectedCotizacion && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 animate-fadeIn">
                    <div className="bg-dark-surface rounded-xl flex flex-col w-full max-w-3xl max-h-[90vh] border border-dark-border shadow-2xl">
                        <div className="p-6 border-b border-dark-border flex justify-between items-start bg-dark-bg/50">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    {selectedCotizacion.folio || `COT-000${selectedCotizacion.id}`}
                                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase border font-bold
                                        ${selectedCotizacion.estado === 'borrador' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : ''}
                                        ${selectedCotizacion.estado === 'enviada' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''}
                                        ${selectedCotizacion.estado === 'aceptada' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                                        ${selectedCotizacion.estado === 'rechazada' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                                    `}>
                                        {selectedCotizacion.estado}
                                    </span>
                                    {esCotizacionVencida(selectedCotizacion) && (
                                        <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-bold uppercase animate-pulse ml-2">🔴 Vencida</span>
                                    )}
                                </h3>
                                <p className="text-txt-secondary text-sm mt-1">Cliente: <span className="text-white font-medium">{selectedCotizacion.cliente_nombre}</span></p>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="text-txt-secondary hover:text-white transition-colors">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            <h4 className="text-xs font-bold text-txt-secondary uppercase tracking-wider">Ítems Cotizados</h4>
                            <div className="bg-dark-bg rounded-lg border border-dark-border overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-dark-surface border-b border-dark-border text-txt-secondary">
                                        <tr><th className="p-3">Descripción</th><th className="p-3 text-center">Cant.</th><th className="p-3 text-right">Unitario</th><th className="p-3 text-right">Subtotal</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-dark-border">
                                        {selectedCotizacion.detalle_cotizaciones?.map((item) => (
                                            <tr key={item.id}>
                                                <td className="p-3 text-white">{item.descripcion}</td>
                                                <td className="p-3 text-center text-txt-secondary font-mono">{Number(item.cantidad)}</td>
                                                <td className="p-3 text-right text-txt-secondary font-mono">${Number(item.unitario).toLocaleString('es-CL')}</td>
                                                <td className="p-3 text-right font-medium text-white font-mono">${Number(item.total).toLocaleString('es-CL')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-end pt-2">
                                <div className="text-right">
                                    <div className="text-sm text-txt-secondary flex justify-between gap-8"><span>Neto:</span> <span className="font-mono">${Number(selectedCotizacion.monto_neto).toLocaleString('es-CL')}</span></div>
                                    <div className="text-sm text-txt-secondary flex justify-between gap-8 mt-1"><span>IVA:</span> <span className="font-mono">${Number(selectedCotizacion.monto_iva).toLocaleString('es-CL')}</span></div>
                                    <div className="text-xl font-bold text-brand mt-2 flex justify-between gap-8 border-t border-dark-border pt-2"><span>Total:</span> <span className="font-mono">${Number(selectedCotizacion.monto_total).toLocaleString('es-CL')}</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-dark-border bg-dark-bg rounded-b-xl space-y-3">
                            {selectedCotizacion.estado === 'rechazada' && selectedCotizacion.motivo_rechazo && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                    <p className="text-xs text-red-400 uppercase font-bold">Motivo de Rechazo:</p>
                                    <p className="text-sm text-white mt-1">{selectedCotizacion.motivo_rechazo}</p>
                                    {selectedCotizacion.fecha_rechazo && (
                                        <p className="text-[10px] text-txt-secondary mt-1 italic">Rechazada el: {new Date(selectedCotizacion.fecha_rechazo).toLocaleString('es-CL')}</p>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => handlePreviewPDF(selectedCotizacion.id)}
                                    disabled={isGeneratingPdf}
                                    className="text-[10px] bg-slate-600/20 hover:bg-slate-500 text-slate-300 hover:text-white border border-slate-500/30 px-3 py-1 rounded font-bold uppercase flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGeneratingPdf ? '⏳ Generando...' : '👁️ Ver PDF'}
                                </button>

                                {puedeEscribir && ['borrador', 'enviada'].includes(selectedCotizacion.estado) && (
                                    <button onClick={abrirModalEnvio} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium">
                                        <Send size={16} /> {selectedCotizacion.estado === 'borrador' ? 'Enviar a Cliente' : 'Reenviar PDF'}
                                    </button>
                                )}

                                {puedeEscribir && selectedCotizacion.estado === 'enviada' && (
                                    <>
                                        <button onClick={() => setIsRejectModalOpen(true)} className="bg-dark-surface border border-red-500/30 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium">
                                            <XCircle size={16} /> Rechazar
                                        </button>
                                        <button onClick={() => {
                                            if (esCotizacionVencida(selectedCotizacion)) {
                                                if (!window.confirm("⚠️ Cotización VENCIDA. ¿Aprobar manteniendo precios?")) return;
                                            }
                                            handleCambiarEstado(selectedCotizacion.id, 'aceptada');
                                        }} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium">
                                            <CheckCircle size={16} /> Aprobar
                                        </button>
                                    </>
                                )}

                                {(selectedCotizacion.estado === 'aceptada' || selectedCotizacion.estado === 'rechazada') && (
                                    <div className="text-sm text-txt-secondary italic flex items-center px-4">
                                        Cotización cerrada financieramente.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isRejectModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-dark-surface border border-red-500/50 w-full max-w-md rounded-xl shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">❌ Rechazar Cotización</h3>
                            <button onClick={() => { setIsRejectModalOpen(false); setMotivoRechazo(''); }} className="text-txt-secondary hover:text-white transition-colors">✕</button>
                        </div>
                        <div className="mb-4 p-3 bg-dark-bg border border-dark-border rounded-lg">
                            <p className="text-xs text-txt-secondary uppercase">Folio a rechazar:</p>
                            <p className="font-bold text-red-400">{selectedCotizacion?.folio}</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-txt-secondary mb-1">Motivo del Rechazo <span className="text-red-400">*</span></label>
                                <textarea required rows={3} className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-white focus:border-red-500 outline-none custom-scrollbar" placeholder="El cliente encontró caro el material..." value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                                <button onClick={() => { setIsRejectModalOpen(false); setMotivoRechazo(''); }} className="px-4 py-2 text-sm text-txt-secondary hover:text-white">Cancelar</button>
                                <button onClick={handleRechazar} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-lg shadow-red-500/20 flex items-center gap-2">
                                    <XCircle size={16} /> Confirmar Rechazo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isEmailModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-dark-surface border border-blue-500/50 w-full max-w-md rounded-xl shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                📧 {selectedCotizacion?.estado === 'borrador' ? 'Enviar Cotización' : 'Reenviar Cotización'}
                            </h3>
                            <button onClick={() => setIsEmailModalOpen(false)} className="text-txt-secondary hover:text-white transition-colors">✕</button>
                        </div>
                        <div className="mb-4 p-3 bg-dark-bg border border-dark-border rounded-lg">
                            <p className="text-xs text-txt-secondary uppercase">Folio a enviar:</p>
                            <p className="font-bold text-brand">{selectedCotizacion?.folio}</p>
                            {selectedCotizacion?.fecha_ultimo_envio && (
                                <p className="text-[10px] text-amber-400 mt-1 italic">Último envío: {new Date(selectedCotizacion.fecha_ultimo_envio).toLocaleString('es-CL')}</p>
                            )}
                        </div>
                        <form onSubmit={handleEnviarPdf} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-txt-secondary mb-1">Correo Electrónico del Cliente</label>
                                <input type="email" required className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none" placeholder="ejemplo@cliente.cl" value={emailDestino} onChange={(e) => setEmailDestino(e.target.value)} />
                                <p className="text-[10px] text-txt-secondary mt-1">Este correo se actualizará en la base de datos de clientes si es diferente al original.</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 mt-8 border-t border-dark-border">
                                <button type="button" onClick={() => setIsEmailModalOpen(false)} className="px-4 py-2 text-sm text-txt-secondary hover:text-white">Cancelar</button>
                                <button type="submit" disabled={isSendingPdf} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50 shadow-lg shadow-blue-500/20 flex items-center gap-2">
                                    {isSendingPdf ? '⏳ Generando...' : '🚀 Enviar Ahora'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cotizaciones;