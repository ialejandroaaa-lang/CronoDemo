import React, { useState, useEffect } from 'react';
import { CreditCard, Banknote, X, CheckCircle2, Loader2, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { printReceipt } from '../receipt/PrintService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';

const CheckoutModal = ({ isOpen, onClose, cartData, onComplete, selectedWarehouseId = 1, creditNote = null }) => {
    // Logic: If creditNote exists, it covers up to grandTotal
    const creditDeduction = creditNote ? Math.min(creditNote.amount, cartData.grandTotal) : 0;
    const remainingTotal = Math.max(0, cartData.grandTotal - creditDeduction);

    const [loading, setLoading] = useState(false);
    const [sequences, setSequences] = useState([]);
    const [selectedNCF, setSelectedNCF] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');
    const [receivedAmount, setReceivedAmount] = useState(cartData.grandTotal.toString());
    const [change, setChange] = useState(0);
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState({ id: 1, nombre: 'CONSUMIDOR FINAL (GENÉRICO)' });
    const [companyConfig, setCompanyConfig] = useState(null);
    const [monedas, setMonedas] = useState([]);
    const [monedaId, setMonedaId] = useState(null);
    const [tasaCambio, setTasaCambio] = useState(1);

    useEffect(() => {
        if (isOpen) {
            loadData();
            // Default received amount is remaining total
            const creditDed = creditNote ? Math.min(creditNote.amount, cartData.grandTotal) : 0;
            const rem = Math.max(0, cartData.grandTotal - creditDed);
            setReceivedAmount(rem.toFixed(2));
        }
    }, [isOpen, creditNote, cartData.grandTotal]);

    const loadData = async () => {
        try {
            // 1. Fetch Sequences
            fetchSequences();

            // 2. Fetch Config
            let config = null;
            try {
                const configRes = await fetch(`${API_BASE}/CompanyConfiguration`);
                if (configRes.ok) {
                    config = await configRes.json();
                    setCompanyConfig(config);
                }
            } catch (e) {
                console.error("Error fetching config:", e);
            }

            // 3. Fetch Clients & Set Default
            const clientsRes = await fetch(`${API_BASE}/Clients`);
            if (clientsRes.ok) {
                const data = await clientsRes.json();
                const items = Array.isArray(data) ? data : (data.value || []);
                setClients(items);

                let defaultClient = null;

                // Priority 1: Configured Default Client
                if (config && config.defaultClientId) {
                    defaultClient = items.find(c => (c.id || c.Id) === config.defaultClientId);
                }

                // Priority 2: Fallback to 'CONSUMIDOR FINAL'
                if (!defaultClient) {
                    defaultClient = items.find(c => {
                        const name = (c.name || c.Name || '').toUpperCase();
                        return name.includes('CONSUMIDOR FINAL');
                    });
                }

                if (defaultClient) {
                    setSelectedClient({
                        id: defaultClient.id || defaultClient.Id,
                        nombre: defaultClient.name || defaultClient.Name,
                        tipoNCF: defaultClient.tipoNCF || defaultClient.TipoNCF,
                        moneda: defaultClient.moneda || defaultClient.Moneda || 'DOP'
                    });
                }

                // 4. Fetch Monedas
                const monRes = await fetch(`${API_BASE}/Monedas`);
                if (monRes.ok) {
                    const monData = await monRes.json();
                    setMonedas(monData);

                    // Set default moneda based on client
                    const clientMon = defaultClient?.moneda || defaultClient?.Moneda || 'DOP';
                    const matchedMon = monData.find(m => m.codigo === clientMon);
                    if (matchedMon) {
                        setMonedaId(matchedMon.id);
                        fetchRate(matchedMon.id);
                    } else {
                        const func = monData.find(m => m.esFuncional);
                        if (func) {
                            setMonedaId(func.id);
                            setTasaCambio(1);
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Error loading checkout data:", e);
        }
    };

    useEffect(() => {
        // Calculate converted grand total for display and received amount comparison
        // We assume the cartData.grandTotal is in the 'functional' currency or the currency it was added in.
        // Actually, PosPage provides the total in whatever currency the client has.
        // Let's assume cartData.grandTotal is the 'Transaction Total'.

        const val = parseFloat(receivedAmount) || 0;
        const creditDed = creditNote ? Math.min(creditNote.amount, cartData.grandTotal) : 0;
        const rem = Math.max(0, cartData.grandTotal - creditDed);
        setChange(Math.max(0, val - rem));
    }, [receivedAmount, cartData.grandTotal, creditNote]);

    // Sync NCF with Client
    useEffect(() => {
        if (selectedClient && selectedClient.tipoNCF) {
            // Check if client NCF exists in sequences
            const exists = sequences.some(s => s.tipoNCF === selectedClient.tipoNCF);
            if (exists) {
                setSelectedNCF(selectedClient.tipoNCF);
            }
        }
    }, [selectedClient, sequences]);

    const fetchSequences = async () => {
        try {
            const res = await fetch(`${API_BASE}/Ventas/NCF/Sequences`);
            if (res.ok) {
                const data = await res.json();
                setSequences(data);
                if (data.length > 0) setSelectedNCF(data[0].tipoNCF);
            }
        } catch (error) {
            console.error("Error loading NCF sequences:", error);
        }
    };

    const fetchRate = async (monId) => {
        if (!monId) return;
        const mon = monedas.find(m => m.id === parseInt(monId));
        if (mon && mon.esFuncional) {
            setTasaCambio(1);
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/Monedas/tasas?monedaId=${monId}`);
            if (res.ok) {
                const data = await res.json();
                setTasaCambio(data.tasa || 1);
            } else {
                setTasaCambio(1);
            }
        } catch (e) {
            console.error("Error fetching rate:", e);
            setTasaCambio(1);
        }
    };

    const handleProcess = async () => {
        try {
            setLoading(true);
            const payload = {
                ClienteId: parseInt(selectedClient.id),
                TipoNCF: selectedNCF,
                Fecha: new Date(),
                Subtotal: parseFloat(cartData.total),
                ITBIS: parseFloat(cartData.tax),
                Total: parseFloat(cartData.grandTotal),
                AlmacenId: parseInt(selectedWarehouseId),
                Usuario: 'Gabriel',
                MetodoPago: paymentMethod,
                MontoRecibido: paymentMethod === 'Efectivo' ? parseFloat(receivedAmount) : parseFloat(cartData.grandTotal),
                Cambio: paymentMethod === 'Efectivo' ? change : 0,
                MonedaId: monedaId,
                TasaCambio: tasaCambio,
                Detalles: cartData.items.map(item => {
                    const price = parseFloat(item.precioUnitario || item.PrecioUnitario || item.precio || 0);
                    return {
                        ArticuloId: parseInt(item.id || item.Id),
                        Cantidad: parseFloat(item.qty),
                        PrecioUnitario: price,
                        ITBIS: parseFloat((price * item.qty) * (0.18)),
                        TotalLinea: parseFloat((price * item.qty) * (1.18)),
                        AlmacenId: parseInt(selectedWarehouseId)
                    };
                })
            };

            // [NEW] Credit Note Data
            if (creditNote) {
                // Determine logic: If fully covered by CN
                const creditDed = Math.min(creditNote.amount, cartData.grandTotal);
                payload.CreditNoteId = parseInt(creditNote.id);
                payload.MontoPagoCredito = creditDed; // Tell backend how much to deduct from NC

                if (creditDed >= cartData.grandTotal) {
                    payload.MetodoPago = 'NotaCredito';
                    payload.MontoRecibido = 0; // Cash received is 0
                    payload.Cambio = 0;
                } else {
                    // Mixed payment
                    // Backend VentasController only sees ONE MetodoPago string for now.
                    // We send the User Selected method (e.g. Efectivo) for the Remainder.
                    // Backend handles the subtraction of CreditNote amount first.
                    // So payload.MontoRecibido should be the CASH part.
                    // And payload.Total is FULL total.
                    // Controller logic: 
                    // if (CreditNoteId) verify balance.
                    // But standard logic might check if MontoRecibido >= Total? 
                    // VentasController logic check:
                    // Lines 111-127 handle TerminosPago. 
                    // Line 197 check MontoRecibido > 0 for Receipt.
                    // It does NOT strictly validate (MontoRecibido + Credit) >= Total in the snippet I saw.
                    // But logically we should ensure it.
                }
            }

            const res = await fetch(`${API_BASE}/Ventas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Error al procesar venta");
            }

            const result = await res.json();

            // Imprimir recibo
            try {
                const receiptData = {
                    receipt: {
                        number: result.factura || result.numeroFactura || result.NumeroFactura,
                        NumeroRecibo: result.numeroRecibo || result.NumeroRecibo || result.factura || result.numeroFactura,
                        NumeroFactura: result.factura || result.numeroFactura || result.NumeroFactura,
                        ncf: result.ncf,
                        tipoNCF: result.tipoNCF,
                        date: result.fecha,
                        time: result.fecha,
                        cashier: payload.Usuario,
                        client: selectedClient.name || selectedClient.nombre || result.nombreCliente || 'CONSUMIDOR FINAL',
                        subtotal: result.subTotal || result.subtotal || payload.Subtotal,
                        tax: result.itbis || result.tax || payload.ITBIS,
                        total: result.total || payload.Total,
                        paymentMethod: paymentMethod,
                        receivedAmount: payload.MontoRecibido,
                        change: payload.Cambio
                    },
                    company: companyConfig || {
                        name: 'POS CRONO',
                        address: 'Calle Principal #1',
                        rnc: '123456789',
                        phone: '809-555-5555'
                    },
                    items: cartData.items.map(item => ({
                        description: item.name || item.descripcion || item.Descripcion,
                        qty: item.qty,
                        price: parseFloat(item.precioUnitario || item.PrecioUnitario || item.precio || 0),
                        total: parseFloat(item.qty) * parseFloat(item.precioUnitario || item.PrecioUnitario || item.precio || 0)
                    }))
                };

                await printReceipt(receiptData);
            } catch (printError) {
                console.error("Error al imprimir recibo:", printError);
                // No detenemos el flujo si falla la impresión, solo notificamos o logueamos
            }

            onComplete(result);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        const mon = monedas.find(m => m.id === parseInt(monedaId));
        const symbol = mon?.simbolo || '$';
        const code = mon?.codigo || 'DOP';
        return `${code} ${symbol}${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl bg-white p-0 overflow-hidden border-none shadow-2xl max-h-[92vh] flex flex-col">
                <div className="bg-hd-black px-4 py-3 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-black italic tracking-tighter">FINALIZAR VENTA</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hidden sm:block">Resumen de transacción</p>
                    </div>
                    <Button variant="ghost" onClick={onClose} size="sm" className="text-white hover:bg-white/10 h-8 w-8 p-0"><X size={18} /></Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto">
                    {/* Left Side: Summary */}
                    <div className="p-5 bg-gray-50 space-y-3 border-b md:border-b-0 md:border-r border-gray-200">
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500">Subtotal</span>
                                <span className="text-xs font-bold text-gray-800">{formatCurrency(cartData.total)}</span>
                            </div>
                            {cartData.autoDiscountTotal > 0 && (
                                <div className="flex justify-between items-center text-hd-orange animate-in fade-in">
                                    <span className="text-[10px] font-bold uppercase italic">Ahorro Promos</span>
                                    <span className="text-xs font-black italic">-{formatCurrency(cartData.autoDiscountTotal)}</span>
                                </div>
                            )}

                            {/* Credit Note Deduction */}
                            {creditNote && (
                                <div className="flex justify-between items-center text-green-600 animate-in fade-in">
                                    <span className="text-[10px] font-bold uppercase italic">Nota Crédito</span>
                                    <span className="text-xs font-black italic">-{formatCurrency(Math.min(creditNote.amount, cartData.grandTotal))}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pb-2 border-b border-gray-200 mb-2">
                                <span className="text-xs font-bold text-gray-500">ITBIS (18%)</span>
                                <span className="text-xs font-bold text-gray-800">{formatCurrency(cartData.tax)}</span>
                            </div>

                            <div className="flex justify-between items-end bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <span className="text-sm font-black text-gray-900 uppercase italic">TOTAL A PAGAR</span>
                                <span className="text-2xl font-black text-hd-orange leading-none">
                                    {formatCurrency(Math.max(0, cartData.grandTotal - (creditNote ? creditNote.amount : 0)))}
                                </span>
                            </div>

                            {/* Promo names */}
                            {cartData.appliedPromotions?.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-2">
                                    {cartData.appliedPromotions.map((name, i) => (
                                        <span key={i} className="text-[8px] bg-hd-orange/10 text-hd-orange px-1.5 py-0.5 rounded-full font-bold border border-hd-orange/20">
                                            ✓ {name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {tasaCambio > 1 && (
                                <div className="text-right pt-2">
                                    <p className="text-[9px] text-gray-400 font-bold uppercase">
                                        Eq. DOP: {((cartData.grandTotal) * tasaCambio).toLocaleString('en-US', { style: 'currency', currency: 'DOP' })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Payment */}
                    <div className="p-5 space-y-4 flex flex-col h-full bg-white">
                        <div className="space-y-3 flex-1">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Método de Pago</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setPaymentMethod('Efectivo')}
                                        className={`flex flex-row items-center justify-center gap-2 p-3 rounded-lg border transition-all ${paymentMethod === 'Efectivo'
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                                            }`}
                                    >
                                        <Banknote size={18} />
                                        <span className="text-[10px] font-black uppercase">Efectivo</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('Tarjeta')}
                                        className={`flex flex-row items-center justify-center gap-2 p-3 rounded-lg border transition-all ${paymentMethod === 'Tarjeta'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                                            }`}
                                    >
                                        <CreditCard size={18} />
                                        <span className="text-[10px] font-black uppercase">Tarjeta</span>
                                    </button>
                                </div>
                            </div>

                            {paymentMethod === 'Efectivo' && (
                                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="grid grid-cols-5 gap-1">
                                        {[100, 200, 500, 1000, 2000].map(amt => (
                                            <button
                                                key={amt}
                                                onClick={() => setReceivedAmount(amt.toFixed(2))}
                                                className="bg-gray-100 h-7 rounded text-[10px] font-bold hover:bg-hd-orange hover:text-white transition-all border border-gray-200"
                                            >
                                                ${amt}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setReceivedAmount(cartData.grandTotal.toFixed(2))}
                                        className="w-full bg-orange-50 h-7 rounded text-[9px] font-black text-hd-orange hover:bg-hd-orange hover:text-white transition-all border border-orange-200 uppercase tracking-widest"
                                    >
                                        Pagar Exacto
                                    </button>

                                    <div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">Recibido:</span>
                                            <Input
                                                type="number"
                                                className="text-xl font-black h-10 text-right pr-3 focus:ring-green-500 border-2 pl-20"
                                                value={receivedAmount}
                                                onChange={(e) => setReceivedAmount(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                                        <span className="text-[10px] font-bold text-green-800 uppercase tracking-widest">Cambio:</span>
                                        <span className="text-xl font-black text-green-600">{formatCurrency(change)}</span>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase">Cliente</label>
                                    <select
                                        className="w-full h-8 bg-gray-50 border rounded px-2 text-xs font-bold truncate options:text-xs"
                                        value={selectedClient.id}
                                        onChange={(e) => {
                                            const c = clients.find(cl => cl.id === parseInt(e.target.value));
                                            if (c) setSelectedClient(c);
                                        }}
                                    >
                                        {clients.map((c, idx) => (
                                            <option key={c.id || idx} value={c.id}>{c.name || c.Name || c.nombre || c.Nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase">Moneda</label>
                                    <div className="flex gap-1">
                                        <select
                                            className="flex-1 h-8 bg-gray-50 border rounded px-2 text-xs font-bold"
                                            value={monedaId || ''}
                                            onChange={(e) => {
                                                const mid = parseInt(e.target.value);
                                                setMonedaId(mid);
                                                fetchRate(mid);
                                            }}
                                        >
                                            {monedas.map(m => (
                                                <option key={m.id} value={m.id}>{m.codigo}</option>
                                            ))}
                                        </select>
                                        <div className="w-14 h-8 bg-gray-100 border rounded flex items-center justify-center font-mono text-[9px] font-bold text-gray-600">
                                            {tasaCambio.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            className={`w-full h-12 text-sm font-black uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] ${loading ? 'bg-gray-400' : 'bg-hd-orange hover:bg-orange-600 shadow-orange-500/20'
                                }`}
                            disabled={loading || (paymentMethod === 'Efectivo' && parseFloat(receivedAmount) < remainingTotal)}
                            onClick={handleProcess}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin w-4 h-4" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 size={16} /> {remainingTotal === 0 ? 'CONFIRMAR' : 'COBRAR'}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent >
        </Dialog >
    );
};

export default CheckoutModal;
