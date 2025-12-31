import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, User, DollarSign, Hash, Eye, Loader2, Printer, ClipboardList, RotateCcw } from 'lucide-react';
import { getHistory, getVentaById } from '../../api/ventas';
import SaleDetailModal from '../../components/ventas/SaleDetailModal';
import DataTable from '../../components/ui/DataTable';

const VentasList = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewSale, setViewSale] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const data = await getHistory();
            setHistory(data);
        } catch (err) {
            setError('Error al cargar el historial');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (row) => {
        // If it's a sale, we can show the modal
        if (row.Tipo === 'Factura') {
            try {
                setLoading(true);
                const data = await getVentaById(row.Id);
                setViewSale(data);
                setIsViewModalOpen(true);
            } catch (err) {
                console.error(err);
                setError('Error al cargar detalle de venta');
            } finally {
                setLoading(false);
            }
        } else if (row.Tipo === 'Cotización') {
            // [NEW] Edit Quotation
            navigate('/ventas/distribucion', { state: { mode: 'edit_quotation', id: row.Id } });
        } else {
            // For Returns, just open the professional print in new tab
            handlePrint(row);
        }
    };

    const handlePrint = (row) => {
        const baseUrl = ((import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') ? import.meta.env.VITE_API_URL : '/api');
        const reportBase = baseUrl.replace('/api', '');

        let path = 'Factura';
        if (row.Tipo === 'Cotización') path = 'Cotizacion';
        if (row.Tipo === 'Devolución') path = 'Devolucion';

        const url = `${reportBase}/Reports/${path}?id=${row.Id}`;
        window.open(url, '_blank');
    };

    const formatCurrency = (value, code = 'DOP', symbol = 'RD$') => {
        return `${code} ${symbol}${(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Columns Definition
    const columns = useMemo(() => [
        {
            header: 'Tipo',
            accessorKey: 'Tipo',
            cell: info => {
                const tipo = info.getValue();
                let icon = <FileText size={16} className="text-blue-500" />;
                let labelClass = "text-blue-700 bg-blue-50";

                if (tipo === 'Cotización') {
                    icon = <ClipboardList size={16} className="text-amber-500" />;
                    labelClass = "text-amber-700 bg-amber-50";
                } else if (tipo === 'Devolución') {
                    icon = <RotateCcw size={16} className="text-red-500" />;
                    labelClass = "text-red-700 bg-red-50";
                }

                return (
                    <div className={`flex items-center gap-2 px-2 py-1 rounded-md font-bold text-xs ${labelClass}`}>
                        {icon}
                        {tipo}
                    </div>
                );
            },
            size: 120,
        },
        {
            header: 'Número',
            accessorKey: 'Numero',
            accessorFn: row => row.Numero || row.numero || row.NumeroFactura || row.numeroFactura,
            cell: info => (
                <div className="flex items-center gap-2 font-black text-gray-900 mono">
                    {info.getValue()}
                </div>
            ),
            size: 140,
        },
        {
            header: 'Fecha',
            accessorKey: 'Fecha',
            accessorFn: row => row.Fecha || row.fecha,
            cell: info => (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar size={14} className="text-gray-400" />
                    {formatDate(info.getValue())}
                </div>
            ),
            size: 150,
        },
        {
            header: 'Cliente',
            accessorKey: 'ClienteNombre',
            accessorFn: row => row.ClienteNombre || row.clienteNombre || 'N/A',
            cell: info => (
                <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span className="font-semibold text-gray-900 text-sm truncate max-w-[150px]">{info.getValue()}</span>
                </div>
            ),
            size: 200,
        },
        {
            header: 'NCF',
            accessorFn: row => row.NCF || row.ncf || 'N/A',
            cell: info => <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">{info.getValue() || 'N/A'}</span>,
            size: 130,
        },
        {
            header: 'Total',
            accessorFn: row => row.Total || row.total,
            cell: info => {
                const val = info.getValue();
                const tipo = info.row.original.Tipo;
                const colorClass = tipo === 'Devolución' ? 'text-red-600' : 'text-green-600';
                return <div className={`text-right font-black ${colorClass}`}>{formatCurrency(val, info.row.original.MonedaCodigo, info.row.original.MonedaSimbolo)}</div>
            },
            size: 120,
        },
        {
            header: 'Estado',
            accessorFn: row => row.Estado || row.estado,
            cell: info => {
                if (info.row.original.Tipo === 'Cotización') {
                    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">Cotización</span>;
                } else if (info.row.original.Tipo === 'Devolución') {
                    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800 uppercase">Procesada</span>;
                }

                const saldo = parseFloat(info.row.original.Saldo || info.row.original.saldo || 0);
                const isPaid = saldo <= 0.01;
                const statusLabel = isPaid ? 'Pagada' : 'Pendiente';

                let badgeClass = 'bg-yellow-100 text-yellow-800';
                if (isPaid) badgeClass = 'bg-green-100 text-green-800';

                const originalStatus = info.getValue();
                if (originalStatus === 'Anulado') {
                    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 uppercase">Anulado</span>;
                }

                return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass} uppercase`}>{statusLabel}</span>;
            },
            size: 100,
        },
        {
            id: 'actions',
            header: 'Acciones',
            cell: info => (
                <div className="flex justify-center gap-1">
                    <button
                        onClick={() => handleViewDetail(info.row.original)}
                        className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-all"
                        title="Ver Detalle"
                    >
                        <Eye size={18} />
                    </button>
                    <button
                        onClick={() => handlePrint(info.row.original)}
                        className="text-gray-600 hover:text-hd-orange hover:bg-orange-50 p-1.5 rounded-lg transition-all"
                        title="Imprimir (Pro)"
                    >
                        <Printer size={18} />
                    </button>
                    {info.row.original.Tipo === 'Factura' && (
                        <button
                            onClick={() => navigate(`/ventas/devoluciones?invoice=${info.row.original.Numero || info.row.original.NumeroFactura}`)}
                            className="text-gray-600 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                            title="Devolver"
                        >
                            <RotateCcw size={18} />
                        </button>
                    )}
                </div>
            ),
            size: 120,
            enableSorting: false,
            enableResizing: false
        }
    ], [formatDate, formatCurrency]);

    if (loading && history.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-hd-orange" size={48} />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Historial Unificado</h1>
                    <p className="text-sm text-gray-500 mt-1">Consulta Ventas, Devoluciones y Cotizaciones</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/ventas/pos')}
                        className="px-4 py-2 bg-hd-orange text-white rounded-lg font-bold hover:bg-orange-600 transition-shadow shadow-sm active:scale-95"
                    >
                        Punto de Venta
                    </button>
                    <button
                        onClick={() => navigate('/ventas/distribucion')}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg font-bold hover:bg-black transition-shadow shadow-sm active:scale-95"
                    >
                        Distribución
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    {error}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-hd-orange transition-colors">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Registros</p>
                    <div className="flex items-end justify-between mt-1">
                        <p className="text-2xl font-black text-gray-900">{history.length}</p>
                        <FileText className="text-hd-orange opacity-20" size={32} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-green-500 transition-colors">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Monto Total Estimado</p>
                    <div className="flex items-end justify-between mt-1">
                        <p className="text-2xl font-black text-green-600">
                            {formatCurrency(history.filter(h => h.Tipo !== 'Devolución').reduce((sum, v) => sum + ((v.Total || 0) * (v.TasaCambio || 1)), 0), 'DOP', 'RD$')}
                        </p>
                        <DollarSign className="text-green-600 opacity-20" size={32} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-amber-500 transition-colors">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cotizaciones</p>
                    <div className="flex items-end justify-between mt-1">
                        <p className="text-2xl font-black text-amber-600">{history.filter(h => h.Tipo === 'Cotización').length}</p>
                        <ClipboardList className="text-amber-600 opacity-20" size={32} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-red-500 transition-colors">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Devoluciones</p>
                    <div className="flex items-end justify-between mt-1">
                        <p className="text-2xl font-black text-red-600">{history.filter(h => h.Tipo === 'Devolución').length}</p>
                        <RotateCcw className="text-red-600 opacity-20" size={32} />
                    </div>
                </div>
            </div>

            {/* Advanced Data Table */}
            <DataTable
                columns={columns}
                data={history}
                storageKey="ventas_historial_unified"
            />

            <SaleDetailModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                sale={viewSale}
            />
        </div>
    );
};

export default VentasList;


