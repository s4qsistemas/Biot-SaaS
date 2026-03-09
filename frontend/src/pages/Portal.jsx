import { Link } from 'react-router-dom';

export default function Portal() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-dark-bg text-txt-primary">
      
      {/* Navbar Pública */}
      <nav className="bg-dark-surface shadow-sm border-b border-dark-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-extrabold text-2xl text-brand tracking-tight">Biot SaaS</span>
          </Link>
          <div className="hidden md:flex space-x-8 text-sm font-medium">
            <a href="#caracteristicas" className="text-txt-secondary hover:text-brand transition-colors">Características</a>
            <a href="#contacto" className="text-txt-secondary hover:text-brand transition-colors">Contacto</a>
          </div>
          <div>
            <Link to="/login" className="px-5 py-2 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark transition-colors shadow-sm">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-grow flex items-center">
        <div className="max-w-4xl mx-auto py-20 px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight text-txt-primary">
            Maestranzas <span className="text-brand">Inteligentes</span>
          </h1>
          <p className="text-txt-secondary text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            El sistema de gestión integral diseñado específicamente para controlar inventario, cotizaciones y órdenes de trabajo con trazabilidad total.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/login" className="px-8 py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dark shadow-md transition-all hover:-translate-y-0.5">
              Acceder al Sistema
            </Link>
          </div>
        </div>
      </section>

      {/* Características */}
      <section id="caracteristicas" className="max-w-6xl mx-auto py-24 px-6 border-t border-dark-border">
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

      {/* Footer / Contacto */}
      <footer id="contacto" className="bg-dark-surface py-16 text-center border-t border-dark-border">
        <h2 className="text-2xl font-bold mb-4 text-txt-primary">¿Listo para transformar tu maestranza?</h2>
        <p className="text-txt-secondary mb-8 max-w-lg mx-auto">Contáctanos para agendar una demostración y descubrir cómo optimizar tus procesos operativos.</p>
        <a href="mailto:contacto@biot.cl" className="inline-block px-8 py-3 rounded-xl border border-brand text-brand font-semibold hover:bg-brand hover:text-white transition-colors">
          contacto@biot.cl
        </a>
      </footer>

    </div>
  );
}