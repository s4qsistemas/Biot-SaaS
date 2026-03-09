import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ModalCrearMaestranza from '../components/superadmin/ModalCrearMaestranza';
import ModalEditarMaestranza from '../components/superadmin/ModalEditarMaestranza';

export default function SuperAdminDashboard() {
    const { user } = useAuth();

    const [empresas, setEmpresas] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Estados Modal Crear
    const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);

    // 👈 2. Nuevos Estados Modal Editar
    const [isModalEditarOpen, setIsModalEditarOpen] = useState(false);
    const [empresaAEditar, setEmpresaAEditar] = useState(null);

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

    return (
        <div className="min-h-screen bg-dark-bg p-6 font-sans">
            <div className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-brand">Panel de Control SaaS</h1>
                    <p className="text-sm text-txt-secondary">Bienvenido, {user?.nombre || 'Super Admin'}.</p>
                </div>
                <button onClick={() => setIsModalCrearOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-brand text-white font-medium rounded-lg hover:bg-brand-dark transition-colors shadow-sm">
                    Nueva Maestranza
                </button>
            </div>

            <section className="bg-dark-surface rounded-2xl shadow-xl border border-dark-border p-6 max-w-6xl mx-auto">
                <h2 className="text-lg font-semibold text-txt-primary mb-4">Empresas Registradas</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-dark-bg text-txt-secondary uppercase text-xs font-semibold">
                            <tr>
                                <th className="py-3 px-4 rounded-tl-lg">Empresa</th>
                                <th className="py-3 px-4">Alias (URL)</th>
                                <th className="py-3 px-4">Plan</th>
                                <th className="py-3 px-4">Administrador</th>
                                <th className="py-3 px-4">Estado</th>
                                <th className="py-3 px-4 rounded-tr-lg">Acciones</th>
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
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-1 bg-blue-900/30 text-brand border border-brand/20 rounded-md text-xs font-semibold">
                                                {emp.plan_nombre}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-txt-primary">{emp.admin_nombre}<br /><span className="text-xs text-txt-secondary">{emp.admin_email}</span></td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${emp.estado === 'activa' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                                                {emp.estado === 'activa' ? 'Activa' : 'Suspendida'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => abrirModalEditar(emp)}
                                                className="text-brand hover:text-brand-dark font-medium transition-colors"
                                            >
                                                Editar
                                            </button>
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
                onSubmit={handleEditarMaestranza}
                empresaData={empresaAEditar}
            />
        </div>
    );
}