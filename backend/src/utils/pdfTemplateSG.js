// backend/src/utils/pdfTemplateSG.js

const generarTemplateCotizacionSG = (cotizacion) => {
    // Formateadores
    const formatMoneda = (valor) => new Intl.NumberFormat('es-CL', { 
        style: 'decimal', 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
    }).format(valor || 0);

    const formatFecha = (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-CL') : '---';

    // Mapeo de ítems para la tabla
    const filasItems = cotizacion.detalle_cotizaciones.map((item, index) => `
        <tr>
            <td style="width: 30px; text-align: center; border: 1px solid #000; padding: 4px;">${index + 1}</td>
            <td style="text-align: left; border: 1px solid #000; padding: 4px;">${item.descripcion}</td>
            <td style="width: 60px; text-align: center; border: 1px solid #000; padding: 4px;">${Number(item.cantidad)}</td>
            <td style="width: 60px; text-align: center; border: 1px solid #000; padding: 4px;">${item.producto?.unidad_base || 'unds'}</td>
            <td style="width: 110px; border: 1px solid #000; padding: 4px;">
                <div style="display: flex; justify-content: space-between;">
                    <span>$</span><span>${formatMoneda(item.unitario)}</span>
                </div>
            </td>
            <td style="width: 110px; border: 1px solid #000; padding: 4px;">
                <div style="display: flex; justify-content: space-between;">
                    <span>$</span><span>${formatMoneda(item.total)}</span>
                </div>
            </td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            @page {
                size: letter;
                margin: 10mm;
            }
            body {
                font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
                margin: 0;
                padding: 10px;
                font-size: 11px;
                color: #333;
                background-color: #fff;
            }

            .container {
                width: 100%;
                border: 1px solid #999;
            }

            /* HEADER SECTION */
            .header-top {
                display: flex;
                align-items: center;
                border-bottom: 3px solid #f0a500;
                padding: 5px 10px;
            }
            .header-logo {
                flex: 0 0 100px;
            }
            .header-logo img {
                max-width: 80px;
                max-height: 80px;
            }
            .header-company {
                flex: 1;
                text-align: center;
                font-weight: bold;
                font-style: italic;
                font-size: 14px;
                color: #444;
                text-transform: uppercase;
            }
            .header-ref {
                flex: 0 0 200px;
                text-align: right;
            }
            .header-ref .doc-type {
                font-weight: bold;
                font-size: 13px;
            }
            .header-ref .doc-num {
                font-weight: bold;
                padding-left: 5px;
            }
            .solicitud-box {
                margin-top: 5px;
                border: 1px solid blue;
                border-radius: 15px;
                padding: 2px 10px;
                display: inline-block;
                font-size: 11px;
                color: #333;
            }
            .solicitud-box span {
                color: brown;
                font-weight: bold;
            }

            /* FECHA ROW */
            .date-row {
                border-bottom: 1.5px solid #000;
                display: flex;
                align-items: center;
                width: 100%;
            }
            .date-label {
                background-color: #eee;
                padding: 5px 10px;
                font-weight: bold;
                border-right: 1.5px solid #000;
                width: 80px;
            }
            .date-value {
                padding: 5px 10px;
                flex: 1;
            }

            /* INFO SECTION */
            .info-grid {
                display: flex;
                border-bottom: 2px solid #000;
            }
            .info-left {
                flex: 1;
                border-right: 1.5px solid #000;
                padding: 5px 10px;
            }
            .info-right {
                flex: 0 0 250px;
                padding: 0 10px 5px 10px; /* 👈 Quitamos el padding superior facilitando el "borde" */
                text-align: center;
                position: relative;
            }
            .info-row {
                display: flex;
                margin-bottom: 2px;
            }
            .info-label {
                width: 80px;
                font-weight: bold;
            }
            .info-dots {
                width: 15px;
                font-weight: bold;
            }
            .info-val {
                flex: 1;
            }

            /* SIGNATURE AREA */
            .signature-area {
                height: 100px;
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
                align-items: center;
                position: relative; /* 👈 Fundamental para el posicionamiento absoluto de la firma */
            }
            .signature-stamp {
                position: absolute;
                top: 5px;   /* 👈 Pegado al borde superior del div */
                left: 50%;
                transform: translateX(-50%);
                width: 170px; /* 👈 Un poco más grande */
                max-height: 90px;
                opacity: 0.95;
                z-index: 1;
                object-fit: contain;
            }
            .firm {
                font-weight: bold;
                font-size: 10px;
                border-top: 1px solid #000;
                padding-top: 2px;
                width: 180px;
                position: relative; /* 👈 Para que el z-index funcione */
                z-index: 2;         /* 👈 Sobre la firma */
            }
            .preparada-por {
                font-size: 9px;
                margin-top: 5px;
                color: #555;
            }

            /* SECTION HEADER ORANGE */
            .section-header {
                background-color: #f0a500;
                border-bottom: 1.5px solid #000;
                padding: 2px 10px;
                font-weight: bold;
                text-align: right;
                font-size: 10px;
            }

            /* CLIENT/GENERAL INFO */
            .client-info, .nav-info {
                padding: 5px 10px;
                border-bottom: 1.5px solid #000;
            }

            /* TABLE STYLES */
            table {
                width: 100%;
                border-collapse: collapse;
            }
            th {
                background-color: #e59400;
                color: black;
                border: 1px solid #000;
                padding: 4px;
                font-size: 10px;
                text-transform: uppercase;
            }
            
            /* FOOTER / TOTALS */
            .footer-container {
                display: flex;
                border-top: 2px solid #000;
            }
            .footer-left {
                flex: 1;
            }
            .footer-right {
                flex: 0 0 300px;
            }
            .total-row {
                display: flex;
                border-bottom: 1px solid #000;
            }
            .total-label {
                flex: 1;
                background-color: #f0a500;
                border-right: 1px solid #000;
                border-left: 1px solid #000;
                padding: 4px 10px;
                font-weight: bold;
                text-align: right;
            }
            .total-val {
                width: 120px;
                padding: 4px 10px;
                text-align: right;
                font-weight: bold;
                border-right: 1px solid #000;
                display: flex;
                justify-content: space-between;
            }
        </style>
    </head>
    <body>

    <div class="container">

        <!-- HEADER -->
        <div class="header-top">
            <div class="header-logo">
                <img src="${cotizacion.empresa?.logo_url || cotizacion.empresa?.imagen_url || 'logo_sg.png'}" alt="Logo">
            </div>
            <div class="header-company">
                ${cotizacion.empresa?.nombre || 'Maestranza SG LTDA'}
            </div>
            <div class="header-ref">
                <div><span class="doc-type">COTIZACIÓN</span> <span class="doc-num">${cotizacion.folio || '---'}</span></div>
                <div class="solicitud-box">
                    Solicitud de Cotización: <span>${cotizacion.solicitud_cotizacion || cotizacion.folio_externo || '---'}</span>
                </div>
            </div>
        </div>

        <!-- FECHA -->
        <div class="date-row">
            <div class="date-label">FECHA</div>
            <div class="date-value">${formatFecha(cotizacion.fecha_emision)}</div>
        </div>

        <!-- INFO BLOCK 1 -->
        <div class="info-grid">
            <div class="info-left">
                <div class="info-row"><div class="info-label">NOMBRE</div><div class="info-dots">:</div><div class="info-val">${cotizacion.empresa?.nombre || '---'}</div></div>
                <div class="info-row"><div class="info-label">RUT</div><div class="info-dots">:</div><div class="info-val">${cotizacion.empresa?.rut || '---'}</div></div>
                <div class="info-row"><div class="info-label">DIRECCION</div><div class="info-dots">:</div><div class="info-val">${cotizacion.empresa?.direccion || '---'}</div></div>
                <div class="info-row"><div class="info-label">GIRO</div><div class="info-dots">:</div><div class="info-val">${cotizacion.empresa?.giro || '---'}</div></div>
                <div class="info-row"><div class="info-label">TELEFONO</div><div class="info-dots">:</div><div class="info-val">${cotizacion.empresa?.telefono || '---'}</div></div>
                <div class="info-row"><div class="info-label">E-MAIL</div><div class="info-dots">:</div><div class="info-val">${cotizacion.empresa?.email_contacto || '---'}</div></div>
            </div>
            <div class="info-right">
                <!-- Signature Area -->
                <div class="signature-area">
                    ${(cotizacion.usuario?.firma_url || cotizacion.firma_url) ? `<img src="${cotizacion.usuario?.firma_url || cotizacion.firma_url}" class="signature-stamp" alt="Firma">` : ''}
                    <div class="firm">
                        ${cotizacion.usuario?.nombre?.toUpperCase() || 'SERGIO GUZMÁN A.'}<br>
                        ${cotizacion.usuario?.cargo || 'GERENTE GENERAL'}
                    </div>
                    <div class="preparada-por">PREPARADA POR</div>
                </div>
            </div>
        </div>

        <!-- CLIENT SECTION -->
        <div class="section-header">CLIENTE</div>
        <div class="client-info">
            <div class="info-row"><div class="info-label">NOMBRE</div><div class="info-dots">:</div><div class="info-val">${cotizacion.entidad?.nombre || cotizacion.cliente_nombre || '---'}</div></div>
            <div class="info-row"><div class="info-label">RUT</div><div class="info-dots">:</div><div class="info-val">${cotizacion.entidad?.rut || '---'}</div></div>
            <div class="info-row"><div class="info-label">DIRECCION</div><div class="info-dots">:</div><div class="info-val">${cotizacion.entidad?.direccion || '---'}</div></div>
            <div class="info-row"><div class="info-label">GIRO</div><div class="info-dots">:</div><div class="info-val">${cotizacion.entidad?.giro || '---'}</div></div>
            <div class="info-row"><div class="info-label">CIUDAD</div><div class="info-dots">:</div><div class="info-val">${cotizacion.entidad?.ciudad || '---'}</div></div>
            <div class="info-row"><div class="info-label">TELEFONO</div><div class="info-dots">:</div><div class="info-val">${cotizacion.entidad?.telefono || '---'}</div></div>
            <div class="info-row"><div class="info-label">CONTACTO</div><div class="info-dots">:</div><div class="info-val">${cotizacion.entidad?.contacto_nombre || '---'}</div></div>
            <div class="info-row"><div class="info-label">E-MAIL</div><div class="info-dots">:</div><div class="info-val">${cotizacion.entidad?.email || '---'}</div></div>
        </div>

        <!-- NAVIGATION INFO -->
        <div class="nav-info">
            <div class="info-row">
                <div class="info-label">${cotizacion.empresa?.modulo_naves_activo ? 'NAVE' : 'NAVE / EQUIPO'}</div>
                <div class="info-dots">:</div>
                <div class="info-val">${cotizacion.nave?.nombre || cotizacion.nave_equipo || '---'}</div>
            </div>
            <div style="margin-top: 5px;">
                <div class="info-row">
                    <div class="info-label" style="width: 100px;">DESCRIPCION GENERAL</div>
                    <div class="info-dots">:</div>
                    <div class="info-val">${cotizacion.descripcion_general || cotizacion.observaciones || '---'}</div>
                </div>
            </div>
        </div>

        <!-- TABLE -->
        <table>
            <thead>
                <tr>
                    <th style="width: 30px;">ITEM</th>
                    <th>DESCRIPCION</th>
                    <th style="width: 60px;">CANTIDAD</th>
                    <th style="width: 60px;">UNIDAD</th>
                    <th style="width: 110px;">VALOR UNITARIO</th>
                    <th style="width: 110px;">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                ${filasItems}
            </tbody>
        </table>

        <!-- FOOTER/TOTALS -->
        <div class="footer-container">
            <div class="footer-left">
                <div style="background-color: #f0a500; border-bottom: 1px solid #000; padding: 2px 10px; font-weight: bold;">CONDICIONES DE VENTA</div>
                <div style="padding: 5px 10px;">
                    <div class="info-row"><div class="info-label">PLAZO DE ENTREGA</div><div class="info-dots">:</div><div class="info-val">${cotizacion.plazo_entrega || '-'}</div></div>
                    <div class="info-row"><div class="info-label">VALIDEZ COTIZACION</div><div class="info-dots">:</div><div class="info-val">${cotizacion.validez_dias || 5} días</div></div>
                </div>
            </div>
            <div class="footer-right">
                <div class="total-row">
                    <div class="total-label">TOTAL NETO</div>
                    <div class="total-val"><span>$</span><span>${formatMoneda(cotizacion.monto_neto)}</span></div>
                </div>
                <div class="total-row">
                    <div class="total-label">IVA 19%</div>
                    <div class="total-val"><span>$</span><span>${formatMoneda(cotizacion.monto_iva)}</span></div>
                </div>
                <div class="total-row">
                    <div class="total-label">TOTAL</div>
                    <div class="total-val"><span>$</span><span>${formatMoneda(cotizacion.monto_total)}</span></div>
                </div>
            </div>
        </div>

    </div>

    </body>
    </html>
    `;
};

module.exports = {
    generarTemplateCotizacionSG
};
