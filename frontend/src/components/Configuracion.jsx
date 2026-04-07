import React, { useState } from 'react';
import { Upload, User, Building, ShieldAlert } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { tienePermiso, PERMISOS_FRONT } from '../config/permissions';

const Configuracion = () => {
    const { user } = useAuth();
    const puedeConfigurarEmpresa = tienePermiso(user?.rol, PERMISOS_FRONT.CONFIGURACION_EMPRESA);

    const [loadingFirma, setLoadingFirma] = useState(false);
    const [loadingLogo, setLoadingLogo] = useState(false);

    // El Contexto provee la info inicial
    const [previewFirma, setPreviewFirma] = useState(user?.firma_url || null);
    const [previewLogo, setPreviewLogo] = useState(user?.empresa?.logo_url || null);

    // Conversor nativo de Archivo a Base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFirmaUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validación básica de tamaño (ej. max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            return alert("El archivo es muy pesado. Máximo 2MB.");
        }

        try {
            setLoadingFirma(true);
            const base64 = await fileToBase64(file);

            await api.put('/api/configuracion/firma', { firma_base64: base64 });
            setPreviewFirma(base64); // Actualiza la UI solo si el backend responde 200 OK
            alert("✅ Firma guardada correctamente.");
        } catch (error) {
            console.error("Error al subir firma:", error);
            alert("Error al guardar la firma. Verifica la conexión.");
        } finally {
            setLoadingFirma(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            return alert("El archivo es muy pesado. Máximo 2MB.");
        }

        try {
            setLoadingLogo(true);
            const base64 = await fileToBase64(file);

            await api.put('/api/configuracion/logo', { logo_base64: base64 });
            setPreviewLogo(base64); // Actualiza la UI
            alert("✅ Logo corporativo actualizado.");
        } catch (error) {
            console.error("Error al subir logo:", error);
            alert(error.response?.data?.message || "Error al guardar el logo.");
        } finally {
            setLoadingLogo(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fadeIn">
            <div>
                <h1 className="text-3xl font-bold text-white">Configuración</h1>
                <p className="text-txt-secondary mt-1">Administra tus credenciales visuales y ajustes del sistema.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ----------------------------------------------------- */}
                {/* BLOQUE 1: MI PERFIL (Visible para todo empleado)    */}
                {/* ----------------------------------------------------- */}
                <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-dark-border bg-dark-bg/50">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <User className="text-brand" size={20} /> Mi Firma Digital
                        </h2>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-txt-secondary mb-4">
                            Esta firma se estampará automáticamente en los documentos (ej. Cotizaciones) generados por tu usuario.
                        </p>

                        <div className="border-2 border-dashed border-dark-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-dark-bg/30 hover:bg-dark-bg/50 transition-colors">
                            {previewFirma ? (
                                <img
                                    src={previewFirma}
                                    alt="Firma"
                                    className="max-h-24 object-contain mb-6 bg-white p-2 rounded shadow-inner"
                                />
                            ) : (
                                <Upload className="text-txt-secondary mb-4 opacity-50" size={40} />
                            )}

                            <label className={`bg-dark-surface border border-dark-border hover:text-white text-txt-secondary px-6 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors ${loadingFirma ? 'opacity-50 cursor-not-allowed' : 'hover:border-brand'}`}>
                                {loadingFirma ? 'Procesando...' : 'Subir Nueva Firma (PNG/JPG)'}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/png, image/jpeg"
                                    onChange={handleFirmaUpload}
                                    disabled={loadingFirma}
                                />
                            </label>
                            <p className="text-[10px] text-txt-secondary mt-3">Recomendado: PNG con fondo transparente.</p>
                        </div>
                    </div>
                </div>

                {/* ----------------------------------------------------- */}
                {/* BLOQUE 2: EMPRESA (Visible solo para Admin)          */}
                {/* ----------------------------------------------------- */}
                {puedeConfigurarEmpresa ? (
                    <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-dark-border bg-dark-bg/50">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Building className="text-brand" size={20} /> Logo Corporativo
                            </h2>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-txt-secondary mb-4">
                                Este logo representará a la maestranza en los encabezados de los PDFs enviados a clientes.
                            </p>

                            <div className="border-2 border-dashed border-dark-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-dark-bg/30 hover:bg-dark-bg/50 transition-colors">
                                {previewLogo ? (
                                    <img
                                        src={previewLogo}
                                        alt="Logo Empresa"
                                        className="max-h-24 object-contain mb-6 bg-white p-2 rounded shadow-inner"
                                    />
                                ) : (
                                    <Upload className="text-txt-secondary mb-4 opacity-50" size={40} />
                                )}

                                <label className={`bg-brand hover:bg-brand/90 text-white px-6 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors shadow-lg shadow-brand/20 ${loadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {loadingLogo ? 'Procesando...' : 'Actualizar Logo (PNG/JPG)'}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/png, image/jpeg"
                                        onChange={handleLogoUpload}
                                        disabled={loadingLogo}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-dark-surface border border-dark-border rounded-xl flex flex-col items-center justify-center p-8 text-center opacity-70">
                        <ShieldAlert className="text-txt-secondary mb-3" size={40} />
                        <h3 className="text-white font-medium mb-1">Área Restringida</h3>
                        <p className="text-sm text-txt-secondary">
                            No tienes los privilegios necesarios para modificar los datos corporativos de la maestranza.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Configuracion;