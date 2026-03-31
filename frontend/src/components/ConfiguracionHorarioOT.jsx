import React, { useState } from 'react';
import { Clock, Save, AlertTriangle, Calendar, Plus, Trash2, Target } from 'lucide-react';
import api from '../utils/api';
import { calcularHorasEfectivas } from '../utils/horarios';

const DIAS_BASE = [
    { dia: 1, nombre: 'Lunes', habilitado: true, apertura: '08:00', cierre: '18:00', colacion_horas: 1 },
    { dia: 2, nombre: 'Martes', habilitado: true, apertura: '08:00', cierre: '18:00', colacion_horas: 1 },
    { dia: 3, nombre: 'Miércoles', habilitado: true, apertura: '08:00', cierre: '18:00', colacion_horas: 1 },
    { dia: 4, nombre: 'Jueves', habilitado: true, apertura: '08:00', cierre: '18:00', colacion_horas: 1 },
    { dia: 5, nombre: 'Viernes', habilitado: true, apertura: '08:00', cierre: '17:00', colacion_horas: 1 },
    { dia: 6, nombre: 'Sábado', habilitado: false, apertura: '08:00', cierre: '13:00', colacion_horas: 0 },
    { dia: 0, nombre: 'Domingo', habilitado: false, apertura: '00:00', cierre: '00:00', colacion_horas: 0 }
];

