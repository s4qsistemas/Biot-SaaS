import api from '../utils/api';

export const getInventario = async () => {
    const response = await api.get('/api/inventario');
    return response.data;
};

export const getHistorialItem = async (id) => {
    const response = await api.get(`/api/inventario/${id}/historial`);
    return response.data;
};

export const registrarMovimiento = async (datosMovimiento) => {
    const response = await api.post('/api/inventario/movimiento', datosMovimiento);
    return response.data;
};

export const inicializarStock = async (data) => {
    const response = await api.post('/api/inventario/inicializar', data);
    return response.data;
};