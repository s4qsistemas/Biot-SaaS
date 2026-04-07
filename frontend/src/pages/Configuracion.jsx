import React, { useState } from 'react';
import { Upload, User, Building, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Configuracion = () => {
    const { user } = useAuth();
    const [loadingFirma, setLoadingFirma] = useState(false);
    const [loadingLogo, setLoadingLogo] = useState(false);

    // Vista previa de imágenes
    const [previewFirma, setPreviewFirma] = useState(user?.firma_url || null);
    const [previewLogo, setPreviewLogo] = useState(user?.empresa?.logo_url || null);

    // Conversor de Archivo a Base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    // Manejador para la firma del usuario
    const handleFirmaUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setLoadingFirma(true);
            const base64 = await fileToBase64(file);
            setPreviewFirma(base64); // Mostramos la vista previa de inmediato

            await api.put('/api/configuracion/firma', { firma_base64: base64 });
            alert("Firma guardada correctamente.");
        } catch (error) {
            console.error("Error al subir firma", error);
            alert("Error al guardar la firma.");
        } finally {
            setLoadingFirma(false);
        }
    };

    // Manejador para el logo de la empresa (Solo visible para admins)
    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setLoadingLogo(true);
            const base64 = await fileToBase64(file);
            setPreviewLogo(base64);

            await api.put('/api/configuracion/logo', { logo_base64: base64 });
            alert("Logo de empresa guardado correctamente.");
        } catch (error) {
            console.error("Error al subir logo", error);
            alert("Error al guardar el logo.");
        } finally {
            setLoadingLogo(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8 animate-fadeIn">
            <div>
                <h1 className="text-3xl font-bold text-white">Configuración del Sistema</h1>
                <p className="text-txt-secondary mt-1">Administra tus preferencias y datos de la cuenta.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* BLOQUE 1: MI PERFIL (Visible para todos) */}
                <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                        <User className="text-brand" /> Mi Perfil
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-txt-secondary mb-2">Firma Digital</p>
                            <div className="border-2 border-dashed border-dark-border rounded-lg p-6 flex flex-col items-center justify-center text-center relative hover:bg-dark-bg/50 transition-colors">
                                {previewFirma ? (
                                    <img src={previewFirma} alt="Firma" className="max-h-24 object-contain mb-4 bg-white p-2 rounded" />
                                ) : (
                                    <Upload className="text-txt-secondary mb-2" size={32} />
                                )}
                                <p className="text-sm text-txt-secondary mb-2">Sube una imagen (PNG sin fondo recomendado)</p>
                                <label className="bg-brand hover:bg-brand/90 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors">
                                    {loadingFirma ? 'Guardando...' : 'Seleccionar Archivo'}
                                    <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFirmaUpload} disabled={loadingFirma} />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BLOQUE 2: EMPRESA (Visible solo para Admins o SuperAdmins) */}
                {(user?.rol === 'admin' || user?.rol === 'super_admin') && (
                    <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                            <Building className="text-brand" /> Datos de la Empresa
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-txt-secondary mb-2">Logo Corporativo (Aparecerá en PDFs)</p>
                                <div className="border-2 border-dashed border-dark-border rounded-lg p-6 flex flex-col items-center justify-center text-center relative hover:bg-dark-bg/50 transition-colors">
                                    {previewLogo ? (
                                        <img src={previewLogo} alt="Logo Empresa" className="max-h-24 object-contain mb-4 bg-white p-2 rounded" />
                                    ) : (
                                        <Upload className="text-txt-secondary mb-2" size={32} />
                                    )}
                                    <p className="text-sm text-txt-secondary mb-2">Sube el logo de tu empresa</p>
                                    <label className="bg-brand hover:bg-brand/90 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors">
                                        {loadingLogo ? 'Guardando...' : 'Seleccionar Archivo'}
                                        <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleLogoUpload} disabled={loadingLogo} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Configuracion;