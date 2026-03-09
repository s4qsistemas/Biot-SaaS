const axios = require('axios');

// Tu URL exacta del webhook de n8n
const N8N_WEBHOOK_URL = 'https://n8n.biogps.cl/webhook/cot-biot';

const enviarWebhookN8n = async (payload) => {
    try {
        // 1. Clonamos el payload solo para la consola y truncamos el Base64 para no inundar la terminal
        const payloadParaConsola = {
            ...payload,
            pdf_base64: payload.pdf_base64
                ? payload.pdf_base64.substring(0, 50) + '... [RESTO DEL PDF OCULTO EN CONSOLA]'
                : 'SIN PDF'
        };

        console.log("\n==========================================");
        console.log("🚀 DISPARANDO WEBHOOK A N8N...");
        console.log("URL Destino:", N8N_WEBHOOK_URL);
        console.log("📦 PAYLOAD ENVIADO:");
        console.log(JSON.stringify(payloadParaConsola, null, 2));

        // 2. Disparamos la petición POST REAL con los datos completos
        const response = await axios.post(N8N_WEBHOOK_URL, payload);

        // 3. Imprimimos la respuesta exitosa de n8n
        console.log("✅ RESPUESTA RECIBIDA DESDE N8N:");
        console.log("Status Code:", response.status);
        console.log("Data:", JSON.stringify(response.data, null, 2));
        console.log("==========================================\n");

        return response.data;
    } catch (error) {
        console.log("\n==========================================");
        console.error("❌ ERROR AL CONECTAR CON N8N:");

        // Si n8n respondió, pero con un error (Ej: 400 Bad Request, 500 Server Error)
        if (error.response) {
            console.error("Status de Error:", error.response.status);
            console.error("Respuesta de n8n:", JSON.stringify(error.response.data, null, 2));
        } else {
            // Si n8n está caído o hay un error de red
            console.error("Mensaje de Error:", error.message);
        }
        console.log("==========================================\n");

        throw new Error('Fallo la conexión con el servidor de automatización (n8n).');
    }
};

module.exports = {
    enviarWebhookN8n
};