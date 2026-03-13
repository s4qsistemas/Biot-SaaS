import React, { useState, useEffect } from 'react';
import { Package, Users, Settings, Plus, Edit, Briefcase, Search } from 'lucide-react';
import {
    getMateriales, createMaterial, updateMaterial,
    getOperarios, createOperario, updateOperario,
    getEquipos, createEquipo, updateEquipo,
    getTareas, createTarea, updateTarea
} from '../services/catalogos.service';
import CatalogoModal from '../components/CatalogoModal';

// 🛡️ IMPORTACIONES DE SEGURIDAD FRONTEND
import { useAuth } from '../context/AuthContext';
import { tienePermiso, PERMISOS_FRONT } from '../config/permissions';

const Catalogos = () => {
    const { user } = useAuth(); // Extraemos al usuario logueado
    // Calculamos si el usuario actual tiene la llave para escribir en catálogos
    const puedeEscribir = tienePermiso(user?.rol, PERMISOS_FRONT.CATALOGOS_ESCRIBIR);

    const [activeTab, setActiveTab] = useState('materiales');
    const [loading, setLoading] = useState(false);

    // Estados de las tablas
    const [materiales, setMateriales] = useState([]);
    const [operarios, setOperarios] = useState([]);
    const [equipos, setEquipos] = useState([]);
    const [tareas, setTareas] = useState([]);

    // Estados del Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemEditar, setItemEditar] = useState(null);

    const tabs = [
        { id: 'materiales', label: 'Materiales (MAT)', icon: Package },
        { id: 'hh', label: 'Operarios (OPE)', icon: Users },
        { id: 'hm', label: 'Equipos (MAQ)', icon: Settings },
        { id: 'tareas', label: 'Tipos de Tarea (TAR)', icon: Briefcase }
    ];

    useEffect(() => {
        cargarDatos(activeTab);
    }, [activeTab]);

    const cargarDatos = async (tab) => {
        setLoading(true);
        try {
            if (tab === 'materiales') {
                const data = await getMateriales();
                setMateriales(data);
            } else if (tab === 'hh') {
                const data = await getOperarios();
                setOperarios(data);
            } else if (tab === 'hm') {
                const data = await getEquipos();
                setEquipos(data);
            } else if (tab === 'tareas') {
                const data = await getTareas();
                setTareas(data || []);
            }
        } catch (error) {
            console.error(`Error cargando ${tab}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const abrirModal = (item = null) => {
        setItemEditar(item);
        setIsModalOpen(true);
    };

    const handleSaveCatalogo = async (formData) => {
        try {
            if (activeTab === 'materiales') {
                itemEditar ? await updateMaterial(itemEditar.id, formData) : await createMaterial(formData);
            } else if (activeTab === 'hh') {
                itemEditar ? await updateOperario(itemEditar.id, formData) : await createOperario(formData);
            } else if (activeTab === 'hm') {
                itemEditar ? await updateEquipo(itemEditar.id, formData) : await createEquipo(formData);
            } else if (activeTab === 'tareas') {
                itemEditar ? await updateTarea(itemEditar.id, formData) : await createTarea(formData);
            }

            setIsModalOpen(false);
            setItemEditar(null);
            cargarDatos(activeTab);
        } catch (error) {
            console.error("Error al guardar:", error);
            // Manejo de error más amigable si el código ya existe
            if (error.response?.status === 400) {
                alert(error.response.data.message || "El código ya existe en sus registros.");
            } else {
                alert("Ocurrió un error al guardar el registro.");
            }
        }
    };

    return (
        <div className="space-y-6 p-6">
            <CatalogoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveCatalogo}
                activeTab={activeTab}
                itemToEdit={itemEditar}
            />

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-txt-primary flex items-center gap-2">
                        Catálogos Maestros
                    </h2>
                    <p className="text-txt-secondary">Gestión centralizada de recursos bajo estándar 3x3</p>
                </div>

                {/* 🛡️ RENDERIZADO CONDICIONAL: Solo admins/gestores ven el botón de crear */}
                {puedeEscribir && (
                    <button
                        onClick={() => abrirModal(null)}
                        className="bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-brand/20"
                    >
                        <Plus size={20} />
                        <span>Nuevo Registro</span>
                    </button>
                )}
            </div>

            <div className="flex space-x-1 bg-dark-surface p-1 rounded-lg border border-dark-border overflow-x-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-md transition-all duration-200 
                                ${isActive
                                    ? 'bg-dark-bg text-brand shadow border border-dark-border'
                                    : 'text-txt-secondary hover:text-white hover:bg-dark-bg/50'
                                }`}
                        >
                            <Icon size={18} className={isActive ? 'text-brand' : 'text-txt-secondary'} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="bg-dark-surface rounded-xl border border-dark-border overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="p-12 text-center text-txt-secondary">Cargando datos del catálogo...</div>
                ) : (
                    <>
                        {/* 📦 TABLA: MATERIALES (MAT) */}
                        {activeTab === 'materiales' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-dark-bg/50 text-txt-secondary text-sm uppercase tracking-wider border-b border-dark-border">
                                            <th className="p-4 font-medium">Código</th>
                                            <th className="p-4 font-medium">Material</th>
                                            <th className="p-4 font-medium text-right">Precio Costo</th>
                                            <th className="p-4 font-medium text-right">Precio Venta</th>
                                            {puedeEscribir && <th className="p-4 font-medium text-right">Acciones</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-dark-border">
                                        {materiales.length === 0 ? (
                                            <tr><td colSpan={puedeEscribir ? "5" : "4"} className="p-8 text-center text-txt-secondary">No hay materiales registrados.</td></tr>
                                        ) : (
                                            materiales.map(m => (
                                                <tr key={m.id} className="hover:bg-dark-bg/30 transition-colors">
                                                    <td className="p-4 text-brand font-mono text-sm font-bold">{m.codigo}</td>
                                                    <td className="p-4 font-medium text-white">{m.nombre}</td>
                                                    <td className="p-4 text-right text-txt-secondary">${Number(m.precio_compra).toLocaleString('es-CL')}</td>
                                                    <td className="p-4 text-right text-emerald-400 font-bold">${Number(m.precio_venta).toLocaleString('es-CL')}</td>

                                                    {puedeEscribir && (
                                                        <td className="p-4 text-right">
                                                            <button onClick={() => abrirModal(m)} className="p-2 text-txt-secondary hover:text-brand transition-colors"><Edit size={18} /></button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 👷‍♂️ TABLA: OPERARIOS (OPE) */}
                        {activeTab === 'hh' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-dark-bg/50 text-txt-secondary text-sm uppercase tracking-wider border-b border-dark-border">
                                            <th className="p-4 font-medium">Código</th>
                                            <th className="p-4 font-medium">Operario / Perfil</th>
                                            <th className="p-4 font-medium">Especialidad</th>
                                            <th className="p-4 font-medium text-right">Valor Hora (HH)</th>
                                            <th className="p-4 font-medium text-center">Estado</th>
                                            {puedeEscribir && <th className="p-4 font-medium text-right">Acciones</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-dark-border">
                                        {operarios.length === 0 ? (
                                            <tr><td colSpan={puedeEscribir ? "6" : "5"} className="p-8 text-center text-txt-secondary">No hay operarios registrados.</td></tr>
                                        ) : (
                                            operarios.map(o => (
                                                <tr key={o.id} className="hover:bg-dark-bg/30 transition-colors">
                                                    <td className="p-4 text-brand font-mono text-sm font-bold">{o.codigo || 'S/C'}</td>
                                                    <td className="p-4 font-medium text-white">{o.nombre}</td>
                                                    <td className="p-4 text-txt-secondary">{o.especialidad || '-'}</td>
                                                    <td className="p-4 text-right text-white font-bold">${Number(o.valor_hora).toLocaleString('es-CL')} / hr</td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-2 py-1 rounded text-xs ${o.activo ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                            {o.activo ? 'Activo' : 'Inactivo'}
                                                        </span>
                                                    </td>

                                                    {puedeEscribir && (
                                                        <td className="p-4 text-right">
                                                            <button onClick={() => abrirModal(o)} className="p-2 text-txt-secondary hover:text-brand transition-colors"><Edit size={18} /></button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ⚙️ TABLA: EQUIPOS (MAQ) */}
                        {activeTab === 'hm' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-dark-bg/50 text-txt-secondary text-sm uppercase tracking-wider border-b border-dark-border">
                                            <th className="p-4 font-medium">Código</th>
                                            <th className="p-4 font-medium">Máquina / Equipo</th>
                                            <th className="p-4 font-medium">Tipo</th>
                                            <th className="p-4 font-medium text-right">Valor Hora (HM)</th>
                                            {puedeEscribir && <th className="p-4 font-medium text-right">Acciones</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-dark-border">
                                        {equipos.length === 0 ? (
                                            <tr><td colSpan={puedeEscribir ? "5" : "4"} className="p-8 text-center text-txt-secondary">No hay equipos registrados.</td></tr>
                                        ) : (
                                            equipos.map(e => (
                                                <tr key={e.id} className="hover:bg-dark-bg/30 transition-colors">
                                                    <td className="p-4 text-brand font-mono text-sm font-bold">{e.codigo || 'S/C'}</td>
                                                    <td className="p-4 font-medium text-white">{e.nombre}</td>
                                                    <td className="p-4 text-txt-secondary">{e.tipo || '-'}</td>
                                                    <td className="p-4 text-right text-white font-bold">${Number(e.valor_hora).toLocaleString('es-CL')} / hr</td>

                                                    {puedeEscribir && (
                                                        <td className="p-4 text-right">
                                                            <button onClick={() => abrirModal(e)} className="p-2 text-txt-secondary hover:text-brand transition-colors"><Edit size={18} /></button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 📋 TABLA: TIPOS DE TAREA (TAR) */}
                        {activeTab === 'tareas' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-dark-bg/50 text-txt-secondary text-sm uppercase tracking-wider border-b border-dark-border">
                                            <th className="p-4 font-medium">Código</th>
                                            <th className="p-4 font-medium">Nombre del Proceso</th>
                                            <th className="p-4 font-medium">Descripción</th>
                                            <th className="p-4 font-medium text-center">Estado</th>
                                            {puedeEscribir && <th className="p-4 font-medium text-right">Acciones</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-dark-border">
                                        {tareas.length === 0 ? (
                                            <tr><td colSpan={puedeEscribir ? "5" : "4"} className="p-8 text-center text-txt-secondary">No hay tipos de tarea registrados.</td></tr>
                                        ) : (
                                            tareas.map(t => (
                                                <tr key={t.id} className="hover:bg-dark-bg/30 transition-colors">
                                                    <td className="p-4 text-brand font-mono text-sm font-bold">{t.codigo}</td>
                                                    <td className="p-4 font-medium text-white">{t.nombre}</td>
                                                    <td className="p-4 text-txt-secondary text-sm">{t.descripcion || '-'}</td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-2 py-1 rounded text-xs ${t.activo ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                            {t.activo ? 'Activo' : 'Inactivo'}
                                                        </span>
                                                    </td>

                                                    {puedeEscribir && (
                                                        <td className="p-4 text-right">
                                                            <button onClick={() => abrirModal(t)} className="p-2 text-txt-secondary hover:text-brand transition-colors"><Edit size={18} /></button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Catalogos;