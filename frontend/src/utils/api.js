import axios from 'axios';

// 1. Instancia base dinámica: Lee del .env, y si no existe, usa localhost por defecto
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// 2. INTERCEPTOR DE SALIDA: Inyectar el Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 3. INTERCEPTOR DE ENTRADA: Atrapar errores (Tokens vencidos)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('Sesión expirada o inválida. Redirigiendo al login...');
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;