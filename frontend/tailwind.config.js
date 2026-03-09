/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Aquí definimos tu "Marca"
                brand: {
                    DEFAULT: '#0ea5e9', // El azul cielo (sky-500) de tu logo
                    dark: '#0284c7',    // Un poco más oscuro para hover
                },
                // Colores de fondo (El modo oscuro)
                dark: {
                    bg: '#0f172a',      // Fondo principal (slate-900)
                    surface: '#1e293b', // Fondo de tarjetas/sidebar (slate-800)
                    border: '#334155',  // Bordes sutiles
                },
                // Textos
                txt: {
                    primary: '#f8fafc',   // Blanco casi puro
                    secondary: '#94a3b8', // Gris claro para textos secundarios
                }
            }
        },
    },
    plugins: [],
}