import api from '../utils/api';

// --- MATERIALES ---
export const getMateriales = async () => {
    const response = await api.get('/api/catalogos/materiales');
    return response.data;
};
export const createMaterial = async (data) => {
    const response = await api.post('/api/catalogos/materiales', data);
    return response.data;
};
export const updateMaterial = async (id, data) => {
    const response = await api.put(`/api/catalogos/materiales/${id}`, data);
    return response.data;
};

// --- OPERARIOS (HH) ---
export const getOperarios = async () => {
    const response = await api.get('/api/catalogos/operarios');
    return response.data;
};
export const createOperario = async (data) => {
    const response = await api.post('/api/catalogos/operarios', data);
    return response.data;
};
export const updateOperario = async (id, data) => {
    const response = await api.put(`/api/catalogos/operarios/${id}`, data);
    return response.data;
};

// --- EQUIPOS (HM) ---
export const getEquipos = async () => {
    const response = await api.get('/api/catalogos/equipos');
    return response.data;
};
export const createEquipo = async (data) => {
    const response = await api.post('/api/catalogos/equipos', data);
    return response.data;
};
export const updateEquipo = async (id, data) => {
    const response = await api.put(`/api/catalogos/equipos/${id}`, data);
    return response.data;
};

// --- TAREAS (TAR) ---
export const getTareas = async () => {
    const response = await api.get('/api/catalogos/tareas');
    return response.data;
};

export const createTarea = async (data) => {
    const response = await api.post('/api/catalogos/tareas', data);
    return response.data;
};

export const updateTarea = async (id, data) => {
    const response = await api.put(`/api/catalogos/tareas/${id}`, data);
    return response.data;
};