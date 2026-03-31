// backend/src/utils/pdfTemplates.js

const generarTemplateCotizacion = (cotizacion) => {
    // Formateador de moneda chilena
    const formatMoneda = (valor) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor || 0);
    const formatFecha = (fecha) => new Date(fecha).toLocaleDateString('es-CL');

    // Mapeo de ítems para la tabla
    const filasItems = cotizacion.detalle_cotizaciones.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eeeeee; color: #333333; font-size: 12px;">${item.descripcion}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center; color: #555555; font-size: 12px;">${Number(item.cantidad)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right; color: #555555; font-size: 12px;">${formatMoneda(item.unitario)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right; color: #111827; font-weight: bold; font-size: 12px;">${formatMoneda(item.total)}</td>
        </tr>
    `).join('');

    // HTML Completo
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Cotización ${cotizacion.folio}</title>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #333; background-color: #fff; }
            .container { width: 100%; max-width: 800px; margin: 0 auto; padding: 20px; box-sizing: border-box; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-placeholder { background-color: #1e293b; color: #38bdf8; padding: 15px 25px; font-size: 24px; font-weight: 900; border-radius: 8px; letter-spacing: 1px; }
            .company-info { text-align: right; font-size: 10px; color: #64748b; line-height: 1.5; }
            .company-info strong { color: #1e293b; font-size: 12px; }
            .doc-title { text-align: center; margin-bottom: 30px; }
            .doc-title h1 { margin: 0; color: #1e293b; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
            .doc-title p { margin: 5px 0 0 0; color: #2563eb; font-weight: bold; font-size: 14px; }
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 30px; background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .info-column { width: 48%; }
            .info-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; margin-bottom: 3px; }
            .info-value { font-size: 12px; color: #0f172a; font-weight: 500; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background-color: #1e293b; color: #ffffff; text-align: left; padding: 12px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
            th.center { text-align: center; }
            th.right { text-align: right; }
            .totals-container { display: flex; justify-content: flex-end; }
            .totals-box { width: 300px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; color: #64748b; }
            .total-row.final { border-top: 1px solid #cbd5e1; margin-top: 8px; padding-top: 10px; font-size: 16px; font-weight: 900; color: #2563eb; }
            .footer { margin-top: 40px; font-size: 10px; color: #64748b; line-height: 1.5; padding-top: 20px; border-top: 1px solid #e2e8f0; }
            .observaciones { background-color: #f1f5f9; padding: 15px; border-left: 4px solid #38bdf8; border-radius: 4px; font-size: 11px; color: #475569; margin-bottom: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo-placeholder">${cotizacion.empresa?.alias?.toUpperCase() || cotizacion.empresa?.nombre || 'BIOT'}</div>
                <div class="company-info">
                    <strong>${cotizacion.empresa?.nombre || 'BIOT SpA'}</strong><br>
                    ${cotizacion.empresa?.giro || 'Servicios y Mantenimiento Industrial'}<br>
                    RUT: ${cotizacion.empresa?.rut || '76.xxx.xxx-K'}<br>
                    ${cotizacion.empresa?.email_contacto || 'contacto@biot.cl'} | ${cotizacion.empresa?.telefono || '+56 9 1234 5678'}
                </div>
            </div>

            <div class="doc-title">
                <h1>Cotización Comercial</h1>
                <p>Folio: ${cotizacion.folio}</p>
            </div>

            <div class="info-grid">
                <div class="info-column">
                    <div class="info-label">Cliente</div>
                    <div class="info-value">${cotizacion.entidad?.nombre || cotizacion.cliente_nombre}</div>
                    <div class="info-label">RUT</div>
                    <div class="info-value">${cotizacion.entidad?.rut || '---'}</div>
                    <div class="info-label">Email</div>
                    <div class="info-value">${cotizacion.entidad?.email || '---'}</div>
                </div>
                <div class="info-column">
                    <div class="info-label">Fecha de Emisión</div>
                    <div class="info-value">${formatFecha(cotizacion.fecha_emision)}</div>
                    <div class="info-label">Validez de Oferta</div>
                    <div class="info-value">${cotizacion.validez_dias} días corridos</div>
                    <div class="info-label">Moneda</div>
                    <div class="info-value">Pesos Chilenos (CLP)</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Descripción del Servicio / Producto</th>
                        <th class="center" style="width: 10%;">Cant.</th>
                        <th class="right" style="width: 20%;">V. Unitario</th>
                        <th class="right" style="width: 20%;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasItems}
                </tbody>
            </table>

            ${cotizacion.observaciones ? `
            <div class="observaciones">
                <strong>Observaciones / Condiciones Comerciales:</strong><br><br>
                ${cotizacion.observaciones.replace(/\n/g, '<br>')}
            </div>
            ` : ''}

            <div class="totals-container">
                <div class="totals-box">
                    <div class="total-row">
                        <span>Monto Neto:</span>
                        <span>${formatMoneda(cotizacion.monto_neto)}</span>
                    </div>
                    <div class="total-row">
                        <span>IVA (19%):</span>
                        <span>${formatMoneda(cotizacion.monto_iva)}</span>
                    </div>
                    <div class="total-row final">
                        <span>TOTAL:</span>
                        <span>${formatMoneda(cotizacion.monto_total)}</span>
                    </div>
                </div>
            </div>

            <div class="footer">
                Documento generado automáticamente por BIOT ERP.<br>
                Cualquier duda o consulta respecto a este documento, por favor responder al correo remitente.
            </div>
        </div>
    </body>
    </html>
    `;
};

