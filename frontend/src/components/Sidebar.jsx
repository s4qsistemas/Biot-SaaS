import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, FileText, Package, Wrench,
    Users, BookOpen, LogOut, ChevronLeft, Menu, ArrowLeft, UserCog
} from 'lucide-react';

import { tienePermiso, PERMISOS_FRONT } from "../config/permissions";

const Sidebar = ({ collapsed, setCollapsed }) => {
    const { user, logout, stopImpersonating } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const isImpersonating = !!localStorage.getItem('super_admin_token');

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: PERMISOS_FRONT.CATALOGOS_LEER },
        { name: 'Mi Equipo', path: '/dashboard/equipo', icon: UserCog, roles: PERMISOS_FRONT.USUARIOS_GESTION },
        { name: 'Cotizaciones', path: '/dashboard/cotizaciones', icon: FileText, roles: PERMISOS_FRONT.COTIZACIONES_LEER },
        { name: 'Inventario', path: '/dashboard/inventario', icon: Package, roles: PERMISOS_FRONT.INVENTARIO_LEER },
        { name: 'Órdenes Trabajo', path: '/dashboard/ordenes-trabajo', icon: Wrench, roles: PERMISOS_FRONT.OT_LEER },
        { name: 'Entidades', path: '/dashboard/entidades', icon: Users, roles: PERMISOS_FRONT.ENTIDADES_LEER },
        { name: 'Catálogos', path: '/dashboard/catalogos', icon: BookOpen, roles: PERMISOS_FRONT.CATALOGOS_LEER },
    ];

    const handleMenuClick = async (e, item) => {
        if (window.innerWidth < 768) setCollapsed(true);

        if (item.name === 'Dashboard' && isImpersonating) {
            e.preventDefault();
            await stopImpersonating();
            // 👈 ESCAPE CORRECTO: Hacia el root, no al dashboard
            navigate('/root');
        }
    };

    return (
        <>
            {!collapsed && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setCollapsed(true)}
                />
            )}

            <aside className={`
                absolute md:relative z-50 h-full bg-dark-surface border-r border-dark-border transition-all duration-300 flex flex-col
                ${collapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-64'}
            `}>
                <div className="p-4 border-b border-dark-border flex justify-between items-center">
                    {!collapsed && <span className="font-bold text-txt-secondary text-xs uppercase tracking-wider">Menú Principal</span>}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 rounded-lg bg-dark-bg border border-dark-border text-txt-secondary hover:text-brand transition-colors hidden md:block"
                    >
                        {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
                    </button>
                    <button
                        onClick={() => setCollapsed(true)}
                        className="md:hidden p-1.5 text-txt-secondary hover:text-white"
                    >
                        <ChevronLeft size={20} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                    <ul className="space-y-1 px-3">
                        {menuItems.map((item) => {
                            const hasAccess = user?.rol === 'super_admin' || tienePermiso(user?.rol, item.roles);
                            if (!hasAccess) return null;

                            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

                            const isExitDoor = item.name === 'Dashboard' && isImpersonating;
                            const displayName = isExitDoor ? 'Volver a Panel Maestro' : item.name;
                            const Icon = isExitDoor ? ArrowLeft : item.icon;

                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        title={collapsed ? displayName : ''}
                                        onClick={(e) => handleMenuClick(e, item)}
                                        className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-3 p-3 rounded-xl transition-all duration-200 group
                                            ${isActive && !isExitDoor
                                                ? 'bg-brand/10 text-brand border border-brand/20 shadow-sm'
                                                : isExitDoor
                                                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20'
                                                    : 'text-txt-secondary hover:bg-dark-bg hover:text-white border border-transparent'
                                            }
                                        `}
                                    >
                                        <Icon size={20} className={`${isActive && !isExitDoor ? 'text-brand' : isExitDoor ? 'text-current' : 'text-txt-secondary group-hover:text-white'} transition-colors shrink-0`} />
                                        {!collapsed && (
                                            <span className="font-medium text-sm whitespace-nowrap">
                                                {displayName}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-dark-border">
                    <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} mb-4 px-2`}>
                        <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
                        </div>
                        {!collapsed && (
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-txt-primary truncate">{user?.nombre}</p>
                                <p className="text-[10px] text-txt-secondary truncate uppercase font-bold tracking-wider">
                                    {isImpersonating ? 'Suplantando Admin' : user?.rol?.replace('_', ' ')}
                                </p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={logout}
                        title={collapsed ? "Cerrar Sesión" : ""}
                        className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-center gap-2'} p-2.5 rounded-lg border border-dark-border text-txt-secondary hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-all text-sm`}
                    >
                        <LogOut size={16} className="shrink-0" />
                        {!collapsed && <span className="font-medium">Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;