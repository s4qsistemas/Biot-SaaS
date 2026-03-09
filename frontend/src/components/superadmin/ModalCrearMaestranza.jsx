import { useState, useEffect } from 'react';
import { formatRut, validateRut } from '../../utils/rut';
import api from '../../utils/api';

export default function ModalCrearMaestranza({ isOpen, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        nombre_empresa: '', rut_empresa: '', alias: '', plan_id: '',
        nombre_admin: '', email_admin: '', password_admin: ''
    });

    const [errorRut, setErrorRut] = useState('');
    const [planes, setPlanes] = useState([]);

    useEffect(() => {
        if (isOpen) {
            const cargarPlanes = async () => {
                try {
                    const { data } = await api.get('/api/superadmin/planes');
                    // Mostrar solo planes marcados como "activo" en la base de datos
                    setPlanes(data.filter(p => p.activo));
                } catch (error) {
                    console.error('Error al cargar la lista de planes:', error);
                }
            };
            cargarPlanes();
        }
    }, [isOpen]);

    // Formateo en tiempo real del RUT y llenado de datos
    const handleChange = (e) => {
        let { name, value } = e.target;

        if (name === 'rut_empresa') {
            value = formatRut(value);
            setErrorRut(''); // Limpiar error si está escribiendo
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();

        // 🛡️ VALIDACIÓN DEL RUT ANTES DE ENVIAR
        if (!validateRut(formData.rut_empresa)) {
            setErrorRut('El RUT ingresado no es válido');
            return;
        }

        // Si pasa, enviamos los datos al componente padre (SuperAdminDashboard)
        onSubmit(formData);

        // Limpiamos el form
        setFormData({ nombre_empresa: '', rut_empresa: '', alias: '', plan_id: '', nombre_admin: '', email_admin: '', password_admin: '' });
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* EMPRESA */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-brand mb-3 border-b border-dark-border pb-1">1. Datos de la Empresa</h4>
                            <div>
                                <label className="block text-xs font-medium text-txt-primary mb-1">Razón Social</label>
                                <input type="text" name="nombre_empresa" value={formData.nombre_empresa} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-txt-primary mb-1">RUT</label>
                                <input type="text" name="rut_empresa" value={formData.rut_empresa} onChange={handleChange} required className={`w-full bg-dark-bg border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:outline-none ${errorRut ? 'border-red-500 focus:ring-red-500' : 'border-dark-border focus:ring-brand'}`} placeholder="12.345.678-9" />
                                {errorRut && <p className="text-red-500 text-[10px] mt-1">{errorRut}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
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
                        </div>

                        {/* ADMIN */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-brand mb-3 border-b border-dark-border pb-1">2. Cuenta Administrador</h4>
                            <div>
                                <label className="block text-xs font-medium text-txt-primary mb-1">Nombre</label>
                                <input type="text" name="nombre_admin" value={formData.nombre_admin} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-txt-primary mb-1">Correo Electrónico</label>
                                <input type="email" name="email_admin" value={formData.email_admin} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary focus:ring-1 focus:ring-brand" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-txt-primary mb-1">Contraseña (Opcional)</label>
                                <input type="text" name="password_admin" value={formData.password_admin} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-txt-primary placeholder-dark-border focus:ring-1 focus:ring-brand" placeholder="Dejar en blanco para usar Genérica" />
                                <p className="text-[10px] text-txt-secondary mt-1">Si está en blanco, usará la clave del sistema y forzará su cambio en el 1° login.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-dark-border">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-txt-secondary bg-dark-bg border border-dark-border rounded-lg hover:bg-dark-surface transition-colors">Cancelar</button>
                        <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">Crear Maestranza</button>
                    </div>
                </form>
            </div>
        </div>
    );
}