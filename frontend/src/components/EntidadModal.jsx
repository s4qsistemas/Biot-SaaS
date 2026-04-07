import { useEffect, useState } from 'react';
import { X, Save, Building2, Hash, Phone, MapPin, Mail, AlertCircle } from 'lucide-react';
// Importamos la utilidad que acabamos de crear
import { cleanRut, formatRut, validateRut } from '../utils/rut';

const EntidadModal = ({ isOpen, onClose, onSave, entidadToEdit }) => {
    const initialFormState = {
        rut: '',
        nombre: '',
        tipo: 'cliente',
        giro: '',
        email: '',
        telefono: '',
        direccion: '',
        contacto_nombre: '',
        activo: true
    };

    const [formData, setFormData] = useState(initialFormState);
    const [rutError, setRutError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setRutError(''); // Reseteamos errores
            if (entidadToEdit) {
                // MODO EDICIÓN:
                // El RUT viene "sucio" de la DB (761234567), lo formateamos para que se vea bien (76.123.456-7)
                setFormData({
                    ...entidadToEdit,
                    rut: formatRut(entidadToEdit.rut),
                    nombre: entidadToEdit.nombre || '',
                    tipo: entidadToEdit.tipo || 'cliente',
                    giro: entidadToEdit.giro || '',
                    email: entidadToEdit.email || '',
                    telefono: entidadToEdit.telefono || '',
                    direccion: entidadToEdit.direccion || '',
                    contacto_nombre: entidadToEdit.contacto_nombre || '',
                    activo: entidadToEdit.activo ?? true
                });
            } else {
                // MODO CREACIÓN
                setFormData(initialFormState);
            }
        }
    }, [isOpen, entidadToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Si el usuario edita el RUT, borramos el error momentáneamente
        if (name === 'rut') setRutError('');
    };

    // Validación y Formateo Automático al salir del campo (UX)
    const handleRutBlur = () => {
        if (!formData.rut) return;

        if (!validateRut(formData.rut)) {
            setRutError('RUT inválido');
        } else {
            setRutError('');
            // Si es válido, lo formateamos bonito automáticamente (111111111 -> 11.111.111-1)
            setFormData(prev => ({ ...prev, rut: formatRut(prev.rut) }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // 1. Validación Final antes de guardar
        if (!validateRut(formData.rut)) {
            setRutError('RUT inválido, verifique el dígito verificador.');
            return;
        }

        // 2. LIMPIEZA: Quitamos puntos y guión para guardar en la BD
        const dataToSave = {
            ...formData,
            rut: cleanRut(formData.rut) // Se guarda: "761234567"
        };

        onSave(dataToSave);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-dark-surface border border-dark-border w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-dark-border bg-dark-bg/50">
                    <div>
                        <h3 className="text-xl font-bold text-txt-primary">
                            {entidadToEdit ? 'Editar Entidad' : 'Nueva Entidad'}
                        </h3>
                        <p className="text-sm text-txt-secondary">
                            {entidadToEdit ? 'Modificar datos existentes' : 'Registrar nuevo cliente o proveedor'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-txt-secondary hover:text-red-400 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Campo RUT con Validación */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-txt-secondary uppercase flex items-center gap-2">
                                <Hash size={14} /> RUT
                            </label>
                            <input
                                type="text"
                                name="rut"
                                value={formData.rut}
                                onChange={handleChange}
                                onBlur={handleRutBlur} // 👈 Valida al perder foco
                                placeholder="Ej: 76.123.456-7"
                                required
                                disabled={!!entidadToEdit}
                                className={`w-full bg-dark-bg border rounded-lg px-4 py-2 text-txt-primary outline-none transition-colors
                                    ${rutError ? 'border-red-500 focus:border-red-500' : 'border-dark-border focus:border-brand'}
                                    ${entidadToEdit ? 'opacity-50 cursor-not-allowed bg-dark-surface' : ''}
                                `}
                            />
                            {rutError && (
                                <p className="text-xs text-red-400 flex items-center gap-1">
                                    <AlertCircle size={10} /> {rutError}
                                </p>
                            )}
                            {entidadToEdit && <p className="text-[10px] text-amber-500/80">* El RUT no se puede editar</p>}
                        </div>

                        {/* Nombre / Razón Social */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-txt-secondary uppercase flex items-center gap-2">
                                <Building2 size={14} /> Razón Social
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                placeholder="Nombre de la empresa"
                                required
                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-txt-primary focus:border-brand outline-none transition-colors"
                            />
                        </div>

                        {/* Giro Comercial */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-txt-secondary uppercase flex items-center gap-2">
                                <Building2 size={14} /> Giro
                            </label>
                            <input
                                type="text"
                                name="giro"
                                value={formData.giro}
                                onChange={handleChange}
                                placeholder="Ej: Servicios Industriales"
                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-txt-primary focus:border-brand outline-none transition-colors"
                            />
                        </div>

                        {/* Tipo de Entidad */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-txt-secondary uppercase">Tipo</label>
                            <select
                                name="tipo"
                                value={formData.tipo}
                                onChange={handleChange}
                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-txt-primary focus:border-brand outline-none"
                            >
                                <option value="cliente">Cliente</option>
                                <option value="proveedor">Proveedor</option>
                                <option value="mixto">Ambos (Mixto)</option>
                            </select>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-txt-secondary uppercase flex items-center gap-2">
                                <Mail size={14} /> Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="contacto@empresa.cl"
                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-txt-primary focus:border-brand outline-none"
                            />
                        </div>

                        {/* Teléfono */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-txt-secondary uppercase flex items-center gap-2">
                                <Phone size={14} /> Teléfono
                            </label>
                            <input
                                type="text"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                placeholder="+56 9 ..."
                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-txt-primary focus:border-brand outline-none"
                            />
                        </div>

                        {/* Nombre de Contacto */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-txt-secondary uppercase">Contacto</label>
                            <input
                                type="text"
                                name="contacto_nombre"
                                value={formData.contacto_nombre}
                                onChange={handleChange}
                                placeholder="Persona de contacto"
                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-txt-primary focus:border-brand outline-none"
                            />
                        </div>
                    </div>

                    {/* Dirección (Full width) */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-txt-secondary uppercase flex items-center gap-2">
                            <MapPin size={14} /> Dirección
                        </label>
                        <input
                            type="text"
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleChange}
                            placeholder="Dirección comercial..."
                            className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-txt-primary focus:border-brand outline-none"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-txt-secondary hover:text-txt-primary hover:bg-dark-bg rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="bg-brand hover:bg-brand-dark text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
                        >
                            <Save size={18} />
                            <span>{entidadToEdit ? 'Actualizar' : 'Guardar'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EntidadModal;