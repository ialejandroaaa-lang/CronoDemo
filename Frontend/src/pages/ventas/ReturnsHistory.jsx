import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, FileText, DollarSign, Filter, RefreshCcw, CreditCard } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import { getReturnsHistory, getCreditNotesHistory } from '../../api/returns';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

const ReturnsHistory = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('returns'); // 'returns' or 'creditNotes'
    const [returns, setReturns] = useState([]);
    const [creditNotes, setCreditNotes] = useState([]);
    const [loading, setLoading] = useState(false);

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, [activeTab, dateRange]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'returns') {
                const data = await getReturnsHistory(dateRange.start, dateRange.end);
                setReturns(data);
            } else {
                const data = await getCreditNotesHistory(dateRange.start, dateRange.end);
                setCreditNotes(data);
            }
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const formatCurrency = (val) => `RD$ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    const returnsColumns = useMemo(() => [
        {
            header: 'Retorno #',
            accessorKey: 'id', // Case sensitive check from API usually Pascal but let's try lowercase safe
            accessorFn: row => row.id || row.Id,
            size: 80
        },
        {
            header: 'Fecha',
            accessorFn: row => formatDate(row.fecha || row.Fecha),
            size: 140
        },
        {
            header: 'Factura Orig.',
            accessorFn: row => row.numeroFactura || row.NumeroFactura,
            cell: info => <span className="font-bold text-gray-700">{info.getValue()}</span>,
            size: 120
        },
        {
            header: 'Cliente',
            accessorFn: row => row.clienteNombre || row.ClienteNombre || 'Cliente General',
            size: 200
        },
        {
            header: 'Tipo Acción',
            accessorFn: row => row.tipoAccion || row.TipoAccion,
            cell: info => (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${info.getValue() === 'Reembolso' ? 'bg-red-100 text-red-800' :
                        info.getValue() === 'Cambio' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {info.getValue()}
                </span>
            ),
            size: 120
        },
        {
            header: 'Total',
            accessorFn: row => row.totalReembolsado || row.TotalReembolsado,
            cell: info => <div className="text-right font-bold text-green-700">{formatCurrency(info.getValue())}</div>,
            size: 120
        },
        {
            header: 'Usuario',
            accessorFn: row => row.usuario || row.Usuario,
            size: 100
        }
    ], []);

    const creditColumns = useMemo(() => [
        {
            header: 'NCF',
            accessorFn: row => row.ncf || row.NCF,
            cell: info => <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{info.getValue()}</span>,
            size: 140
        },
        {
            header: 'Fecha',
            accessorFn: row => formatDate(row.fecha || row.Fecha),
            size: 140
        },
        {
            header: 'Cliente',
            accessorFn: row => row.clienteNombre || row.ClienteNombre,
            size: 200
        },
        {
            header: 'Factura Orig.',
            accessorFn: row => row.numeroFactura || row.NumeroFactura,
            size: 120
        },
        {
            header: 'Monto Original',
            accessorFn: row => row.monto || row.Monto,
            cell: info => <div className="text-right">{formatCurrency(info.getValue())}</div>,
            size: 120
        },
        {
            header: 'Saldo',
            accessorFn: row => row.saldo || row.Saldo,
            cell: info => {
                const val = info.getValue();
                return <div className={`text-right font-bold ${val > 0 ? 'text-green-600' : 'text-gray-400'}`}>{formatCurrency(val)}</div>
            },
            size: 120
        },
        {
            header: 'Estado',
            accessorFn: row => row.estado || row.Estado,
            cell: info => <span className="px-2 py-1 bg-gray-100 rounded text-xs">{info.getValue()}</span>,
            size: 100
        }
    ], []);

    return (
        <div className="p-6 space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Historial de Devoluciones</h1>
                    <p className="text-gray-500">Consulta de devoluciones y notas de crédito generadas.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/ventas/devoluciones')}
                        className="bg-hd-orange text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition"
                    >
                        Nueva Devolución
                    </button>
                </div>
            </div>

            {/* Filters */}
            <Card className="bg-gray-50 border-none shadow-none">
                <div className="p-4 flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Desde</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="border p-2 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hasta</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="border p-2 rounded"
                        />
                    </div>
                </div>
            </Card>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('returns')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'returns' ? 'bg-white shadow text-hd-orange' : 'text-gray-600 hover:text-gray-900'}`}
                >
                    <span className="flex items-center gap-2"><RefreshCcw size={16} /> Devoluciones</span>
                </button>
                <button
                    onClick={() => setActiveTab('creditNotes')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'creditNotes' ? 'bg-white shadow text-hd-orange' : 'text-gray-600 hover:text-gray-900'}`}
                >
                    <span className="flex items-center gap-2"><CreditCard size={16} /> Notas de Crédito</span>
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>
                ) : (
                    <DataTable
                        columns={activeTab === 'returns' ? returnsColumns : creditColumns}
                        data={activeTab === 'returns' ? returns : creditNotes}
                        storageKey={`history_${activeTab}`}
                    />
                )}
            </div>
        </div>
    );
};

export default ReturnsHistory;


