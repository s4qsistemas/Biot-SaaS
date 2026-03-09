import { useState, useEffect } from 'react';
import { formatRut, validateRut } from '../../utils/rut';

export default function ModalEditarMaestranza({ isOpen, onClose, onSubmit, empresaData }) {
    const [activeTab, setActiveTab] = useState('empresa');
    const [errorRut, setErrorRut] = useState('');

    const [formData, setFormData] = useState({
        nombre_empresa: '', rut_empresa: '', alias: '', activo: true, plan_id: '',
        admin_id: null, nombre_admin: '', email_admin: '', password_admin: ''
    });

    // 🔄 Pre-cargar los datos cuando se abre el modal con una empresa específica
    useEffect(() => {
        if (empresaData && isOpen) {
            setFormData({
                nombre_empresa: empresaData.nombre || '',
                rut_empresa: empresaData.rut || '',
                alias: empresaData.alias || '',
                plan_id: empresaData.plan_id || '',
                activo: empresaData.estado === 'activa',
                admin_id: empresaData.admin_id || null,
                nombre_admin: empresaData.admin_nombre || '',
                email_admin: empresaData.admin_email || '',
                password_admin: '' // Siempre oculto por seguridad
            });
            setActiveTab('empresa'); // Reiniciar a la primera pestaña
            setErrorRut('');
        }
    }, [empresaData, isOpen]);

    const handleChange = (e) => {
        let { name, value, type, checked } = e.target;
        let finalValue = type === 'checkbox' ? checked : value;

        if (name === 'rut_empresa') {
            finalValue = formatRut(value);
            setErrorRut('');
        }

        setFormData({ ...formData, [name]: finalValue });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();

        if (!validateRut(formData.rut_empresa)) {
            setErrorRut('El RUT ingresado no es válido');
            setActiveTab('empresa'); // Forzamos ir a la pestaña 1 para que vea el error
            return;
        }

        // Enviamos el ID y los datos al padre
        onSubmit(empresaData.id, formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-dark-surface border border-dark-border rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">

                <div className="px-6 py-4 border-b border-dark-border flex justify-between items-center bg-dark-bg/50">
                    <h3 className="text-lg font-bold text-txt-primary">Editar Maestranza</h3>
                    <button onClick={onClose} className="text-txt-secondary hover:text-txt-primary">✕</button>
                </div>

                {/* TABS */}
                <div className="flex border-b border-dark-border px-6 pt-2 bg-dark-bg/30">
                    <button type="button" onClick={() => setActiveTab('empresa')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'empresa' ? 'border-brand text-brand' : 'border-transparent text-txt-secondary hover:text-txt-primary'}`}>
                        Datos de Empresa
                    </button>
                    <button type="button" onClick={() => setActiveTab('admin')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'admin' ? 'border-brand text-brand' : 'border-transparent text-txt-secondary hover:text-txt-primary'}`}>
                        Cuenta Administrador
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} className="p-6 min-h-[300px]">

                    {/* TAB 1: EMPRESA */}
                    {activeTab === 'empresa' && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Razón Social</label>
                                    <input type="text" name="nombre_empresa" value={formData.nombre_empresa} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">RUT</label>
                                    <input type="text" name="rut_empresa" value={formData.rut_empresa} onChange={handleChange} required className={`w-full bg-dark-bg border rounded-lg px-3 py-2 text-sm text-txt-primary focus:outline-none focus:ring-1 ${errorRut ? 'border-red-500 focus:ring-red-500' : 'border-dark-border focus:ring-brand'}`} />
                                    {errorRut && <p className="text-red-500 text-[10px] mt-1">{errorRut}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Alias / Slug (URL Interna)</label>
                                    <input type="text" name="alias" value={formData.alias} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Plan de Suscripción</label>
                                    <select name="plan_id" value={formData.plan_id || ''} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand">
                                        <option value="" disabled>Seleccionar Plan</option>
                                        <option value="1">Básico</option>
                                        <option value="2">Pro</option>
                                        <option value="3">Enterprise</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-dark-border mt-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <div className="relative">
                                        <input type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} className="sr-only" />
                                        <div className={`block w-10 h-6 rounded-full transition-colors ${formData.activo ? 'bg-emerald-600' : 'bg-dark-bg border border-dark-border'}`}></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.activo ? 'transform translate-x-4' : ''}`}></div>
                                    </div>
                                    <span className={`text-sm font-medium ${formData.activo ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formData.activo ? 'Empresa Activa (Acceso Permitido)' : 'Empresa Suspendida (Acceso Bloqueado)'}
                                    </span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: ADMINISTRADOR */}
                    {activeTab === 'admin' && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="bg-brand/10 border border-brand/20 p-3 rounded-lg mb-4">
                                <p className="text-xs text-brand">Estás editando la cuenta principal de acceso de esta maestranza.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Nombre del Administrador</label>
                                    <input type="text" name="nombre_admin" value={formData.nombre_admin} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Correo Electrónico (Login)</label>
                                    <input type="email" name="email_admin" value={formData.email_admin} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-txt-primary mb-1">Nueva Contraseña (Opcional)</label>
                                <input type="text" name="password_admin" value={formData.password_admin} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary placeholder-dark-border focus:ring-1 focus:ring-brand" placeholder="Dejar en blanco para no cambiarla" />
                            </div>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-dark-border">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-txt-secondary hover:text-txt-primary bg-dark-bg border border-dark-border rounded-lg hover:bg-dark-surface transition-colors">Cancelar</button>
                        <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark shadow-sm transition-colors">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    );
}