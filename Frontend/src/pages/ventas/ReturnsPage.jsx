import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, ArrowLeft, Printer, RefreshCcw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom'; // Import useSearchParams
import { createReturn, getReturnReport } from '../../api/returns'; // Keep createReturn as it's used later
import InvoiceSelector from '../../components/ventas/InvoiceSelector';
import HelpModal from '../../components/ventas/ReturnsHelpModal';

const ReturnsPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams(); // Hook
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [saleData, setSaleData] = useState(null);
    const [details, setDetails] = useState([]);
    const [selectedItems, setSelectedItems] = useState({}); // { itemId: { quantity: 1, returnToStock: true } }
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showInvoiceSelector, setShowInvoiceSelector] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [report, setReport] = useState(null);
    const [returnReason, setReturnReason] = useState('Damaged'); // Default reason

    // Auto-load from URL
    useEffect(() => {
        const invParam = searchParams.get('invoice');
        if (invParam) {
            setInvoiceNumber(invParam);
            handleSearch(invParam);
        }
    }, [searchParams]);

    const handleSearch = async (invNum = invoiceNumber) => {
        if (!invNum || !invNum.trim()) {
            setError('Ingrese un número de factura');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        setSaleData(null);
        setDetails([]);
        setSelectedItems({});

        try {
            const API_URL = import.meta.env.VITE_API_URL || '/api';
            const response = await fetch(`${API_URL}/Returns/Search/${invNum.trim()}`);

            if (response.ok) {
                const data = await response.json();
                setSaleData(data.venta || data.Venta);
                // Map details to local state
                setDetails(data.detalles || data.Detalles || []);
            } else {
                setError('Factura no encontrada o no elegible para devolución.');
                setSaleData(null);
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión con el servidor.');
            setSaleData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleInvoiceSelect = (invoice) => {
        console.log("Invoice Selected:", invoice);
        setShowInvoiceSelector(false);
        const invNum = invoice.numeroFactura || invoice.NumeroFactura;
        console.log("Extracted Invoice Number:", invNum);

        if (invoice && invNum) {
            setInvoiceNumber(invNum);
            // Wait a tick or just call search
            handleSearch(invNum);
        } else {
            console.error("Could not extract invoice number from selection");
        }
    };

    // ... (rest of details handling)

    const handleQuantityChange = (detailId, qty) => {
        setSelectedItems(prev => {
            const current = prev[detailId] || { returnToStock: true };
            if (qty <= 0) {
                const { [detailId]: deleted, ...rest } = prev;
                return rest;
            }
            return { ...prev, [detailId]: { ...current, quantity: qty } };
        });
    };

    const handleAction = async (actionType) => {
        if (!Object.keys(selectedItems).length) {
            alert("⚠️ Por favor, ingrese la cantidad a devolver en al menos un artículo.");
            return;
        }

        setLoading(true);
        try {
            // Build DTO
            const returnDetails = Object.keys(selectedItems).map(id => {
                const item = details.find(d => d.articuloId === parseInt(id) || d.id === parseInt(id)); // Match ID carefully
                // details from API: d.ArticuloId, d.Cantidad, d.PrecioUnitario...
                // The key in selectedItems should be ArticuloId properly if uniqueness holds or ID of detail line.
                // Let's assume detail.ArticuloId is unique enough per invoice for now or use row index if needed.
                // Retrying logic: 'details' array has 'articuloId'. unique? usually yes in simple POS.
                const detailInfo = details.find(d => d.articuloId == id);
                return {
                    articuloId: parseInt(id),
                    cantidad: selectedItems[id].quantity,
                    precioUnitario: detailInfo.precioUnitario,
                    retornarAlStock: true // Default true for now
                };
            });

            // Calculate Total (approx)
            const totalRefund = returnDetails.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);

            const payload = {
                VentaId: saleData.id || saleData.Id,
                TipoAccion: actionType,
                Razon: "Solicitado por cliente",
                TotalReembolsado: totalRefund,
                Usuario: "Admin",
                Detalles: returnDetails
            };

            console.log("Sending Return Payload:", payload);

            const result = await createReturn(payload);
            console.log('Create return result:', result);

            // Fetch detailed report for accounting validation
            const returnId = result.returnId || result.ReturnId;
            if (returnId) {
                try {
                    const rpt = await getReturnReport(returnId);
                    console.log('Report fetched:', rpt);
                    setReport(rpt);
                } catch (e) {
                    console.error('Error fetching return report:', e);
                }
            }

            if (actionType === 'Cambio') {
                // Redirect to POS with credit note
                navigate('/ventas/pos', { state: { creditNoteId: result.creditNoteId, creditAmount: totalRefund } });
            } else {
                alert(`Proceso Completado. ${result.message}`);
                setSaleData(null);
                setInvoiceNumber('');
                setDetails([]);
                // Keep report visible after reset if needed
            }

        } catch (err) {
            console.error(err);
            setError('Error procesando la devolución.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen font-sans animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#F96302]">Devoluciones y Notas de Crédito</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/ventas/historial-devoluciones')}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-bold hover:bg-gray-300 transition flex items-center gap-2"
                    >
                        <RefreshCcw size={18} />
                        Historial
                    </button>
                    <button
                        onClick={() => setShowHelp(true)}
                        className="flex items-center gap-2 text-gray-500 hover:text-[#F96302] transition font-bold"
                        title="Ver Guía de Ayuda"
                    >
                        <span className="bg-white h-8 w-8 rounded-full shadow flex items-center justify-center text-lg">?</span>
                        <span className="hidden md:inline">Ayuda</span>
                    </button>
                </div>
            </div>

            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

            {showInvoiceSelector && (
                <InvoiceSelector
                    onSelect={handleInvoiceSelect}
                    onCancel={() => setShowInvoiceSelector(false)}
                />
            )}

            {/* Search Section */}
            <div className="bg-white p-6 rounded shadow-md mb-6">
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-bold mb-2">Número de Factura</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                className="w-full border p-2 rounded text-lg uppercase"
                                placeholder="FACT-000000"
                            />
                            <button
                                onClick={() => setShowInvoiceSelector(true)}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded font-bold hover:bg-gray-300 transition flex items-center gap-2"
                                title="Buscar Factura"
                            >
                                🔍
                            </button>
                        </div>

                    </div>
                    <button
                        onClick={() => handleSearch()}
                        disabled={loading}
                        className="bg-[#F96302] text-white px-6 py-2 rounded font-bold hover:bg-[#d85502] transition h-[46px]"
                    >
                        {loading ? 'Buscando...' : 'Buscar'}
                    </button>
                </div>
                {error && <p className="text-red-600 mt-2 font-bold">{error}</p>}
            </div>

            {/* Details Section */}
            {saleData && (
                <div className="bg-white p-6 rounded shadow-md animate-fade-in">
                    <div className="flex justify-between items-end mb-4 border-b pb-4">
                        <div className="space-y-1">
                            <p className="text-gray-600 text-sm">Cliente</p>
                            <p className="font-bold text-xl text-gray-900">{saleData.clienteId || saleData.ClienteId}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-gray-600 text-sm">Factura</p>
                            <p className="font-bold text-xl text-gray-900">{saleData.numeroFactura || saleData.NumeroFactura || invoiceNumber}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-gray-600 text-sm">Fecha</p>
                            <p className="font-bold text-xl text-gray-900">{new Date(saleData.fecha || saleData.Fecha).toLocaleDateString()}</p>
                        </div>
                        {(saleData.ncf || saleData.NCF) && (
                            <div className="space-y-1">
                                <p className="text-gray-600 text-sm">NCF</p>
                                <p className="font-bold text-xl text-blue-600">{saleData.ncf || saleData.NCF}</p>
                            </div>
                        )}
                        <div className="text-right space-y-1">
                            <p className="text-gray-600 text-sm">Total Factura</p>
                            <p className="font-black text-3xl text-green-600">${(saleData.total || saleData.Total)?.toFixed(2)}</p>
                        </div>
                    </div>

                    <table className="w-full mb-6 border border-gray-300">
                        <thead className="bg-gray-800 text-white">
                            <tr>
                                <th className="p-3 text-left">Artículo</th>
                                <th className="p-3 text-center">Cant. Comprada</th>
                                <th className="p-3 text-center">Precio</th>
                                <th className="p-3 text-center bg-[#F96302]">Cant. a Devolver</th>
                            </tr>
                        </thead>
                        <tbody>
                            {details.map(item => (
                                <tr key={item.articuloId || item.ArticuloId} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-medium text-black">{item.articuloDescripcion || item.ArticuloDescripcion || item.Descripcion || item.descripcion}</td>
                                    <td className="p-3 text-center text-black">{item.cantidad || item.Cantidad}</td>
                                    <td className="p-3 text-center text-black">${(item.precioUnitario || item.PrecioUnitario)?.toFixed(2)}</td>
                                    <td className="p-3 text-center bg-orange-50">
                                        <input
                                            type="number"
                                            min="0"
                                            max={item.cantidad || item.Cantidad}
                                            className="border-2 border-gray-400 p-2 w-24 text-center text-lg font-bold rounded focus:border-[#F96302] focus:outline-none"
                                            placeholder="0"
                                            onChange={(e) => handleQuantityChange(item.articuloId || item.ArticuloId, parseFloat(e.target.value))}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 mt-6">
                        <button
                            onClick={() => handleAction('SoloDevolucion')}
                            className="bg-gray-700 text-white px-6 py-3 rounded font-bold hover:bg-gray-800 shadow-lg text-lg"
                            title="Regresa los artículos al inventario sin generar reembolso. Úselo para correcciones."
                        >
                            Solo Devolución (Inv)
                        </button>
                        <button
                            onClick={() => handleAction('Reembolso')}
                            className="bg-red-600 text-white px-6 py-3 rounded font-bold hover:bg-red-700 shadow-lg text-lg"
                            title="Devuelve dinero en efectivo y regresa artículos al inventario."
                        >
                            Reembolso (Efectivo)
                        </button>
                        <button
                            onClick={() => handleAction('Cambio')}
                            className="bg-green-600 text-white px-6 py-3 rounded font-bold hover:bg-green-700 shadow-lg text-lg"
                            title="Genera una Nota de Crédito para usar en una nueva compra futura."
                        >
                            Cambio (Nota Crédito)
                        </button>
                    </div>
                </div>
            )}
            {/* Return Report */}
            {report && (
                <div className="mt-8 p-4 bg-white rounded shadow">
                    <h2 className="text-xl font-bold mb-4">Reporte de Devolución (ID: {(report.Master || report.master)?.Id})</h2>
                    <table className="w-full border">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="p-2 text-left">Artículo</th>
                                <th className="p-2 text-center">Cantidad</th>
                                <th className="p-2 text-center">Precio Unitario</th>
                                <th className="p-2 text-center">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(report.Detalles || report.detalles || []).map((d, i) => (
                                <tr key={i} className="border-t">
                                    <td className="p-2">{d.ArticuloDescripcion || d.Descripcion || d.ArticuloId}</td>
                                    <td className="p-2 text-center">{d.Cantidad || d.cantidad}</td>
                                    <td className="p-2 text-center">${(d.PrecioUnitario || d.precioUnitario).toFixed(2)}</td>
                                    <td className="p-2 text-center">${((d.Cantidad || d.cantidad) * (d.PrecioUnitario || d.precioUnitario)).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-4 text-right font-bold">
                        Total Calculado: ${(report.TotalCalculado || report.totalCalculado)?.toFixed(2)}
                        {(report.TotalesCoinciden !== undefined ? report.TotalesCoinciden : report.totalesCoinciden) ? (
                            <span className="text-green-600 ml-2">(Coinciden)</span>
                        ) : (
                            <span className="text-red-600 ml-2">(Discrepancia)</span>
                        )}
                    </div>
                </div>
            )}
        </div >
    );
};

export default ReturnsPage;

