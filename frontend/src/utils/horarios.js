/**
 * Calcula las horas hábiles efectivas entre dos fechas, 
 * cruzándolas con la matriz de horarios y excepciones de la OT.
 */
export const calcularHorasEfectivas = (fechaInicio, fechaFin, horarioJson) => {
    if (!fechaInicio || !fechaFin) return 0;

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (inicio >= fin) return 0;

    // 1. Normalizar la configuración de la OT
    let config = { rutina: [], excepciones: [] };
    if (horarioJson) {
        const parsed = typeof horarioJson === 'string' ? JSON.parse(horarioJson) : horarioJson;
        config = Array.isArray(parsed)
            ? { rutina: parsed, excepciones: [] }
            : { rutina: parsed.rutina || [], excepciones: parsed.excepciones || [] };
    }

    // Si no hay rutina cargada, creamos una de emergencia (L a V, 08:00 a 18:00)
    if (!config.rutina || config.rutina.length === 0) {
        config.rutina = [1, 2, 3, 4, 5].map(d => ({ dia: d, habilitado: true, apertura: '08:00', cierre: '18:00', colacion_horas: 1 }));
    }

    let totalHorasEfectivas = 0;

    // Iterador de días
    let current = new Date(inicio);
    current.setHours(0, 0, 0, 0);

    const endDia = new Date(fin);
    endDia.setHours(0, 0, 0, 0);

    // Recorremos día por día
    while (current <= endDia) {
        // ISO ajustado a zona horaria local para comparar con las excepciones
        const offset = current.getTimezoneOffset() * 60000;
        const fechaLocalString = new Date(current.getTime() - offset).toISOString().split('T')[0];
        const diaSemana = current.getDay();

        // 2. ¿Es una excepción o es rutina?
        const excepcion = config.excepciones?.find(e => e.fecha === fechaLocalString);
        const regla = excepcion || config.rutina?.find(r => r.dia === diaSemana);

        if (regla && regla.habilitado) {
            const [hApertura, mApertura] = regla.apertura.split(':').map(Number);
            const [hCierre, mCierre] = regla.cierre.split(':').map(Number);

            const turnoInicio = new Date(current);
            turnoInicio.setHours(hApertura, mApertura, 0, 0);

            const turnoFin = new Date(current);
            turnoFin.setHours(hCierre, mCierre, 0, 0);

            // 3. Calcular la intersección (Solapamiento)
            const overlapInicio = inicio > turnoInicio ? inicio : turnoInicio;
            const overlapFin = fin < turnoFin ? fin : turnoFin;

            if (overlapInicio < overlapFin) {
                // Convertir milisegundos a horas
                let horasTrabajadas = (overlapFin - overlapInicio) / (1000 * 60 * 60);

                // 4. Lógica de Colación: Si el trabajador cruzó la mitad del turno, se le descuenta colación
                const mitadTurno = new Date(turnoInicio.getTime() + (turnoFin - turnoInicio) / 2);
                if (overlapInicio <= mitadTurno && overlapFin >= mitadTurno) {
                    horasTrabajadas = Math.max(0, horasTrabajadas - Number(regla.colacion_horas));
                }

                totalHorasEfectivas += horasTrabajadas;
            }
        }

        // Avanzar al siguiente día
        current.setDate(current.getDate() + 1);
    }

    return Number(totalHorasEfectivas.toFixed(2));
};