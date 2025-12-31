import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MENU_ITEMS } from '../../config/menuItems';
import {
    TrendingUp,
    ShoppingCart,
    AlertTriangle,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    ChevronRight,
    Package,
    ChevronDown,
    Activity,
    CreditCard,
    Wallet,
    LayoutGrid,
    Users,
    ClipboardList
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const COLORS = ['#FF6600', '#000000', '#666666', '#999999', '#CCCCCC'];

const StatCard = ({ title, value, icon: Icon, trend, color, subtitle }) => (
    <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow bg-white">
        <CardContent className="p-6">
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl font-black text-gray-900">{value}</h3>
                    {subtitle && <p className="text-[10px] text-gray-400 font-medium">{subtitle}</p>}
                </div>
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
                    <Icon size={24} />
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center text-xs font-bold">
                    {trend > 0 ? (
                        <span className="text-green-500 flex items-center bg-green-50 px-2 py-0.5 rounded-full">
                            <ArrowUpRight size={14} className="mr-1" /> +{trend}%
                        </span>
                    ) : (
                        <span className="text-red-500 flex items-center bg-red-50 px-2 py-0.5 rounded-full">
                            <ArrowDownRight size={14} className="mr-1" /> {trend}%
                        </span>
                    )}
                    <span className="text-gray-400 ml-2 font-medium">vs ayer</span>
                </div>
            )}
        </CardContent>
    </Card>
);

