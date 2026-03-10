import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function Contacto() {
    const [formData, setFormData] = useState({ nombre: '', email: '', telefono: '', mensaje: '' });
    const [estado, setEstado] = useState({ loading: false, success: false, error: '' });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setEstado({ loading: true, success: false, error: '' });

        try {
            await api.post('/api/public/contacto', formData);
            setEstado({ loading: false, success: true, error: '' });
            setFormData({ nombre: '', email: '', telefono: '', mensaje: '' });
        } catch (error) {
            setEstado({ loading: false, success: false, error: error.response?.data?.message || 'Error al enviar.' });
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg text-txt-primary font-sans flex flex-col">
            {/* Navbar Simple */}
            <nav className="border-b border-dark-border bg-dark-surface/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <Link to="/" className="font-extrabold text-2xl text-brand tracking-tight">Biot SaaS</Link>
                        <Link to="/" className="text-sm font-medium text-txt-secondary hover:text-white transition-colors">Volver al Inicio</Link>
                    </div>
                </div>
            </nav>

            {/* Contenido Central */}
            <main className="flex-grow flex items-center justify-center px-4 py-12">
                <div className="max-w-lg w-full">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-extrabold text-white mb-3">Hablemos</h1>
                        <p className="text-txt-secondary">¿Tienes dudas sobre Biot SaaS? Déjanos tu mensaje y un especialista te contactará.</p>
                    </div>

                    <div className="bg-dark-surface border border-dark-border rounded-2xl p-8 shadow-xl">

                        {estado.success ? (
                            <div className="text-center py-8 animate-fadeIn">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-900/30 text-emerald-400 mb-4">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">¡Mensaje Enviado!</h3>
                                <p className="text-txt-secondary">Hemos recibido tu consulta en nuestra central. Te contactaremos pronto.</p>
                                <button onClick={() => setEstado({ ...estado, success: false })} className="mt-6 text-brand text-sm hover:underline">Enviar otro mensaje</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {estado.error && (
                                    <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-sm text-red-400 text-center">{estado.error}</div>
                                )}

                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">Nombre Completo *</label>
                                    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-sm text-txt-primary focus:ring-1 focus:ring-brand" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-medium text-txt-primary mb-1">Email Corporativo *</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-sm text-txt-primary focus:ring-1 focus:ring-brand" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-txt-primary mb-1">Teléfono (Opcional)</label>
                                        <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-sm text-txt-primary focus:ring-1 focus:ring-brand" placeholder="+56 9..." />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-txt-primary mb-1">¿En qué podemos ayudarte? *</label>
                                    <textarea name="mensaje" value={formData.mensaje} onChange={handleChange} required rows="4" className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-sm text-txt-primary focus:ring-1 focus:ring-brand resize-none"></textarea>
                                </div>

                                <button type="submit" disabled={estado.loading} className="w-full py-3 bg-brand text-white font-bold rounded-lg hover:bg-brand-dark transition-colors shadow-sm disabled:opacity-50">
                                    {estado.loading ? 'Enviando a la central...' : 'Enviar Mensaje'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}