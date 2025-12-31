import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, User, X, Save, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();



    // Simple mapping for header title based on path
    const getTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Dashboard';
        if (path.startsWith('/clientes')) return 'Gestión de Clientes';
        if (path.startsWith('/proveedores')) return 'Gestión de Proveedores';
        if (path.startsWith('/ventas/devoluciones')) return 'Devoluciones y Notas de Crédito';
        if (path.startsWith('/ventas')) return 'Punto de Venta';
        if (path.startsWith('/compras')) return 'Compras e Ingresos';
        if (path.includes('/productos/nuevo')) return (
            <div>
                <div className="flex items-center gap-2">
                    <span>Catálogo de Productos</span>
                    <span className="text-gray-400">|</span>
                    <span>Nuevo Artículo</span>
                </div>
                <div className="text-sm text-gray-500 font-normal">Ficha de Artículo</div>
            </div>
        );
        if (path.includes('/productos/editar')) return (
            <div>
                <div className="flex items-center gap-2">
                    <span>Catálogo de Productos</span>
                    <span className="text-gray-400">|</span>
                    <span>Editar Artículo</span>
                </div>
                <div className="text-sm text-gray-500 font-normal">Ficha de Artículo</div>
            </div>
        );
        if (path.startsWith('/productos')) return 'Catálogo de Productos';
        if (path.startsWith('/inventario/lista-precios')) return 'Mantenimiento Lista de Precios';
        if (path.startsWith('/inventario/categorias-articulos')) return 'Segmentación de Artículos';
        if (path.startsWith('/inventario/unidades-medida')) return 'Unidades de Medida';
        if (path.startsWith('/inventario/almacenes')) return 'Almacenes';
        if (path.startsWith('/inventario/grupos-impuestos')) return 'Grupos de Impuestos';
        if (path.startsWith('/kardex')) return 'Control de Inventario';
        if (path.startsWith('/configuracion/articulos')) return (
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/configuracion')}
                        className="flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <div className="text-xl font-bold text-gray-800">Configuración de Artículos</div>
                        <div className="text-xs text-gray-500 font-normal">Configuración de secuencia numérica para artículos</div>
                    </div>
                </div>
                <div id="header-message" className="ml-14"></div>
            </div>
        );
        if (path.startsWith('/reportes/valoracion-inventario')) return 'Valoración de Inventario';
        if (path.startsWith('/reportes')) return 'Reportes';
        return 'Sistema POS';
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
                    <div className="text-xl font-bold text-gray-800">{getTitle()}</div>

                    <div className="flex items-center space-x-4">
                        {/* Show action buttons on product form pages */}
                        <div id="header-actions"></div>

                        <button className="p-2 text-gray-400 hover:text-hd-orange transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>

                        <div className="flex items-center space-x-2 border-l border-gray-200 pl-4 ml-2">
                            <div className="text-right hidden md:block mr-2">
                                <div className="text-sm font-semibold text-gray-700">{user?.fullName || 'Usuario'}</div>
                                <div className="text-[10px] font-black uppercase text-hd-orange tracking-tighter italic leading-none">{user?.role || 'Vendedor'}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-hd-orange rounded-full flex items-center justify-center text-white shadow-lg shadow-hd-orange/10 font-black italic">
                                    {user?.userName?.substring(0, 2).toUpperCase() || 'U'}
                                </div>
                                <button
                                    onClick={logout}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50/50 rounded-xl transition-all"
                                    title="Cerrar Sesión"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;

