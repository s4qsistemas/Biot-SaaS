const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const generarPdfBase64 = async (htmlContent) => {
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
        });

        await browser.close();

        // 🛑 PRUEBA DE ÁCIDO: Guardar el PDF físicamente en el servidor
        //const rutaPrueba = path.join(__dirname, '../../test_diagnostico.pdf');
        //fs.writeFileSync(rutaPrueba, pdfBuffer);
        //console.log("💾 ALERTA ARQUITECTO: Archivo físico guardado en:", rutaPrueba);

        // Convertir a Base64 puro para enviarlo a n8n
        //return pdfBuffer.toString('base64');
        // 🛑 PRUEBA DE ÁCIDO: Convertir a Base64 puro para enviarlo a n8n
        return Buffer.from(pdfBuffer).toString('base64');
    } catch (error) {
        console.error('Error interno al generar el PDF con Puppeteer:', error);
        throw new Error('No se pudo generar el documento PDF.');
    }
};

module.exports = {
    generarPdfBase64
};