export default function ConfiguracionHorarioOT({ ot, onUpdate, readOnly = false }) {
    const parseInitialState = () => {
        if (!ot?.horario_programado) return { rutina: DIAS_BASE, excepciones: [], fecha_entrega: '' };
        const parsed = typeof ot.horario_programado === 'string' ? JSON.parse(ot.horario_programado) : ot.horario_programado;
        if (Array.isArray(parsed)) return { rutina: parsed, excepciones: [], fecha_entrega: '' };
        return {
            rutina: parsed.rutina || DIAS_BASE,
            excepciones: parsed.excepciones || [],
            fecha_entrega: parsed.fecha_entrega || '' // 👈 Nuevo campo
        };
    };

    const [configuracion, setConfiguracion] = useState(parseInitialState());
    const [isSaving, setIsSaving] = useState(false);

    const handleRutinaChange = (index, field, value) => {
        const nuevaRutina = [...configuracion.rutina];
        nuevaRutina[index][field] = value;
        setConfiguracion({ ...configuracion, rutina: nuevaRutina });
    };

    const calcularHorasSemanales = () => {
        return configuracion.rutina.reduce((total, dia) => {
            if (!dia.habilitado) return total;
            const [hApertura, mApertura] = dia.apertura.split(':').map(Number);
            const [hCierre, mCierre] = dia.cierre.split(':').map(Number);
            const horasBrutas = (hCierre + mCierre / 60) - (hApertura + mApertura / 60);
            return total + Math.max(0, horasBrutas - Number(dia.colacion_horas));
        }, 0);
    };

    // ⚡ CALCULO INTELIGENTE: ¿Cuántas horas reales nos quedan?
    const calcularHorasRestantes = () => {
        if (!configuracion.fecha_entrega) return null;
        const ahora = new Date();
        const fechaLimite = new Date(`${configuracion.fecha_entrega}T18:00:00`); // Asumimos tope a las 18:00 de ese día
        if (ahora >= fechaLimite) return 0;
        return calcularHorasEfectivas(ahora, fechaLimite, configuracion);
    };

    const horasRestantes = calcularHorasRestantes();

    const agregarExcepcion = () => {
        const nuevaExcepcion = { fecha: new Date().toISOString().split('T')[0], motivo: '', habilitado: false, apertura: '00:00', cierre: '00:00', colacion_horas: 0 };
        setConfiguracion({ ...configuracion, excepciones: [...configuracion.excepciones, nuevaExcepcion] });
    };

    const handleExcepcionChange = (index, field, value) => {
        const nuevasExcepciones = [...configuracion.excepciones];
        nuevasExcepciones[index][field] = value;
        setConfiguracion({ ...configuracion, excepciones: nuevasExcepciones });
    };

    const eliminarExcepcion = (index) => {
        setConfiguracion({ ...configuracion, excepciones: configuracion.excepciones.filter((_, i) => i !== index) });
    };

    const handleGuardar = async () => {
        const excepcionesIncompletas = configuracion.excepciones.some(e => !e.fecha || !e.motivo.trim());
        if (excepcionesIncompletas) return alert("Todas las excepciones deben tener una fecha y un motivo asignado.");

        setIsSaving(true);
        try {
            await api.patch(`/api/ordenes-trabajo/${ot.id}/horario`, { horario_programado: configuracion });
            alert("✅ Programación guardada exitosamente.");
            if (onUpdate) onUpdate();
        } catch (error) {
            alert("Error al guardar la configuración.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-dark-bg border border-dark-border rounded-xl p-6 animate-fadeIn space-y-8">

            {/* CABECERA CON FECHA DE ENTREGA Y MÉTRICAS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-surface p-4 rounded-lg border border-dark-border">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Target className="text-brand" size={20} /> Planificación OT {ot.folio}
                    </h3>
                    <p className="text-xs text-txt-secondary mt-1">Configura la rutina, la fecha límite y descuenta los feriados.</p>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    {/* NUEVO: FECHA DE ENTREGA */}
                    <div className="bg-dark-bg border border-dark-border px-4 py-2 rounded-lg text-center flex-1 md:flex-none">
                        <p className="text-[10px] text-txt-secondary font-bold uppercase tracking-wider mb-1">Fecha Entrega</p>
                        <input
                            type="date"
                            value={configuracion.fecha_entrega}
                            onChange={(e) => setConfiguracion({ ...configuracion, fecha_entrega: e.target.value })}
                            disabled={readOnly}
                            className={`bg-transparent text-sm font-bold text-white outline-none ${readOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                        />
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-lg text-center flex-1 md:flex-none">
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-0.5">Semana Base</p>
                        <p className="text-lg font-bold text-white font-mono">{calcularHorasSemanales().toFixed(1)} <span className="text-xs text-txt-secondary">HH</span></p>
                    </div>

                    {/* NUEVO: HORAS HÁBILES RESTANTES */}
                    {horasRestantes !== null && (
                        <div className={`border px-4 py-2 rounded-lg text-center flex-1 md:flex-none ${horasRestantes < 15 ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${horasRestantes < 15 ? 'text-red-400' : 'text-emerald-400'}`}>Real Restante</p>
                            <p className="text-lg font-bold text-white font-mono">{horasRestantes.toFixed(1)} <span className="text-xs text-txt-secondary">HH</span></p>
                        </div>
                    )}
                </div>
            </div>

            {/* SECCIÓN 1: RUTINA (Mismo código anterior) */}
            <div>
                <h4 className="text-sm font-bold text-white mb-3">Rutina Semanal</h4>
                <div className="space-y-2">
                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold text-txt-secondary uppercase tracking-wider border-b border-dark-border mb-2">
                        <div className="col-span-3">Día de la Semana</div>
                        <div className="col-span-2 text-center">Estado</div>
                        <div className="col-span-2 text-center">Inicio</div>
                        <div className="col-span-2 text-center">Fin</div>
                        <div className="col-span-3 text-center">Colación (Hrs)</div>
                    </div>
                    {configuracion.rutina.map((dia, index) => (
                        <div key={dia.dia} className={`grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-3 rounded-lg border transition-colors ${dia.habilitado ? 'bg-dark-surface border-dark-border' : 'bg-dark-bg border-transparent opacity-50 grayscale'}`}>
                            <div className="col-span-3 font-medium text-white">{dia.nombre}</div>
                            <div className="col-span-2 flex justify-center">
                                <label className={`relative inline-flex items-center ${readOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                                    <input type="checkbox" className="sr-only peer" checked={dia.habilitado} disabled={readOnly} onChange={(e) => handleRutinaChange(index, 'habilitado', e.target.checked)} />
                                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>
                            <div className="col-span-2"><input type="time" disabled={!dia.habilitado || readOnly} value={dia.apertura} onChange={(e) => handleRutinaChange(index, 'apertura', e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded p-1.5 text-sm text-center text-white focus:border-blue-500 outline-none disabled:cursor-not-allowed" /></div>
                            <div className="col-span-2"><input type="time" disabled={!dia.habilitado || readOnly} value={dia.cierre} onChange={(e) => handleRutinaChange(index, 'cierre', e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded p-1.5 text-sm text-center text-white focus:border-blue-500 outline-none disabled:cursor-not-allowed" /></div>
                            <div className="col-span-3 flex justify-center"><input type="number" min="0" step="0.5" disabled={!dia.habilitado || readOnly} value={dia.colacion_horas} onChange={(e) => handleRutinaChange(index, 'colacion_horas', e.target.value)} className="w-20 bg-dark-bg border border-dark-border rounded p-1.5 text-sm text-center text-white focus:border-blue-500 outline-none disabled:cursor-not-allowed" /></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SECCIÓN 2: EXCEPCIONES Y FERIADOS (Mismo código anterior) */}
            <div className="pt-6 border-t border-dark-border">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2"><Calendar className="text-amber-400" size={18} /> Excepciones / Feriados Específicos</h4>
                        <p className="text-[11px] text-txt-secondary mt-1">Sobreescribe la rutina base para fechas puntuales (ej. Feriados, cortes de luz).</p>
                    </div>
                    {!readOnly && (
                        <button onClick={agregarExcepcion} className="text-xs bg-dark-surface border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 px-3 py-1.5 rounded flex items-center gap-1 transition-colors">
                            <Plus size={14} /> Añadir Fecha
                        </button>
                    )}
                </div>
                {configuracion.excepciones.length === 0 ? (
                    <div className="text-center p-6 border border-dashed border-dark-border rounded-lg text-txt-secondary text-xs">No hay excepciones programadas para esta OT.</div>
                ) : (
                    <div className="space-y-3">
                        {configuracion.excepciones.map((exc, index) => (
                            <div key={index} className={`grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 rounded-lg border ${exc.habilitado ? 'bg-dark-surface border-blue-500/30' : 'bg-red-500/5 border-red-500/20'}`}>
                                <div className="col-span-2"><input type="date" value={exc.fecha} disabled={readOnly} onChange={(e) => handleExcepcionChange(index, 'fecha', e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded p-1.5 text-xs text-white outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed" /></div>
                                <div className="col-span-3"><input type="text" placeholder="Motivo (ej. Feriado Legal)" disabled={readOnly} value={exc.motivo} onChange={(e) => handleExcepcionChange(index, 'motivo', e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded p-1.5 text-xs text-white outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed" /></div>
                                <div className="col-span-2 flex justify-center items-center gap-2">
                                    <span className="text-[10px] text-txt-secondary">¿Se trabaja?</span>
                                    <label className={`relative inline-flex items-center ${readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                        <input type="checkbox" className="sr-only peer" checked={exc.habilitado} disabled={readOnly} onChange={(e) => handleExcepcionChange(index, 'habilitado', e.target.checked)} />
                                        <div className="w-7 h-4 bg-red-500/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>
                                <div className="col-span-4 flex items-center gap-2">
                                    <input type="time" disabled={!exc.habilitado || readOnly} value={exc.apertura} onChange={(e) => handleExcepcionChange(index, 'apertura', e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded p-1.5 text-xs text-center text-white outline-none disabled:opacity-30 disabled:cursor-not-allowed" />
                                    <span className="text-txt-secondary">-</span>
                                    <input type="time" disabled={!exc.habilitado || readOnly} value={exc.cierre} onChange={(e) => handleExcepcionChange(index, 'cierre', e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded p-1.5 text-xs text-center text-white outline-none disabled:opacity-30 disabled:cursor-not-allowed" />
                                    <input type="number" step="0.5" disabled={!exc.habilitado || readOnly} title="Colación" value={exc.colacion_horas} onChange={(e) => handleExcepcionChange(index, 'colacion_horas', e.target.value)} className="w-16 bg-dark-bg border border-dark-border rounded p-1.5 text-xs text-center text-white outline-none disabled:opacity-30 disabled:cursor-not-allowed" />
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    {!readOnly && (
                                        <button onClick={() => eliminarExcepcion(index)} className="text-red-400 hover:bg-red-500/20 p-1.5 rounded transition-colors"><Trash2 size={16} /></button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {!readOnly && (
                <div className="mt-6 flex justify-end pt-4">
                    <button onClick={handleGuardar} disabled={isSaving} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-colors">
                        <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Programación'}
                    </button>
                </div>
            )}
        </div>
    );
}