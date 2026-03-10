import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="min-h-screen bg-dark-bg text-txt-primary font-sans flex flex-col">

            {/* Navbar Público Unificado */}
            <nav className="border-b border-dark-border bg-dark-surface/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        {/* Izquierda: Logo */}
                        <div className="font-extrabold text-2xl text-brand tracking-tight">
                            Biot SaaS
                        </div>

                        {/* Centro: Enlaces de anclaje (Solo visibles en escritorio) */}
                        <div className="hidden md:flex space-x-8 text-sm font-medium">
                            <a href="#caracteristicas" className="text-txt-secondary hover:text-brand transition-colors">Características</a>
                            <a href="#contacto" className="text-txt-secondary hover:text-brand transition-colors">Contacto</a>
                        </div>

                        {/* Derecha: Botones de Acción */}
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-sm font-medium text-txt-secondary hover:text-white transition-colors hidden sm:block">
                                Iniciar Sesión
                            </Link>
                            <Link to="/register" className="text-sm font-medium bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors shadow-sm">
                                Prueba Gratis
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section (Orientado a Conversión) */}
            <section className="flex flex-col items-center justify-center px-4 text-center py-20 md:py-32">
                <div className="inline-block px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold uppercase tracking-widest mb-6">
                    Lanzamiento 2026
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white">
                    El motor para tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-emerald-400">Maestranza</span>
                </h1>
                <p className="text-lg md:text-xl text-txt-secondary max-w-2xl mb-10 leading-relaxed">
                    Gestiona cotizaciones, operarios, órdenes de trabajo e inventario en un solo lugar. Todo en la nube, en tiempo real y diseñado para la industria metalmecánica.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link to="/register" className="px-8 py-3.5 bg-brand text-white font-bold rounded-lg hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20 flex items-center justify-center gap-2">
                        Comenzar 14 días gratis
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </Link>
                    <Link to="/login" className="px-8 py-3.5 bg-dark-surface border border-dark-border text-txt-primary font-bold rounded-lg hover:border-brand hover:bg-dark-bg transition-colors flex items-center justify-center">
                        Ya tengo cuenta
                    </Link>
                </div>
            </section>

            {/* Sección de Características (Traída del Portal) */}
            <section id="caracteristicas" className="max-w-7xl mx-auto py-24 px-6 border-t border-dark-border w-full">
                <h2 className="text-3xl font-bold text-center mb-16 text-txt-primary">¿Por qué elegir Biot SaaS?</h2>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="bg-dark-surface rounded-2xl shadow-sm border border-dark-border p-8 text-center border-t-4 border-t-brand hover:border-brand transition-colors">
                        <h3 className="font-bold text-xl mb-3 text-txt-primary">Control de Bodega</h3>
                        <p className="text-txt-secondary text-sm leading-relaxed">Gestión de stock, historial de movimientos y alertas automáticas de reposición.</p>
                    </div>
                    <div className="bg-dark-surface rounded-2xl shadow-sm border border-dark-border p-8 text-center border-t-4 border-t-brand hover:border-brand transition-colors">
                        <h3 className="font-bold text-xl mb-3 text-txt-primary">Cotizaciones Ágiles</h3>
                        <p className="text-txt-secondary text-sm leading-relaxed">Crea cotizaciones precisas calculando HH, HM y materiales en tiempo real.</p>
                    </div>
                    <div className="bg-dark-surface rounded-2xl shadow-sm border border-dark-border p-8 text-center border-t-4 border-t-brand hover:border-brand transition-colors">
                        <h3 className="font-bold text-xl mb-3 text-txt-primary">Trazabilidad de OT</h3>
                        <p className="text-txt-secondary text-sm leading-relaxed">Sigue el estado de cada tarea, horas invertidas y rentabilidad por orden.</p>
                    </div>
                </div>
            </section>

            {/* Footer / Contacto (Traído del Portal) */}
            <footer id="contacto" className="bg-dark-surface py-16 text-center border-t border-dark-border mt-auto">
                <h2 className="text-2xl font-bold mb-4 text-txt-primary">¿Listo para transformar tu maestranza?</h2>
                <p className="text-txt-secondary mb-8 max-w-lg mx-auto">Contáctanos para agendar una demostración y descubrir cómo optimizar tus procesos operativos.</p>
                <a href="mailto:contacto@biot.cl" className="inline-block px-8 py-3 rounded-xl border border-brand text-brand font-semibold hover:bg-brand hover:text-white transition-colors">
                    contacto@biot.cl
                </a>
            </footer>

        </div>
    );
}