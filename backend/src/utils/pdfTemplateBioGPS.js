const fs = require('fs');
const path = require('path');

const generarTemplateCotizacionBioGPS = (cotizacion) => {
    const {
        folio,
        fecha_emision,
        validez_dias,
        entidad,
        detalle_cotizaciones,
        monto_neto,
        monto_iva,
        monto_total,
        empresa,
        observaciones
    } = cotizacion;

    const fmt = (n) => "$" + Math.round(Number(n)).toLocaleString('es-CL');
    const formatoFecha = (fecha) => {
        const d = new Date(fecha);
        return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const fechaVencimiento = new Date(fecha_emision);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + (validez_dias || 15));

    const colorPrimario = '#f1f5f9';
    const colorBorde = '#e2e8f0';
    const colorTextoValores = '#1e293b';

    // --- PROCESAMIENTO DINÁMICO DE PRODUCTOS E IMÁGENES ---
    const filasHtml = (detalle_cotizaciones || []).map((item, index) => {
        const bgRow = index % 2 === 0 ? '#ffffff' : '#f8fafc';

        let htmlImagen = `<div style="width:60px; height:60px; background:#e2e8f0; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:10px; text-align:center; margin: 0 auto;">Sin<br>Foto</div>`;

        // Verificamos si el producto tiene imagen
        if (item.producto && item.producto.imagen_url) {
            try {
                // Si es una ruta relativa en public/uploads
                const imgProductoPath = path.join(__dirname, '../../../public/uploads', item.producto.imagen_url);
                
                if (fs.existsSync(imgProductoPath)) {
                    const imgBase64 = fs.readFileSync(imgProductoPath).toString('base64');
                    let ext = path.extname(item.producto.imagen_url).replace('.', '').toLowerCase();
                    if (ext === 'jpg') ext = 'jpeg';
                    htmlImagen = `<img src="data:image/${ext};base64,${imgBase64}" style="max-height: 60px; max-width: 60px; border-radius: 4px; display: block; margin: 0 auto;">`;
                }
            } catch (error) {
                console.error(`Error cargando imagen del producto:`, error.message);
            }
        }

        return `
        <tr style="background-color: ${bgRow};">
            <td style="padding: 12px; border-bottom: 1px solid ${colorBorde}; text-align:center; vertical-align:middle; width: 8%;">
                ${htmlImagen}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid ${colorBorde}; vertical-align:middle; width: 45%;">
                <strong style="color: ${colorTextoValores}; font-size: 13px;">${item.descripcion || 'Servicio'}</strong>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid ${colorBorde}; text-align:center; width: 10%;">${Number(item.cantidad)}</td>
            <td style="padding: 12px; border-bottom: 1px solid ${colorBorde}; text-align:right; color: ${colorTextoValores}; width: 15%;">${fmt(item.unitario)}</td>
            <td style="padding: 12px; border-bottom: 1px solid ${colorBorde}; text-align:center; color: #ef4444; width: 8%;">-</td>
            <td style="padding: 12px; border-bottom: 1px solid ${colorBorde}; text-align:right; font-weight:bold; color: ${colorTextoValores}; width: 14%;">${fmt(item.total)}</td>
        </tr>`;
    }).join('');

    let imgLogo = '';
    try {
        // Intentamos usar el logo de biogps si existe físicamente, si no usamos el de la empresa del objeto
        const logoPath = path.join(__dirname, '../../../public/uploads/logo-biogps.png');
        if (fs.existsSync(logoPath)) {
            const logoBase64 = fs.readFileSync(logoPath).toString('base64');
            imgLogo = `<img src="data:image/png;base64,${logoBase64}" style="height:110px; width:auto; display:block;">`;
        } else if (empresa && empresa.logo_url) {
             imgLogo = `<img src="${empresa.logo_url}" style="height:110px; width:auto; display:block;">`;
        } else {
            imgLogo = `<div style="height:110px; width:220px; background:#f1f5f9; text-align:center; color:#94a3b8; font-size:12px; padding-top:45px; border-radius:4px; box-sizing: border-box;">${empresa?.alias || 'BioGPS'}</div>`;
        }
    } catch (error) {
        console.error("Error cargando el logo para el PDF:", error.message);
        imgLogo = `<div style="height:110px; width:220px; background:#f1f5f9; text-align:center; color:#94a3b8; font-size:12px; padding-top:45px; border-radius:4px; box-sizing: border-box;">Sin Logo</div>`;
    }

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #334155; font-size: 13px; }
            #wrapper { padding: 30px; }
            
            header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid ${colorBorde}; }
            .header-left { width: 60%; } 
            .header-right { width: 260px; flex-shrink: 0; } 
            
            .box-folio { border: 2px solid ${colorBorde}; border-radius: 8px; overflow: hidden; width: 100%; }
            .folio-head { background: #1e293b; color: white; padding: 8px; text-align: center; text-transform: uppercase; font-weight: bold; font-size: 11px; letter-spacing: 1px; }
            .folio-body { padding: 12px; text-align: center; }
            .folio-body h1 { margin: 0; font-size: 26px; color: #ef4444; font-weight: 900; line-height: 1; }
            .folio-dates { background: ${colorPrimario}; padding: 8px 12px; font-size: 11px; display: grid; grid-template-columns: 1fr 1fr; gap: 5px; border-top: 1px solid ${colorBorde}; }
            
            .section-client { display: flex; gap: 20px; margin-bottom: 25px; }
            .box-client { flex: 1; border: 1px solid ${colorBorde}; border-radius: 8px; padding: 15px; }
            .box-client h3 { margin: 0 0 10px 0; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
            .client-item { margin-bottom: 3px; }
            .client-item strong { color: #1e293b; margin-right: 5px; }

            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; }
            thead th { background: ${colorPrimario}; color: #475569; padding: 12px; text-transform: uppercase; font-size: 10px; font-weight: 700; border-bottom: 2px solid ${colorBorde}; border-top: 1px solid ${colorBorde}; text-align: left; }
            
            .totals-container { display: flex; justify-content: flex-end; margin-bottom: 30px; }
            .totals-box { width: 280px; border: 1px solid ${colorBorde}; border-radius: 8px; padding: 10px; }
            .row-total { display: flex; justify-content: space-between; padding: 4px 0; }
            .row-total.grand { border-top: 2px solid ${colorBorde}; margin-top: 8px; padding-top: 8px; font-weight: bold; font-size: 15px; color: #1e293b; }

            .observations-box { background: ${colorPrimario}; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
            .observations-box h4 { margin: 0 0 8px 0; color: #64748b; font-size: 11px; text-transform: uppercase; }

            footer { text-align: center; color: #94a3b8; font-size: 11px; margin-top: 40px; border-top: 1px solid ${colorBorde}; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div id="wrapper">
            <header>
                <div class="header-left">
                    ${imgLogo}
                </div>
                <div class="header-right">
                    <div class="box-folio">
                        <div class="folio-head">Propuesta Comercial</div>
                        <div class="folio-body">
                            <h1>${folio || 'N° ---'}</h1>
                        </div>
                        <div class="folio-dates">
                            <div>EMISIÓN:<br><strong>${formatoFecha(fecha_emision)}</strong></div>
                            <div>VÁLIDA HASTA:<br><strong>${formatoFecha(fechaVencimiento)}</strong></div>
                        </div>
                    </div>
                </div>
            </header>

            <div class="section-client">
                <div class="box-client">
                    <h3>Cliente</h3>
                    <div class="client-item"><strong>Razón Social:</strong> ${entidad?.nombre || '---'}</div>
                    <div class="client-item"><strong>RUT/ID:</strong> ${entidad?.rut || 'Sin ID'}</div>
                    <div class="client-item"><strong>Giro:</strong> ${entidad?.giro || 'Servicios'}</div>
                </div>
                <div class="box-client">
                    <h3>Despacho / Contacto</h3>
                    <div class="client-item"><strong>Dirección:</strong> ${entidad?.direccion || 'No registrada'}</div>
                    <div class="client-item"><strong>Ciudad:</strong> ${entidad?.ciudad || '---'}</div>
                    <div class="client-item"><strong>Email:</strong> ${entidad?.email || 'No registrado'}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th width="8%" style="text-align:center">Imagen</th>
                        <th width="45%">Descripción / Servicio</th>
                        <th width="10%" style="text-align:center">Cant.</th>
                        <th width="15%" style="text-align:right">Precio Unit.</th>
                        <th width="8%" style="text-align:center">Desc.</th>
                        <th width="14%" style="text-align:right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasHtml}
                </tbody>
            </table>

            <div class="totals-container">
                <div class="totals-box">
                    <div class="row-total"><span>Subtotal Neto:</span> <span>${fmt(monto_neto)}</span></div>
                    <div class="row-total"><span>IVA (19%):</span> <span>${fmt(monto_iva)}</span></div>
                    <div class="row-total grand"><span>TOTAL CL:</span> <span>${fmt(monto_total)}</span></div>
                </div>
            </div>

            ${observaciones ? `
            <div class="observations-box">
                <h4>Observaciones y Condiciones</h4>
                <div style="line-height:1.5;">${observaciones.replace(/\n/g, '<br>')}</div>
            </div>
            ` : ''}

            <footer>
                <p>Generado electrónicamente por BioManager Workspace.</p>
                <p>Esta propuesta comercial está sujeta a la vigencia indicada anteriormente.</p>
            </footer>
        </div>
    </body>
    </html>
    `;
};

module.exports = {
    generarTemplateCotizacionBioGPS
};