import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    FileText,
    Users,
    Package,
    Clock,
    Download,
    Filter,
    Calendar,
    ChevronRight,
    Search
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';

const ReportesCompras = () => {
    const [activeTab, setActiveTab] = useState('resumen');
    const [filters, setFilters] = useState({
        desde: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        hasta: new Date().toISOString().split('T')[0],
        numero: '',
        proveedor: '',
        estado: ''
    });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const tabs = [
        { id: 'resumen', title: 'Resumen', icon: <BarChart3 size={18} /> },
        { id: 'proveedor', title: 'Por Proveedor', icon: <Users size={18} /> },
        { id: 'articulo', title: 'Por Artículo', icon: <Package size={18} /> },
        { id: 'antiguedad', title: 'Antigüedad (Aging)', icon: <Clock size={18} /> },
        { id: 'almacen', title: 'Por Almacén', icon: <Package size={18} /> },
        { id: 'pendientes', title: 'Facturas Pendientes', icon: <FileText size={18} /> },
        { id: 'historico', title: 'Histórico Facturas', icon: <Search size={18} /> }
    ];

    useEffect(() => {
        fetchReportData();
    }, [activeTab]);

    const fetchReportData = async () => {
        setLoading(true);
        let endpoint = '';
        const params = `?desde=${filters.desde}&hasta=${filters.hasta}`;
        const searchParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value);
            }
        });

        switch (activeTab) {
            case 'resumen': endpoint = '/ReportesCompras/Resumen' + params; break;
            case 'proveedor': endpoint = '/ReportesCompras/PorProveedor' + params; break;
            case 'articulo': endpoint = '/ReportesCompras/PorArticulo' + params; break;
            case 'antiguedad': endpoint = '/ReportesCompras/AntiguedadSaldos'; break;
            case 'almacen': endpoint = '/ReportesCompras/PorAlmacen' + params; break;
            case 'pendientes': endpoint = '/ReportesCompras/FacturasPendientes'; break;
            case 'historico': endpoint = '/ReportesCompras/BuscarFacturas?' + searchParams.toString(); break;
            default: endpoint = '/ReportesCompras/Resumen' + params;
        }

        try {
            const res = await fetch(`${API_BASE}${endpoint}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error("Error fetching report data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvoiceDetail = async (numero) => {
        setLoadingDetail(true);
        setSelectedInvoice(numero);
        setShowModal(true);
        try {
            // Fetch Header and Items
            const resFactura = await fetch(`${API_BASE}/ReportesCompras/Factura/${numero}`);
            if (!resFactura.ok) {
                const errorText = await resFactura.text();
                throw new Error(`Failed to fetch invoice details: ${resFactura.status} ${errorText}`);
            }
            const dataFactura = await resFactura.json();

            // Fetch Payments
            const resPagos = await fetch(`${API_BASE}/ReportesCompras/PagosPorFactura/${numero}`);
            if (!resPagos.ok) {
                const errorText = await resPagos.text();
                throw new Error(`Failed to fetch payments: ${resPagos.status} ${errorText}`);
            }
            const dataPagos = await resPagos.json();

            setDetailData({
                ...dataFactura,
                pagos: dataPagos
            });
        } catch (error) {
            console.error("Error fetching invoice detail:", error);
            setDetailData(null);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const exportToExcel = () => {
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(h => {
                let val = row[h];
                if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
                return val;
            }).join(','))
        ].join('\n');

        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Reporte_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatCurrency = (val, currencySymbol = 'RD$') => {
        // If it's a code like 'USD', try to use standard formatter, otherwise use literal symbol
        if (currencySymbol === 'USD' || currencySymbol === 'DOP') {
            return new Intl.NumberFormat('es-DO', {
                style: 'currency',
                currency: currencySymbol
            }).format(val || 0);
        }
        // If no symbol or code provided, default to RD$
        const symbol = currencySymbol || 'RD$';
        return `${symbol} ${new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2 }).format(val || 0)}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-DO');
    };

    const renderTable = () => {
        if (loading) return <div className="py-20 text-center text-gray-400">Generando reporte...</div>;
        if (data.length === 0) return <div className="py-20 text-center text-gray-400">No hay datos para este periodo.</div>;

        switch (activeTab) {
            case 'resumen':
                return (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Moneda</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Compras</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">SubTotal</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Impuesto</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total DOP</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase text-blue-600">Total USD</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((item, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.moneda || item.Moneda}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">{item.cantidadCompras || item.CantidadCompras}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(item.subTotal || item.SubTotal, item.monedaSimbolo || item.moneda || item.Moneda)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-hd-orange">{formatCurrency(item.impuesto || item.Impuesto || item.Impuestos, item.monedaSimbolo || item.moneda || item.Moneda)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold">{formatCurrency(item.total || item.Total, item.monedaSimbolo || item.moneda || item.Moneda)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-hd-orange">{formatCurrency(item.totalDOP || item.TotalDOP, 'RD$')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-blue-600">{formatCurrency(item.totalUSD || item.TotalUSD, 'USD')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );

            case 'proveedor':
                return (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Facturas</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total DOP</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total USD</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((item, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.proveedor || item.Proveedor}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">{item.facturas || item.Facturas}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-hd-orange font-bold">{formatCurrency(item.totalDOP || item.TotalDOP, 'DOP')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-blue-600 font-bold">{formatCurrency(item.totalUSD || item.TotalUSD, 'USD')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );

            case 'historico':
                return (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Número</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Proveedor</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Moneda</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Saldo</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((item, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">{item.numeroCompra || item.NumeroCompra}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.fechaCompra || item.FechaCompra)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.proveedor || item.Proveedor}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.moneda || item.Moneda}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{formatCurrency(item.total || item.Total, item.monedaSimbolo || item.moneda || item.Moneda)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-red-600 font-bold">{formatCurrency(item.saldo || item.Saldo, item.monedaSimbolo || item.moneda || item.Moneda)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-left">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.estado === 'Pagado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {(item.estado || 'Pendiente').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button
                                            onClick={() => fetchInvoiceDetail(item.numeroCompra || item.NumeroCompra)}
                                            className="text-hd-orange hover:text-orange-700 transition-colors"
                                            title="Ver Detalle"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );

            case 'articulo':
                return (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Artículo</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cant.</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Costo Prom.</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((item, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm font-mono">{item.numeroArticulo || item.NumeroArticulo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{item.articulo || item.Articulo || item.descripcion || item.Descripcion}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">{item.cantidadComprada || item.CantidadComprada}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(item.costoPromedio || item.CostoPromedio)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(item.totalSinImpuestos || item.TotalSinImpuestos)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );

            case 'antiguedad':
                return (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">0-30 Días</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">31-60 Días</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">61-90 Días</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">+90 Días</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase font-bold">Total</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((item, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{item.proveedor || item.Proveedor}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(item["0_30_Dias"] || item["0_30_dias"])}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(item["31_60_Dias"] || item["31_60_dias"])}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(item["61_90_Dias"] || item["61_90_dias"])}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-red-600">{formatCurrency(item["Mas_90_Dias"] || item["mas_90_dias"])}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-hd-orange">{formatCurrency(item.saldoTotal || item.SaldoTotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );

            case 'pendientes':
                return (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Moneda</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Días</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((item, i) => (
                                <tr key={i} className={item.diasVencimiento > 30 ? 'bg-red-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{item.numeroCompra}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.fechaCompra)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{item.proveedor}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs text-gray-400">{item.moneda}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(item.total, item.monedaSimbolo)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-red-600">{formatCurrency(item.saldo, item.monedaSimbolo)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${item.diasVencimiento > 30 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                            {item.diasVencimiento} días
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );

            case 'almacen':
                return (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Almacén</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Operaciones</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Valor (RD$)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 uppercase text-[11px]">
                            {data.map((item, i) => (
                                <tr key={i} className="hover:bg-orange-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800 border-l-2 border-hd-orange">{item.almacen}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">{item.cantidadCompras}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-black text-hd-orange">{formatCurrency(item.totalDOP, 'RD$')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <BarChart3 className="text-hd-orange" />
                    Reportes de Compras
                </h1>
                <Button
                    onClick={exportToExcel}
                    disabled={data.length === 0 || loading}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                    <Download size={18} />
                    Exportar a Excel (CSV)
                </Button>
            </div>

            {/* Tabs */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="flex border-b overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'border-b-2 border-hd-orange text-hd-orange bg-orange-50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {tab.icon}
                            {tab.title}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                {(activeTab === 'resumen' || activeTab === 'proveedor' || activeTab === 'articulo' || activeTab === 'historico') && (
                    <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Desde</label>
                            <input
                                type="date"
                                name="desde"
                                value={filters.desde}
                                onChange={handleFilterChange}
                                className="rounded-md border-gray-300 text-sm focus:ring-hd-orange focus:border-hd-orange"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Hasta</label>
                            <input
                                type="date"
                                name="hasta"
                                value={filters.hasta}
                                onChange={handleFilterChange}
                                className="rounded-md border-gray-300 text-sm focus:ring-hd-orange focus:border-hd-orange"
                            />
                        </div>
                        {activeTab === 'historico' && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Número</label>
                                    <input
                                        type="text"
                                        name="numero"
                                        placeholder="Buscar número..."
                                        onChange={handleFilterChange}
                                        className="rounded-md border-gray-300 text-sm focus:ring-hd-orange focus:border-hd-orange"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Estado</label>
                                    <select
                                        name="estado"
                                        onChange={handleFilterChange}
                                        className="rounded-md border-gray-300 text-sm focus:ring-hd-orange focus:border-hd-orange"
                                    >
                                        <option value="">Todos</option>
                                        <option value="Pendiente">Pendiente</option>
                                        <option value="Pagado">Pagado</option>
                                    </select>
                                </div>
                            </>
                        )}
                        <Button
                            onClick={fetchReportData}
                            className="bg-hd-orange hover:bg-orange-600 text-white flex items-center gap-2"
                        >
                            <Search size={16} />
                            Actualizar
                        </Button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    {renderTable()}
                </div>
            </div>

            {/* Modal de Detalle */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">Detalle de Factura: {selectedInvoice}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingDetail ? (
                                <div className="py-10 text-center text-gray-400 font-medium">Buscando detalles...</div>
                            ) : detailData ? (
                                <div className="space-y-6">
                                    {/* Header info */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-orange-50 p-4 rounded-lg border border-orange-100 text-sm">
                                        <div><span className="text-gray-500 block">Proveedor:</span> <span className="font-bold">{detailData.header.proveedor}</span></div>
                                        <div><span className="text-gray-500 block">Fecha:</span> <span className="font-bold">{formatDate(detailData.header.fechaCompra)}</span></div>
                                        <div><span className="text-gray-500 block">Almacén:</span> <span className="font-bold text-blue-600">{detailData.header.almacenNombre || 'No definido'}</span></div>
                                        <div><span className="text-gray-500 block">Total:</span> <span className="font-bold">{formatCurrency(detailData.header.total, detailData.header.monedaSimbolo)}</span></div>
                                        <div><span className="text-gray-500 block">Saldo Actual:</span> <span className="font-black text-red-600">{formatCurrency(detailData.header.saldo, detailData.header.monedaSimbolo)}</span></div>
                                    </div>

                                    {/* Line Items */}
                                    <div>
                                        <h4 className="text-md font-bold text-gray-700 mb-2 border-l-4 border-hd-orange pl-2 uppercase tracking-wide">Artículos</h4>
                                        <div className="border rounded-lg overflow-hidden">
                                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Articulo</th>
                                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Cant.</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Almacén</th>
                                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Costo</th>
                                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {detailData.items.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-4 py-2">
                                                                <span className="text-gray-400 font-mono text-xs mr-2">{item.numeroArticulo}</span>
                                                                {item.descripcion}
                                                            </td>
                                                            <td className="px-4 py-2 text-right font-medium">{item.cantidad}</td>
                                                            <td className="px-4 py-2 text-left text-[10px] text-gray-500 font-medium italic">{item.almacenLinea || detailData.header.almacenNombre}</td>
                                                            <td className="px-4 py-2 text-right">{formatCurrency(item.costoUnitario, detailData.header.monedaSimbolo)}</td>
                                                            <td className="px-4 py-2 text-right font-bold">{formatCurrency(item.totalLinea, detailData.header.monedaSimbolo)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Notas de Crédito/Débito */}
                                    <div>
                                        <h4 className="text-md font-bold text-gray-700 mb-2 border-l-4 border-yellow-500 pl-2 uppercase tracking-wide">Notas de Crédito / Débito</h4>
                                        {detailData.notas && detailData.notas.length > 0 ? (
                                            <div className="border rounded-lg overflow-hidden">
                                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                    <thead className="bg-yellow-50">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Ref.</th>
                                                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Monto Aplicado</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {detailData.notas.map((nota, idx) => (
                                                            <tr key={idx}>
                                                                <td className="px-4 py-2">{formatDate(nota.fecha)}</td>
                                                                <td className="px-4 py-2">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${nota.tipo === 'Credito' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                                        {nota.tipo.toUpperCase()}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-2 text-xs text-gray-500">{nota.referencia}</td>
                                                                <td className={`px-4 py-2 text-right font-bold ${nota.tipo === 'Credito' ? 'text-blue-600' : 'text-red-600'}`}>
                                                                    {nota.tipo === 'Credito' ? '-' : '+'}{formatCurrency(nota.monto, detailData.header.monedaSimbolo)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg">No hay notas aplicadas a esta factura.</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-10 text-center text-red-500 font-medium">No se pudo cargar la información.</div>
                            )}
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex justify-end">
                            <Button onClick={() => setShowModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800">Cerrar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportesCompras;
