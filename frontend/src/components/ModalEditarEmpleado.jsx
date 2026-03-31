import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function ModalEditarEmpleado({ isOpen, onClose, empleadoData, onUpdateSuccess }) {
    const [formData, setFormData] = useState({
        nombre: '', rol: '', reset_password: false
    });
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        if (empleadoData && isOpen) {
            setFormData({
                nombre: empleadoData.nombre || '',
                rol: empleadoData.rol || 'operario',
                reset_password: false
            });
        }
    }, [empleadoData, isOpen]);

    if (!isOpen || !empleadoData) return null;

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        setCargando(true);
        try {
            await api.put(`/api/usuarios/empleado/${empleadoData.id}`, formData);
            onUpdateSuccess();
            onClose();
        } catch (error) {
            alert(error.response?.data?.message || 'Error al actualizar empleado');
        } finally {
            setCargando(false);
        }
    };

    // Bloqueamos la edición si este empleado resulta ser el admin superior
    const esAdminSuperior = empleadoData.rol === 'admin' || empleadoData.rol === 'super_admin';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-dark-surface border border-dark-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                <div className="px-6 py-4 border-b border-dark-border flex justify-between items-center bg-dark-bg/50">
                    <h3 className="text-lg font-bold text-white">Editar Empleado</h3>
                    <button onClick={onClose} className="text-txt-secondary hover:text-white transition-colors">✕</button>
                </div>

                <form onSubmit={handleGuardar} className="p-6 space-y-5">
                    
                    <div className="bg-dark-bg p-3 border border-dark-border rounded-lg mb-4 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-txt-secondary">Correo / Usuario</p>
                            <p className="text-sm font-medium text-white">{empleadoData.email}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                            ${empleadoData.activo ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}
                        `}>
                            {empleadoData.activo ? 'Activo' : 'Suspendido'}
                        </span>
                    </div>

                    {esAdminSuperior ? (
                        <div className="p-4 border border-amber-500/30 bg-amber-500/10 rounded-lg text-sm text-amber-400 text-center">
                            No puedes modificar a un usuario de nivel gerencial superior desde este panel.
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-txt-primary mb-1">Nombre Completo</label>
                                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-brand" />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-txt-primary mb-1">Rol Operativo</label>
                                <select name="rol" value={formData.rol} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-brand">
                                    <option value="gerente">Gerente</option>
                                    <option value="jefe_taller">Jefe de Taller</option>
                                    <option value="administrativo">Administrativo</option>
                                    <option value="operario">Operario (Taller)</option>
                                </select>
                            </div>

                            <div className="mt-4 p-4 border border-red-900/50 bg-red-900/10 rounded-lg">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input type="checkbox" name="reset_password" checked={formData.reset_password} onChange={handleChange} className="mt-1 w-4 h-4 rounded border-dark-border bg-dark-bg text-brand focus:ring-brand" />
                                    <div>
                                        <span className="text-sm font-semibold text-red-400 group-hover:text-red-300 transition-colors">Forzar reset de contraseña</span>
                                        <p className="text-xs text-txt-secondary mt-1">El usuario volverá a la contraseña genérica y se le pedirá crear una nueva al ingresar.</p>
                                    </div>
                                </label>
                            </div>
                        </>
                    )}

                    <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-dark-border">
                        <button type="button" disabled={cargando} onClick={onClose} className="px-4 py-2 text-sm text-txt-secondary hover:text-white transition-colors">Cancelar</button>
                        {!esAdminSuperior && (
                            <button type="submit" disabled={cargando} className="px-6 py-2 text-sm font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors flex items-center justify-center min-w-[120px]">
                                {cargando ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
