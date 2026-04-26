const axios = require('axios');

// --- FUNCIÓN ORIGINAL (Cotizaciones y PDFs) ---
const enviarWebhookN8n = async (payload) => {
    try {
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        if (!webhookUrl) throw new Error("La variable N8N_WEBHOOK_URL no existe en el .env");

        const payloadParaConsola = {
            ...payload,
            pdf_base64: payload.pdf_base64
                ? payload.pdf_base64.substring(0, 50) + '... [RESTO DEL PDF OCULTO EN CONSOLA]'
                : 'SIN PDF'
        };

        console.log("\n==========================================");
        console.log("🚀 DISPARANDO WEBHOOK DE COTIZACIÓN A N8N...");
        console.log("URL Destino:", webhookUrl);
        console.log("📦 PAYLOAD ENVIADO:");
        console.log(JSON.stringify(payloadParaConsola, null, 2));

        const response = await axios.post(webhookUrl, payload);

        console.log("✅ RESPUESTA RECIBIDA DESDE N8N:");
        console.log("Status Code:", response.status);
        console.log("Data:", JSON.stringify(response.data, null, 2));
        console.log("==========================================\n");

        return response.data;
    } catch (error) {
        console.log("\n==========================================");
        console.error("❌ ERROR AL CONECTAR CON N8N (COTIZACIÓN):");
        if (error.response) {
            console.error("Status de Error:", error.response.status);
            console.error("Respuesta de n8n:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Mensaje de Error:", error.message);
        }
        console.log("==========================================\n");
        throw new Error('Fallo la conexión con el servidor de automatización (n8n). Por favor, contacte al administrador.');
    }
};

// --- NUEVA FUNCIÓN EXCLUSIVA PARA CONTACTO ---
const enviarContactoN8n = async (payload) => {
    try {
        const webhookContacto = process.env.N8N_WEBHOOK_CONTACTO;
        if (!webhookContacto) throw new Error("La variable N8N_WEBHOOK_CONTACTO no existe en el .env");

        console.log("\n🚀 Enviando formulario de contacto a N8N ->", webhookContacto);

        const response = await axios.post(webhookContacto, payload);

        console.log("✅ Contacto recibido por N8N con éxito.");
        return response.data;
    } catch (error) {
        console.error("❌ Error enviando contacto a N8N:", error.message);
        throw new Error('No se pudo enviar el mensaje. Por favor, contacte al administrador.');
    }
};

module.exports = {
    enviarWebhookN8n,
    enviarContactoN8n
};