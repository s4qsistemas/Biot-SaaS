import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleGuard = ({ permiso = [] }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="p-8 text-txt-secondary">Verificando accesos...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Comparamos el rol del usuario contra la "llave" (arreglo) que exige la ruta
    if (!permiso.includes(user.rol)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default RoleGuard;