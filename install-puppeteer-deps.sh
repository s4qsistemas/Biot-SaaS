#!/bin/bash
# ==============================================================================
# SCRIPT DE INSTALACIÓN: DEPENDENCIAS GRÁFICAS PARA PUPPETEER EN UBUNTU 24.04+
# Proyecto: BIOT ERP
# ==============================================================================

echo "🚀 Iniciando actualización del sistema..."
sudo apt-get update -y

echo "📦 Instalando librerías base y fuentes..."
sudo apt-get install -y \
    ca-certificates \
    fonts-liberation \
    wget \
    xdg-utils \
    lsb-release

echo "🎨 Instalando motores de renderizado y ventanas (X11 / GTK)..."
sudo apt-get install -y \
    libappindicator3-1 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0

echo "⚙️ Instalando librerías del sistema y hardware virtual (Specs Ubuntu 24.04)..."
sudo apt-get install -y \
    libc6 \
    libgcc1 \
    libstdc++6 \
    libasound2t64 \
    libxshmfence1 \
    libdrm2

echo "🖥️ Instalando extensiones de entorno gráfico (X11 extensions)..."
sudo apt-get install -y \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6

echo "✅ ¡Instalación completada! Puppeteer (Chromium) ya puede renderizar en modo Headless."

# ==============================================================================
# 📌 POST-IT DE SUPERVIVENCIA (TROUBLESHOOTING PM2 Y SERVIDOR)
# ==============================================================================
# Si en el futuro algo falla con el servidor, usa estos comandos de diagnóstico:
#
# 🔄 1. REINICIAR EL BACKEND (Obligatorio tras instalar librerías o cambiar .env)
#    Comando: pm2 restart all
#
# 🧹 2. LIMPIAR EL HISTORIAL DE LOGS (Para no confundirse con errores del pasado)
#    Comando: pm2 flush
#
# 🚨 3. VER LA HERIDA REAL (Muestra las últimas 20 líneas de errores fatales)
#    Comando: tail -n 20 /root/.pm2/logs/biot-backend-error.log
#
# 📊 4. VER LOGS EN TIEMPO REAL (Tráfico normal + Errores)
#    Comando: pm2 logs --lines 20
#
# 🧪 5. PRUEBA DE ÁCIDO (Si en el futuro el PDF llega dañado o en blanco a n8n):
#    Ve a `pdf.service.js` y activa el código que guarda `test_diagnostico.pdf` 
#    físicamente en el servidor mediante `fs.writeFileSync`. Si ese archivo 
#    se abre bien, el error NO es del backend, sino de la automatización en n8n 
#    (n8n no está decodificando el Base64 a Binario).
# ==============================================================================