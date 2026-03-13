import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tienePermiso } from '../config/permissions';

export default function RoleGuard({ permiso }) {
    const { user, loading } = useAuth();

    if (loading) return null; // Evitar redirecciones fantasmas mientras carga

    // Si el usuario no tiene la llave, lo pateamos al dashboard inicial
    if (!tienePermiso(user?.rol, permiso)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}