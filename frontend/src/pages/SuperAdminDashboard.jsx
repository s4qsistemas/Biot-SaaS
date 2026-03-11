import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ModalCrearMaestranza from '../components/superadmin/ModalCrearMaestranza';
import ModalEditarMaestranza from '../components/superadmin/ModalEditarMaestranza';
import ModalGestionPlanes from '../components/superadmin/ModalGestionPlanes';
import ModalCambiarPlan from '../components/superadmin/ModalCambiarPlan';
import ModalCambiarEstado from '../components/superadmin/ModalCambiarEstado';
import ModalAuditoria from '../components/superadmin/ModalAuditoria';

export default function SuperAdminDashboard() {
    const { user } = useAuth();

    const [empresas, setEmpresas] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Estados Modal Crear
    const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);

    // 👈 2. Nuevos Estados Modal Editar
    const [isModalEditarOpen, setIsModalEditarOpen] = useState(false);
    const [empresaAEditar, setEmpresaAEditar] = useState(null);

    const [isModalPlanesOpen, setIsModalPlanesOpen] = useState(false);

    const [isModalCambiarPlanOpen, setIsModalCambiarPlanOpen] = useState(false);

    const [isModalCambiarEstadoOpen, setIsModalCambiarEstadoOpen] = useState(false);

    const [isModalAuditoriaOpen, setIsModalAuditoriaOpen] = useState(false);

    const cargarEmpresas = async () => {
        try {
            setCargando(true);
            const { data } = await api.get('/api/superadmin/empresas');
            setEmpresas(data);
        } catch (error) {
            console.error('Error al cargar maestranzas:', error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarEmpresas();
    }, []);

    const handleCrearMaestranza = async (formData) => {
        try {
            await api.post('/api/superadmin/empresa', formData);
            alert('¡Maestranza y Administrador creados con éxito!');
            setIsModalCrearOpen(false);
            await cargarEmpresas();
        } catch (error) {
            alert(error.response?.data?.message || 'Error interno al crear la maestranza');
        }
    };

    // 👈 3. Función para recibir los datos de edición y hacer el PUT
    const handleEditarMaestranza = async (id, formData) => {
        try {
            await api.put(`/api/superadmin/empresa/${id}`, formData);
            alert('¡Maestranza actualizada con éxito!');
            setIsModalEditarOpen(false);
            await cargarEmpresas();
        } catch (error) {
            alert(error.response?.data?.message || 'Error al actualizar la maestranza');
        }
    };

    // 👈 4. Función que se dispara al hacer clic en "Editar" en la tabla
    const abrirModalEditar = (empresa) => {
        setEmpresaAEditar(empresa);
        setIsModalEditarOpen(true);
    };

    const abrirModalPlan = (empresa) => {
        setEmpresaAEditar(empresa);
        setIsModalCambiarPlanOpen(true);
    };

    const abrirModalEstado = (empresa) => {
        setEmpresaAEditar(empresa);
        setIsModalCambiarEstadoOpen(true);
    };

    const abrirModalAuditoria = (empresa) => {
        setEmpresaAEditar(empresa);
        setIsModalAuditoriaOpen(true);
    };

    return (
        <div className="min-h-screen bg-dark-bg p-6 font-sans">
            <div className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-brand">Panel de Control SaaS</h1>
                    <p className="text-sm text-txt-secondary">Bienvenido, {user?.nombre || 'Super Admin'}.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsModalPlanesOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-dark-surface border border-dark-border text-txt-primary font-medium rounded-lg hover:border-brand transition-colors shadow-sm">
                        ⚙️ Gestionar Planes
                    </button>
                    <button onClick={() => setIsModalCrearOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-brand text-white font-medium rounded-lg hover:bg-brand-dark transition-colors shadow-sm">
                        Nueva Maestranza
                    </button>
                </div>
            </div>

            <section className="bg-dark-surface rounded-2xl shadow-xl border border-dark-border p-6 max-w-6xl mx-auto">
                <h2 className="text-lg font-semibold text-txt-primary mb-4">Empresas Registradas</h2>
                <div className="overflow-x-auto min-h-[400px]"> {/* min-h añadido para que el dropdown no corte la tabla */}
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-dark-bg text-txt-secondary uppercase text-xs font-semibold">
                            <tr>
                                <th className="py-3 px-4 rounded-tl-lg">Empresa</th>
                                <th className="py-3 px-4">Alias (URL)</th>
                                <th className="py-3 px-4">Plan & Vencimiento</th>
                                <th className="py-3 px-4">Administrador</th>
                                <th className="py-3 px-4">Estado</th>
                                <th className="py-3 px-4 rounded-tr-lg text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                            {cargando ? (
                                <tr><td colSpan="6" className="py-8 text-center text-txt-secondary">Cargando datos del servidor...</td></tr>
                            ) : empresas.length === 0 ? (
                                <tr><td colSpan="6" className="py-8 text-center text-txt-secondary">No hay empresas registradas aún.</td></tr>
                            ) : (
                                empresas.map(emp => (
                                    <tr key={emp.id} className="hover:bg-dark-bg/50 transition-colors">
                                        <td className="py-3 px-4 font-medium text-txt-primary">{emp.nombre}<br /><span className="text-xs text-txt-secondary">RUT: {emp.rut}</span></td>
                                        <td className="py-3 px-4 font-mono text-xs text-brand">{emp.alias}</td>

                                        {/* 👇 CELDA DEL PLAN + COUNTDOWN */}
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="px-2 py-0.5 bg-blue-900/30 text-brand border border-brand/20 rounded text-[11px] font-semibold">
                                                    {emp.plan_nombre}
                                                </span>
                                                {emp.dias_restantes !== null ? (
                                                    <div className={`text-[10px] font-bold flex items-center gap-1 ${emp.dias_restantes <= 0 ? 'text-red-500' :
                                                        emp.dias_restantes <= 5 ? 'text-orange-400' :
                                                            'text-txt-secondary'
                                                        }`}>
                                                        {emp.dias_restantes <= 0 ? '⚠️ Expirado' : `⏳ Quedan ${emp.dias_restantes} días`}
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] font-bold text-txt-secondary">
                                                        ∞ Ilimitado
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td className="py-3 px-4 text-txt-primary">{emp.admin_nombre}<br /><span className="text-xs text-txt-secondary">{emp.admin_email}</span></td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${emp.estado === 'activa' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                                                {emp.estado === 'activa' ? 'Activa' : 'Suspendida'}
                                            </span>
                                        </td>

                                        {/* 👇 NUEVO MENÚ DE ACCIONES (Iconos SVG) */}
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex justify-end gap-2">

                                                {/* 1. Botón Editar Datos */}
                                                <button
                                                    onClick={() => abrirModalEditar(emp)}
                                                    className="p-1.5 text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 border border-blue-400/30 rounded-lg transition-colors"
                                                    title="Editar Datos Básicos"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>

                                                {/* 2. Botón Cambiar Plan */}
                                                <button
                                                    onClick={() => abrirModalPlan(emp)}
                                                    className="p-1.5 text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/30 rounded-lg transition-colors"
                                                    title="Modificar Plan de Suscripción"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                                </button>

                                                {/* 3. Botón Estado (Suspender/Activar) */}
                                                <button
                                                    onClick={() => abrirModalEstado(emp)}
                                                    className={`p-1.5 rounded-lg transition-colors border ${emp.estado === 'activa' ? 'text-orange-400 bg-orange-400/10 hover:bg-orange-400/20 border-orange-400/30' : 'text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 border-emerald-400/30'}`}
                                                    title={emp.estado === 'activa' ? 'Suspender Empresa' : 'Activar Empresa'}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                                </button>

                                                {/* 4. Botón Auditar */}
                                                <button
                                                    onClick={() => abrirModalAuditoria(emp)}
                                                    className="p-1.5 text-purple-400 bg-purple-400/10 hover:bg-purple-400/20 border border-purple-400/30 rounded-lg transition-colors"
                                                    title="Ver Historial de Auditoría"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                </button>

                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <ModalCrearMaestranza
                isOpen={isModalCrearOpen}
                onClose={() => setIsModalCrearOpen(false)}
                onSubmit={handleCrearMaestranza}
            />

            <ModalEditarMaestranza
                isOpen={isModalEditarOpen}
                onClose={() => setIsModalEditarOpen(false)}
                empresaData={empresaAEditar}
                onUpdateSuccess={cargarEmpresas}
            />

            <ModalGestionPlanes
                isOpen={isModalPlanesOpen}
                onClose={() => setIsModalPlanesOpen(false)}
            />

            <ModalCambiarPlan
                isOpen={isModalCambiarPlanOpen}
                onClose={() => setIsModalCambiarPlanOpen(false)}
                empresaData={empresaAEditar}
                onUpdateSuccess={cargarEmpresas}
            />

            <ModalCambiarEstado
                isOpen={isModalCambiarEstadoOpen}
                onClose={() => setIsModalCambiarEstadoOpen(false)}
                empresaData={empresaAEditar}
                onUpdateSuccess={cargarEmpresas}
            />
            <ModalAuditoria
                isOpen={isModalAuditoriaOpen}
                onClose={() => setIsModalAuditoriaOpen(false)}
                empresaData={empresaAEditar}
            />
        </div>
    );
}