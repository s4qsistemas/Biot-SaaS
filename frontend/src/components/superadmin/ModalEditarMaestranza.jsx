import { useState, useEffect } from 'react';
import { formatRut, validateRut } from '../../utils/rut';
import api from '../../utils/api';

export default function ModalEditarMaestranza({ isOpen, onClose, onSubmit, empresaData }) {
    const [activeTab, setActiveTab] = useState('empresa');
    const [planes, setPlanes] = useState([]);

    // ELIMINADO password_admin, AÑADIDO reset_password
    const [formData, setFormData] = useState({
        nombre_empresa: '', rut_empresa: '', alias: '', activo: true, plan_id: '',
        admin_id: null, nombre_admin: '', email_admin: '', reset_password: false
    });

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
                reset_password: false // Siempre entra en falso por seguridad
            });
            setActiveTab('empresa');
        }
    }, [empresaData, isOpen]);

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
        let { name, value, type, checked } = e.target;
        // Si es checkbox, toma 'checked', si no, toma 'value'
        let finalValue = type === 'checkbox' ? checked : value;

        if (name === 'rut_empresa') {
            finalValue = formatRut(value);
        }

        setFormData({ ...formData, [name]: finalValue });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
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
                                    <input
                                        type="text"
                                        name="rut_empresa"
                                        value={formData.rut_empresa}
                                        readOnly
                                        className="w-full bg-dark-eval border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-secondary cursor-not-allowed focus:outline-none"
                                    />
                                    <p className="text-txt-secondary text-[10px] mt-1 italic">* El RUT es el identificador único y no puede modificarse.</p>
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
                                        {planes.map(plan => (
                                            <option key={plan.id} value={plan.id}>
                                                {plan.nombre} ({plan.limite_usuarios} usr) - ${Number(plan.precio_mensual).toLocaleString('es-CL')}
                                            </option>
                                        ))}
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

                            {/* EL BOTÓN DE PÁNICO (CHECKBOX DE RESET) */}
                            <div className="mt-4 p-4 border border-red-900/50 bg-red-900/10 rounded-lg">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="flex items-center h-5">
                                        <input
                                            type="checkbox"
                                            name="reset_password"
                                            checked={formData.reset_password}
                                            onChange={handleChange}
                                            className="w-4 h-4 rounded border-dark-border bg-dark-bg text-brand focus:ring-brand focus:ring-offset-dark-surface"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-sm font-semibold text-red-400 group-hover:text-red-300 transition-colors">Resetear contraseña del usuario</span>
                                        <p className="text-xs text-txt-secondary mt-1">
                                            Al guardar, la contraseña volverá a ser la clave genérica del sistema. El usuario será expulsado y forzado a crear una nueva al reingresar.
                                        </p>
                                    </div>
                                </label>
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