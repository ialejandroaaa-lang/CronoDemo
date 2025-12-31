import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { X, Save, FileText, AlertCircle, RefreshCcw } from 'lucide-react';

const API_BASE = ((import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') ? import.meta.env.VITE_API_URL : '/api');

const NotaForm = ({ onClose, onSuccess, initialProveedorId }) => {
    const [proveedores, setProveedores] = useState([]);
    const [monedas, setMonedas] = useState([]);
    const [facturasPendientes, setFacturasPendientes] = useState([]);
    const [loading, setLoading] = useState(false);

    const [nota, setNota] = useState({
        proveedorId: initialProveedorId || '',
        tipo: 'Credito',
        fecha: new Date().toISOString().split('T')[0],
        monedaId: '',
        tasaCambio: 1,
        monto: 0,
        referencia: '',
        comentario: '',
        allocations: {}
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (nota.proveedorId) {
            loadFacturasPendientes(nota.proveedorId);
        }
    }, [nota.proveedorId]);

    const loadInitialData = async () => {
        try {
            const [pRes, mRes] = await Promise.all([
                fetch(`${API_BASE}/Proveedores`),
                fetch(`${API_BASE}/Monedas`)
            ]);

            if (pRes.ok) setProveedores(await pRes.json());
            if (mRes.ok) {
                const mons = await mRes.json();
                setMonedas(mons);
                const func = mons.find(m => m.esFuncional);
                if (func && !nota.monedaId) {
                    setNota(prev => ({ ...prev, monedaId: func.id }));
                }
            }
        } catch (error) {
            console.error("Error loading initial data:", error);
        }
    };

    const loadFacturasPendientes = async (proveedorId) => {
        try {
            const res = await fetch(`${API_BASE}/Pagos/FacturasPendientes/${proveedorId}`);
            if (res.ok) {
                setFacturasPendientes(await res.json());
            }
        } catch (error) {
            console.error("Error loading invoices:", error);
        }
    };

    const handleInputChange = async (field, value) => {
        if (field === 'monedaId') {
            const monId = parseInt(value);
            const mon = monedas.find(m => m.id === monId);
            let tasa = 1;
            if (mon && !mon.esFuncional) {
                try {
                    const today = new Date().toISOString().split('T')[0];
                    const res = await fetch(`${API_BASE}/Monedas/tasas?monedaId=${monId}&fecha=${today}`);
                    if (res.ok) {
                        const data = await res.json();
                        tasa = data.tasa || 1;
                    }
                } catch (e) {
                    console.error("Error fetching rate:", e);
                }
            }
            setNota(prev => ({ ...prev, monedaId: value, tasaCambio: tasa, allocations: {}, monto: 0 }));
        } else {
            setNota(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleAllocationChange = (invoiceId, amount, maxSaldo) => {
        let val = parseFloat(amount) || 0;

        // Validation for Credit Notes (cannot exceed balance)
        if (nota.tipo === 'Credito' && val > maxSaldo) val = maxSaldo;
        if (val < 0) val = 0;

        const newAllocations = { ...nota.allocations, [invoiceId]: val };
        if (val === 0) delete newAllocations[invoiceId];

        const computeTotal = () => {
            let total = 0;
            // Since we only allow allocations for the SAME currency, we just sum them up
            Object.keys(newAllocations).forEach(id => {
                total += newAllocations[id];
            });
            return total;
        };

        setNota(prev => ({
            ...prev,
            allocations: newAllocations,
            monto: computeTotal()
        }));
    };

    // Filter invoices by selected note currency to ensure "Usar la MISMA moneda que la factura"
    const filteredFacturas = facturasPendientes.filter(f => f.monedaId === parseInt(nota.monedaId));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (nota.monto <= 0) return alert("El monto debe ser mayor a 0");
        if (!nota.referencia) return alert("Debe ingresar una referencia");

        setLoading(true);
        try {
            const body = {
                proveedorId: parseInt(nota.proveedorId),
                tipo: nota.tipo,
                monedaId: parseInt(nota.monedaId),
                tasaCambio: parseFloat(nota.tasaCambio),
                monto: nota.monto,
                referencia: nota.referencia,
                comentario: nota.comentario,
                allocations: Object.keys(nota.allocations).map(key => {
                    const invId = parseInt(key);
                    const appliedAmount = nota.allocations[key];

                    // Cálculo funcional
                    var functionalAmount = appliedAmount;
                    const mon = monedas.find(m => m.id === parseInt(nota.monedaId));
                    if (!mon?.esFuncional) {
                        functionalAmount = appliedAmount * nota.tasaCambio;
                    }

                    return {
                        invoiceId: invId,
                        monto: appliedAmount,
                        montoFuncional: functionalAmount
                    };
                })
            };

            const res = await fetch(`${API_BASE}/Notas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const err = await res.json();
                alert(err.message || "Error al crear la nota");
            }
        } catch (error) {
            console.error("Error creating note:", error);
            alert("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className={`p-4 flex justify-between items-center text-white ${nota.tipo === 'Credito' ? 'bg-blue-600' : 'bg-red-600'}`}>
                    <h2 className="text-lg font-bold flex items-center">
                        <FileText className="mr-2" size={20} />
                        Nueva Nota de {nota.tipo}
                    </h2>
                    <button onClick={onClose} className="hover:opacity-80 p-1 rounded transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                            <select
                                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                value={nota.proveedorId}
                                onChange={(e) => handleInputChange('proveedorId', e.target.value)}
                                required
                                disabled={!!initialProveedorId}
                            >
                                <option value="">Seleccione un proveedor</option>
                                {proveedores.map(p => <option key={p.id} value={p.id}>{p.razonSocial}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Nota</label>
                            <div className="flex bg-gray-100 p-1 rounded-md">
                                <button
                                    type="button"
                                    className={`flex-1 py-1 text-sm font-medium rounded ${nota.tipo === 'Credito' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setNota(prev => ({ ...prev, tipo: 'Credito' }))}
                                >
                                    Crédito (-)
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 py-1 text-sm font-medium rounded ${nota.tipo === 'Debito' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setNota(prev => ({ ...prev, tipo: 'Debito' }))}
                                >
                                    Débito (+)
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia / Factura</label>
                            <Input
                                placeholder="NC-001"
                                value={nota.referencia}
                                onChange={(e) => handleInputChange('referencia', e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                            <select
                                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                value={nota.monedaId}
                                onChange={(e) => handleInputChange('monedaId', e.target.value)}
                            >
                                {monedas.map(m => <option key={m.id} value={m.id}>{m.codigo}</option>)}
                            </select>
                        </div>
                        {monedas.find(m => m.id === parseInt(nota.monedaId))?.esFuncional === false && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tasa</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={nota.tasaCambio}
                                    onChange={(e) => handleInputChange('tasaCambio', e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Comentario</label>
                        <Input
                            placeholder="Motivo de la nota..."
                            value={nota.comentario}
                            onChange={(e) => handleInputChange('comentario', e.target.value)}
                        />
                    </div>

                    <div className="border rounded-md overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <span>Facturas Pendientes</span>
                            <span>Monto a Aplicar</span>
                        </div>
                        <div className="max-h-48 overflow-y-auto divide-y">
                            {filteredFacturas.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm italic">
                                    No hay facturas pendientes en esta moneda para este proveedor.
                                </div>
                            ) : (
                                filteredFacturas.map(inv => (
                                    <div key={inv.id} className="p-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-800">{inv.numeroCompra}</span>
                                            <span className="text-[10px] text-gray-500">
                                                Saldo: {inv.monedaSimbolo} {inv.saldo.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Input
                                                type="number"
                                                className="w-32 h-8 text-right text-sm"
                                                placeholder="0.00"
                                                value={nota.allocations[inv.id] || ''}
                                                onChange={(e) => handleAllocationChange(inv.id, e.target.value, inv.saldo)}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2 text-[10px] text-blue-600 hover:text-blue-700 font-bold"
                                                onClick={() => handleAllocationChange(inv.id, inv.saldo, inv.saldo)}
                                            >
                                                TODO
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-md flex justify-between items-center border border-gray-200">
                        <div className="text-sm text-gray-600 font-medium">Total de la Nota:</div>
                        <div className={`text-xl font-bold ${nota.tipo === 'Credito' ? 'text-blue-600' : 'text-red-600'}`}>
                            {monedas.find(m => m.id === parseInt(nota.monedaId))?.simbolo || '$'} {nota.monto.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className={`${nota.tipo === 'Credito' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'} text-white shadow-md`}
                            disabled={loading || nota.monto <= 0}
                        >
                            {loading ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Registrar Nota
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NotaForm;


