import { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api'; // Importamos nuestra nueva aduana

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Volvemos a null
    const [loading, setLoading] = useState(true);

    // Al recargar la página (F5), verificamos si el token sigue siendo válido
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Le preguntamos al backend quiénes somos
                    const { data } = await api.get('/api/auth/me');
                    setUser(data);
                } catch (error) {
                    console.error('Fallo en la verificación del token:', error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        // Hacemos el POST real a tu backend
        const { data } = await api.post('/api/auth/login', { email, password });
        localStorage.setItem('token', data.token); // Guardamos el pasaporte
        setUser(data.user); // Guardamos el perfil
        return data.user;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);