const MenuPanel = ({ item }) => {
    const navigate = useNavigate();
    const Icon = item.icon;
    const [isOpen, setIsOpen] = useState(false); // Default closed for cleaner dashboard

    if (item.id === 'inicio') return null;

    return (
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col h-full">
            <div
                className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between cursor-pointer group"
                onClick={() => item.isLink ? navigate(item.path) : setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-hd-orange/10 p-2 rounded-lg text-hd-orange group-hover:bg-hd-orange group-hover:text-white transition-colors">
                        <Icon size={20} />
                    </div>
                    <h3 className="font-bold text-gray-800">{item.label}</h3>
                </div>
                {!item.isLink && (
                    <div className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                        <ChevronDown size={16} />
                    </div>
                )}
            </div>

            {isOpen && !item.isLink && item.subItems && (
                <div className="p-2 grid gap-1 animate-in slide-in-from-top-2 duration-300">
                    {item.subItems.map((sub, idx) => {
                        const SubIcon = sub.icon;
                        return (
                            <div
                                key={idx}
                                onClick={() => navigate(sub.path)}
                                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${sub.highlight
                                    ? 'bg-orange-50 text-hd-orange hover:bg-orange-100'
                                    : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <SubIcon size={16} className={sub.highlight ? 'text-hd-orange' : 'text-gray-400'} />
                                <span className="text-xs font-medium">{sub.label}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [summary, setSummary] = useState({
        salesToday: 0,
        purchasesToday: 0,
        cxpPending: 0,
        lowStockCount: 0,
        recentSales: []
    });
    const [chartData, setChartData] = useState({
        salesByHour: [],
        topProducts: [],
        cashStatus: []
    });

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                // Parallel fetch
                const [summaryRes, chartsRes] = await Promise.all([
                    fetch(`${API_BASE}/Dashboard/Summary`),
                    fetch(`${API_BASE}/Dashboard/Charts`)
                ]);

                if (summaryRes.ok) {
                    const sData = await summaryRes.json();
                    setSummary(sData);
                }

                if (chartsRes.ok) {
                    const cData = await chartsRes.json();
                    setChartData(cData);
                }
            } catch (error) {
                console.error("Dashboard error:", error);
            } finally {
                setLoading(false);
                // Give layout some time to stabilize before rendering ResponsiveContainers
                setTimeout(() => setIsReady(true), 100);
            }
        };
        fetchDashboard();
    }, []);

    const formatCurrency = (val) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(val);

    return (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto transition-colors duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Activity className="text-hd-orange" size={24} />
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Consola Administrativa</h1>
                    </div>
                    <p className="text-gray-500 font-medium">Análisis de tiempo real y gestión operativa del sistema.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => navigate('/launchpad')}
                        className="bg-black hover:bg-gray-800 text-white font-black uppercase tracking-tighter italic border-b-4 border-hd-orange"
                    >
                        <LayoutGrid size={18} className="mr-2" /> Menú de Módulos
                    </Button>
                    <div className="bg-white border px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold text-gray-600 shadow-sm">
                        <Clock size={16} className="text-hd-orange" />
                        {new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Ventas de Hoy"
                    value={formatCurrency(summary.salesToday)}
                    icon={ShoppingCart}
                    color="bg-blue-500"
                    subtitle="Subtotal + ITBIS acumulado"
                />
                <StatCard
                    title="Compras realizadas"
                    value={formatCurrency(summary.purchasesToday)}
                    icon={TrendingUp}
                    color="bg-green-500"
                    subtitle="Convertido a DOP"
                />
                <StatCard
                    title="CXP - Saldo Pendiente"
                    value={formatCurrency(summary.cxpPending)}
                    icon={DollarSign}
                    color="bg-orange-500"
                    subtitle="Deuda total a proveedores"
                />
                <StatCard
                    title="Stock Crítico"
                    value={summary.lowStockCount}
                    icon={AlertTriangle}
                    color="bg-red-500"
                    subtitle="Bajo stock de seguridad"
                />
            </div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Sales Activity Area Chart */}
                <Card className="xl:col-span-2 border-none shadow-xl bg-white overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/30 px-6 py-4">
                        <CardTitle className="text-lg font-black flex items-center gap-2">
                            <TrendingUp className="text-hd-orange" size={20} />
                            Flujo de Ventas (Últimas 24h)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-8">
                        <div className="w-full h-[300px]" style={{ width: '100%', height: 300 }}>
                            {isReady && chartData.salesByHour.length > 0 ? (
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <AreaChart data={chartData.salesByHour.map(h => ({ hour: `${h.Hour}:00`, amount: h.Amount }))}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#FF6600" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#FF6600" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} dy={10} />
                                            <YAxis hide />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                                formatter={(val) => [formatCurrency(val), "Ventas"]}
                                            />
                                            <Area type="monotone" dataKey="amount" stroke="#FF6600" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 border-2 border-dashed border-gray-100 rounded-xl">
                                    <TrendingUp size={32} />
                                    <p className="text-sm font-medium italic">Sin actividad de ventas en las últimas 24h</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Cash Method Distribution */}
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                    <CardHeader className="border-b bg-gray-50/30 px-6 py-4">
                        <CardTitle className="text-lg font-black flex items-center gap-2">
                            <Wallet className="text-hd-orange" size={20} />
                            Distribución de Efectivo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 flex flex-col items-center justify-center">
                        {isReady && chartData.cashStatus.length > 0 ? (
                            <div style={{ width: '100%', height: 240 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={chartData.cashStatus}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="Value"
                                        >
                                            {chartData.cashStatus.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 border-2 border-dashed border-gray-100 rounded-xl">
                                <Wallet size={32} />
                                <p className="text-sm font-medium italic font-mono text-center px-4">Sin datos de cobros hoy</p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 mt-4 w-full">
                            {chartData.cashStatus.map((item, idx) => (
                                <div key={idx} className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                        <span className="text-[10px] uppercase font-black text-gray-400">{item.Name || 'Otros'}</span>
                                    </div>
                                    <span className="text-sm font-black text-gray-800 ml-4">{formatCurrency(item.Value)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Sales Table */}
                <Card className="lg:col-span-2 border-none shadow-xl bg-white overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/30 px-6 py-4">
                        <CardTitle className="text-lg font-black flex items-center gap-2">
                            <Activity className="text-hd-orange" size={20} />
                            Ventas del Día
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="text-hd-orange font-bold text-xs uppercase tracking-widest hover:bg-orange-50">Ver todas <ChevronRight size={14} /></Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[400px] overflow-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 text-[10px] uppercase font-black tracking-widest border-b h-12 sticky top-0 bg-white">
                                    <tr>
                                        <th className="px-6">No. Factura</th>
                                        <th className="px-6">Cliente</th>
                                        <th className="px-6">Hora</th>
                                        <th className="px-6 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {summary.recentSales.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic font-medium">No se han registrado ventas hoy.</td>
                                        </tr>
                                    ) : summary.recentSales.map((sale) => (
                                        <tr key={sale.NumeroFactura} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="font-black text-xs text-hd-orange bg-orange-50 px-2 py-1 rounded border border-orange-100">{sale.NumeroFactura}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-700">{sale.Cliente || 'Cliente General'}</td>
                                            <td className="px-6 py-4 text-xs font-medium text-gray-400 italic">
                                                {new Date(sale.Fecha).toLocaleString('es-DO', { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-black text-gray-900">{formatCurrency(sale.Total)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card className="border-none shadow-xl bg-white text-gray-900 overflow-hidden flex flex-col">
                    <CardHeader className="border-b bg-gray-50/30 px-6 py-4">
                        <CardTitle className="text-lg font-black flex items-center gap-2">
                            <TrendingUp className="text-hd-orange" size={20} />
                            Productos Más Vendidos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 flex-grow">
                        <div className="space-y-6">
                            {chartData.topProducts.map((prod, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-gray-600 truncate max-w-[200px]">{prod.Name}</span>
                                        <span className="text-xs font-black text-hd-orange">{prod.Value} unds</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-hd-orange rounded-full"
                                            style={{ width: `${(prod.Value / Math.max(...chartData.topProducts.map(p => p.Value))) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {chartData.topProducts.length === 0 && (
                                <p className="text-gray-500 text-sm italic text-center py-10">Sin datos de productos este mes.</p>
                            )}
                        </div>
                    </CardContent>
                    {summary.lowStockCount > 0 && (
                        <div className="p-6 bg-red-600/10 border-t border-red-500/20 group cursor-pointer hover:bg-red-600/20 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-red-500">
                                    <AlertTriangle size={18} />
                                    <span className="text-xs font-black uppercase tracking-tight">{summary.lowStockCount} Alertas de Stock</span>
                                </div>
                                <ChevronRight size={16} className="text-red-500 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    )}
                </Card>
            </div>

        </div >
    );
};

export default Dashboard;

