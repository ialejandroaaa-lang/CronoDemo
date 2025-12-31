import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Calendar, Tag, Box, ArrowUp, ArrowDown, Info, Search, ShoppingCart, TrendingUp, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { getArticulos } from '../../api/articulos';
import { getMotivos } from '../../api/motivosAjuste';
import { createAjuste } from '../../api/ajustes'; // Direct import or use fetch

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Helper for currency formatting
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);
};

// Helper for number formatting
const formatNumber = (number) => {
    return new Intl.NumberFormat('es-DO').format(number);
};

const HistorialArticulo = () => {
    const { articuloId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [filters, setFilters] = useState({
        fechaInicio: '',
        fechaFin: '',
        tipoMovimiento: ''
    });
    const [busqueda, setBusqueda] = useState('');
    const [resultados, setResultados] = useState([]);
    const [mostrandoBusqueda, setMostrandoBusqueda] = useState(!articuloId);
    const [groupByWarehouse, setGroupByWarehouse] = useState(false);

    // Adjust Modal State
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [realStock, setRealStock] = useState('');
    const [motivos, setMotivos] = useState([]);
    const [selectedMotivo, setSelectedMotivo] = useState('');
    const [adjustNote, setAdjustNote] = useState('');

    const groupedMovements = React.useMemo(() => {
        const list = data?.movimientos || [];
        if (!groupByWarehouse) return null;
        return list.reduce((groups, mov) => {
            const key = mov.almacenNombre || 'Sin Almacén';
            if (!groups[key]) groups[key] = [];
            groups[key].push(mov);
            return groups;
        }, {});
    }, [data, groupByWarehouse]);

    useEffect(() => {
        if (!articuloId) {
            setMostrandoBusqueda(true);
            setLoading(false);
        } else {
            setMostrandoBusqueda(false);
        }
    }, [articuloId]);

    const buscarArticulos = async (term) => {
        if (!term) {
            setResultados([]);
            return;
        }
        try {
            const all = await getArticulos();
            const filtered = all.filter(a =>
                a.descripcion.toLowerCase().includes(term.toLowerCase()) ||
                a.numeroArticulo.toLowerCase().includes(term.toLowerCase())
            ).slice(0, 10);
            setResultados(filtered);
        } catch (e) {
            toast.error("Error buscando artículos");
        }
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setBusqueda(val);
        buscarArticulos(val);
    };

    // KPI Card Component
    const KpiCard = ({ title, value, icon: Icon, colorClass, subtext }) => (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                <h3 className={`text-2xl font-bold ${colorClass}`}>{value}</h3>
                {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-full ${colorClass.replace('text-', 'bg-').replace('600', '100')}`}>
                <Icon className={`w-6 h-6 ${colorClass}`} />
            </div>
        </div>
    );

    const fetchData = async () => {
        try {
            console.log('[Historial] Fetching data for ID:', articuloId);
            setLoading(true);
            // Construct query params
            const params = new URLSearchParams();
            if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
            if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
            if (filters.tipoMovimiento) params.append('tipoMovimiento', filters.tipoMovimiento); // Backend needs to support this if we add it

            const res = await fetch(`${API_BASE}/ArticuloHistorial/${articuloId}?${params.toString()}`);
            console.log('[Historial] Fetch Status:', res.status, res.statusText);

            if (!res.ok) {
                const text = await res.text();
                console.error('[Historial] Fetch Error Body:', text);
                throw new Error('Error al cargar historial: ' + res.status);
            }

            const jsonData = await res.json();
            console.log('[Historial] Data Received:', jsonData);
            setData(jsonData);
        } catch (err) {
            console.error('[Historial] Catch Error:', err);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdjust = async () => {
        setShowAdjustModal(true);
        setRealStock(kpis?.existenciaActual || 0);
        try {
            const m = await getMotivos();
            console.log("Motivos loaded:", m);
            // Handle both Array and {data: Array} formats
            const list = Array.isArray(m) ? m : (m.data || []);
            const activeMotivos = list.filter(x => x.activo);
            setMotivos(activeMotivos);

            if (activeMotivos.length > 0) {
                setSelectedMotivo(activeMotivos[0].id);
            }
        } catch (e) {
            console.error("Error loading motivos:", e);
            toast.error("Error cargando motivos");
        }
    };

    const handleConfirmAdjust = async () => {
        if (realStock === '') return;
        const current = kpis.existenciaActual;
        const real = parseFloat(realStock);
        const diff = real - current;

        if (diff === 0) {
            toast('El stock es idéntico, no se requiere ajuste.');
            setShowAdjustModal(false);
            return;
        }

        if (!selectedMotivo) {
            toast.error('Seleccione un motivo');
            return;
        }

        const type = diff > 0 ? 'in' : 'out';
        const qty = Math.abs(diff);

        const payload = {
            fecha: new Date().toISOString().split('T')[0],
            tipoAjuste: type,
            motivoId: parseInt(selectedMotivo),
            motivoDescripcion: motivos.find(m => m.id == selectedMotivo)?.motivo,
            almacenId: 1, // Default Main (Improve later if needed)
            observaciones: `Ajuste Rápido desde Historial: ${adjustNote}`,
            detalles: [{
                articuloId: encabezado.id,
                codigo: encabezado.codigo,
                descripcion: encabezado.descripcion,
                unidad: encabezado.unidadMedida,
                cantidad: qty,
                equivalente: 1,
                costo: encabezado.costoUnitario,
                planUoM: encabezado.planMedida || 'N/A'
            }]
        };

        try {
            console.log("Sending payload:", payload);
            const res = await createAjuste(payload);
            console.log("Response:", res);
            toast.success(`Ajuste ${res.documento} creado. Stock actualizado.`);
            setShowAdjustModal(false);
            fetchData();
        } catch (e) {
            console.error("Error creating adjustment:", e);
            toast.error('Error al crear ajuste: ' + e.message);
        }
    };

    useEffect(() => {
        if (articuloId) {
            fetchData();
        }
    }, [articuloId, filters]);

    if (loading && !data) return <div className="p-8 text-center">Cargando historial...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">No se encontraron datos.</div>;

    const { encabezado, kpis, movimientos } = data || { encabezado: {}, kpis: {}, movimientos: [] };

    if (mostrandoBusqueda) {
        return (
            <div className="p-6 bg-slate-50 min-h-screen flex flex-col items-center pt-20">
                <div className="w-full max-w-2xl text-center space-y-8">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-800 tracking-tight mb-2">Historial de Artículos</h1>
                        <p className="text-slate-500">Busca un producto para ver su kardex detallado</p>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-4 text-slate-400 w-6 h-6" />
                        <input
                            type="text"
                            className="w-full h-14 pl-14 pr-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 text-lg shadow-sm transition-all"
                            placeholder="Buscar por código o descripción..."
                            value={busqueda}
                            onChange={handleSearchChange}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-3">
                        {resultados.map(r => (
                            <button
                                key={r.id}
                                onClick={() => navigate(`/inventario/historial/${r.id}`)}
                                className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="text-left">
                                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600">{r.descripcion}</h3>
                                    <p className="text-xs text-slate-500">Code: {r.numeroArticulo}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-slate-700 block">Stock: {r.stockActual}</span>
                                    <span className="text-xs text-slate-400">{r.unidadMedida}</span>
                                </div>
                            </button>
                        ))}
                        {busqueda && resultados.length === 0 && (
                            <div className="text-slate-400 py-4">No se encontraron productos</div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            {/* Header with Navigation */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            {encabezado?.descripcion || 'Artículo sin nombre'}
                            <span className={`text-xs px-2 py-1 rounded-full ${encabezado?.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {encabezado?.estado || 'N/A'}
                            </span>
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><Tag className="w-4 h-4" /> {encabezado.codigo}</span>
                            <span className="flex items-center gap-1"><Box className="w-4 h-4" /> {encabezado.categoria}</span>
                            <span>U.M: {encabezado.unidadMedida}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={async () => {
                        if (!confirm('¿Estás seguro de conciliar el stock basándose en el historial completo de todos los almacenes?')) return;
                        try {
                            const res = await fetch(`${API_BASE}/Articulos/${articuloId}/RecalculateStock`, { method: 'POST' });
                            const json = await res.json();
                            if (res.ok) {
                                toast.success(`Stock conciliado: ${json.nuevoStock}`);

                                // Print Report
                                const printContent = `
                                    <html>
                                    <head>
                                        <title>Reporte de Conciliación - ${encabezado.descripcion}</title>
                                        <style>
                                            body { font-family: 'Segoe UI', sans-serif; padding: 20px; font-size: 12px; }
                                            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                                            .title { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
                                            .subtitle { color: #555; }
                                            .section { margin-bottom: 20px; page-break-inside: avoid; }
                                            .section-title { font-size: 16px; font-weight: bold; color: #4338ca; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px; }
                                            
                                            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
                                            .kpi-card { border: 1px solid #ddd; padding: 10px; border-radius: 6px; background: #f9fafb; text-align: center; }
                                            .kpi-label { color: #666; font-size: 11px; text-transform: uppercase; }
                                            .kpi-value { font-size: 18px; font-weight: bold; color: #111; }
                                            
                                            .table { width: 100%; border-collapse: collapse; font-size: 11px; }
                                            .table th, .table td { border: 1px solid #e5e7eb; padding: 6px; text-align: left; }
                                            .table th { background-color: #f3f4f6; font-weight: bold; color: #374151; }
                                            .text-right { text-align: right; }
                                            
                                            .footer { margin-top: 30px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
                                        </style>
                                    </head>
                                    <body>
                                        <div class="header">
                                            <div class="title">Reporte de Conciliación de Inventario</div>
                                            <div class="subtitle">${new Date().toLocaleString()} - Generado tras Recálculo</div>
                                        </div>

                                        <div class="info" style="display: flex; justify-content: space-between; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                                            <div>
                                                <p><strong>Artículo:</strong> ${encabezado.descripcion}</p>
                                                <p><strong>Código:</strong> ${encabezado.codigo}</p>
                                            </div>
                                            <div class="text-right">
                                                <p><strong>Categoría:</strong> ${encabezado.categoria}</p>
                                                <p><strong>Unidad:</strong> ${encabezado.unidadMedida}</p>
                                            </div>
                                        </div>

                                        <!-- KPIs Conciliados -->
                                        <div class="section">
                                            <div class="section-title">Resultados de la Conciliación</div>
                                            <div class="kpi-grid">
                                                <div class="kpi-card">
                                                    <div class="kpi-label">Stock Anterior</div>
                                                    <div class="kpi-value">${formatNumber(json.stockAnterior !== undefined ? json.stockAnterior : 0)}</div>
                                                </div>
                                                <div class="kpi-card">
                                                    <div class="kpi-label">Stock Nuevo</div>
                                                    <div class="kpi-value">${formatNumber(json.nuevoStock || 0)}</div>
                                                </div>
                                                <div class="kpi-card">
                                                    <div class="kpi-label">Total Entradas</div>
                                                    <div class="kpi-value text-green-600">+${formatNumber(json.totalEntradas || 0)}</div>
                                                </div>
                                                <div class="kpi-card">
                                                    <div class="kpi-label">Total Salidas</div>
                                                    <div class="kpi-value text-red-600">-${formatNumber(json.totalSalidas || 0)}</div>
                                                </div>
                                                <div className="kpi-card">
                                                    <div className="kpi-label">Total Compras</div>
                                                    <div className="kpi-value text-blue-600">+${formatNumber(json.totalCompras || json.TotalCompras || 0)}</div>
                                                </div>
                                                <div className="kpi-card">
                                                    <div className="kpi-label">Entradas por Recepción</div>
                                                    <div className="kpi-value text-green-600">+${formatNumber(json.entradasRecepcion || json.EntradasRecepcion || 0)}</div>
                                                </div>
                                            </div>
                                            <div style="font-size: 14px; text-align: center; padding: 10px; background: ${json.diferencia === 0 ? '#f0fdf4' : '#fef2f2'}; color: ${json.diferencia === 0 ? '#15803d' : '#b91c1c'}; border-radius: 6px; border: 1px solid currentColor;">
                                                <strong>Ajuste Realizado: ${json.diferencia > 0 ? '+' : ''}${formatNumber(json.diferencia)}</strong>
                                                ${json.diferencia === 0 ? '(El inventario ya estaba correcto)' : '(Se corrigió el inventario re-sumando historial)'}
                                            </div>
                                        </div>

                                        <!-- Movements Table -->
                                        <div class="section">
                                            <div class="section-title">Historial Completo Utilizado para Cálculo</div>
                                            <table class="table">
                                                <thead>
                                                    <tr>
                                                        <th>Fecha</th>
                                                        <th>Tipo</th>
                                                        <th>Doc</th>
                                                        <th class="text-right">Ctd</th>
                                                        <th class="text-right">Costo</th>
                                                        <th>Almacén</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${(json.movimientos || data?.movimientos || []).map(mov => `
                                                        <tr>
                                                            <td>${new Date(mov.fechaMovimiento || mov.FechaMovimiento).toLocaleString()}</td>
                                                            <td>${mov.tipoMovimiento || mov.TipoMovimiento}</td>
                                                            <td>${mov.referencia || mov.Referencia || mov.documento || '-'}</td>
                                                            <td class="text-right" style="color: ${(mov.cantidad || mov.Cantidad) > 0 ? '#16a34a' : '#dc2626'}">
                                                                ${formatNumber(mov.cantidad || mov.Cantidad)}
                                                            </td>
                                                            <td class="text-right">${formatCurrency(mov.costo || mov.Costo || 0)}</td>
                                                            <td>${mov.almacenNombre || mov.AlmacenId || '-'}</td>
                                                        </tr>
                                                    `).join('')}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div class="footer">
                                            Generado por Sistema Crono POS - Auditoría de Inventario
                                        </div>
                                    </body>
                                    </html>
                                `;

                                const printWindow = window.open('', '', 'width=800,height=600');
                                printWindow.document.write(printContent);
                                printWindow.document.close();
                                printWindow.focus();
                                setTimeout(() => {
                                    printWindow.print();
                                    printWindow.close();
                                    // Reload after print dialog interaction
                                    window.location.reload();
                                }, 500);

                            } else {
                                toast.error(json.message);
                            }
                        } catch (e) {
                            console.error(e);
                            toast.error('Error al conciliar');
                        }
                    }} className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg shadow-sm text-slate-600 hover:bg-slate-200 font-medium border border-slate-200 text-xs">
                        <RefreshCw className="w-3 h-3" /> Auditar (Recálculo)
                    </button>

                    <button onClick={handleOpenAdjust} className="flex items-center gap-2 bg-hd-orange px-4 py-2 rounded-lg shadow-sm text-white hover:bg-orange-600 font-medium border border-transparent">
                        <RefreshCw className="w-4 h-4" /> Ajustar Stock
                    </button>

                    <button onClick={fetchData} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm text-indigo-600 hover:bg-indigo-50 font-medium border border-slate-200">
                        <RefreshCw className="w-4 h-4" /> Actualizar
                    </button>
                </div>
            </div>

            {/* Quick Adjust Modal */}
            {
                showAdjustModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Ajuste Rápido de Inventario</h3>

                            <div className="space-y-4">
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Stock Sistema:</span>
                                    <span className="font-mono font-bold text-lg">{kpis.existenciaActual}</span>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Físico Real</label>
                                    <input
                                        type="number"
                                        autoFocus
                                        className="w-full text-2xl font-bold text-center border-2 border-indigo-100 focus:border-indigo-500 rounded-lg py-2"
                                        value={realStock}
                                        onChange={e => setRealStock(e.target.value)}
                                    />
                                </div>

                                {realStock !== '' && (
                                    <div className={`text-center text-sm font-medium py-2 rounded ${parseFloat(realStock) - kpis.existenciaActual >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                        Diferencia: {parseFloat(realStock) - kpis.existenciaActual > 0 ? '+' : ''}{(parseFloat(realStock) - kpis.existenciaActual).toFixed(2)}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                                    <select
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        value={selectedMotivo}
                                        onChange={e => setSelectedMotivo(e.target.value)}
                                    >
                                        {motivos.map(m => (
                                            <option key={m.id} value={m.id}>{m.motivo}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nota</label>
                                    <input
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500"
                                        placeholder="Opcional..."
                                        value={adjustNote}
                                        onChange={e => setAdjustNote(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowAdjustModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmAdjust}
                                    className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium shadow-sm transition-colors"
                                >
                                    Confirmar Ajuste
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <KpiCard
                    title="Existencia Actual"
                    value={formatNumber(kpis.existenciaActual)}
                    icon={Box}
                    colorClass="text-blue-600"
                    subtext={`Costo uni: ${formatCurrency(encabezado.costoUnitario)}`}
                />
                <KpiCard
                    title="Total Compras"
                    value={formatNumber(kpis.totalCompras)}
                    icon={ShoppingCart}
                    colorClass="text-emerald-600"
                    subtext="Entradas por Recepción"
                />
                <KpiCard
                    title="Total Ventas"
                    value={formatNumber(kpis.totalVentas)}
                    icon={TrendingUp}
                    colorClass="text-rose-500"
                    subtext="Salidas por Facturación"
                />
                <KpiCard
                    title="Entradas Totales"
                    value={formatNumber(kpis.entradasTotales)}
                    icon={ArrowUp}
                    colorClass="text-green-600"
                />
                <KpiCard
                    title="Salidas Totales"
                    value={formatNumber(kpis.salidasTotales)}
                    icon={ArrowDown}
                    colorClass="text-red-600"
                />
                <KpiCard
                    title="Balance Neto"
                    value={formatNumber(kpis.balanceNeto)}
                    icon={Info}
                    colorClass={kpis.balanceNeto >= 0 ? "text-slate-600" : "text-amber-600"}
                    subtext="En periodo seleccionado"
                />
            </div>

            {/* Filters (Basic implementation) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Desde</label>
                    <input
                        type="date"
                        className="input-field-sm"
                        value={filters.fechaInicio}
                        onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Hasta</label>
                    <input
                        type="date"
                        className="input-field-sm"
                        value={filters.fechaFin}
                        onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
                    />
                </div>
                {/* Add more filters here if needed */}
            </div>

            {/* Stock Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <Box className="w-5 h-5" /> Distribución de Stock por Almacén
                    </h3>
                    <button
                        onClick={() => {
                            const printContent = `
                                <html>
                                <head>
                                    <title>Reporte de Articulo - ${encabezado.descripcion}</title>
                                    <style>
                                        body { font-family: 'Segoe UI', sans-serif; padding: 20px; font-size: 12px; }
                                        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                                        .title { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
                                        .subtitle { color: #555; }
                                        .section { margin-bottom: 20px; page-break-inside: avoid; }
                                        .section-title { font-size: 16px; font-weight: bold; color: #4338ca; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px; }
                                        
                                        .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
                                        .kpi-card { border: 1px solid #ddd; padding: 10px; border-radius: 6px; background: #f9fafb; text-align: center; }
                                        .kpi-label { color: #666; font-size: 11px; text-transform: uppercase; }
                                        .kpi-value { font-size: 18px; font-weight: bold; color: #111; }
                                        
                                        .table { width: 100%; border-collapse: collapse; font-size: 11px; }
                                        .table th, .table td { border: 1px solid #e5e7eb; padding: 6px; text-align: left; }
                                        .table th { background-color: #f3f4f6; font-weight: bold; color: #374151; }
                                        .text-right { text-align: right; }
                                        .total-row { font-weight: bold; background-color: #f3f4f6; }
                                        
                                        .dist-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
                                        .dist-item { border: 1px solid #eee; padding: 8px; border-radius: 4px; }
                                        .dist-bar-bg { height: 8px; background: #eee; border-radius: 4px; margin-top: 4px; overflow: hidden; }
                                        .dist-bar { height: 100%; background: #4f46e5; }
                                        
                                        .footer { margin-top: 30px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
                                        
                                        @media print {
                                            body { padding: 0; }
                                            .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                                            table { page-break-inside: auto; }
                                            tr { page-break-inside: avoid; page-break-after: auto; }
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div class="header">
                                        <div class="title">Reporte Detallado de Artículo</div>
                                        <div class="subtitle">${new Date().toLocaleString()}</div>
                                    </div>

                                    <div class="info" style="display: flex; justify-content: space-between; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                                        <div>
                                            <p><strong>Artículo:</strong> ${encabezado.descripcion}</p>
                                            <p><strong>Código:</strong> ${encabezado.codigo}</p>
                                        </div>
                                        <div class="text-right">
                                            <p><strong>Categoría:</strong> ${encabezado.categoria}</p>
                                            <p><strong>Unidad:</strong> ${encabezado.unidadMedida}</p>
                                        </div>
                                    </div>

                                    <!-- KPIs -->
                                    <div class="section">
                                        <dvi class="section-title">Resumen de Inventario</div>
                                        <div class="kpi-grid">
                                            <div class="kpi-card">
                                                <div class="kpi-label">Existencia Actual</div>
                                                <div class="kpi-value">${formatNumber(kpis.existenciaActual)}</div>
                                            </div>
                                            <div class="kpi-card">
                                                <div class="kpi-label">Total Entradas</div>
                                                <div class="kpi-value text-green-600">+${formatNumber(kpis.entradasTotales)}</div>
                                            </div>
                                            <div class="kpi-card">
                                                <div class="kpi-label">Total Salidas</div>
                                                <div class="kpi-value text-red-600">-${formatNumber(kpis.salidasTotales)}</div>
                                            </div>
                                             <div class="kpi-card">
                                                <div class="kpi-label">Compras (Periodo)</div>
                                                <div class="kpi-value" style="color: #4f46e5;">+${formatNumber(kpis.totalCompras)}</div>
                                            </div>
                                             <div class="kpi-card">
                                                <div class="kpi-label">Ventas (Periodo)</div>
                                                <div class="kpi-value" style="color: #ea580c;">-${formatNumber(kpis.totalVentas)}</div>
                                            </div>
                                            <div class="kpi-card">
                                                <div class="kpi-label">Balance Neto</div>
                                                <div class="kpi-value">${formatNumber(kpis.balanceNeto)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Distribution -->
                                    <div class="section">
                                        <div class="section-title">Distribución por Almacén</div>
                                        <div class="dist-grid">
                                            ${data.stockDistribucion.map(d => {
                                const totalStock = kpis.existenciaActual > 0 ? kpis.existenciaActual : 1;
                                const percentage = Math.max(0, Math.min(100, (d.stock / totalStock) * 100));
                                return `
                                                <div class="dist-item">
                                                    <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                                                        <strong>${d.almacen}</strong>
                                                        <span>${formatNumber(d.stock)}</span>
                                                    </div>
                                                    <div class="dist-bar-bg">
                                                        <div class="dist-bar" style="width: ${percentage}%"></div>
                                                    </div>
                                                </div>
                                                `;
                            }).join('')}
                                        </div>
                                    </div>

                                    <!-- Movements Table -->
                                    <div class="section">
                                        <div class="section-title">Historial de Movimientos</div>
                                        <table class="table">
                                            <thead>
                                                <tr>
                                                    <th>Fecha</th>
                                                    <th>Tipo</th>
                                                    <th>Doc</th>
                                                    <th class="text-right">Entrada</th>
                                                    <th class="text-right">Salida</th>
                                                    <th class="text-right">Balance</th>
                                                    <th>Almacén</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${(data?.movimientos || []).map(mov => `
                                                    <tr>
                                                        <td>${new Date(mov.fechaMovimiento).toLocaleString()}</td>
                                                        <td>${mov.tipoMovimiento}</td>
                                                        <td>${mov.referencia || mov.documento || '-'}</td>
                                                        <td class="text-right" style="color: ${mov.entrada > 0 ? '#16a34a' : 'inherit'}">
                                                            ${mov.entrada > 0 ? formatNumber(mov.entrada) : '-'}
                                                        </td>
                                                        <td class="text-right" style="color: ${mov.salida > 0 ? '#dc2626' : 'inherit'}">
                                                            ${mov.salida > 0 ? formatNumber(mov.salida) : '-'}
                                                        </td>
                                                        <td class="text-right"><b>${formatNumber(mov.balance)}</b></td>
                                                        <td>${mov.almacenNombre}</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div class="footer">
                                        Generado por Sistema Crono POS - Documento Interno
                                    </div>
                                </body>
                                </html>
                            `;
                            const printWindow = window.open('', '', 'width=800,height=600');
                            printWindow.document.write(printContent);
                            printWindow.document.close();
                            printWindow.focus();
                            setTimeout(() => {
                                printWindow.print();
                                printWindow.close();
                            }, 500);
                        }}
                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir Reporte
                    </button>
                </div>
                {data.stockDistribucion && data.stockDistribucion.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.stockDistribucion.map((dist, idx) => {
                            const totalStock = data.kpis.existenciaActual > 0 ? data.kpis.existenciaActual : 1;
                            const percentage = Math.max(0, Math.min(100, (dist.stock / totalStock) * 100));

                            return (
                                <div key={idx} className="relative">
                                    <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                                        <span>{dist.almacen}</span>
                                        <span className="text-slate-900 font-bold">{formatNumber(dist.stock)}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className={`h-2.5 rounded-full ${dist.stock > 0 ? 'bg-indigo-500' : 'bg-red-400'}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-slate-500 italic text-sm">No hay información de distribución por almacén.</p>
                )}
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                        Historial de Movimientos
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setGroupByWarehouse(!groupByWarehouse)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${groupByWarehouse
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            <Box className="w-4 h-4" />
                            {groupByWarehouse ? 'Desagrupar' : 'Agrupar por Almacén'}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-4"></div>
                        <p>Cargando historial...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3">Fecha / Hora</th>
                                    <th className="px-6 py-3">Tipo</th>
                                    <th className="px-6 py-3">Documento</th>
                                    <th className="px-6 py-3 text-right text-green-700 bg-green-50">Entrada</th>
                                    <th className="px-6 py-3 text-right text-red-700 bg-red-50">Salida</th>
                                    <th className="px-6 py-3 text-right">Stock</th>
                                    <th className="px-6 py-3">Almacén</th>
                                    <th className="px-6 py-3">Usuario</th>
                                    <th className="px-6 py-3">Info</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {groupByWarehouse && groupedMovements ? (
                                    Object.entries(groupedMovements).map(([almacen, movs]) => (
                                        <React.Fragment key={almacen}>
                                            <tr className="bg-slate-50/80">
                                                <td colSpan="9" className="px-6 py-2 font-semibold text-slate-700 border-t border-b border-slate-200">
                                                    <div className="flex items-center gap-2">
                                                        <Box className="w-4 h-4 text-indigo-500" />
                                                        {almacen}
                                                        <span className="text-xs font-normal text-slate-500 ml-2">({movs.length} movimientos)</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            {movs.map((mov) => (
                                                <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-3 whitespace-nowrap text-slate-600">
                                                        {new Date(mov.fechaMovimiento).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-3 font-medium text-slate-700">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${mov.entrada > 0
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : mov.salida > 0
                                                                ? 'bg-rose-100 text-rose-800'
                                                                : 'bg-slate-100 text-slate-800'
                                                            }`}>
                                                            {mov.tipoMovimiento}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-slate-500 font-mono text-xs">
                                                        {mov.numeroDocumento || mov.referencia || '-'}
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-medium text-emerald-600 bg-green-50/30">
                                                        {mov.entrada > 0 ? `+${formatNumber(mov.entrada)}` : '-'}
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-medium text-rose-600 bg-red-50/30">
                                                        {mov.salida > 0 ? `-${formatNumber(mov.salida)}` : '-'}
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-xs text-slate-500 bg-slate-50/50">
                                                        {mov.stockAnterior !== undefined && mov.stockAnterior !== null
                                                            ? <>{formatNumber(mov.stockAnterior)} <span className="mx-1">→</span> <strong className="text-slate-700 text-sm">{formatNumber(mov.balance || 0)}</strong></>
                                                            : <strong className="text-slate-700 text-sm">{formatNumber(mov.balance || 0)}</strong>
                                                        }
                                                    </td>
                                                    <td className="px-6 py-3 text-slate-600">
                                                        {mov.almacenNombre}
                                                    </td>
                                                    <td className="px-6 py-3 text-slate-500 text-xs">
                                                        {mov.usuario}
                                                    </td>
                                                    <td className="px-6 py-3 text-slate-500 text-xs font-mono">
                                                        {mov.referencia || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    movimientos.length > 0 ? (
                                        movimientos.map((mov) => (
                                            <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-3 whitespace-nowrap text-slate-600">
                                                    {new Date(mov.fechaMovimiento).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-3 font-medium text-slate-700">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${mov.entrada > 0
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : mov.salida > 0
                                                            ? 'bg-rose-100 text-rose-800'
                                                            : 'bg-slate-100 text-slate-800'
                                                        }`}>
                                                        {mov.tipoMovimiento}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-slate-500 font-mono text-xs">
                                                    {mov.numeroDocumento || mov.referencia || '-'}
                                                </td>
                                                <td className="px-6 py-3 text-right font-medium text-emerald-600 bg-green-50/30">
                                                    {mov.entrada > 0 ? `+${formatNumber(mov.entrada)}` : '-'}
                                                </td>
                                                <td className="px-6 py-3 text-right font-medium text-rose-600 bg-red-50/30">
                                                    {mov.salida > 0 ? `-${formatNumber(mov.salida)}` : '-'}
                                                </td>
                                                <td className="px-6 py-3 text-right text-xs text-slate-500 bg-slate-50/50">
                                                    {mov.stockAnterior !== undefined && mov.stockAnterior !== null
                                                        ? <>{formatNumber(mov.stockAnterior)} <span className="mx-1">→</span> <strong className="text-slate-700 text-sm">{formatNumber(mov.balance || 0)}</strong></>
                                                        : <strong className="text-slate-700 text-sm">{formatNumber(mov.balance || 0)}</strong>
                                                    }
                                                </td>
                                                <td className="px-6 py-3 text-slate-600">
                                                    {mov.almacenNombre}
                                                </td>
                                                <td className="px-6 py-3 text-slate-500 text-xs">
                                                    {mov.usuario}
                                                </td>
                                                <td className="px-6 py-3 text-slate-500 text-xs font-mono">
                                                    {mov.referencia || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="px-6 py-12 text-center text-slate-500">
                                                No se encontraron movimientos para el rango seleccionado
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div >
    );
};

export default HistorialArticulo;

