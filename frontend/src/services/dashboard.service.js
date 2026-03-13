import api from '../utils/api';

/**
 * Obtiene las métricas para el dashboard del administrador.
 * @returns {Promise<{
 *  cotizacionesActivas: number,
 *  ordenesEnCurso: number,
 *  alertasInventario: number
 * }>}
 */
export const getAdminMetrics = async () => {
    try {
        const response = await api.get('/api/dashboard/metrics');
        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        throw error;
    }
};
