import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function ModalEditarMaestranza({ isOpen, onClose, empresaData, onUpdateSuccess }) {
    const [activeTab, setActiveTab] = useState('empresa');

    // ESTADOS SEPARADOS POR TAB
    const [datosEmpresa, setDatosEmpresa] = useState({ nombre_empresa: '', alias: '', giro: '', direccion: '', email_contacto: '', telefono: '' });
    const [datosAdmin, setDatosAdmin] = useState({ admin_id: '', nombre_admin: '', email_admin: '', reset_password: false });

    useEffect(() => {
        if (empresaData && isOpen) {
            setDatosEmpresa({
                nombre_empresa: empresaData.nombre || '',
                alias: empresaData.alias || '',
                giro: empresaData.giro || '',
                direccion: empresaData.direccion || '',
                email_contacto: empresaData.email_contacto || '',
                telefono: empresaData.telefono || ''
            });
            setDatosAdmin({
                admin_id: empresaData.admin_id || '',
                nombre_admin: empresaData.admin_nombre || '',
                email_admin: empresaData.admin_email || '',
                reset_password: false
            });
            setActiveTab('empresa');
        }
    }, [empresaData, isOpen]);

    // MANEJADORES DE SUBMIT INDEPENDIENTES
    const handleGuardarEmpresa = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/api/superadmin/empresa/${empresaData.id}/datos`, datosEmpresa);
            alert('Datos de empresa actualizados.');
            onUpdateSuccess(); // Recarga la tabla en el componente padre
            onClose();
        } catch (error) {
            alert(error.response?.data?.message || 'Error al actualizar empresa');
        }
    };

    const handleGuardarAdmin = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/api/superadmin/empresa/${empresaData.id}/admin`, datosAdmin);
            alert('Datos del administrador actualizados.');
            onUpdateSuccess();
            onClose();
        } catch (error) {
            alert(error.response?.data?.message || 'Error al actualizar admin');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-dark-surface border border-dark-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">

                <div className="px-6 py-4 border-b border-dark-border flex justify-between items-center bg-dark-bg/50">
                    <h3 className="text-lg font-bold text-txt-primary">Editar Datos Básicos</h3>
                    <button onClick={onClose} className="text-txt-secondary hover:text-white">✕</button>
                </div>

                {/* TABS */}
                <div className="flex border-b border-dark-border px-6 pt-2 bg-dark-bg/30">
                    <button type="button" onClick={() => setActiveTab('empresa')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'empresa' ? 'border-brand text-brand' : 'border-transparent text-txt-secondary hover:text-white'}`}>
                        Datos de Empresa
                    </button>
                    <button type="button" onClick={() => setActiveTab('admin')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'admin' ? 'border-brand text-brand' : 'border-transparent text-txt-secondary hover:text-white'}`}>
                        Cuenta Administrador
                    </button>
                </div>

                <div className="p-6">
                    {/* TAB 1: EMPRESA */}
                    {activeTab === 'empresa' && (
                        <form onSubmit={handleGuardarEmpresa} className="space-y-4 animate-fadeIn">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Razón Social</label>
                                    <input type="text" value={datosEmpresa.nombre_empresa} onChange={e => setDatosEmpresa({ ...datosEmpresa, nombre_empresa: e.target.value })} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-brand" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Alias / Slug (URL Interna)</label>
                                    <input type="text" value={datosEmpresa.alias} onChange={e => setDatosEmpresa({ ...datosEmpresa, alias: e.target.value })} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-brand" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Giro Comercial</label>
                                    <input type="text" value={datosEmpresa.giro} onChange={e => setDatosEmpresa({ ...datosEmpresa, giro: e.target.value })} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-brand" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Dirección</label>
                                    <input type="text" value={datosEmpresa.direccion} onChange={e => setDatosEmpresa({ ...datosEmpresa, direccion: e.target.value })} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-brand" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Email Contacto</label>
                                    <input type="email" value={datosEmpresa.email_contacto} onChange={e => setDatosEmpresa({ ...datosEmpresa, email_contacto: e.target.value })} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-brand" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Teléfono</label>
                                    <input type="text" value={datosEmpresa.telefono} onChange={e => setDatosEmpresa({ ...datosEmpresa, telefono: e.target.value })} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-brand" />
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-dark-border">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-txt-secondary hover:text-white">Cancelar</button>
                                <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark">Guardar Empresa</button>
                            </div>
                        </form>
                    )}

                    {/* TAB 2: ADMINISTRADOR */}
                    {activeTab === 'admin' && (
                        <form onSubmit={handleGuardarAdmin} className="space-y-4 animate-fadeIn">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Nombre</label>
                                    <input type="text" value={datosAdmin.nombre_admin} onChange={e => setDatosAdmin({ ...datosAdmin, nombre_admin: e.target.value })} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-brand" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Correo Electrónico</label>
                                    <input type="email" value={datosAdmin.email_admin} onChange={e => setDatosAdmin({ ...datosAdmin, email_admin: e.target.value })} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-brand" />
                                </div>
                            </div>

                            <div className="mt-4 p-4 border border-red-900/50 bg-red-900/10 rounded-lg">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input type="checkbox" checked={datosAdmin.reset_password} onChange={e => setDatosAdmin({ ...datosAdmin, reset_password: e.target.checked })} className="mt-1 w-4 h-4 rounded border-dark-border bg-dark-bg text-brand focus:ring-brand" />
                                    <div>
                                        <span className="text-sm font-semibold text-red-400">Resetear contraseña del usuario</span>
                                        <p className="text-xs text-txt-secondary mt-1">El usuario será forzado a crear una nueva contraseña al reingresar.</p>
                                    </div>
                                </label>
                            </div>

                            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-dark-border">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-txt-secondary hover:text-white">Cancelar</button>
                                <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark">Guardar Admin</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}