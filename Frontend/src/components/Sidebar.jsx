import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Home, Users, Truck, ShoppingCart, Package, BarChart3,
    ChevronDown, ChevronRight, ShoppingBag, ClipboardList,
    HeartHandshake, Target, Calendar, MessageSquare, Briefcase, ListFilter, Monitor, LayoutGrid, Zap, Shield, Megaphone, Ticket, UserCheck, Tags, FileText, ArrowRightLeft, Boxes, DollarSign, RefreshCcw, Layers, Hash, Settings
} from 'lucide-react';
import { MENU_ITEMS } from '../config/menuItems';
import GateKeeper from './auth/GateKeeper';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const [quickActions, setQuickActions] = useState([]);
    const [expanded, setExpanded] = useState({
        crm: false,
        operaciones: true,
        inventario: false,
        ventas: false,
        configuracion: false,
        reportes: true,
        repVentas: false,
        repCompras: false,
        repInventario: false,
        repEntidades: false,
        repSmartList: true,

        compras: true,
        marketing: true,
        manager: false
    });

    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const toggle = (section) => {
        setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Sync with Launchpad customization
    React.useEffect(() => {
        const savedStructure = localStorage.getItem('launchpad_structure');
        const defaultQuick = MENU_ITEMS.find(m => m.id === 'acceso-rapido')?.subItems || [];

        if (savedStructure) {
            try {
                const structure = JSON.parse(savedStructure);
                const quickModule = structure.find(m => m.id === 'acceso-rapido');
                if (quickModule && quickModule.subItems) {
                    setQuickActions(quickModule.subItems);
                } else {
                    setQuickActions(defaultQuick);
                }
            } catch (e) {
                setQuickActions(defaultQuick);
            }
        } else {
            setQuickActions(defaultQuick);
        }
    }, []);

    const navItemClass = ({ isActive }) =>
        `flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${isActive
            ? 'bg-hd-orange text-white'
            : 'text-zinc-400 hover:bg-white/5 hover:text-white'
        }`;

    const subItemClass = ({ isActive }) =>
        `block flex items-center space-x-3 px-8 py-2 text-sm transition-colors ${isActive
            ? 'text-hd-orange font-black'
            : 'text-zinc-500 hover:text-white'
        }`;

    return (
        <>
            {/* Mobile Toggle Button */}
            <div className="lg:hidden fixed top-4 left-4 z-[60]">
                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="p-2 bg-hd-black text-white rounded-md shadow-lg border border-gray-700"
                >
                    <LayoutGrid size={24} />
                </button>
            </div>

            {/* Overlay for mobile */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <div className={`
                w-64 bg-hd-black border-r border-white/5 min-h-screen text-gray-100 flex flex-col font-sans transition-all duration-300
                fixed inset-y-0 left-0 z-50 
                lg:relative lg:translate-x-0
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-white/5 flex items-center space-x-2 bg-black/10">
                    <div className="w-8 h-8 bg-hd-orange rounded flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-hd-orange/20">
                        C
                    </div>
                    <span className="text-xl font-black italic tracking-tighter uppercase">CRONO POS</span>
                    {/* Close button for mobile inside drawer */}
                    <button
                        className="ml-auto lg:hidden text-gray-400"
                        onClick={() => setIsMobileOpen(false)}
                    >
                        <ChevronDown className="rotate-90" size={20} />
                    </button>
                </div>

                <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                    <NavLink to="/" className={navItemClass} end>
                        <Home size={20} />
                        <span>Inicio</span>
                    </NavLink>

                    <NavLink to="/launchpad" className={navItemClass}>
                        <LayoutGrid size={20} />
                        <span>Launchpad</span>
                    </NavLink>

                    {/* Quick Access */}
                    <div className="px-4 py-2 border-y border-white/5 my-2 bg-black/5">
                        <div className="flex items-center gap-2 mb-3">
                            <Zap size={12} className="text-hd-orange animate-pulse" />
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic opacity-50">Acceso Rápido</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {quickActions.slice(0, 6).map((item, idx) => {
                                // Find full item data from MENU_ITEMS to get correct Icon and Label if truncated
                                let fullItem = null;
                                MENU_ITEMS.forEach(m => {
                                    const found = m.subItems?.find(si => si.path === item.path);
                                    if (found) fullItem = found;
                                });

                                const displayItem = fullItem || item;
                                const Icon = displayItem.icon || Zap;

                                return (
                                    <NavLink
                                        key={idx}
                                        to={displayItem.path}
                                        className="flex flex-col items-center justify-center p-2 rounded bg-gray-800/40 hover:bg-hd-orange transition-all group border border-white/5"
                                    >
                                        <Icon size={16} className="text-hd-orange group-hover:text-white mb-1" />
                                        <span className="text-[9px] font-black text-gray-400 group-hover:text-white uppercase tracking-tighter text-center leading-none">
                                            {displayItem.label.split(' ')[0]}
                                        </span>
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>

                    {/* CRM Group - Ejemplo */}
                    <div>
                        <button
                            onClick={() => toggle('crm')}
                            className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <HeartHandshake size={20} />
                                <span>CRM</span>
                            </div>
                            {expanded.crm ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>

                        {expanded.crm && (
                            <div className="bg-black/20 pb-2">
                                <NavLink to="/crm/dashboard" className={subItemClass}>
                                    <BarChart3 size={18} />
                                    <span>Dashboard</span>
                                </NavLink>
                                <NavLink to="/crm/prospectos" className={subItemClass}>
                                    <Users size={18} />
                                    <span>Prospectos</span>
                                </NavLink>
                                <NavLink to="/crm/oportunidades" className={subItemClass}>
                                    <Target size={18} />
                                    <span>Oportunidades</span>
                                </NavLink>
                                <NavLink to="/crm/actividades" className={subItemClass}>
                                    <Calendar size={18} />
                                    <span>Actividades</span>
                                </NavLink>
                                <NavLink to="/crm/interacciones" className={subItemClass}>
                                    <MessageSquare size={18} />
                                    <span>Interacciones</span>
                                </NavLink>
                            </div>
                        )}
                    </div>

                    <NavLink to="/clientes" className={navItemClass}>
                        <Users size={20} />
                        <span>Clientes</span>
                    </NavLink>


                    <NavLink to="/vendedores" className={subItemClass}>
                        <UserCheck size={18} />
                        <span>Vendedores</span>
                    </NavLink>



                    {/* Marketing Group */}
                    <div>
                        <button
                            onClick={() => toggle('marketing')}
                            className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <Megaphone size={20} className="text-hd-orange" />
                                <span>Marketing</span>
                            </div>
                            {expanded.marketing ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        {expanded.marketing && (
                            <div className="bg-black/20 pb-2">
                                <NavLink to="/marketing/promociones" className={subItemClass}>
                                    <Tags size={18} />
                                    <span>Promociones</span>
                                </NavLink>
                                <NavLink to="/marketing/cupones" className={subItemClass}>
                                    <Ticket size={18} />
                                    <span>Cupones</span>
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Ventas Group */}
                    <div>
                        <button
                            onClick={() => toggle('ventas')}
                            className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <ShoppingCart size={20} />
                                <span>Ventas</span>
                            </div>
                            {expanded.ventas ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>

                        {expanded.ventas && (
                            <div className="bg-black/20 pb-2">
                                <NavLink to="/ventas/pos" className={subItemClass}>
                                    <ShoppingBag size={18} />
                                    <span>POS (Caja)</span>
                                </NavLink>
                                <NavLink to="/ventas/distribucion" className={subItemClass}>
                                    <Truck size={18} />
                                    <span>Ventas Distribución</span>
                                </NavLink>
                                <NavLink to="/ventas/devoluciones" className={subItemClass}>
                                    <RefreshCcw size={18} />
                                    <span>Devoluciones y NC</span>
                                </NavLink>
                                <NavLink to="/ventas/historial" className={subItemClass}>
                                    <FileText size={18} />
                                    <span>Historial de Ventas</span>
                                </NavLink>
                                <NavLink to="/ventas/corte" className={subItemClass}>
                                    <DollarSign size={18} />
                                    <span>Corte de Caja</span>
                                </NavLink>
                                <NavLink to="/cuentas-por-cobrar/cobros" className={subItemClass}>
                                    <DollarSign size={18} />
                                    <span>Cuentas por Cobrar</span>
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Compras Group */}
                    <div>
                        <button
                            onClick={() => toggle('compras')}
                            className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <ClipboardList size={20} />
                                <span>Compras</span>
                            </div>
                            {expanded.compras ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>

                        {expanded.compras && (
                            <div className="bg-black/20 pb-2">
                                <NavLink to="/compras" className={subItemClass} end>
                                    <ClipboardList size={18} />
                                    <span>Órdenes y Facturas</span>
                                </NavLink>
                                <NavLink to="/proveedores" className={subItemClass}>
                                    <Truck size={18} />
                                    <span>Proveedores</span>
                                </NavLink>
                                <NavLink to="/cuentas-por-pagar/pagos" className={subItemClass}>
                                    <ArrowRightLeft size={18} />
                                    <span>Cuentas por Pagar</span>
                                </NavLink>
                            </div>
                        )}
                    </div>


                    {/* Inventario Group */}
                    <div>
                        <button
                            onClick={() => toggle('inventario')}
                            className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <Package size={20} />
                                <span>Inventario</span>
                            </div>
                            {expanded.inventario ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>

                        {expanded.inventario && (
                            <div className="bg-black/20 pb-2">
                                <NavLink to="/productos" className={subItemClass}>
                                    <Boxes size={18} />
                                    <span>Maestro de Artículos</span>
                                </NavLink>

                                {/* Catalog Submenu */}
                                <div className="ml-4 border-l-2 border-gray-700 pl-4 mt-1 mb-2 space-y-1">
                                    <NavLink to="/inventario/lista-precios" className="flex items-center gap-2 px-4 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                                        <DollarSign size={14} />
                                        <span>Lista de Precios</span>
                                    </NavLink>
                                    <NavLink to="/inventario/niveles-precios" className="flex items-center gap-2 px-4 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                                        <Layers size={14} />
                                        <span>Niveles de Precio</span>
                                    </NavLink>
                                    <NavLink to="/inventario/categorias-articulos" className="flex items-center gap-2 px-4 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                                        <Tags size={14} />
                                        <span>Atributos de Artículos</span>
                                    </NavLink>
                                    <NavLink to="/inventario/unidades-medida" className="flex items-center gap-2 px-4 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                                        <Hash size={14} />
                                        <span>Unidades de Medida</span>
                                    </NavLink>
                                    <NavLink to="/inventario/almacenes" className="flex items-center gap-2 px-4 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                                        <Boxes size={14} />
                                        <span>Almacenes</span>
                                    </NavLink>
                                    <NavLink to="/inventario/grupos-impuestos" className="flex items-center gap-2 px-4 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                                        <RefreshCcw size={14} />
                                        <span>Grupos de Impuestos</span>
                                    </NavLink>
                                    <NavLink to="/inventario/grupos-producto" className="flex items-center gap-2 px-4 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                                        <Package size={14} />
                                        <span>Grupos de Producto</span>
                                    </NavLink>
                                </div>


                                <NavLink to="/ajustes" className={subItemClass}>
                                    <RefreshCcw size={18} />
                                    <span>Ajustes</span>
                                </NavLink>
                                <NavLink to="/transferencias" className={subItemClass}>
                                    <ArrowRightLeft size={18} />
                                    <span>Transferencias</span>
                                </NavLink>
                                <NavLink to="/inventario/historial" className={subItemClass}>
                                    <FileText size={18} />
                                    <span>Historial (Kardex)</span>
                                </NavLink>
                                <NavLink to="/kardex" className={subItemClass}>
                                    <Boxes size={18} />
                                    <span>Control (Kardex)</span>
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Configuración Group */}
                    <div>
                        <button
                            onClick={() => toggle('configuracion')}
                            className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <Settings size={20} />
                                <span>Configuración</span>
                            </div>
                            {expanded.configuracion ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>

                        {expanded.configuracion && (
                            <div className="bg-black/20 pb-2">
                                <NavLink to="/configuracion/compania" className={subItemClass}>
                                    <Settings size={18} />
                                    <span>Compañía</span>
                                </NavLink>
                                <NavLink to="/configuracion/cxp" className={subItemClass}>
                                    <FileText size={18} />
                                    <span>Cuentas por Pagar</span>
                                </NavLink>
                                <NavLink to="/configuracion/ncf" className={subItemClass}>
                                    <Hash size={18} />
                                    <span>Comprobantes (NCF)</span>
                                </NavLink>
                                <NavLink to="/configuracion/clientes" className={subItemClass}>
                                    <Users size={18} />
                                    <span>Configuración Clientes</span>
                                </NavLink>
                                <NavLink to="/configuracion/articulos" className={subItemClass}>
                                    <Package size={18} />
                                    <span className={expanded.configuracion ? "" : "hidden"}>Configuración Artículos</span>
                                </NavLink>
                                <NavLink to="/configuracion/monedas" className={subItemClass}>
                                    <DollarSign size={18} />
                                    <span className={expanded.configuracion ? "" : "hidden"}>Monedas y Tasas</span>
                                </NavLink>
                                <NavLink to="/configuracion/proveedores" className={subItemClass}>
                                    <Users size={18} />
                                    <span>Configuración Proveedores</span>
                                </NavLink>
                                <NavLink to="/configuracion/pos" className={subItemClass}>
                                    <Monitor size={18} />
                                    <span>Configuración POS</span>
                                </NavLink>
                                <NavLink to="/configuracion/compras" className={subItemClass}>
                                    <ClipboardList size={18} />
                                    <span>Configuración Compras</span>
                                </NavLink>
                                <NavLink to="/configuracion/transferencias" className={subItemClass}>
                                    <ArrowRightLeft size={18} />
                                    <span>Configuración Transferencias</span>
                                </NavLink>
                                <NavLink to="/configuracion/usuarios" className={subItemClass}>
                                    <Users size={18} />
                                    <span>Gestión de Usuarios</span>
                                </NavLink>
                                <NavLink to="/configuracion/security-editor" className={subItemClass}>
                                    <Shield size={18} />
                                    <span>Editor de Seguridad</span>
                                </NavLink>

                            </div>
                        )}
                    </div>

                    {/* Manager Report Group */}
                    <div>
                        <button
                            onClick={() => toggle('manager')}
                            className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <BarChart3 size={20} />
                                <span>Manager Report</span>
                            </div>
                            {expanded.manager ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>

                        {expanded.manager && (
                            <div className="bg-black/20 pb-2">
                                <NavLink to="/reportes/manager" className={subItemClass} end>
                                    <BarChart3 size={18} />
                                    <span>Ver Reporte</span>
                                </NavLink>
                                <NavLink to="/configuracion/receipt-designer" className={subItemClass}>
                                    <FileText size={18} />
                                    <span>Diseñador de Recibos</span>
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Reportes Group */}
                    <div>
                        <button
                            onClick={() => toggle('reportes')}
                            className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <BarChart3 size={20} />
                                <span>Reportes</span>
                            </div>
                            {expanded.reportes ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>

                        {expanded.reportes && (
                            <div className="bg-black/20 pb-2 ml-4 border-l border-gray-800">
                                {/* Ventas Reports */}
                                <div>
                                    <button
                                        onClick={() => toggle('repVentas')}
                                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <ShoppingCart size={16} />
                                            <span>Ventas</span>
                                        </div>
                                        {expanded.repVentas ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                    {expanded.repVentas && (
                                        <div className="ml-4 space-y-1">
                                            <NavLink to="/reportes/ventas" className={subItemClass}>
                                                <span>General de Ventas</span>
                                            </NavLink>
                                            <NavLink to="/reportes/ventas-cobros" className={subItemClass}>
                                                <span>Cobros y Métodos de Pago</span>
                                            </NavLink>
                                            <NavLink to="/reportes/ventas-vendedor" className={subItemClass}>
                                                <span>Por Vendedor</span>
                                            </NavLink>
                                            <NavLink to="/reportes/ventas-cliente" className={subItemClass}>
                                                <span>Por Cliente</span>
                                            </NavLink>
                                            <NavLink to="/ventas/corte" className={subItemClass}>
                                                <span>Corte de Caja</span>
                                            </NavLink>
                                        </div>
                                    )}
                                </div>

                                {/* Compras Reports */}
                                <div>
                                    <button
                                        onClick={() => toggle('repCompras')}
                                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <ClipboardList size={16} />
                                            <span>Compras</span>
                                        </div>
                                        {expanded.repCompras ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                    {expanded.repCompras && (
                                        <div className="ml-4 space-y-1">
                                            <NavLink to="/compras/reportes" className={subItemClass}>
                                                <span>Reportes de Compras</span>
                                            </NavLink>
                                            <NavLink to="/reportes/compras-multi-moneda" className={subItemClass}>
                                                <span>Multi-Moneda (Excel)</span>
                                            </NavLink>

                                            {/* SmartLists Sub-Group */}
                                            <div className="mt-2 pt-2 border-t border-gray-800">
                                                <div className="px-8 py-1 text-[10px] font-bold text-hd-orange uppercase tracking-widest opacity-70">SmartLists Dinámicos</div>
                                                <NavLink to="/reportes/smartlist/facturas" className={subItemClass}>
                                                    <ListFilter size={14} className="text-hd-orange" />
                                                    <span>S.L. Facturas</span>
                                                </NavLink>
                                                <NavLink to="/reportes/smartlist/articulos" className={subItemClass}>
                                                    <ListFilter size={14} className="text-hd-orange" />
                                                    <span>S.L. Artículos</span>
                                                </NavLink>
                                                <NavLink to="/reportes/smartlist/proveedores" className={subItemClass}>
                                                    <ListFilter size={14} className="text-hd-orange" />
                                                    <span>S.L. Proveedores</span>
                                                </NavLink>
                                                <NavLink to="/reportes/smartlist/pagos" className={subItemClass}>
                                                    <ListFilter size={14} className="text-hd-orange" />
                                                    <span>S.L. Pagos</span>
                                                </NavLink>
                                                <NavLink to="/reportes/smartlist/inventario" className={subItemClass}>
                                                    <ListFilter size={14} className="text-hd-orange" />
                                                    <span>S.L. Existencias</span>
                                                </NavLink>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Inventario Reports */}
                                <div>
                                    <button
                                        onClick={() => toggle('repInventario')}
                                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Package size={16} />
                                            <span>Inventario</span>
                                        </div>
                                        {expanded.repInventario ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                    {expanded.repInventario && (
                                        <div className="ml-4 space-y-1">
                                            <NavLink to="/reportes/inventario" className={subItemClass}>
                                                <span>Existencias Actuales</span>
                                            </NavLink>
                                            <NavLink to="/reportes/valoracion-inventario" className={subItemClass}>
                                                <span>Valoración de Inventario</span>
                                            </NavLink>
                                            <NavLink to="/reportes/kardex" className={subItemClass}>
                                                <span>Movimientos de Artículos</span>
                                            </NavLink>
                                        </div>
                                    )}
                                </div>

                                {/* Entidades Reports */}
                                <div>
                                    <button
                                        onClick={() => toggle('repEntidades')}
                                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Users size={16} />
                                            <span>Entidades</span>
                                        </div>
                                        {expanded.repEntidades ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                    {expanded.repEntidades && (
                                        <div className="ml-4 space-y-1">
                                            <NavLink to="/reportes/clientes" className={subItemClass}>
                                                <span>Listado de Clientes</span>
                                            </NavLink>
                                            <NavLink to="/reportes/proveedores" className={subItemClass}>
                                                <span>Listado de Proveedores</span>
                                            </NavLink>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </nav >

                <div className="p-4 border-t border-gray-800 text-xs text-gray-500 text-center">
                    Versión 1.0.0
                </div>
            </div>
        </>
    );
};

export default Sidebar;


