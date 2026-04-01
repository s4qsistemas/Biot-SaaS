import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // 👈 Motor de navegación
import api from '../utils/api';

import ModalCrearMaestranza from '../components/superadmin/ModalCrearMaestranza';
import ModalEditarMaestranza from '../components/superadmin/ModalEditarMaestranza';
import ModalGestionPlanes from '../components/superadmin/ModalGestionPlanes';
import ModalCambiarPlan from '../components/superadmin/ModalCambiarPlan';
import ModalCambiarEstado from '../components/superadmin/ModalCambiarEstado';
import ModalAuditoria from '../components/superadmin/ModalAuditoria';
import { Plus, Edit, Power, TrendingUp, History, ShieldCheck, Building } from 'lucide-react';

export default function SuperAdminDashboard() {
    // 👈 Extraemos impersonate del AuthContext
    const { user, impersonate } = useAuth();
    const navigate = useNavigate();

    const [empresas, setEmpresas] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Estados Modales
    const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
    const [isModalEditarOpen, setIsModalEditarOpen] = useState(false);
    const [empresaAEditar, setEmpresaAEditar] = useState(null);
    const [isModalPlanesOpen, setIsModalPlanesOpen] = useState(false);
    const [isModalCambiarPlanOpen, setIsModalCambiarPlanOpen] = useState(false);
    const [isModalCambiarEstadoOpen, setIsModalCambiarEstadoOpen] = useState(false);
    const [isModalAuditoriaOpen, setIsModalAuditoriaOpen] = useState(false);

    useEffect(() => {
        cargarEmpresas();
    }, []);

    const cargarEmpresas = async () => {
        try {
            const res = await api.get('/api/superadmin/empresas');
            setEmpresas(res.data);
        } catch (error) {
            console.error('Error al cargar empresas', error);
        } finally {
            setCargando(false);
        }
    };

    // Se delegará la creación al ModalCrearMaestranza.

    const abrirModalEdicion = (empresa) => {
        setEmpresaAEditar(empresa);
        setIsModalEditarOpen(true);
    };

    const abrirModalCambioPlan = (empresa) => {
        setEmpresaAEditar(empresa);
        setIsModalCambiarPlanOpen(true);
    };

    const abrirModalCambiarEstado = (empresa) => {
        setEmpresaAEditar(empresa);
        setIsModalCambiarEstadoOpen(true);
    };

    const abrirModalAuditoria = (empresa) => {
        setEmpresaAEditar(empresa);
        setIsModalAuditoriaOpen(true);
    };

    // ⚡ LÓGICA DE SUPLANTACIÓN (DOBLE CLIC)
    const handleImpersonate = async (empresaId) => {
        try {
            console.log("1. Gatillo presionado para la empresa:", empresaId); // 👈 Agrega este log para probar
            await impersonate(empresaId);
            console.log("3. Suplantación exitosa, redirigiendo..."); // 👈 Y este
            navigate('/dashboard');
        } catch (error) {
            console.error("Error en impersonate:", error);
            alert("Error al intentar acceder al panel de esta empresa.");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <ShieldCheck className="text-brand" size={32} />
                        Panel SaaS
                    </h1>
                    <p className="text-txt-secondary mt-1">Gestión centralizada de empresas y facturación.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsModalPlanesOpen(true)}
                        className="bg-dark-surface border border-dark-border text-white px-4 py-2 rounded-lg font-medium hover:border-brand transition-colors"
                    >
                        Gestor de Planes
                    </button>
                    <button
                        onClick={() => setIsModalCrearOpen(true)}
                        className="bg-brand text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-hover transition-colors shadow-lg shadow-brand/20 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Nueva Empresa
                    </button>
                </div>
            </header>

            <section className="bg-dark-surface rounded-xl border border-dark-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-dark-border bg-dark-bg/50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Building size={20} className="text-txt-secondary" />
                        Empresas Activas
                    </h2>
                    <span className="bg-brand/10 text-brand px-3 py-1 rounded-full text-xs font-bold border border-brand/20">
                        Total: {empresas.length}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-dark-bg/80 text-txt-secondary text-xs uppercase tracking-wider border-b border-dark-border">
                                <th className="p-4 font-semibold">Empresa</th>
                                <th className="p-4 font-semibold">Administrador</th>
                                <th className="p-4 font-semibold">Plan Actual</th>
                                <th className="p-4 font-semibold">Vencimiento</th>
                                <th className="p-4 font-semibold text-center">Estado</th>
                                <th className="p-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                            {cargando ? (
                                <tr><td colSpan="6" className="p-8 text-center text-txt-secondary">Cargando empresas...</td></tr>
                            ) : empresas.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-txt-secondary">No hay empresas registradas.</td></tr>
                            ) : (
                                empresas.map((empresa) => (
                                    <tr
                                        key={empresa.id}
                                        onDoubleClick={() => handleImpersonate(empresa.id)} // 👈 GATILLO DEL DOBLE CLIC
                                        className={`hover:bg-brand/10 transition-colors cursor-pointer group ${empresa.estado !== 'activa' ? 'opacity-60 grayscale-[0.5]' : ''}`} // 👈 EFECTO VISUAL SUSPENDIDA
                                        title="Doble clic para entrar a esta empresa"
                                    >
                                        <td className="p-4">
                                            <p className="font-bold text-white group-hover:text-brand transition-colors">{empresa.nombre}</p>
                                            <p className="text-xs text-txt-secondary font-mono mt-0.5">{empresa.rut}</p>
                                        </td>
                                        <td className="p-4">
                                            {empresa.admin_nombre ? (
                                                <>
                                                    <p className="font-medium text-slate-300 text-sm">{empresa.admin_nombre}</p>
                                                    <p className="text-xs text-txt-secondary">{empresa.admin_email}</p>
                                                </>
                                            ) : (
                                                <span className="text-xs italic text-red-400">Sin administrador</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold border
                                                ${(empresa.plan_nombre || '').toLowerCase().includes('trial')
                                                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}
                                            >
                                                {empresa.plan_nombre || 'Ninguno'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm text-slate-300">
                                                {new Date(empresa.fecha_vencimiento).toLocaleDateString('es-CL')}
                                            </p>
                                            {/* 👈 RECUPERADO: DÍAS RESTANTES COMO LO TENÍAS */}
                                            {empresa.dias_restantes !== null && (
                                                <p className={`text-[10px] font-bold mt-0.5 ${empresa.dias_restantes <= 5 ? 'text-red-400 animate-pulse' : 'text-txt-secondary'}`}>
                                                    Quedan {empresa.dias_restantes} días
                                                </p>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase border
                                                ${empresa.estado === 'activa'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
                                            >
                                                {empresa.estado === 'activa' ? 'Activa' : 'Suspendida'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => abrirModalAuditoria(empresa)} className="p-1.5 text-txt-secondary hover:text-white hover:bg-dark-bg rounded transition-colors" title="Ver Historial de Cambios">
                                                    <History size={16} />
                                                </button>
                                                <div className="w-px h-6 bg-dark-border mx-1"></div>

                                                {/* 👈 RECUPERADO: BLOQUEO DE BOTONES SI ESTÁ SUSPENDIDA */}
                                                <button
                                                    onClick={() => abrirModalEdicion(empresa)}
                                                    disabled={empresa.estado !== 'activa'}
                                                    className={`p-1.5 rounded transition-colors ${empresa.estado === 'activa' ? 'text-txt-secondary hover:text-brand hover:bg-brand/10' : 'text-dark-border cursor-not-allowed'}`}
                                                    title={empresa.estado === 'activa' ? "Editar Datos y Credenciales" : "Empresa suspendida"}
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => abrirModalCambioPlan(empresa)}
                                                    disabled={empresa.estado !== 'activa'}
                                                    className={`p-1.5 rounded transition-colors ${empresa.estado === 'activa' ? 'text-txt-secondary hover:text-blue-400 hover:bg-blue-500/10' : 'text-dark-border cursor-not-allowed'}`}
                                                    title={empresa.estado === 'activa' ? "Upgrade / Downgrade Plan" : "Empresa suspendida"}
                                                >
                                                    <TrendingUp size={16} />
                                                </button>

                                                <button onClick={() => abrirModalCambiarEstado(empresa)} className={`p-1.5 rounded transition-colors ${empresa.estado === 'activa' ? 'text-txt-secondary hover:text-red-400 hover:bg-red-500/10' : 'text-txt-secondary hover:text-emerald-400 hover:bg-emerald-500/10'}`} title={empresa.estado === 'activa' ? "Suspender Empresa" : "Activar Empresa"}>
                                                    <Power size={16} />
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

            <ModalCrearMaestranza isOpen={isModalCrearOpen} onClose={() => setIsModalCrearOpen(false)} onUpdateSuccess={cargarEmpresas} />
            <ModalEditarMaestranza isOpen={isModalEditarOpen} onClose={() => setIsModalEditarOpen(false)} empresaData={empresaAEditar} onUpdateSuccess={cargarEmpresas} />
            <ModalGestionPlanes isOpen={isModalPlanesOpen} onClose={() => setIsModalPlanesOpen(false)} />
            <ModalCambiarPlan isOpen={isModalCambiarPlanOpen} onClose={() => setIsModalCambiarPlanOpen(false)} empresaData={empresaAEditar} onUpdateSuccess={cargarEmpresas} />
            <ModalCambiarEstado isOpen={isModalCambiarEstadoOpen} onClose={() => setIsModalCambiarEstadoOpen(false)} empresaData={empresaAEditar} onUpdateSuccess={cargarEmpresas} />
            <ModalAuditoria isOpen={isModalAuditoriaOpen} onClose={() => setIsModalAuditoriaOpen(false)} empresaData={empresaAEditar} />
        </div>
    );
}