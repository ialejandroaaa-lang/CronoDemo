import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, Plus, Calendar, CheckCircle, CreditCard, X, DollarSign, User } from 'lucide-react';
import { getClients } from '../../api/clientes';

const API_BASE = ((import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') ? import.meta.env.VITE_API_URL : '/api');

const CobrosCliente = () => {
    // State
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [pendingInvoices, setPendingInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [monedas, setMonedas] = useState([]);

    // New Payment State
    const [payment, setPayment] = useState({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        method: 'Efectivo',
        reference: '',
        monedaId: '',
        tasaCambio: 1,
        allocations: {} // { invoiceId: amount }
    });

    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Default to strict filtering, user can toggle "Show All"
    const [showAllCurrencies, setShowAllCurrencies] = useState(false);

    // Load Clients & Currencies
    useEffect(() => {
        setLoading(true);
        Promise.all([
            getClients(),
            fetch(`${API_BASE}/Monedas`).then(r => {
                if (!r.ok) throw new Error("Err Monedas: " + r.status);
                return r.json();
            })
        ]).then(([clientsData, monedasData]) => {
            console.log("Data loaded:", clientsData.length, monedasData.length);
            setClients(clientsData);
            setMonedas(monedasData);

            // Default Currency (Functional)
            const func = monedasData.find(m => m.esFuncional);
            if (func) {
                setPayment(p => ({ ...p, monedaId: func.id, tasaCambio: 1 }));
            }
        })
            .catch(err => {
                console.error("Init Error:", err);
                setSuccessMsg("Error carga: " + err.message);
            })
            .finally(() => setLoading(false));
    }, []);

    // Load Invoices when Client Selected
    useEffect(() => {
        if (!selectedClient) {
            setPendingInvoices([]);
            return;
        }

        setPendingInvoices([]); // clear prev
        fetch(`${API_BASE}/Cobros/Pendientes/${selectedClient.id}`)
            .then(r => r.json())
            .then(data => setPendingInvoices(data))
            .catch(err => console.error("Error loading invoices", err));

    }, [selectedClient]);

    // Handle Amount/Allocation
    const handleAmountChange = (val) => {
        const totalPay = parseFloat(val) || 0;
        setPayment(p => ({ ...p, amount: totalPay }));

        // Auto Allocate logic (FIFO)
        let remaining = totalPay;
        const newAlloc = {};

        // Helper
        const getVal = (obj, key) => obj[key] === undefined ? obj[key.charAt(0).toUpperCase() + key.slice(1)] : obj[key];

        const relevantInvoices = pendingInvoices
            .filter(inv => {
                const mid = getVal(inv, 'monedaId');
                return !payment.monedaId || mid == payment.monedaId;
                // Note: If you want cross-currency allocation, logic gets complex (FX rates). Keeping simplicity for now.
            })
            .sort((a, b) => {
                const dateA = new Date(getVal(a, 'fecha'));
                const dateB = new Date(getVal(b, 'fecha'));
                return dateA - dateB;
            });

        relevantInvoices.forEach(inv => {
            if (remaining <= 0) return;

            const invId = getVal(inv, 'id');
            const invSaldo = parseFloat(getVal(inv, 'saldo') || 0);

            const toPay = Math.min(remaining, invSaldo);
            newAlloc[invId] = toPay;
            remaining -= toPay;
        });

        setPayment(p => ({ ...p, amount: totalPay, allocations: newAlloc }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedClient) return;
        if (payment.amount <= 0) return;

        setSaving(true);
        try {
            const mId = parseInt(payment.monedaId);
            const payload = {
                ClienteId: selectedClient.id,
                Fecha: payment.date,
                Monto: payment.amount,
                MetodoPago: payment.method,
                Referencia: payment.reference || '',
                MonedaId: isNaN(mId) ? null : mId,
                TasaCambio: parseFloat(payment.tasaCambio) || 1,
                Observaciones: '',
                Detalles: Object.keys(payment.allocations).map(k => ({
                    VentaId: parseInt(k) || 0,
                    MontoAplicado: parseFloat(payment.allocations[k]) || 0
                })).filter(d => d.VentaId > 0 && d.MontoAplicado > 0)
            };

            console.log("Submitting Payload:", payload);

            const res = await fetch(`${API_BASE}/Cobros`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error("Server Error:", errorData);
                throw new Error(errorData.message || "Error al guardar (Server 400/500)");
            }

            const data = await res.json();
            setSuccessMsg(`Cobro Registrado: ${data.numero}`);

            // Reset but keep currency
            setPayment(prev => ({
                ...prev,
                amount: 0,
                reference: '',
                allocations: {}
            }));

            // Refresh invoices
            fetch(`${API_BASE}/Cobros/Pendientes/${selectedClient.id}`)
                .then(r => r.json())
                .then(d => setPendingInvoices(d));

            setTimeout(() => setSuccessMsg(''), 3000);

        } catch (error) {
            console.error(error);
            alert("Error al guardar cobro");
        } finally {
            setSaving(false);
        }
    };

    // Derived: Total Debt in Selected Currency
    const totalDebtInCurrency = useMemo(() => {
        return pendingInvoices
            .filter(inv => showAllCurrencies || !payment.monedaId || inv.monedaId == payment.monedaId)
            .reduce((acc, curr) => acc + (parseFloat(curr.saldo) || 0), 0);
    }, [pendingInvoices, payment.monedaId, showAllCurrencies]);

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <DollarSign className="mr-2 text-hd-orange" /> Cuentas por Cobrar
            </h1>
            <div className="mb-2 text-[10px] text-gray-400">DEBUG: Clients:{clients.length} Monedas:{monedas.length} Loading:{loading.toString()} Amount:{payment.amount} InvCount:{pendingInvoices.length} Saving:{saving.toString()}</div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Client Selection */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="bg-gray-50 pb-2">
                            <CardTitle className="text-sm uppercase text-gray-500">Seleccionar Cliente</CardTitle>
                        </CardHeader>
                        <div className="p-4">
                            <select
                                className="w-full border rounded p-2 text-sm"
                                value={selectedClient?.id || ''}
                                onChange={(e) => {
                                    const c = clients.find(cl => cl.id == e.target.value);
                                    setSelectedClient(c);
                                }}
                            >
                                <option value="">-- Seleccionar --</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} - {c.rnc}</option>
                                ))}
                            </select>

                            {selectedClient && (
                                <div className="mt-4 bg-orange-50 p-4 rounded border border-orange-100">
                                    <p className="font-bold text-gray-800">{selectedClient.name}</p>
                                    <p className="text-xs text-gray-500">{selectedClient.address}</p>
                                    <div className="mt-2 pt-2 border-t border-orange-200">
                                        <span className="text-sm font-semibold">Deuda Total:</span>
                                        <div className="flex flex-col mt-1 space-y-1">
                                            {(() => {
                                                // Helper to get prop case-insensitive
                                                const getVal = (obj, key) => obj[key] || obj[key.charAt(0).toUpperCase() + key.slice(1)];

                                                const debts = pendingInvoices.reduce((acc, inv) => {
                                                    const cur = getVal(inv, 'monedaCodigo') || 'DOP';
                                                    const val = parseFloat(getVal(inv, 'saldo')) || 0;
                                                    acc[cur] = (acc[cur] || 0) + val;
                                                    return acc;
                                                }, {});

                                                if (Object.keys(debts).length === 0) return <span className="text-xs text-gray-500">Sin deudas pendientes</span>;

                                                return Object.entries(debts).map(([cur, amount]) => (
                                                    <div key={cur} className="flex justify-between text-sm">
                                                        <span>{cur}</span>
                                                        <span className="font-bold text-red-600">
                                                            {cur === 'USD' ? '$' : 'RD$'} {amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Panel: Payment Form */}
                <div className="lg:col-span-2">
                    {selectedClient ? (
                        <Card>
                            <CardHeader className="flex flex-row justify-between items-center py-3 bg-gray-50">
                                <CardTitle className="text-gray-700 flex items-center gap-2">
                                    <CreditCard size={18} /> Registrar Cobro
                                </CardTitle>
                                {successMsg && <span className="text-green-600 text-sm flex items-center font-bold"><CheckCircle size={14} className="mr-1" /> {successMsg}</span>}
                            </CardHeader>
                            <div className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Header Inputs */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Fecha</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input type="date" className="pl-8" value={payment.date} onChange={e => setPayment({ ...payment, date: e.target.value })} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Método Pago</label>
                                            <select className="w-full border rounded p-2 h-10 bg-white"
                                                value={payment.method}
                                                onChange={e => setPayment({ ...payment, method: e.target.value })}
                                            >
                                                <option>Efectivo</option>
                                                <option>Cheque</option>
                                                <option>Transferencia</option>
                                                <option>Tarjeta</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Moneda Pago</label>
                                            <div className="space-y-1">
                                                <select
                                                    className="w-full border rounded p-2 h-10 bg-white text-sm"
                                                    value={payment.monedaId}
                                                    onChange={e => {
                                                        const mid = e.target.value;
                                                        const mon = monedas.find(m => m.id == mid);
                                                        setPayment(prev => ({
                                                            ...prev,
                                                            monedaId: mid,
                                                            tasaCambio: mon ? mon.tasa : 1,
                                                            allocations: {} // Reset allocations on currency change just in case
                                                        }));
                                                    }}
                                                >
                                                    {monedas.map(m => (
                                                        <option key={m.id} value={m.id}>{m.codigo} - {m.nombre}</option>
                                                    ))}
                                                </select>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id="chkShowAll"
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        checked={showAllCurrencies}
                                                        onChange={e => setShowAllCurrencies(e.target.checked)}
                                                    />
                                                    <label htmlFor="chkShowAll" className="text-xs text-gray-500 cursor-pointer select-none">Ver facturas de todas las monedas</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Referencia</label>
                                            <Input placeholder="Ref transacción/cheque..." value={payment.reference} onChange={e => setPayment({ ...payment, reference: e.target.value })} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium mb-1 text-hd-orange font-bold">Monto a Cobrar</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2 text-gray-400">$</span>
                                                <Input
                                                    type="number"
                                                    className="pl-7 font-bold text-lg"
                                                    value={payment.amount}
                                                    onChange={e => handleAmountChange(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Invoices List Grid */}
                                    <div className="border rounded-md overflow-hidden bg-gray-50 min-h-[300px] flex flex-col">
                                        <div className="bg-gray-100 px-4 py-2 text-xs font-bold text-gray-500 uppercase flex justify-between items-center border-b">
                                            <span>Facturas Pendientes</span>
                                            <span className="text-gray-400">
                                                {pendingInvoices.length} FACTURAS
                                            </span>
                                        </div>

                                        <div className="flex-1 overflow-auto p-2 space-y-2">
                                            {(() => {
                                                const getVal = (obj, key) => obj[key] === undefined ? obj[key.charAt(0).toUpperCase() + key.slice(1)] : obj[key];

                                                const visibleInvoices = pendingInvoices.filter(inv => {
                                                    const mid = getVal(inv, 'monedaId');
                                                    if (showAllCurrencies) return true;
                                                    return !payment.monedaId || mid == payment.monedaId;
                                                });

                                                if (visibleInvoices.length === 0) {
                                                    return (
                                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 text-center p-8">
                                                            <CheckCircle className="h-10 w-10 mb-2" />
                                                            <p className="text-sm">No se encontraron facturas pendientes.</p>
                                                        </div>
                                                    );
                                                }

                                                return visibleInvoices.map(inv => {
                                                    // Debug first item
                                                    // console.log("Inv Data:", inv); 

                                                    const id = getVal(inv, 'id');
                                                    const saldo = parseFloat(getVal(inv, 'saldo') || 0);
                                                    const allocated = payment.allocations[id] || 0;
                                                    const isFullyPaid = allocated >= saldo;

                                                    const invMid = getVal(inv, 'monedaId');
                                                    const invCod = getVal(inv, 'monedaCodigo');
                                                    const invSim = getVal(inv, 'monedaSimbolo');
                                                    const num = getVal(inv, 'numeroFactura');
                                                    const fecha = getVal(inv, 'fecha');
                                                    const ven = getVal(inv, 'fechaVencimiento');
                                                    const ncf = getVal(inv, 'ncf') || getVal(inv, 'NCF'); // Special NCF case

                                                    const isMatch = !payment.monedaId || invMid == payment.monedaId;

                                                    const dateStr = fecha ? new Date(fecha).toLocaleDateString() : 'N/A';
                                                    const venStr = ven ? new Date(ven).toLocaleDateString() : 'N/A';

                                                    return (
                                                        <div
                                                            key={id}
                                                            className={`bg-white border rounded p-3 flex justify-between items-center shadow-sm hover:border-hd-orange transition-all cursor-pointer ${isFullyPaid ? 'border-green-200 ring-1 ring-green-100' : ''} ${!isMatch ? 'bg-gray-50 opacity-90' : ''}`}
                                                            onClick={() => {
                                                                // BEST METHOD: Click to Toggle Payment
                                                                const currentAlloc = payment.allocations[id] || 0;
                                                                const remainingToPay = saldo - currentAlloc;

                                                                let newAllocations = { ...payment.allocations };
                                                                let newTotal = payment.amount;

                                                                if (remainingToPay > 0.01) {
                                                                    // Case A: Verify if we are adding this invoice
                                                                    // Add the remaining visible balance to the allocation
                                                                    newAllocations[id] = saldo;

                                                                    // Recalculate total based on ALL allocations to be safe/consistent
                                                                    // mixed with manual entry can be tricky, but summing allocations is safest for "Select Mode"
                                                                    // But if user typed 500, and clicks another 100, expects 600.
                                                                    // Let's just add the delta.
                                                                    newTotal += remainingToPay;
                                                                } else {
                                                                    // Case B: Deselect/Unpay
                                                                    // Remove this invoice's amount from total
                                                                    newTotal -= currentAlloc;
                                                                    delete newAllocations[id];
                                                                }

                                                                // Update state
                                                                setPayment(prev => ({
                                                                    ...prev,
                                                                    amount: parseFloat(newTotal.toFixed(2)),
                                                                    allocations: newAllocations
                                                                }));
                                                            }}
                                                        >
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-gray-800">{num}</span>
                                                                    {!isMatch && (
                                                                        <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-200 font-bold">
                                                                            {invCod}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-gray-500">
                                                                    {dateStr} - Vence: {venStr}
                                                                </span>
                                                                <span className="text-xs text-gray-400">NCF: {ncf || 'N/A'}</span>
                                                            </div>

                                                            <div className="text-right">
                                                                <div className="text-sm text-gray-600 mb-1">
                                                                    Saldo: <span className="font-bold text-gray-900">{invSim} {saldo.toLocaleString()}</span>
                                                                </div>
                                                                {allocated > 0 && (
                                                                    <div className="text-xs text-white bg-green-500 px-2 py-0.5 rounded-full inline-block font-bold shadow-sm">
                                                                        Abono: ${allocated.toLocaleString()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t">
                                        <Button
                                            type="submit"
                                            disabled={saving || payment.amount <= 0 || pendingInvoices.length === 0}
                                            className="bg-hd-orange hover:bg-orange-600 text-white w-full md:w-auto md:px-8"
                                        >
                                            {saving ? 'Procesando...' : 'Registrar Cobro'}
                                        </Button>
                                        {(saving || payment.amount <= 0 || pendingInvoices.length === 0) && (
                                            <div className="text-[10px] text-red-400 text-center mt-1">
                                                Disabled Reason: {saving ? 'Saving ' : ''} {payment.amount <= 0 ? 'Amount<=0 ' : ''} {pendingInvoices.length === 0 ? 'NoInv ' : ''}
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </Card>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-10 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                            <User className="h-12 w-12 mb-2 opacity-50" />
                            <span className="font-medium">Seleccione un cliente para ver su estado de cuenta</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CobrosCliente;


