import { useState, useEffect } from 'react';
import { Ship, Plus, Edit, Power } from 'lucide-react';
import api from '../utils/api';
import ModalNave from '../components/ModalNave';

const Naves = () => {
    const [naves, setNaves] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [naveAEditar, setNaveAEditar] = useState(null);

    const fetchNaves = async () => {
        try {
            const response = await api.get('/api/naves');
            setNaves(response.data);
        } catch (error) {
            console.error("Error al cargar naves:", error);
        } finally {
            setLoading(false);
        }
    };

    // 👇 AHORA SÍ ESTÁ AFUERA DE fetchNaves
    const toggleEstadoNave = async (nave) => {
        const confirmacion = window.confirm(`¿Estás seguro de que deseas ${nave.activo ? 'desactivar' : 'activar'} la nave ${nave.nombre}?`);
        if (!confirmacion) return;

        try {
            await api.put(`/api/naves/${nave.id}`, {
                nombre: nave.nombre,
                descripcion: nave.descripcion,
                entidad_id: nave.entidad_id,
                activo: !nave.activo
            });
            fetchNaves();
        } catch (error) {
            console.error(error);
            alert('Error al cambiar el estado de la nave/equipo.');
        }
    };

    useEffect(() => {
        fetchNaves();
    }, []);

    const abrirModalRegistro = () => {
        setNaveAEditar(null);
        setIsModalOpen(true);
    };

    const abrirModalEdicion = (nave) => {
        setNaveAEditar(nave);
        setIsModalOpen(true);
    };

    return (
        <div className="p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Ship className="text-brand" />
                        Gestión de Naves y Equipos
                    </h1>
                    <p className="text-txt-secondary text-sm mt-1">
                        Administra los activos y embarcaciones de tus clientes.
                    </p>
                </div>
                <button
                    onClick={abrirModalRegistro}
                    className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand/90 transition-colors font-medium"
                >
                    <Plus size={18} />
                    Registrar Nave
                </button>
            </div>

            {loading ? (
                <div className="text-txt-secondary">Cargando registros...</div>
            ) : (
                <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-dark-bg text-txt-secondary border-b border-dark-border text-sm">
                                <th className="p-4 font-medium">Nombre de la Nave / Equipo</th>
                                <th className="p-4 font-medium">Descripción</th>
                                <th className="p-4 font-medium text-center">Estado</th>
                                <th className="p-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-dark-border">
                            {naves.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-txt-secondary">
                                        No hay naves registradas. Haz clic en "Registrar Nave" para comenzar.
                                    </td>
                                </tr>
                            ) : (
                                naves.map((nave) => (
                                    <tr key={nave.id} className={`hover:bg-dark-bg/50 transition-colors ${!nave.activo ? 'opacity-50' : ''}`}>
                                        <td className="p-4 font-medium text-white">
                                            {nave.nombre}
                                            {/* Si agregaste el entidad_id en Prisma, esto mostrará el cliente */}
                                            {nave.entidad?.nombre && (
                                                <span className="block text-xs text-txt-secondary font-normal mt-0.5 truncate max-w-[250px]">
                                                    Cliente: {nave.entidad.nombre}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-txt-secondary truncate max-w-xs">{nave.descripcion || 'Sin descripción'}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${nave.activo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                {nave.activo ? 'Operativa' : 'Inactiva'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {/* 👇 AHORA SÍ ESTÁN LOS DOS BOTONES */}
                                            <div className="flex justify-end gap-2 opacity-70 hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => abrirModalEdicion(nave)}
                                                    className="p-1.5 rounded text-txt-secondary hover:text-brand hover:bg-brand/10 transition-colors"
                                                    title="Editar Datos"
                                                >
                                                    <Edit size={16} />
                                                </button>

                                                <div className="w-px h-6 bg-dark-border mx-1"></div>

                                                <button
                                                    onClick={() => toggleEstadoNave(nave)}
                                                    className={`p-1.5 rounded transition-colors ${nave.activo ? 'text-txt-secondary hover:text-red-400 hover:bg-red-500/10' : 'text-txt-secondary hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                                                    title={nave.activo ? "Desactivar" : "Activar"}
                                                >
                                                    <Power size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <ModalNave
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                naveData={naveAEditar}
                onSaveSuccess={fetchNaves}
            />
        </div>
    );
};

export default Naves;