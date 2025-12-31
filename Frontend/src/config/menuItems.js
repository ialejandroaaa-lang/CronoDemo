import {
    Home, Users, Truck, ShoppingCart, Package, BarChart3,
    ChevronDown, ChevronRight, ShoppingBag, ClipboardList,
    FileText, Boxes, Tags, RefreshCcw, ArrowRightLeft, Settings, Hash, UserCheck, DollarSign, Layers,
    HeartHandshake, Target, Calendar, MessageSquare, ListFilter, Monitor, LayoutGrid, Activity, Zap, Shield, Megaphone, Ticket
} from 'lucide-react';

export const MENU_ITEMS = [
    {
        id: 'inicio',
        label: 'Inicio',
        path: '/',
        icon: Home,
        isLink: true
    },
    {
        id: 'acceso-rapido',
        label: 'Acceso Rápido',
        icon: Zap,
        subItems: [
            { label: 'POS (Caja)', path: '/ventas/pos', icon: ShoppingBag, highlight: true },
            { label: 'Maestro Stock', path: '/productos', icon: Boxes, highlight: true },
            { label: 'Nuevo Cliente', path: '/clientes/nuevo', icon: Users },
            { label: 'Nueva Compra', path: '/compras/nuevo', icon: ClipboardList }
        ]
    },
    {
        id: 'crm',
        label: 'CRM',
        icon: HeartHandshake,
        subItems: [
            { label: 'Dashboard', path: '/crm/dashboard', icon: BarChart3 },
            { label: 'Prospectos', path: '/crm/prospectos', icon: Users },
            { label: 'Oportunidades', path: '/crm/oportunidades', icon: Target },
            { label: 'Actividades', path: '/crm/actividades', icon: Calendar },
            { label: 'Interacciones', path: '/crm/interacciones', icon: MessageSquare }
        ]
    },
    {
        id: 'ventas',
        label: 'Ventas',
        icon: ShoppingCart,
        subItems: [
            { label: 'Clientes', path: '/clientes', icon: Users },
            { label: 'Vendedores', path: '/vendedores', icon: UserCheck },
            { label: 'POS (Caja)', path: '/ventas/pos', icon: ShoppingBag },
            { label: 'Ventas Distribución', path: '/ventas/distribucion', icon: Truck },
            { label: 'Historial de Ventas', path: '/ventas/historial', icon: FileText },
            { label: 'Control de Devoluciones', path: '/ventas/historial-devoluciones', icon: RefreshCcw },
            { label: 'Corte de Caja', path: '/ventas/corte', icon: DollarSign }
        ]
    },
    {
        id: 'compras',
        label: 'Compras',
        icon: ClipboardList,
        subItems: [
            { label: 'Órdenes y Facturas', path: '/compras', icon: ClipboardList },
            { label: 'Proveedores', path: '/proveedores', icon: Truck },
            { label: 'Cuentas por Pagar', path: '/cuentas-por-pagar/pagos', icon: ArrowRightLeft }
        ]
    },
    {
        id: 'inventario',
        label: 'Inventario',
        icon: Package,
        subItems: [
            { label: 'Maestro de Artículos', path: '/productos', icon: Boxes },
            { label: 'Ajustes', path: '/ajustes', icon: RefreshCcw },
            { label: 'Transferencias', path: '/transferencias', icon: ArrowRightLeft },
            { label: 'Control (Kardex)', path: '/kardex', icon: FileText },
            // Catalog Submenu Group (Flattened for Launchpad, Nested for Sidebar - handling via group? or just flat for now since Sidebar has custom logic)
            // Let's flatten for simplicity in config, Sidebar logic can arguably be complex. 
            // Actually, Sidebar has a nested generic div for catalogs. 
            // I'll add them as standard subitems for now to simplify.
            { label: 'Lista de Precios', path: '/inventario/lista-precios', icon: DollarSign },
            { label: 'Niveles de Precio', path: '/inventario/niveles-precios', icon: Layers },
            { label: 'Atributos de Artículos', path: '/inventario/categorias-articulos', icon: Tags },
            { label: 'Unidades de Medida', path: '/inventario/unidades-medida', icon: Hash },
            { label: 'Almacenes', path: '/inventario/almacenes', icon: Boxes },
            { label: 'Grupos de Impuestos', path: '/inventario/grupos-impuestos', icon: RefreshCcw },
            { label: 'Grupos de Producto', path: '/inventario/grupos-producto', icon: Package }
        ]
    },
    {
        id: 'marketing',
        label: 'Marketing',
        icon: Megaphone,
        subItems: [
            { label: 'Promociones', path: '/marketing/promociones', icon: Tags },
            { label: 'Cupones', path: '/marketing/cupones', icon: Ticket }
        ]
    },
    {
        id: 'configuracion',
        label: 'Configuración',
        icon: Settings,
        subItems: [
            { label: 'Compañía', path: '/configuracion/compania', icon: Settings },
            { label: 'Cuentas por Pagar', path: '/configuracion/cxp', icon: FileText },
            { label: 'Comprobantes (NCF)', path: '/configuracion/ncf', icon: Hash },
            { label: 'Configuración Clientes', path: '/configuracion/clientes', icon: Users },
            { label: 'Configuración Artículos', path: '/configuracion/articulos', icon: Package },
            { label: 'Monedas y Tasas', path: '/configuracion/monedas', icon: DollarSign },
            { label: 'Configuración Proveedores', path: '/configuracion/proveedores', icon: Users },
            { label: 'Configuración POS', path: '/configuracion/pos', icon: Monitor },
            { label: 'Configuración Compras', path: '/configuracion/compras', icon: ClipboardList },
            { label: 'Configuración Transferencias', path: '/configuracion/transferencias', icon: ArrowRightLeft },
            { label: 'Configuración Ajustes', path: '/configuracion/ajustes', icon: RefreshCcw },
            { label: 'Gestión de Usuarios', path: '/configuracion/usuarios', icon: Users },
            { label: 'Editor de Seguridad', path: '/configuracion/security-editor', icon: Shield }
        ]
    },
    {
        id: 'manager',
        label: 'Manager Report',
        icon: BarChart3,
        subItems: [
            { label: 'Ver Reporte', path: '/reportes/manager', icon: BarChart3 },
            { label: 'Diseñador de Recibos', path: '/configuracion/receipt-designer', icon: FileText }
        ]
    },
    {
        id: 'reportes',
        label: 'Reportes',
        icon: BarChart3,
        subItems: [
            // Ventas
            { label: 'General de Ventas', path: '/reportes/ventas', icon: ShoppingCart },
            { label: 'Cobros y Métodos', path: '/reportes/ventas-cobros', icon: DollarSign },
            { label: 'Por Vendedor', path: '/reportes/ventas-vendedor', icon: Users },
            { label: 'Por Cliente', path: '/reportes/ventas-cliente', icon: Users },
            // Compras
            { label: 'Reportes de Compras', path: '/compras/reportes', icon: ClipboardList },
            { label: 'Multi-Moneda (Excel)', path: '/reportes/compras-multi-moneda', icon: DollarSign },
            // SmartLists
            { label: 'S.L. Facturas', path: '/reportes/smartlist/facturas', icon: ListFilter, highlight: true },
            { label: 'S.L. Artículos', path: '/reportes/smartlist/articulos', icon: ListFilter, highlight: true },
            { label: 'S.L. Proveedores', path: '/reportes/smartlist/proveedores', icon: ListFilter, highlight: true },
            { label: 'S.L. Pagos', path: '/reportes/smartlist/pagos', icon: ListFilter, highlight: true },
            { label: 'S.L. Existencias', path: '/reportes/smartlist/inventario', icon: ListFilter, highlight: true },
            // Inventario
            { label: 'Existencias Actuales', path: '/reportes/inventario', icon: Package },
            { label: 'Valoración de Inventario', path: '/reportes/valoracion-inventario', icon: DollarSign },
            { label: 'Movimientos de Artículos', path: '/reportes/kardex', icon: FileText },
            // Entidades
            { label: 'Listado de Clientes', path: '/reportes/clientes', icon: Users },
            { label: 'Listado de Proveedores', path: '/reportes/proveedores', icon: Truck }
        ]
    },
    {
        id: 'utilidades',
        label: 'Utilidades',
        icon: LayoutGrid,
        subItems: [
            { label: 'Calculadora', path: '/utilidades/calculadora', icon: Activity },
            { label: 'Bloc de Notas', path: '/utilidades/notas', icon: FileText },
            { label: 'Calendario', path: '/utilidades/calendario', icon: Calendar }
        ]
    }
];

