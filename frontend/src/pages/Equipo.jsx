import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { ShieldCheck, Edit, Power, Users } from 'lucide-react';
import ModalEditarEmpleado from '../components/ModalEditarEmpleado';

export default function Equipo() {
    const { user } = useAuth();
    const [equipo, setEquipo] = useState([]);
    const [cargando, setCargando] = useState(true);

    const [isModalEditarOpen, setIsModalEditarOpen] = useState(false);
    const [empleadoAEditar, setEmpleadoAEditar] = useState(null);

    useEffect(() => {
        cargarEquipo();
    }, []);

    const cargarEquipo = async () => {
        try {
            const res = await api.get('/api/usuarios/equipo');
            setEquipo(res.data);
        } catch (error) {
            console.error('Error al cargar equipo:', error);
        } finally {
            setCargando(false);
        }
    };

    const abrirModalEdicion = (empleado) => {
        setEmpleadoAEditar(empleado);
        setIsModalEditarOpen(true);
    };

    const toggleEstadoEmpleado = async (empleado) => {
        const confirmacion = window.confirm(`¿Estás seguro de que deseas ${empleado.activo ? 'suspender' : 'activar'} el acceso a ${empleado.nombre}?`);
        if (!confirmacion) return;

        try {
            await api.put(`/api/usuarios/empleado/${empleado.id}`, { activo: !empleado.activo });
            cargarEquipo();
        } catch (error) {
            alert(error.response?.data?.message || 'Error al cambiar el estado del empleado');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Users className="text-brand" size={32} />
                        Mi Equipo
                    </h1>
                    <p className="text-txt-secondary mt-1">Gestión del personal y accesos de tu maestranza.</p>
                </div>
            </header>

            <section className="bg-dark-surface rounded-xl border border-dark-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-dark-border bg-dark-bg/50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <ShieldCheck size={20} className="text-txt-secondary" />
                        Usuarios Registrados
                    </h2>
                    <span className="bg-brand/10 text-brand px-3 py-1 rounded-full text-xs font-bold border border-brand/20">
                        Total: {equipo.length}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-dark-bg/80 text-txt-secondary text-xs uppercase tracking-wider border-b border-dark-border">
                                <th className="p-4 font-semibold">Nombre y Correo</th>
                                <th className="p-4 font-semibold">Rol / Permiso</th>
                                <th className="p-4 font-semibold">Ingreso</th>
                                <th className="p-4 font-semibold text-center">Estado</th>
                                <th className="p-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                            {cargando ? (
                                <tr><td colSpan="5" className="p-8 text-center text-txt-secondary">Cargando personal...</td></tr>
                            ) : equipo.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-txt-secondary">No hay empleados registrados.</td></tr>
                            ) : (
                                equipo.map((empleado) => {
                                    const esSuperior = empleado.rol === 'admin' || empleado.rol === 'super_admin';
                                    
                                    return (
                                        <tr key={empleado.id} className={`hover:bg-brand/10 transition-colors group ${!empleado.activo ? 'opacity-60' : ''}`}>
                                            <td className="p-4">
                                                <p className="font-bold text-white group-hover:text-brand transition-colors">{empleado.nombre}</p>
                                                <p className="text-xs text-txt-secondary font-mono mt-0.5">{empleado.email}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold border capitalize 
                                                    ${esSuperior ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}
                                                `}>
                                                    {empleado.rol.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm text-slate-300">
                                                    {new Date(empleado.created_at).toLocaleDateString('es-CL')}
                                                </p>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border
                                                    ${empleado.activo
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
                                                >
                                                    {empleado.activo ? 'Activo' : 'Suspendido'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    {!esSuperior && (
                                                        <>
                                                            <button
                                                                onClick={() => abrirModalEdicion(empleado)}
                                                                className="p-1.5 rounded text-txt-secondary hover:text-brand hover:bg-brand/10 transition-colors"
                                                                title="Editar Datos"
                                                            >
                                                                <Edit size={16} />
                                                            </button>

                                                            <div className="w-px h-6 bg-dark-border mx-1"></div>

                                                            <button
                                                                onClick={() => toggleEstadoEmpleado(empleado)}
                                                                className={`p-1.5 rounded transition-colors ${empleado.activo ? 'text-txt-secondary hover:text-red-400 hover:bg-red-500/10' : 'text-txt-secondary hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                                                                title={empleado.activo ? "Suspender Acceso" : "Restaurar Acceso"}
                                                            >
                                                                <Power size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <ModalEditarEmpleado 
                isOpen={isModalEditarOpen} 
                onClose={() => setIsModalEditarOpen(false)} 
                empleadoData={empleadoAEditar} 
                onUpdateSuccess={cargarEquipo} 
            />
        </div>
    );
}
