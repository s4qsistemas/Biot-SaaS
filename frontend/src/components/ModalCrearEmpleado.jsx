import { useState } from 'react';
import api from '../utils/api';

export default function ModalCrearEmpleado({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        nombre: '', email: '', rol: 'operario'
    });
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);
        setMensaje({ tipo: '', texto: '' });

        try {
            const { data } = await api.post('/api/usuarios/empleado', formData);
            setMensaje({ tipo: 'éxito', texto: `Empleado registrado con éxito.`, password_generica: data.password_generica });
            
            // Limpia el formulario
            setFormData({ nombre: '', email: '', rol: 'operario' });
            
            // Recargamos el listado (opcional si onSubmit pasa por props pero aquí no se ve, 
            // no hacemos el close automatico para que lea la clave, debe cerrarlo manual)
            
        } catch (error) {
            setMensaje({ 
                tipo: 'error', 
                texto: error.response?.data?.message || 'Error al registrar al empleado.' 
            });
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-dark-surface border border-dark-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                <div className="px-6 py-4 border-b border-dark-border flex justify-between items-center bg-dark-bg/50">
                    <h3 className="text-lg font-bold text-txt-primary">Registrar Nuevo Empleado</h3>
                    <button onClick={onClose} className="text-txt-secondary hover:text-white">✕</button>
                </div>

                <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                    {mensaje.texto && mensaje.tipo === 'error' && (
                        <div className="p-3 rounded-lg text-sm border font-medium bg-red-900/10 border-red-500/30 text-red-400">
                            {mensaje.texto}
                        </div>
                    )}

                    {mensaje.texto && mensaje.tipo === 'éxito' && (
                        <div className="p-4 rounded-lg text-sm border font-medium bg-emerald-900/10 border-emerald-500/30">
                            <h4 className="text-emerald-400 font-bold mb-2">¡{mensaje.texto}!</h4>
                            <p className="text-slate-300 mb-2">Comparta la siguiente contraseña temporal con el usuario. El sistema le forzará a cambiarla en su primer acceso:</p>
                            <div className="bg-dark-bg border border-dark-border p-3 rounded-md text-center">
                                <span className="font-mono text-xl tracking-widest text-emerald-400 select-all">{mensaje.password_generica}</span>
                            </div>
                        </div>
                    )}

                    {!mensaje.password_generica && (
                        <>
                        <div>
                            <label className="block text-xs font-medium text-txt-primary mb-1">Nombre Completo</label>
                            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-brand" placeholder="Ej: Juan Pérez" />
                        </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-txt-primary mb-1">Correo Electrónico</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-brand" placeholder="juan@empresa.cl" />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-txt-primary mb-1">Rol a asignar</label>
                        <select name="rol" value={formData.rol} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-brand">
                            <option value="gerente">Gerente</option>
                            <option value="jefe_taller">Jefe de Taller</option>
                            <option value="administrativo">Administrativo</option>
                            <option value="operario">Operario (Taller)</option>
                        </select>
                    </div>

                    <div className="mt-2 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg flex items-start gap-3">
                        <span className="text-blue-400 mt-0.5">ℹ️</span>
                        <p className="text-xs text-blue-200/80 leading-relaxed">
                            <strong>Privacidad por diseño:</strong> La contraseña inicial será la clave genérica del sistema. El usuario será forzado a crear su propia contraseña al iniciar sesión por primera vez.
                        </p>
                    </div>
                    </>
                    )}

                    <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-dark-border">
                        <button type="button" disabled={cargando} onClick={() => { setMensaje({ tipo: '', texto: '' }); onClose(); }} className="px-4 py-2 text-sm text-txt-secondary hover:text-white disabled:opacity-50 transition-colors">
                            {mensaje.password_generica ? 'Cerrar Panel' : 'Cancelar'}
                        </button>
                        {!mensaje.password_generica && (
                            <button type="submit" disabled={cargando} className="px-6 py-2 text-sm font-bold text-white bg-brand rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors flex items-center justify-center min-w-[140px]">
                                {cargando ? 'Guardando...' : 'Crear Cuenta'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
