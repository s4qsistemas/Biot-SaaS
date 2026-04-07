import { useState, useEffect } from 'react';
import { formatRut, validateRut } from '../../utils/rut';
import api from '../../utils/api';

export default function ModalCrearMaestranza({ isOpen, onClose, onUpdateSuccess }) {
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '', password_generica: '' });
    const [formData, setFormData] = useState({
        nombre_empresa: '', rut_empresa: '', alias: '', giro: '', direccion: '', email_contacto: '', telefono: '', plan_id: '',
        nombre_admin: '', email_admin: ''
    });

    const [errorRut, setErrorRut] = useState('');
    const [planes, setPlanes] = useState([]);

    useEffect(() => {
        if (isOpen) {
            const cargarPlanes = async () => {
                try {
                    const { data } = await api.get('/api/superadmin/planes');
                    setPlanes(data.filter(p => p.activo));
                } catch (error) {
                    console.error('Error al cargar la lista de planes:', error);
                }
            };
            cargarPlanes();
        }
    }, [isOpen]);

    const handleChange = (e) => {
        let { name, value } = e.target;

        if (name === 'rut_empresa') {
            value = formatRut(value);
            setErrorRut('');
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!validateRut(formData.rut_empresa)) {
            setErrorRut('El RUT ingresado no es válido');
            return;
        }

        setCargando(true);
        setMensaje({ tipo: '', texto: '' });

        try {
            const { data } = await api.post('/api/superadmin/empresa', formData);
            setMensaje({ tipo: 'éxito', texto: `Maestranza creada con éxito.`, password_generica: data.password_generica });
            
            // Limpiamos el form
            setFormData({ nombre_empresa: '', rut_empresa: '', alias: '', giro: '', direccion: '', email_contacto: '', telefono: '', plan_id: '', nombre_admin: '', email_admin: '' });
            
            // Refrescar padre
            if (onUpdateSuccess) onUpdateSuccess();

        } catch (error) {
            setMensaje({ 
                tipo: 'error', 
                texto: error.response?.data?.message || 'Error al crear la maestranza.' 
            });
        } finally {
            setCargando(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-dark-surface border border-dark-border rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
                <div className="px-6 py-4 border-b border-dark-border flex justify-between items-center bg-dark-bg/50">
                    <h3 className="text-lg font-bold text-txt-primary">Alta de Nueva Maestranza</h3>
                    <button onClick={onClose} className="text-txt-secondary hover:text-txt-primary">✕</button>
                </div>

                <form onSubmit={handleFormSubmit} className="p-6">
                    {mensaje.texto && mensaje.tipo === 'error' && (
                        <div className="mb-4 p-3 rounded-lg text-sm border font-medium bg-red-900/10 border-red-500/30 text-red-400">
                            {mensaje.texto}
                        </div>
                    )}

                    {mensaje.texto && mensaje.tipo === 'éxito' && (
                        <div className="mb-4 p-5 rounded-lg text-sm border font-medium bg-emerald-900/10 border-emerald-500/30">
                            <h4 className="text-emerald-400 font-bold mb-3 text-lg">¡{mensaje.texto}!</h4>
                            <p className="text-slate-300 mb-4 leading-relaxed">
                                La maestranza ha sido registrada y el Administrador creado. Por favor, comparte la siguiente contraseña temporal con el cliente. <br />
                                <strong>El usuario será forzado a cambiarla inmediatamente en su primer ingreso.</strong>
                            </p>
                            <div className="bg-dark-bg border border-dark-border p-4 rounded-md text-center shadow-inner">
                                <span className="font-mono text-2xl tracking-widest text-emerald-400 select-all">{mensaje.password_generica}</span>
                            </div>
                        </div>
                    )}

                    {!mensaje.password_generica && (
                        <div className="grid grid-cols-1 gap-6">

                        {/* EMPRESA */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-brand mb-3 border-b border-dark-border pb-1">1. Datos de la Empresa</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Razón Social</label>
                                    <input type="text" name="nombre_empresa" value={formData.nombre_empresa} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">RUT</label>
                                    <input type="text" name="rut_empresa" value={formData.rut_empresa} onChange={handleChange} required className={`w-full bg-dark-bg border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:outline-none ${errorRut ? 'border-red-500 focus:ring-red-500' : 'border-dark-border focus:ring-brand'}`} placeholder="12.345.678-9" />
                                    {errorRut && <p className="text-red-500 text-[10px] mt-1">{errorRut}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Alias (URL)</label>
                                    <input type="text" name="alias" value={formData.alias} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" placeholder="mi-empresa" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Plan</label>
                                    <select name="plan_id" value={formData.plan_id} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand">
                                        <option value="" disabled>Seleccionar...</option>
                                        {planes.map(plan => (
                                            <option key={plan.id} value={plan.id}>
                                                {plan.nombre} ({plan.limite_usuarios} usr) - ${Number(plan.precio_mensual).toLocaleString('es-CL')}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Giro Comercial</label>
                                    <input type="text" name="giro" value={formData.giro} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" placeholder="Servicios Industriales" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Dirección Casa Matriz</label>
                                    <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" placeholder="Av. Principal 123, Oficina 45" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Email Contacto (PDF)</label>
                                    <input type="email" name="email_contacto" value={formData.email_contacto} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" placeholder="contacto@empresa.com" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Teléfono (PDF)</label>
                                    <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" placeholder="+56 9 1234 5678" />
                                </div>
                            </div>
                        </div>

                        {/* ADMIN */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-brand mb-3 border-b border-dark-border pb-1">2. Cuenta Administrador</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Nombre</label>
                                    <input type="text" name="nombre_admin" value={formData.nombre_admin} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Correo Electrónico</label>
                                    <input type="email" name="email_admin" value={formData.email_admin} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" />
                                </div>
                            </div>

                            {/* NUEVO AVISO DE SEGURIDAD EN VEZ DEL INPUT */}
                            <div className="mt-2 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg flex items-start gap-3">
                                <span className="text-blue-400 mt-0.5">ℹ️</span>
                                <p className="text-xs text-blue-200/80 leading-relaxed">
                                    <strong>Privacidad por diseño:</strong> La contraseña inicial será la clave genérica del sistema. El usuario será forzado a crear su propia contraseña al iniciar sesión por primera vez.
                                </p>
                            </div>
                        </div>
                    </div>
                    )}

                    <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-dark-border">
                        <button type="button" disabled={cargando} onClick={() => { setMensaje({ tipo: '', texto: '' }); onClose(); }} className="px-4 py-2 text-sm font-medium text-txt-secondary bg-dark-bg border border-dark-border rounded-lg hover:bg-dark-surface transition-colors">
                            {mensaje.password_generica ? 'Cerrar Panel' : 'Cancelar'}
                        </button>
                        {!mensaje.password_generica && (
                            <button type="submit" disabled={cargando} className="px-6 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors flex items-center justify-center min-w-[150px] disabled:opacity-50">
                                {cargando ? 'Registrando...' : 'Crear Maestranza'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}