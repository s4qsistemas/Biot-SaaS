import api from '../utils/api';

export const getCotizaciones = async () => {
    const response = await api.get('/api/cotizaciones');
    return response.data;
};

export const createCotizacion = async (cotizacionData) => {
    const response = await api.post('/api/cotizaciones', cotizacionData);
    return response.data;
};

export const getCotizacionById = async (id) => {
    const response = await api.get(`/api/cotizaciones/${id}`);
    return response.data;
};

// Envía el nuevo estado al backend
export const updateEstadoCotizacion = async (id, estado, extras = {}) => {
    const response = await api.put(`/api/cotizaciones/${id}/estado`, { estado, ...extras });
    return response.data;
};

// Actualiza la cotización con sus nuevos ítems
export const updateCotizacionCompleta = async (id, cotizacionData) => {
    const response = await api.put(`/api/cotizaciones/${id}`, cotizacionData);
    return response.data;
};

// Borra un borrador
export const deleteCotizacion = async (id) => {
    const response = await api.delete(`/api/cotizaciones/${id}`);
    return response.data;
};