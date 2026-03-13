import { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const { data } = await api.get('/api/auth/me');
                setUser(data);
            } catch (error) {
                console.error('Fallo en la verificación del token:', error);
                localStorage.removeItem('token');
                setUser(null);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const { data } = await api.post('/api/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return data.user;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('super_admin_token'); // 🧹 Limpiar el disfraz al salir
        setUser(null);
    };

    // 🎭 PONERSE EL DISFRAZ (Impersonate)
    const impersonate = async (empresaId) => {
        try {
            const { data } = await api.post(`/api/superadmin/empresa/${empresaId}/impersonate`);
            const currentToken = localStorage.getItem('token');
            localStorage.setItem('super_admin_token', currentToken); // Guardar original

            localStorage.setItem('token', data.token); // Usar el nuevo
            setUser(data.user);
            return true;
        } catch (error) {
            console.error("Error impersonating:", error);
            throw error;
        }
    };

    // 🦸‍♂️ QUITARSE EL DISFRAZ
    const stopImpersonating = async () => {
        const originalToken = localStorage.getItem('super_admin_token');
        if (originalToken) {
            localStorage.setItem('token', originalToken);
            localStorage.removeItem('super_admin_token');
            await checkAuth();
        }
    };

    return (
        <AuthContext.Provider value={{
            user, login, logout, loading,
            isAuthenticated: !!user,
            impersonate, stopImpersonating
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);