import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Save, Printer, X, Plus, Trash2, Calendar, Truck, Search, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '../../components/ui/Table';
import { getProveedores } from '../../api/proveedores';
import { saveCompra, getCompra, anularCompra } from '../../api/compras';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { getAlmacenes } from '../../api/almacenes';
import { getPlanes } from '../../api/unidadMedida';
import ProductSearchModal from '../../components/ProductSearchModal';

const CompraForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    // Transfer Data
    const transferFrom = location.state?.transferFrom;
    const targetType = location.state?.targetType;

    // State
    const [loading, setLoading] = useState(false);
    const [proveedores, setProveedores] = useState([]);
    const [proveedorId, setProveedorId] = useState('');
    const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().split('T')[0]);
    const [referencia, setReferencia] = useState('');
    const [terminos, setTerminos] = useState('Contado');
    const [estado, setEstado] = useState('Borrador');
    const [numeroCompra, setNumeroCompra] = useState('(Auto)');

    // Workflow State
    const [tipoDocumento, setTipoDocumento] = useState('OrdenCompra'); // OrdenCompra, Recepcion, Factura
    const [documentoReferenciaId, setDocumentoReferenciaId] = useState(null);

    // Multi-Currency
    const [monedas, setMonedas] = useState([]);
    const [monedaId, setMonedaId] = useState('');
    const [tasaCambio, setTasaCambio] = useState(1);
    const [isFunctional, setIsFunctional] = useState(true);

    // Almacen
    const [almacenes, setAlmacenes] = useState([]);
    const [almacenId, setAlmacenId] = useState('');

    // Line Items
    const [items, setItems] = useState([]);
    const [planesUoM, setPlanesUoM] = useState([]);
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [config, setConfig] = useState({ habilitarFacturas: true }); // Default to true (fiscal)

    // Load Initial Data
    useEffect(() => {
        loadCatalogs();
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';
            const res = await fetch(`${API_BASE}/ProveedorConfiguration`);
            if (res.ok) {
                const conf = await res.json();
                setConfig(conf);
                // If simple mode, force document type to Order/Internal if needed, or just hide inputs
            }
        } catch (e) {
            console.error("Error loading config:", e);
        }
    };

    useEffect(() => {
        if (isEditMode) {
            loadCompra();
        } else if (transferFrom) {
            loadTransferData();
        }
    }, [id, transferFrom]); // Added transferFrom to dependencies

    const loadTransferData = () => {
        if (!transferFrom) return;

        // Set Target Type
        if (targetType) setTipoDocumento(targetType);

        // Link Reference
        setDocumentoReferenciaId(transferFrom.id);

        // Copy Data
        setProveedorId(transferFrom.proveedorId);
        setReferencia(transferFrom.referenciaProveedor || '');
        setTerminos(transferFrom.terminosPago || 'Contado');
        setMonedaId(transferFrom.monedaId);
        setTasaCambio(transferFrom.tasaCambio);
        setAlmacenId(transferFrom.almacenId);

        // Map Items
        // We need to fetch details full object if transferFrom is just a summary item from list
        // Ideally fetch full object, but for now assuming transferFrom has what we need or we fetch it
        // The list item usually doesn't have details. We should fetch the source document fully.
        fetchSourceDetails(transferFrom.id);
    };

    const fetchSourceDetails = async (sourceId) => {
        try {
            setLoading(true);
            const data = await getCompra(sourceId);
            const mappedItems = data.detalles.map(d => ({
                id: d.articuloId,
                articuloId: d.articuloId,
                codigo: d.numeroArticulo,
                descripcion: d.descripcion,
                cantidad: d.cantidad,
                costo: d.costoUnitario,
                unidad: d.unidadMedida,
                total: d.totalLinea, // Recalculated later anyway based on new qty if changed
                impuesto: d.montoImpuesto,
                planMedida: d.planMedida || ''
            }));
            setItems(mappedItems);
            // Re-set these just in case list item was incomplete
            setProveedorId(data.proveedorId);
            setMonedaId(data.monedaId);
            setTasaCambio(data.tasaCambio);
        } catch (error) {
            console.error("Error fetching source details:", error);
        } finally {
            setLoading(false);
        }
    };


    const loadCatalogs = async () => {
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';
            const [provs, alms, mons, pls] = await Promise.all([
                getProveedores(),
                getAlmacenes(),
                fetch(`${API_BASE}/Monedas`).then(r => r.json()),
                getPlanes()
            ]);

            setProveedores(Array.isArray(provs) ? provs : []);
            setAlmacenes(Array.isArray(alms) ? alms : []);
            setMonedas(Array.isArray(mons) ? mons : []);
            setPlanesUoM(Array.isArray(pls) ? pls : []);

            // Default Almacen
            if (alms.length > 0 && !almacenId) setAlmacenId(alms[0].id);

            // Set default currency to functional (DOP) only if creating new (not edit, not transfer)
            if (!isEditMode && !transferFrom) {
                const func = mons.find(m => m.esFuncional);
                if (func) {
                    setMonedaId(func.id);
                    setTasaCambio(1);
                    setIsFunctional(true);
                }
            }
        } catch (error) {
            console.error("Error loading catalogs:", error);
        }
    };

    const handleProveedorChange = async (val) => {
        setProveedorId(val);

        // Auto-suggest NCF prefix
        if (config.habilitarFacturas && val) {
            const provider = proveedores.find(p => p.id === parseInt(val));
            if (provider && provider.tipoComprobante) {
                // Only set if empty to avoid overwriting user input
                if (!referencia) {
                    setReferencia(provider.tipoComprobante);
                }
            }
        }
    };

    const fetchTasa = async (monId, fecha) => {
        if (!monId) return;
        const mon = monedas.find(m => m.id === parseInt(monId));
        if (mon && mon.esFuncional) {
            setTasaCambio(1);
            setIsFunctional(true);
            return;
        }

        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';
            const res = await fetch(`${API_BASE}/Monedas/tasas?monedaId=${monId}&fecha=${fecha}`);
            if (res.ok) {
                const data = await res.json();
                setTasaCambio(data.tasa || 1);
                setIsFunctional(false);
            } else {
                setTasaCambio(1);
                setIsFunctional(false);
            }
        } catch (e) {
            console.error("Error fetching rate:", e);
        }
    };

    const loadCompra = async () => {
        try {
            setLoading(true);
            const data = await getCompra(id);
            setNumeroCompra(data.numeroCompra);
            setProveedorId(data.proveedorId);
            setFechaCompra(data.fechaCompra.split('T')[0]);
            setReferencia(data.referenciaProveedor || '');
            setTerminos(data.terminosPago || 'Contado');
            setEstado(data.estado);
            setMonedaId(data.monedaId || '');
            setTasaCambio(data.tasaCambio || 1);

            setTipoDocumento(data.tipoDocumento || 'Factura');
            setDocumentoReferenciaId(data.documentoReferenciaId);

            // Map details
            const mappedItems = data.detalles.map(d => ({
                id: d.articuloId,
                articuloId: d.articuloId,
                codigo: d.numeroArticulo,
                descripcion: d.descripcion,
                cantidad: d.cantidad,
                costo: d.costoUnitario,
                unidad: d.unidadMedida,
                total: d.totalLinea,
                impuesto: d.montoImpuesto,
                planMedida: d.planMedida || '',
                cantTotal: d.cantTotal // Load from DB
            }));
            setItems(mappedItems);
        } catch (error) {
            console.error("Error loading purchase:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculations
    const subtotal = items.reduce((acc, item) => acc + (item.cantidad * item.costo), 0);
    const totalCantidad = items.reduce((acc, item) => acc + (parseFloat(item.cantidad) || 0), 0);
    // Only calculate tax if Fiscal Mode is enabled
    const impuestos = config.habilitarFacturas ? subtotal * 0.18 : 0;
    const total = subtotal + impuestos;

    // Handlers
    const handleAddProduct = async (product) => {
        // Fetch prices for this product to know available U.M. and prices
        let productPrices = [];
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';
            const res = await fetch(`${API_BASE}/Articulos/${product.id}/Precios`);
            if (res.ok) productPrices = await res.json();
        } catch (e) {
            console.error("Error fetching product prices", e);
        }

        setItems(prev => {
            const defaultUnit = product.unidadMedida || 'UND';
            // Only merge if both Article ID AND Unit match
            const existing = prev.find(i => i.articuloId === product.id && i.unidad === defaultUnit);

            if (existing) {
                return prev.map(i => (i.articuloId === product.id && i.unidad === defaultUnit)
                    ? { ...i, cantidad: i.cantidad + 1, total: (i.cantidad + 1) * i.costo }
                    : i);
            }

            const currentMon = monedas.find(m => m.id === parseInt(monedaId));
            const monCode = currentMon ? currentMon.codigo : 'DOP';


            const priceObj = productPrices.find(p => p.moneda === monCode && p.unidadMedida === defaultUnit);

            // User clarified that cost is always in functional currency (DOP)
            const baseCostDOP = product.costoUnitario || 0;
            let initialCost = baseCostDOP;

            if (priceObj) {
                initialCost = priceObj.precio;
            } else if (monCode !== 'DOP' && tasaCambio > 0) {
                // If no specific price for foreign currency, convert from DOP
                initialCost = baseCostDOP / tasaCambio;
            }

            return [...prev, {
                articuloId: product.id,
                codigo: product.numeroArticulo,
                descripcion: product.descripcion,
                cantidad: 1,
                costo: initialCost,
                unidad: defaultUnit,
                total: initialCost * 1,
                planMedida: product.planMedida || '',
                costoOriginalDOP: baseCostDOP, // Keep original DOP for reversible conversions
                prices: productPrices // Store prices to avoid re-fetching
            }];
        });
        setSearchModalOpen(false);
    };

    const handleUpdateItem = (index, field, value) => {
        const newItems = [...items];
        const item = newItems[index];

        if (field === 'cantidad') {
            const val = parseFloat(value) || 0;
            item.cantidad = val;
            item.total = val * item.costo;
            item.cantTotal = undefined; // Force recalculation
        } else if (field === 'costo') {
            const val = parseFloat(value) || 0;
            item.costo = val;
            item.total = item.cantidad * val;
        } else if (field === 'planMedida') {
            item.planMedida = value;
            // When plan changes, if current unit is not in new plan, reset to base unit of plan
            const plan = planesUoM.find(p => p.planId === value);
            if (plan) {
                const units = [plan.unidadBase, ...(plan.detalles || []).map(d => d.unidadMedida)];
                if (!units.includes(item.unidad)) {
                    item.unidad = plan.unidadBase;
                }
            }
            item.cantTotal = undefined; // Force recalculation
        } else if (field === 'unidad') {
            item.unidad = value;
            // Lookup price for new unit
            const currentMon = monedas.find(m => m.id === parseInt(monedaId));
            const monCode = currentMon ? currentMon.codigo : 'DOP';
            const priceObj = (item.prices || []).find(p => p.moneda === monCode && p.unidadMedida === value);
            if (priceObj) {
                item.costo = priceObj.precio;
                item.total = item.cantidad * item.costo;
            }
            item.cantTotal = undefined; // Force recalculation
        }

        setItems(newItems);
    };

    const handleRemoveItem = (index) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    // Update prices when currency changes
    useEffect(() => {
        if (!monedaId || items.length === 0) return;

        const currentMon = monedas.find(m => m.id === parseInt(monedaId));
        const monCode = currentMon ? currentMon.codigo : 'DOP';

        setItems(prev => prev.map(item => {
            const priceObj = (item.prices || []).find(p => p.moneda === monCode && p.unidadMedida === item.unidad);

            let newCost = item.costo;
            if (priceObj) {
                newCost = priceObj.precio;
            } else {
                // Convert from original DOP cost if no specific price exists
                const baseDOP = item.costoOriginalDOP || item.costo; // Fallback to current cost if no original stored
                if (monCode === 'DOP') {
                    newCost = baseDOP;
                } else if (tasaCambio > 0) {
                    newCost = baseDOP / tasaCambio;
                }
            }

            return {
                ...item,
                costo: newCost,
                total: item.cantidad * newCost
            };
        }));
    }, [monedaId, tasaCambio]);

    const handleSave = async () => {
        if (!proveedorId) {
            alert("Debe seleccionar un proveedor");
            return;
        }
        if (items.length === 0) {
            alert("Debe agregar al menos un artículo");
            return;
        }

        // Create a local date string with time to avoid UTC shift issues
        const [year, month, day] = fechaCompra.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        const now = new Date();
        dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

        // Format as YYYY-MM-DDTHH:mm:ss for backend to parse as local
        const localISO = `${fechaCompra}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

        const compraData = {
            ProveedorId: parseInt(proveedorId),
            FechaCompra: localISO,
            TerminosPago: terminos,
            ReferenciaProveedor: referencia,
            Estado: estado,
            Subtotal: subtotal,
            Impuestos: impuestos,
            Total: total,
            AlmacenId: almacenId ? parseInt(almacenId) : null,
            MonedaId: monedaId ? parseInt(monedaId) : null,
            TasaCambio: parseFloat(tasaCambio),
            TipoDocumento: tipoDocumento, // New Field
            DocumentoReferenciaId: documentoReferenciaId, // New Field
            Detalles: items.map(i => {
                // Calculate factor same way as display
                let factor = 1;
                if (i.planMedida && i.unidad) {
                    const plan = planesUoM.find(p => p.planId === i.planMedida);
                    if (plan) {
                        if (plan.unidadBase === i.unidad) {
                            factor = 1;
                        } else {
                            const detail = (plan.detalles || []).find(d => d.unidadMedida === i.unidad);
                            if (detail) {
                                factor = detail.cantidad !== undefined ? detail.cantidad : (detail.Cantidad !== undefined ? detail.Cantidad : 1);
                            }
                        }
                    }
                }

                // Calculate CantTotal: if already set use it, otherwise calculate from factor
                const cantTotal = i.cantTotal !== undefined ? i.cantTotal : ((parseFloat(i.cantidad) || 0) * factor);

                return {
                    ArticuloId: i.articuloId,
                    NumeroArticulo: i.codigo,
                    Descripcion: i.descripcion,
                    Cantidad: i.cantidad,
                    UnidadMedida: i.unidad,
                    CostoUnitario: i.costo,
                    TotalLinea: i.total,
                    PlanMedida: i.planMedida,
                    CantTotal: cantTotal,
                    CantAdq: parseFloat(i.cantidad) || 0,
                    PorcentajeImpuesto: 18,
                    MontoImpuesto: i.total * 0.18
                };
            })
        };

        try {
            await saveCompra(compraData);
            alert("Compra guardada exitosamente");
            navigate('/compras');
        } catch (error) {
            console.error("Error saving purchase:", error);
            alert("Error al guardar la compra");
        }
    };

    const handleAnular = async () => {
        try {
            setLoading(true);
            await anularCompra(id);
            setConfirmModalOpen(false);
            navigate('/compras');
        } catch (error) {
            console.error("Error anular compra:", error);
        } finally {
            setLoading(false);
            setConfirmModalOpen(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* Modal */}
            <ProductSearchModal
                isOpen={searchModalOpen}
                onClose={() => setSearchModalOpen(false)}
                onSelect={handleAddProduct}
            />

            {/* Modal de Confirmación */}
            <ConfirmModal
                isOpen={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleAnular}
                title="Anular Compra"
                message={`¿Está seguro que desea anular la compra ${numeroCompra}? Esta acción no se puede deshacer y reversará el inventario.`}
                confirmLabel="Confirmar Anulación"
            />

            {/* Header Actions */}
            <div className="flex items-center justify-between sticky top-0 bg-gray-50/95 backdrop-blur z-10 py-4 border-b border-gray-200 -mx-6 px-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Orden de Compra</h1>
                    <p className="text-sm text-gray-500">Documento #{numeroCompra} • <span className="text-orange-600 font-medium">{estado}</span></p>
                </div>
                <div className="flex space-x-3">
                    <Button variant="outline" onClick={() => navigate('/compras')}>
                        <X className="mr-2 h-4 w-4" /> Cancelar
                    </Button>
                    {isEditMode && (
                        <Button variant="outline" onClick={() => window.open(`/compras/imprimir/${id}`, '_blank')}>
                            <Printer className="mr-2 h-4 w-4" /> Imprimir
                        </Button>
                    )}
                    {!isEditMode && (
                        <Button className="bg-gray-800 hover:bg-gray-900" onClick={handleSave}>
                            <Save className="mr-2 h-4 w-4" /> Guardar Compra
                        </Button>
                    )}
                    {isEditMode && estado !== 'Anulado' && (
                        <button
                            type="button"
                            className="flex items-center px-4 py-2 rounded-md transition-colors text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 cursor-pointer text-sm font-medium shadow-sm bg-white"
                            onClick={() => setConfirmModalOpen(true)}
                        >
                            <X className="mr-2 h-4 w-4" /> Anular Compra
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Header Information */}
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wider text-gray-500">Datos Generales</CardTitle>
                        </CardHeader>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo de Documento</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange disabled:bg-gray-100"
                                    value={tipoDocumento}
                                    onChange={(e) => setTipoDocumento(e.target.value)}
                                    disabled={isEditMode || transferFrom || documentoReferenciaId}
                                >
                                    <option value="Factura">Factura Directa</option>
                                    <option value="OrdenCompra">Orden de Compra</option>
                                    <option value="Recepcion" disabled>Recepción (Requiere OC)</option>
                                </select>
                                {documentoReferenciaId && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        Vinculado al documento anterior ID: {documentoReferenciaId}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Proveedor</label>
                                <div className="relative">
                                    <select
                                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange disabled:bg-gray-100"
                                        value={proveedorId}
                                        onChange={(e) => handleProveedorChange(e.target.value)}
                                        disabled={isEditMode}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {proveedores.map(p => (
                                            <option key={p.id} value={p.id}>{p.razonSocial}</option>
                                        ))}
                                    </select>
                                    <Truck className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Moneda</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange disabled:bg-gray-100"
                                    value={monedaId}
                                    onChange={(e) => {
                                        setMonedaId(e.target.value);
                                        fetchTasa(e.target.value, fechaCompra);
                                    }}
                                    disabled={isEditMode}
                                >
                                    {monedas.map(m => (
                                        <option key={m.id} value={m.id}>{m.codigo} - {m.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {!isFunctional && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Tasa de Cambio</label>
                                    <Input
                                        type="number"
                                        value={tasaCambio}
                                        onChange={(e) => setTasaCambio(parseFloat(e.target.value) || 1)}
                                        disabled={isEditMode}
                                    />
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wider text-gray-500">Detalles Factura</CardTitle>
                        </CardHeader>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo de Documento</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange disabled:bg-gray-100"
                                    value={tipoDocumento}
                                    onChange={(e) => setTipoDocumento(e.target.value)}
                                    disabled={isEditMode || transferFrom}
                                >
                                    <option value="OrdenCompra">Orden de Compra</option>
                                    <option value="Recepcion">Recepción de Mercancía</option>
                                    {config.habilitarFacturas && <option value="Factura">Factura de Compra</option>}
                                </select>
                            </div>

                            {/* Fecha Documento always visible */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Fecha Documento</label>
                                <Input
                                    type="date"
                                    value={fechaCompra}
                                    onChange={(e) => {
                                        setFechaCompra(e.target.value);
                                        fetchTasa(monedaId, e.target.value);
                                    }}
                                    disabled={isEditMode}
                                />
                            </div>

                            {/* Fiscal Fields only if enabled */}
                            {config.habilitarFacturas && (
                                <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
                                    <Input
                                        label="NCF / No. Factura"
                                        placeholder="ej: B0100000001"
                                        title="Número de Comprobante Fiscal (NCF) del proveedor"
                                        value={referencia}
                                        onChange={(e) => setReferencia(e.target.value)}
                                        disabled={isEditMode}
                                        className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 font-mono"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Condición de Pago</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange disabled:bg-gray-100"
                                    value={terminos}
                                    onChange={(e) => setTerminos(e.target.value)}
                                    disabled={isEditMode}
                                >
                                    <option>Contado</option>
                                    <option>Crédito 15 días</option>
                                    <option>Crédito 30 días</option>
                                    <option>Crédito 60 días</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Almacén de Recepción</label>
                                <select
                                    value={almacenId}
                                    onChange={(e) => setAlmacenId(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange disabled:cursor-not-allowed disabled:bg-gray-100"
                                    disabled={isEditMode}
                                >
                                    <option value="">Seleccione Almacén</option>
                                    {almacenes.map(a => (
                                        <option key={a.id} value={a.id}>{a.nombre}</option>
                                    ))}
                                </select>
                            </div>

                        </div>

                    </Card>
                </div>

                {/* Lines and Totals */}
                <div className="lg:col-span-3 space-y-4">
                    <Card className="min-h-[500px] flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between py-3">
                            <CardTitle className="text-sm uppercase tracking-wider text-gray-500">Artículos a Ingresar</CardTitle>
                            {!isEditMode && (
                                <Button size="sm" variant="ghost" className="text-hd-orange hover:bg-orange-50 hover:text-orange-700" onClick={() => setSearchModalOpen(true)}>
                                    <Plus className="mr-1 h-4 w-4" /> Agregar Producto
                                </Button>
                            )}
                        </CardHeader>

                        <div className="flex-1 p-0 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="w-[120px]">Código</TableHead>
                                        <TableHead>Producto</TableHead>
                                        <TableHead className="w-[120px]">Plan</TableHead>
                                        <TableHead className="w-[100px]">U.M.</TableHead>
                                        <TableHead className="w-[100px] text-right">Cantidad</TableHead>
                                        <TableHead className="w-[100px] text-right text-purple-600">Cant. Total</TableHead>
                                        <TableHead className="w-[120px] text-right">Costo Unit.</TableHead>
                                        <TableHead className="w-[120px] text-right">Total</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item, index) => {
                                        // Calculate Factor for Display
                                        let factor = 1;
                                        if (item.planMedida && item.unidad) {
                                            const plan = planesUoM.find(p => p.planId === item.planMedida);
                                            if (plan) {
                                                if (plan.unidadBase === item.unidad) {
                                                    factor = 1;
                                                } else {
                                                    const detail = (plan.detalles || []).find(d => d.unidadMedida === item.unidad);
                                                    if (detail) {
                                                        // Handle potential casing differences (cantidad vs Cantidad)
                                                        factor = detail.cantidad !== undefined ? detail.cantidad : (detail.Cantidad !== undefined ? detail.Cantidad : 1);
                                                    }
                                                }
                                            }
                                        }
                                        // Use stored total from DB if available (and not editing), otherwise calculate
                                        const totalConverted = item.cantTotal !== undefined ? item.cantTotal : ((parseFloat(item.cantidad) || 0) * factor);

                                        return (
                                            <TableRow key={index}>
                                                <TableCell className="font-mono text-xs text-gray-500">{item.codigo}</TableCell>
                                                <TableCell className="font-medium text-gray-800">{item.descripcion}</TableCell>
                                                <TableCell>
                                                    <select
                                                        className="w-full text-xs border-0 border-b border-transparent focus:border-hd-orange focus:ring-0 bg-transparent p-1 h-8"
                                                        value={item.planMedida}
                                                        onChange={(e) => handleUpdateItem(index, 'planMedida', e.target.value)}
                                                        disabled={isEditMode}
                                                    >
                                                        <option value="">--</option>
                                                        {planesUoM.map(p => (
                                                            <option key={p.planId} value={p.planId}>{p.planId}</option>
                                                        ))}
                                                    </select>
                                                </TableCell>
                                                <TableCell>
                                                    <select
                                                        className="w-full text-xs border-0 border-b border-transparent focus:border-hd-orange focus:ring-0 bg-transparent p-1 h-8"
                                                        value={item.unidad}
                                                        onChange={(e) => handleUpdateItem(index, 'unidad', e.target.value)}
                                                        disabled={isEditMode}
                                                    >
                                                        {(() => {
                                                            const plan = planesUoM.find(p => p.planId === item.planMedida);
                                                            const units = plan
                                                                ? [plan.unidadBase, ...(plan.detalles || []).map(d => d.unidadMedida)]
                                                                : [item.unidad];

                                                            // Fallback to prices if plan not found or empty
                                                            const finalUnits = units.length > 0 && units[0] !== "" ? units : (item.prices || []).map(p => p.unidadMedida);
                                                            const uniqueUnits = [...new Set(finalUnits)];

                                                            return uniqueUnits.map(u => (
                                                                <option key={u} value={u}>{u}</option>
                                                            ));
                                                        })()}
                                                    </select>
                                                </TableCell>
                                                <TableCell>
                                                    <input
                                                        type="number"
                                                        className="w-full text-right border-0 border-b border-transparent focus:border-hd-orange focus:ring-0 bg-transparent p-1 h-8"
                                                        value={item.cantidad}
                                                        onChange={(e) => handleUpdateItem(index, 'cantidad', e.target.value)}
                                                        disabled={isEditMode}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-purple-600">
                                                    {totalConverted.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <input
                                                        type="number"
                                                        className="w-full text-right border-0 border-b border-transparent focus:border-hd-orange focus:ring-0 bg-transparent p-1 h-8"
                                                        value={item.costo}
                                                        onChange={(e) => handleUpdateItem(index, 'costo', e.target.value)}
                                                        disabled={isEditMode}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-gray-900">
                                                    ${item.total.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    {!isEditMode && (
                                                        <button onClick={() => handleRemoveItem(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {items.length > 0 && (
                                        <TableRow className="bg-gray-50 font-bold border-t-2 border-gray-200">
                                            <TableCell colSpan={5} className="text-right">Total Cantidad ENTRADA:</TableCell>
                                            <TableCell className="text-right">{totalCantidad.toFixed(2)}</TableCell>
                                            <TableCell colSpan={3}></TableCell>
                                        </TableRow>
                                    )}
                                    {items.length === 0 && (
                                        <TableRow className="bg-gray-50/30 border-dashed border-b-2">
                                            <TableCell colSpan={6} className="text-center py-4 text-gray-400 italic text-xs">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <p>No hay artículos agregados aún.</p>
                                                    <Button
                                                        variant="outline"
                                                        className="text-hd-orange border-hd-orange hover:bg-orange-50"
                                                        onClick={() => setSearchModalOpen(true)}
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" /> Agregar Producto
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Resume Footer */}
                        <div className="bg-gray-50 border-t border-gray-200 p-6">
                            <div className="flex justify-end">
                                <div className="w-64 space-y-3">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Subtotal:</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Subtotal:</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>

                                    {config.habilitarFacturas && (
                                        <div className="flex justify-between text-sm text-gray-600" title="Impuestos calculados (Modo Fiscal Activo)">
                                            <span>Impuestos (Est. 18%):</span>
                                            <span>${impuestos.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="h-px bg-gray-300 my-2"></div>
                                    <div className="flex justify-between text-lg font-bold text-gray-900">
                                        <span>Total Compra:</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CompraForm;