const generarTemplateOT = (ot) => {
    const formatFecha = (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-CL') : '---';

    // Generar las filas de las tareas (Ruta de Fabricación)
    const filasTareas = ot.tareas?.length > 0
        ? ot.tareas.map((tarea, index) => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center; color: #555555; font-size: 12px; font-weight: bold;">${index + 1}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eeeeee; color: #333333; font-size: 12px; font-weight: bold;">${tarea.nombre}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eeeeee; color: #555555; font-size: 12px;">${tarea.tipo || 'General'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eeeeee; color: #555555; font-size: 12px; font-family: monospace;">
                    ${tarea.operario_id ? (tarea.operario?.nombre || 'Asignado') : 'Sin asignar'}
                </td>
            </tr>
        `).join('')
        : '<tr><td colspan="4" style="padding: 15px; text-align: center; color: #999;">No hay tareas detalladas en la ruta de fabricación.</td></tr>';

    // Generar las filas de los materiales (Alcance)
    const filasMateriales = ot.cotizacion?.detalle_cotizaciones?.length > 0
        ? ot.cotizacion.detalle_cotizaciones.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eeeeee; color: #2563eb; font-size: 11px; font-family: monospace; font-weight: bold;">
                    [${item.producto?.codigo || item.operario?.codigo || item.equipo?.codigo || 'GENÉRICO'}]
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #eeeeee; color: #333333; font-size: 11px;">${item.descripcion}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eeeeee; text-align: center; color: #555555; font-size: 11px; font-weight: bold;">${Number(item.cantidad)}</td>
            </tr>
        `).join('')
        : '<tr><td colspan="3" style="padding: 15px; text-align: center; color: #999;">Sin alcance definido.</td></tr>';

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Orden de Trabajo ${ot.folio}</title>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #333; background-color: #fff; }
            .container { width: 100%; max-width: 800px; margin: 0 auto; padding: 20px; box-sizing: border-box; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #f59e0b; padding-bottom: 15px; margin-bottom: 25px; }
            .logo-placeholder { background-color: #1e293b; color: #f59e0b; padding: 15px 25px; font-size: 24px; font-weight: 900; border-radius: 8px; letter-spacing: 1px; }
            .ot-badge { background-color: #fef3c7; color: #b45309; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold; border: 1px solid #fde68a; }
            .doc-title { text-align: center; margin-bottom: 25px; }
            .doc-title h1 { margin: 0; color: #1e293b; font-size: 26px; text-transform: uppercase; letter-spacing: 1px; }
            .doc-title p { margin: 5px 0 0 0; color: #f59e0b; font-weight: bold; font-size: 16px; font-family: monospace; }
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 25px; border: 2px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
            .info-column { width: 50%; padding: 15px; background-color: #f8fafc; }
            .info-column:first-child { border-right: 2px solid #e2e8f0; }
            .info-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; margin-bottom: 3px; }
            .info-value { font-size: 13px; color: #0f172a; font-weight: bold; margin-bottom: 12px; }
            .section-title { font-size: 14px; font-weight: bold; color: #1e293b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background-color: #1e293b; color: #ffffff; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
            th.center { text-align: center; }
            .footer-alert { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; font-size: 11px; color: #92400e; margin-top: 40px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo-placeholder">${ot.empresa?.alias?.toUpperCase() || ot.empresa?.nombre || 'BIOT'}</div>
                <div class="ot-badge">DOCUMENTO INTERNO TALLER</div>
            </div>

            <div class="doc-title">
                <h1>Orden de Trabajo</h1>
                <p>${ot.folio}</p>
            </div>

            <div class="info-grid">
                <div class="info-column">
                    <div class="info-label">Cliente / Proyecto</div>
                    <div class="info-value">${ot.cliente_nombre || 'Interno'}</div>
                    <div class="info-label">Cotización Origen</div>
                    <div class="info-value">${ot.cotizacion?.folio || 'OT Directa'}</div>
                </div>
                <div class="info-column">
                    <div class="info-label">Fecha Emisión OT</div>
                    <div class="info-value">${formatFecha(ot.fecha_inicio)}</div>
                    <div class="info-label">Estado Actual</div>
                    <div class="info-value" style="text-transform: uppercase; color: #2563eb;">${ot.estado}</div>
                </div>
            </div>

            <div class="section-title">📦 Alcance del Proyecto (Materiales / Servicios)</div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 15%;">Código</th>
                        <th style="width: 70%;">Descripción</th>
                        <th class="center" style="width: 15%;">Cant.</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasMateriales}
                </tbody>
            </table>

            <div class="section-title">⚙️ Ruta de Fabricación (Tareas)</div>
            <table>
                <thead>
                    <tr>
                        <th class="center" style="width: 10%;">N°</th>
                        <th style="width: 45%;">Tarea</th>
                        <th style="width: 20%;">Tipo</th>
                        <th style="width: 25%;">Responsable</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasTareas}
                </tbody>
            </table>

            <div class="footer-alert">
                <strong>ATENCIÓN:</strong> Este es un documento de uso exclusivamente operativo. Los consumos de materiales y registros de tiempos (HH/HM) deben ser ingresados en el sistema ERP en tiempo real a medida que avanza la producción.
            </div>
        </div>
    </body>
    </html>
    `;
};

module.exports = {
    generarTemplateCotizacion,
    generarTemplateOT
};