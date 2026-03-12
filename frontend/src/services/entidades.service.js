import api from '../utils/api';
const ENTIDADES_URL = '/api/entidades';

// Leer
export const getEntidades = async () => {
    const response = await api.get(ENTIDADES_URL);
    return response.data;
};

// Crear
export const createEntidad = async (entidadData) => {
    const response = await api.post(ENTIDADES_URL, entidadData);
    return response.data;
};

// Actualizar
export const updateEntidad = async (id, entidadData) => {
    const response = await api.put(`${ENTIDADES_URL}/${id}`, entidadData);
    return response.data;
};

// Eliminar
export const deleteEntidad = async (id) => {
    const response = await api.delete(`${ENTIDADES_URL}/${id}`);
    return response.data;
};