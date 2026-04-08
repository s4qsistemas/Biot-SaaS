import { useEffect, useState } from 'react';
import { getEntidades, createEntidad, updateEntidad } from '../services/entidades.service';
import { Plus, Edit, Power, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EntidadModal from '../components/EntidadModal';
import { formatRut } from '../utils/rut';

// 🛡️ IMPORTAMOS LA JAULA DE SEGURIDAD FRONTEND
import { tienePermiso, PERMISOS_FRONT } from '../config/permissions';

const Entidades = () => {
    const [entidades, setEntidades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState(null);
    const [entidadEditar, setEntidadEditar] = useState(null);

    const { user } = useAuth();

    // 🛡️ PERMISOS CENTRALIZADOS (Nada de strings duros)
    const tienePermisosCompletos = tienePermiso(user?.rol, PERMISOS_FRONT.ENTIDADES_ESCRIBIR);

    useEffect(() => {
        loadEntidades();
    }, []);

    const loadEntidades = async () => {
        try {
            const data = await getEntidades();
            const sortedData = data.sort((a, b) => Number(b.activo) - Number(a.activo));
            setEntidades(sortedData);
        } catch (err) {
            console.error(err);
            setError('Error al cargar los datos.');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (entidad = null) => {
        setEntidadEditar(entidad);
        setIsModalOpen(true);
    };

    const handleSaveEntidad = async (formData) => {
        try {
            if (entidadEditar) {
                const actualizada = await updateEntidad(entidadEditar.id, formData);
                setEntidades(entidades.map(item =>
                    item.id === entidadEditar.id ? { ...item, ...actualizada } : item
                ));
            } else {
                const nueva = await createEntidad(formData);
                setEntidades([...entidades, nueva]);
            }
            setIsModalOpen(false);
            setEntidadEditar(null);
        } catch (error) {
            alert('Error al procesar: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleToggleStatus = async (id, estadoActual, nombre) => {
        const nuevoEstado = !estadoActual;
        const accion = nuevoEstado ? 'Activar' : 'Desactivar';
        if (!window.confirm(`¿Estás seguro de que deseas ${accion} a "${nombre}"?`)) return;

        try {
            await updateEntidad(id, { activo: nuevoEstado });
            setEntidades(entidades.map(entidad =>
                entidad.id === id ? { ...entidad, activo: nuevoEstado } : entidad
            ));
        } catch (error) {
            const msg = error.response?.data?.message || `Error al ${accion.toLowerCase()} la entidad.`;
            alert(msg);
        }
    };

    if (loading) return <div className="p-8 text-center text-txt-secondary">Cargando datos...</div>;

    return (
        <div className="space-y-6 p-6">
            <EntidadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEntidad}
                entidadToEdit={entidadEditar}
            />

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-txt-primary">Entidades</h2>
                    <p className="text-txt-secondary">Gestión de Clientes y Proveedores</p>
                </div>

                {tienePermisosCompletos && (
                    <button
                        onClick={() => openModal(null)}
                        className="bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-brand/20"
                    >
                        <Plus size={20} />
                        <span>Nueva Entidad</span>
                    </button>
                )}
            </div>

            <div className="bg-dark-surface rounded-xl border border-dark-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-dark-bg/50 text-txt-secondary text-sm uppercase tracking-wider border-b border-dark-border">
                                <th className="p-4 font-medium">Estado</th>
                                <th className="p-4 font-medium">Nombre / Razón Social</th>
                                <th className="p-4 font-medium">RUT</th>
                                <th className="p-4 font-medium">Giro</th>
                                <th className="p-4 font-medium">Tipo</th>
                                <th className="p-4 font-medium">Ciudad</th>
                                <th className="p-4 font-medium">Contacto</th>
                                {tienePermisosCompletos && (
                                    <th className="p-4 font-medium text-right">Acciones</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                            {entidades.map((entidad) => (
                                <tr
                                    key={entidad.id}
                                    className={`hover:bg-dark-bg/30 transition-colors group ${!entidad.activo ? 'opacity-50 grayscale-[0.5]' : ''}`}
                                >
                                    <td className="p-4">
                                        <div className={`w-3 h-3 rounded-full ${entidad.activo ? 'bg-emerald-500 shadow-emerald-500/50 shadow-sm' : 'bg-red-500'}`} title={entidad.activo ? "Activo" : "Inactivo"}></div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-txt-primary">{entidad.nombre}</div>
                                        <div className="text-xs text-txt-secondary">{entidad.email || 'Sin email'}</div>
                                    </td>

                                    <td className="p-4 text-txt-secondary font-mono text-sm">
                                        {formatRut(entidad.rut)}
                                    </td>

                                    <td className="p-4 text-txt-secondary text-sm">
                                        {entidad.giro || '-'}
                                    </td>

                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize border 
                                            ${entidad.tipo === 'cliente' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''}
                                            ${entidad.tipo === 'proveedor' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                                            ${entidad.tipo === 'mixto' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : ''}
                                        `}>
                                            {entidad.tipo}
                                        </span>
                                    </td>
                                    <td className="p-4 text-txt-secondary text-sm">
                                        {entidad.ciudad || '-'}
                                    </td>
                                    <td className="p-4 text-txt-secondary text-sm">
                                        {entidad.contacto_nombre || '-'}
                                    </td>
                                    {tienePermisosCompletos && (
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openModal(entidad)} className="p-2 text-txt-secondary hover:text-brand hover:bg-brand/10 rounded-lg transition-colors" title="Editar">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleToggleStatus(entidad.id, entidad.activo, entidad.nombre)} className={`p-2 rounded-lg transition-colors ${entidad.activo ? 'text-txt-secondary hover:text-red-400 hover:bg-red-400/10' : 'text-txt-secondary hover:text-emerald-400 hover:bg-emerald-400/10'}`} title={entidad.activo ? "Desactivar" : "Activar"}>
                                                    <Power size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {entidades.length === 0 && !error && (
                    <div className="p-12 text-center text-txt-secondary flex flex-col items-center">
                        <Search size={48} className="mb-4 opacity-20" />
                        <p>No se encontraron entidades registradas.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Entidades;