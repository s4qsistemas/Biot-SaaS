import { useEffect, useState } from 'react';
import { getInventario, getHistorialItem, registrarMovimiento, inicializarStock } from '../services/inventario.service';
import { useAuth } from '../context/AuthContext';
import { Package, MapPin, Search, History, AlertTriangle, PlusCircle, MinusCircle, Plus } from 'lucide-react';
import NuevoStockModal from '../components/NuevoStockModal';

// 🛡️ IMPORTAMOS LA JAULA
import { tienePermiso, PERMISOS } from '../config/permissions';

const Inventario = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('');

    const [isNuevoStockModalOpen, setIsNuevoStockModalOpen] = useState(false);
    const [isMovimientoModalOpen, setIsMovimientoModalOpen] = useState(false);
    const [tipoMovimiento, setTipoMovimiento] = useState('');
    const [itemSeleccionado, setItemSeleccionado] = useState(null);

    const [historial, setHistorial] = useState([]);
    const [loadingHistorial, setLoadingHistorial] = useState(false);

    const { user } = useAuth();

    // 🛡️ PERMISOS CENTRALIZADOS
    const puedeEditar = tienePermiso(user?.rol, PERMISOS.INVENTARIO_MOVER);
    const puedeInicializar = tienePermiso(user?.rol, PERMISOS.INVENTARIO_INICIALIZAR);

    useEffect(() => {
        cargarInventario();
    }, []);

    const cargarInventario = async () => {
        setLoading(true);
        try {
            const data = await getInventario();
            setItems(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGuardarNuevoStock = async (formData) => {
        try {
            await inicializarStock(formData);
            setIsNuevoStockModalOpen(false);
            cargarInventario();
            alert("¡Material ingresado a bodega exitosamente!");
        } catch (error) {
            console.error("Error al inicializar stock:", error);
            alert("Error al ingresar material: " + (error.response?.data?.message || error.message));
        }
    };

    const handleAbrirModal = async (item, tipo) => {
        setItemSeleccionado(item);
        setTipoMovimiento(tipo);
        setIsMovimientoModalOpen(true);

        if (tipo === 'historial') {
            setLoadingHistorial(true);
            try {
                const data = await getHistorialItem(item.id);
                setHistorial(data);
            } catch (error) {
                console.error("Error cargando historial:", error);
            } finally {
                setLoadingHistorial(false);
            }
        }
    };

    const handleConfirmarMovimiento = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const cantidad = formData.get('cantidad');

        let motivoFinal = '';
        if (tipoMovimiento === 'salida') {
            const categoria = formData.get('motivo_categoria');
            const detalle = formData.get('motivo_detalle');
            motivoFinal = `[${categoria}] - ${detalle}`;
        } else {
            motivoFinal = formData.get('motivo');
        }

        try {
            await registrarMovimiento({
                inventario_id: itemSeleccionado.id,
                tipo_movimiento: tipoMovimiento.toUpperCase(),
                cantidad: Number(cantidad),
                motivo: motivoFinal
            });

            setIsMovimientoModalOpen(false);
            cargarInventario();
            alert(`¡${tipoMovimiento} registrada con éxito!`);
        } catch (error) {
            console.error("Error al registrar movimiento:", error);
            alert("Error del servidor: " + (error.response?.data?.message || error.message));
        }
    };

    const itemsFiltrados = items.filter(item => {
        // 🔧 CORRECCIÓN: Usando singular (producto) según esquema Prisma
        const nombre = item.producto?.nombre?.toLowerCase() || '';
        const codigo = item.producto?.codigo?.toLowerCase() || '';
        const terminoBusqueda = filtro.toLowerCase();
        return nombre.includes(terminoBusqueda) || codigo.includes(terminoBusqueda);
    });

    const materialesYaEnBodega = items.map(item => item.producto_id);

    if (loading) return <div className="p-8 text-center text-txt-secondary">Cargando bodega...</div>;

    return (
        <div className="space-y-6 p-6">
            <NuevoStockModal
                isOpen={isNuevoStockModalOpen}
                onClose={() => setIsNuevoStockModalOpen(false)}
                onSave={handleGuardarNuevoStock}
                materialesExistentes={materialesYaEnBodega}
            />

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-txt-primary flex items-center gap-2">
                        <Package className="text-brand" /> Gestión de Inventario
                    </h2>
                    <p className="text-txt-secondary">Control de Stock y Bodegas</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 text-txt-secondary" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar material..."
                            className="w-full bg-dark-surface border border-dark-border rounded-lg pl-10 pr-4 py-2 text-txt-primary focus:border-brand outline-none"
                            onChange={(e) => setFiltro(e.target.value)}
                        />
                    </div>
                    {puedeInicializar && (
                        <button
                            onClick={() => setIsNuevoStockModalOpen(true)}
                            className="bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shadow-lg shadow-brand/20"
                        >
                            <Plus size={20} />
                            <span>Registrar Ingreso</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-dark-surface rounded-xl border border-dark-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-dark-bg/50 text-txt-secondary text-xs uppercase tracking-wider border-b border-dark-border">
                                <th className="p-4 font-medium">Material / Código</th>
                                <th className="p-4 font-medium">Ubicación</th>
                                <th className="p-4 font-medium">Tipo</th>
                                <th className="p-4 font-medium text-right">Cant. Disponible</th>
                                <th className="p-4 font-medium text-center">Estado</th>
                                <th className="p-4 font-medium text-center">Acciones</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-dark-border">
                            {itemsFiltrados.map((item) => (
                                <tr key={item.id} className="hover:bg-dark-bg/30 transition-colors group">
                                    <td className="p-4">
                                        {/* 🔧 CORRECCIÓN: producto en singular */}
                                        <div className="font-medium text-txt-primary">{item.producto?.nombre}</div>
                                        <div className="text-xs text-txt-secondary font-mono bg-dark-bg px-1.5 py-0.5 rounded inline-block mt-1">
                                            {item.producto?.codigo}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-sm text-txt-secondary">
                                            <MapPin size={14} className="text-brand/70" />
                                            {/* 🔧 CORRECCIÓN: ubicacion en singular */}
                                            <span>{item.bodega || item.ubicacion?.bodega || 'Bodega Central'}</span>
                                        </div>
                                        <div className="text-xs text-txt-secondary opacity-60 pl-6">
                                            {item.ubicacion?.ubicacion || 'Por asignar'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border 
                                            ${(item.tipo_unit || '').toUpperCase() === 'NORMAL' || item.es_agregado
                                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }
                                        `}>
                                            {item.tipo_unit || (item.es_agregado ? 'GRANEL' : 'UNITARIO')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className={`font-bold text-lg ${(item.estado || 'disponible').toLowerCase() === 'sin_stock' ? 'text-red-400'
                                            : (item.estado || 'disponible').toLowerCase() === 'bajo_stock' ? 'text-amber-400'
                                                : 'text-emerald-400'
                                            }`}>
                                            {Number(item.cantidad_disponible).toLocaleString('es-CL')} <span className="text-xs font-normal text-txt-secondary">{item.producto?.unidad_base || 'UN'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border capitalize
                                            ${(item.estado || 'disponible').toLowerCase() === 'sin stock' || (item.estado || 'disponible').toLowerCase() === 'sin_stock'
                                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                : (item.estado || 'disponible').toLowerCase() === 'bajo stock' || (item.estado || 'disponible').toLowerCase() === 'bajo_stock'
                                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }
                                        `}>
                                            {(item.estado || 'disponible').toLowerCase()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {puedeEditar && (
                                                <>
                                                    <button onClick={() => handleAbrirModal(item, 'entrada')} className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Registrar Entrada"><PlusCircle size={18} /></button>
                                                    <button onClick={() => handleAbrirModal(item, 'salida')} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Ajuste / Merma"><MinusCircle size={18} /></button>
                                                </>
                                            )}
                                            <button onClick={() => handleAbrirModal(item, 'historial')} className="p-2 text-txt-secondary hover:text-brand hover:bg-brand/10 rounded-lg transition-colors" title="Ver Historial"><History size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {itemsFiltrados.length === 0 && (
                    <div className="p-12 text-center text-txt-secondary">
                        <Package size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No se encontraron materiales en bodega.</p>
                    </div>
                )}
            </div>

            {/* Modal de Movimientos (Se mantiene igual, solo ajustando los itemSeleccionado.producto) */}
            {isMovimientoModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-dark-surface border border-dark-border w-full max-w-md rounded-xl shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className={`text-xl font-bold capitalize flex items-center gap-2
                                ${tipoMovimiento === 'entrada' ? 'text-emerald-400' : ''}
                                ${tipoMovimiento === 'salida' ? 'text-red-400' : ''}
                                ${tipoMovimiento === 'historial' ? 'text-brand' : ''}
                            `}>
                                {tipoMovimiento === 'entrada' && <PlusCircle size={20} />}
                                {tipoMovimiento === 'salida' && <MinusCircle size={20} />}
                                {tipoMovimiento === 'historial' && <History size={20} />}
                                {tipoMovimiento === 'historial' ? 'Historial de Movimientos' : tipoMovimiento === 'salida' ? 'Ajuste / Merma de Stock' : `Registrar ${tipoMovimiento}`}
                            </h3>
                            <button onClick={() => setIsMovimientoModalOpen(false)} className="text-txt-secondary hover:text-white transition-colors">✕</button>
                        </div>

                        <div className="mb-6 p-3 bg-dark-bg rounded-lg border border-dark-border">
                            <p className="text-xs text-txt-secondary uppercase">Material Seleccionado</p>
                            <p className="font-bold text-txt-primary">{itemSeleccionado?.producto?.nombre}</p>
                            <p className="text-sm text-txt-secondary font-mono">{itemSeleccionado?.producto?.codigo}</p>
                        </div>

                        {tipoMovimiento === 'salida' && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6 flex gap-3 items-start">
                                <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
                                <p className="text-xs text-red-200 leading-relaxed">
                                    <strong>ALERTA FINANCIERA:</strong> No use este formulario para OTs. El consumo para Órdenes de Trabajo debe hacerse exclusivamente desde el módulo <strong>Órdenes de Trabajo</strong> para cargar el costo al proyecto.
                                </p>
                            </div>
                        )}

                        {tipoMovimiento !== 'historial' ? (
                            <form onSubmit={handleConfirmarMovimiento} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-txt-secondary mb-1">Cantidad a {tipoMovimiento === 'entrada' ? 'ingresar' : 'retirar / mermar'}</label>
                                    <div className="flex relative">
                                        <input type="number" name="cantidad" min="1" step="0.01" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 pr-12 text-txt-primary focus:border-brand outline-none" placeholder="Ej: 10" required />
                                        <span className="absolute right-4 top-2.5 text-txt-secondary text-sm">{itemSeleccionado?.producto?.unidad_base || 'UN'}</span>
                                    </div>
                                </div>

                                {tipoMovimiento === 'entrada' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-txt-secondary mb-1">Motivo / Referencia</label>
                                        <input type="text" name="motivo" placeholder="Ej: Factura de compra #1234" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-txt-primary focus:border-emerald-500 outline-none" required />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-txt-secondary mb-1">Categoría de Salida</label>
                                            <select name="motivo_categoria" required className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-txt-primary focus:border-red-500 outline-none">
                                                <option value="">-- Seleccione el motivo exacto --</option>
                                                <option value="Consumo Interno">Consumo Interno (Mantenimiento Taller)</option>
                                                <option value="Merma">Merma por daño / óxido / quiebre</option>
                                                <option value="Pérdida">Pérdida o extravío</option>
                                                <option value="Ajuste">Ajuste de inventario (Cuadratura)</option>
                                                <option value="Calibración">Pruebas / Calibración de máquinas</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-txt-secondary mb-1">Observación Obligatoria</label>
                                            <textarea
                                                name="motivo_detalle"
                                                required
                                                minLength="10"
                                                rows="2"
                                                placeholder="Ej: Se oxidaron 3 planchas por filtración de agua..."
                                                className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-txt-primary focus:border-red-500 outline-none resize-none"
                                            ></textarea>
                                            <p className="text-[10px] text-txt-secondary mt-1 flex items-center gap-1">
                                                <AlertTriangle size={12} className="text-amber-500" />
                                                Debe escribir al menos 10 caracteres justificando la salida para auditoría.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setIsMovimientoModalOpen(false)} className="px-4 py-2 text-txt-secondary hover:text-white transition-colors">Cancelar</button>
                                    <button type="submit" className={`px-6 py-2 rounded-lg text-white font-medium transition-colors ${tipoMovimiento === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}>
                                        Confirmar {tipoMovimiento === 'entrada' ? 'Ingreso' : 'Ajuste / Merma'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="max-h-64 overflow-y-auto pr-2">
                                {loadingHistorial ? (
                                    <div className="text-center p-8 text-txt-secondary">Cargando movimientos...</div>
                                ) : historial.length === 0 ? (
                                    <div className="text-center p-8 text-txt-secondary border border-dashed border-dark-border rounded-lg">
                                        <History size={32} className="mx-auto mb-2 opacity-50" />
                                        <p>No hay movimientos registrados para este material.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {historial.map((mov) => (
                                            <div key={mov.id} className="bg-dark-bg p-3 rounded-lg border border-dark-border flex justify-between items-center hover:bg-dark-surface transition-colors">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${mov.tipo?.toUpperCase() === 'ENTRADA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{mov.tipo}</span>
                                                        <span className={`text-sm font-bold ${mov.tipo?.toUpperCase() === 'ENTRADA' ? 'text-emerald-400' : 'text-red-400'}`}>{mov.tipo?.toUpperCase() === 'ENTRADA' ? '+' : '-'}{Number(mov.cantidad_movida)}</span>
                                                    </div>
                                                    <p className="text-xs text-txt-secondary mt-1">{mov.motivo || mov.referencia_tipo} • Por: <span className="text-txt-primary">{mov.usuario?.nombre || 'Sistema'}</span></p>
                                                </div>
                                                <div className="text-xs text-txt-secondary text-right font-mono">
                                                    {new Date(mov.created_at).toLocaleDateString('es-CL')}
                                                    <br />
                                                    <span className="opacity-70">{new Date(mov.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventario;