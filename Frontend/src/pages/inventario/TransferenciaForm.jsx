import React, { useState, useEffect } from 'react';
import ProductSearchModal from '../../components/ProductSearchModal';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, ChevronDown, ChevronRight, X, Trash2, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { getAlmacenes } from '../../api/almacenes';
import { getStock } from '../../api/articulos';
import { getPlanes as getPlanesUoM } from '../../api/unidadMedida';
import { getTransferenciaConfig } from '../../api/transferenciaConfig';


const API_BASE = ((import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') ? import.meta.env.VITE_API_URL : '/api');

const Section = ({ title, children, defaultExpanded = true }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    return (
        <div className="border border-gray-200 bg-white rounded-sm mb-4 shadow-sm overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-100"
            >
                {expanded ? <ChevronDown size={16} className="text-gray-500 mr-2" /> : <ChevronRight size={16} className="text-gray-500 mr-2" />}
                <span className="font-semibold text-sm text-gray-700 uppercase tracking-wide">{title}</span>
            </button>
            {expanded && (
                <div className="p-6 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

const Field = ({ label, children, required = false }) => (
    <div className="flex flex-col space-y-1">
        <label className="text-xs font-semibold text-gray-500 truncate flex items-center">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {children}
    </div>
);

const TransferenciaForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isReadOnly = !!id;

    const [loading, setLoading] = useState(false);
    const [almacenes, setAlmacenes] = useState([]);
    const [items, setItems] = useState([]);
    const [planesUoM, setPlanesUoM] = useState([]);
    const [defaultPlan, setDefaultPlan] = useState('');
    const [defaultUnit, setDefaultUnit] = useState('');
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    // Form State
    const [header, setHeader] = useState({
        numeroTransferencia: '(Auto)',
        fecha: new Date().toISOString().split('T')[0],
        almacenOrigenId: '',
        almacenDestinoId: '',
        observaciones: ''
    });



    // Handler functions (previously added)
    const handleHeaderChange = (field, value) => {
        setHeader(prev => ({ ...prev, [field]: value }));
    };

    const handleUpdateItem = (index, field, value) => {
        setItems(prev =>
            prev.map((item, i) => {
                if (i !== index) return item;
                const updatedItem = { ...item, [field]: value };

                // Logic for Plan Change
                if (field === 'planUoM') {
                    // Reset unit and factor when plan changes
                    const plan = planesUoM.find(p => p.planId === value);
                    if (plan && plan.detalles && plan.detalles.length > 0) {
                        updatedItem.unidadMedida = plan.detalles[0].unidadMedida;
                        updatedItem.cantidadUnidad = plan.detalles[0].cantidad || 1;
                    } else {
                        updatedItem.unidadMedida = item.unidadOriginal;
                        updatedItem.cantidadUnidad = 1;
                    }
                }

                // Logic for Unit Change
                if (field === 'unidadMedida') {
                    // Find factor in current plan
                    const plan = planesUoM.find(p => p.planId === item.planUoM);
                    if (plan) {
                        const detail = plan.detalles?.find(d => d.unidadMedida === value);
                        updatedItem.cantidadUnidad = detail ? (detail.cantidad || 1) : 1;
                    } else {
                        updatedItem.cantidadUnidad = 1;
                    }
                }

                return updatedItem;
            })
        );
    };

    const handleRemoveItem = (index) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                ...header,
                almacenOrigenId: Number(header.almacenOrigenId),
                almacenDestinoId: Number(header.almacenDestinoId),
                items: items
            };
            const method = id ? 'PUT' : 'POST';
            const res = await fetch(`${API_BASE}/Transferencias${id ? '/' + id : ''}`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                throw new Error('Failed to save transferencia');
            }
            navigate('/transferencias');
        } catch (e) {
            console.error(e);
            alert('Error al guardar la transferencia');
        } finally {
            setLoading(false);
        }
    };

    // New handler to add selected product to the transfer
    const handleSelectProduct = async (product) => {
        if (!header.almacenOrigenId) {
            alert("Debe seleccionar el Almacén Origen antes de agregar artículos.");
            return;
        }

        try {
            // Validar existencia en almacén origen
            const stockData = await getStock(product.id, Number(header.almacenOrigenId));
            const stockReal = stockData.stock !== undefined ? stockData.stock : (stockData.Stock !== undefined ? stockData.Stock : 0);

            if (stockReal <= 0) {
                alert(`El artículo "${product.descripcion}" no tiene existencia en el almacén de origen.`);
                return;
            }

            const newItem = {
                articuloId: product.id,
                numeroArticulo: product.numeroArticulo || product.NumeroArticulo || '',
                descripcion: product.descripcion || product.Descripcion || '',
                unidadMedida: product.unidadMedida || product.UnidadMedida || 'UND',
                cantidad: 0,
                existencia: stockReal,
                unidadOriginal: product.unidadMedida || product.UnidadMedida || 'UND',
                costoUnitario: product.costoUnitario || product.CostoUnitario || 0,
                planUoM: '',
                cantidadUnidad: 1
            };

            // Determine Plan (Default vs Product)
            const selectedPlanId = defaultPlan || product.planUoM || product.PlanUoM || '';
            newItem.planUoM = selectedPlanId;

            let unitFound = false;

            // Check Plan Details
            if (selectedPlanId) {
                const plan = planesUoM.find(p => p.planId === selectedPlanId);
                if (plan && plan.detalles) {
                    // 1. Try Default Unit in Plan (Case Insensitive)
                    if (defaultUnit) {
                        const targetUnit = defaultUnit.trim().toUpperCase();
                        const targetDetail = plan.detalles.find(d => (d.unidadMedida || '').trim().toUpperCase() === targetUnit);

                        if (targetDetail) {
                            newItem.unidadMedida = targetDetail.unidadMedida;
                            newItem.cantidadUnidad = targetDetail.cantidad || 1;
                            unitFound = true;
                        }
                    }

                    // 2. Fallback to First Unit in Plan
                    if (!unitFound && plan.detalles.length > 0) {
                        newItem.unidadMedida = plan.detalles[0].unidadMedida;
                        newItem.cantidadUnidad = plan.detalles[0].cantidad || 1;
                        unitFound = true;
                    }
                }
            }

            // 3. Fallback to Original Unit if matches Default Unit
            if (!unitFound && defaultUnit) {
                const targetUnit = defaultUnit.trim().toUpperCase();
                const originalUnit = (newItem.unidadOriginal || '').trim().toUpperCase();

                if (originalUnit === targetUnit || originalUnit === '') { // Also fallback if original is empty but we want to be safe, though mainly checking match
                    newItem.unidadMedida = newItem.unidadOriginal;
                    newItem.cantidadUnidad = 1;
                    unitFound = true;
                }
            }

            setItems(prev => [...prev, newItem]);
            setIsProductModalOpen(false);
        } catch (error) {
            console.error("Error al validar stock:", error);
            alert("Error al verificar la existencia del artículo. Intente nuevamente.");
        }
    };



    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const almData = await getAlmacenes();
                setAlmacenes(almData);

                // Fetch UoM Plans
                try {
                    const uomData = await getPlanesUoM();
                    setPlanesUoM(uomData || []);
                } catch (e) {
                    console.error("Error loading UoM plans:", e);
                }

                // Fetch Config
                try {
                    const config = await getTransferenciaConfig();
                    if (config) {
                        if (config.defaultPlanId) setDefaultPlan(config.defaultPlanId);
                        if (config.defaultUnit) setDefaultUnit(config.defaultUnit);
                    }
                } catch (e) {
                    console.error("Error loading config:", e);
                }

                if (almData.length > 0 && !id) {
                    setHeader(prev => ({
                        ...prev,
                        almacenOrigenId: almData[0].id,
                        almacenDestinoId: almData[1] ? almData[1].id : almData[0].id
                    }));
                }
            } catch (error) {
                console.error("Error loading warehouses:", error);
            }
        };
        fetchInitialData();
    }, [id]);

    // Load existing transfer
    useEffect(() => {
        if (id) {
            const loadTransfer = async () => {
                try {
                    setLoading(true);
                    const res = await fetch(`${API_BASE}/Transferencias/${id}`);
                    if (res.ok) {
                        const data = await res.json();
                        console.log('API Response:', data);
                        // Backend returns { header: {...}, items: [...] } (camelCase or PascalCase depending on serializer)
                        // Adjust based on actual API response structure from Controller: new { Header = header, Items = items }
                        const m = data.Header || data.header || data.master || data;
                        const d = data.Items || data.items || data.detalles || [];

                        // DEBUG: Temporary alert to diagnose the issue
                        if (d.length === 0) {
                            console.warn("No items found in response", data);
                            // alert("ALERTA: Recibí la cabecera pero NO los items. Verifique la consola (F12).");
                        } else {
                            // alert(`Recibí ${d.length} items. Primer item: ${JSON.stringify(d[0])}`);
                        }

                        setHeader({
                            numeroTransferencia: m.NumeroTransferencia || m.numeroTransferencia,
                            fecha: (m.Fecha || m.fecha || '').split('T')[0],
                            almacenOrigenId: m.AlmacenOrigenId || m.almacenOrigenId,
                            almacenDestinoId: m.AlmacenDestinoId || m.almacenDestinoId,
                            observaciones: m.Observaciones || m.observaciones || ''
                        });

                        setItems(d.map(item => ({
                            articuloId: item.ArticuloId || item.articuloId,
                            numeroArticulo: item.NumeroArticulo || item.numeroArticulo,
                            descripcion: item.Descripcion || item.descripcion || item.ArticuloNombre, // Controller query aliases as ArticuloNombre
                            cantidad: item.Cantidad || item.cantidad,
                            existencia: 0, // Not relevant for completed transfer view
                            unidadMedida: item.UnidadMedida || item.unidadMedida || 'UND',
                            cantidadUnidad: item.CantidadUnidad || item.cantidadUnidad || 1,
                            planUoM: item.PlanUoM || item.planUoM || '',
                            costoUnitario: item.CostoUnitario || item.costoUnitario
                        })));
                    }
                } catch (e) {
                    console.error(e);
                    alert("Error cargando transferencia");
                } finally {
                    setLoading(false);
                }
            };
            loadTransfer();
        }
    }, [id]);

    // ... (existing useEffects)

    // ... (handlers)

    return (
        <div className="flex flex-col h-full bg-gray-100 min-h-screen">
            {/* ... ProductSearchModal ... */}

            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/transferencias')} className="text-gray-500 hover:text-gray-800">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-col">
                        {/* ... labels ... */}
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">
                            {isReadOnly ? `Transferencia ${header.numeroTransferencia}` : 'Orden de Transferencia'}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/transferencias')} className="border-gray-300 text-gray-700">
                        <X className="mr-2 h-4 w-4" /> Cancelar
                    </Button>
                    {!isReadOnly && (
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-hd-orange hover:bg-orange-600 text-white shadow-sm border border-transparent"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Registrar Envío
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-6 max-w-7xl mx-auto w-full">

                <Section title="General">
                    <Field label="No. Transferencia">
                        <Input
                            value={header.numeroTransferencia}
                            disabled
                            className="bg-gray-50 border-gray-200"
                        />
                    </Field>
                    <Field label="Fecha Envío" required>
                        <Input
                            type="date"
                            className="font-medium"
                            value={header.fecha}
                            onChange={(e) => handleHeaderChange('fecha', e.target.value)}
                        />
                    </Field>
                    <Field label="Estado">
                        <div className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold uppercase">
                            Borrador
                        </div>
                    </Field>
                    <div className="col-span-1 md:col-span-3 h-px bg-gray-100 my-2"></div>

                    <div className="flex items-end space-x-4 col-span-1 md:col-span-2">
                        <div className="flex-1">
                            <Field label="Almacén Origen" required>
                                <select
                                    className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-hd-orange focus:border-hd-orange"
                                    value={header.almacenOrigenId}
                                    onChange={(e) => handleHeaderChange('almacenOrigenId', e.target.value)}
                                >
                                    <option value="">Seleccione Origen</option>
                                    {almacenes.map(alm => (
                                        <option key={alm.id} value={alm.id}>{alm.nombre}</option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                        <div className="pb-2 text-gray-400">
                            <ArrowRight size={20} />
                        </div>
                        <div className="flex-1">
                            <Field label="Almacén Destino" required>
                                <select
                                    className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-hd-orange focus:border-hd-orange"
                                    value={header.almacenDestinoId}
                                    onChange={(e) => handleHeaderChange('almacenDestinoId', e.target.value)}
                                >
                                    <option value="">Seleccione Destino</option>
                                    {almacenes.map(alm => (
                                        <option key={alm.id} value={alm.id}>{alm.nombre}</option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                    </div>

                    <Field label="Referencia / Chofer">
                        <Input
                            placeholder="Ej. Envío camión placa..."
                            value={header.observaciones}
                            onChange={(e) => handleHeaderChange('observaciones', e.target.value)}
                        />
                    </Field>
                </Section>

                {/* Lines Section */}
                <div className="border border-gray-200 bg-white rounded-sm mb-4 shadow-sm overflow-hidden flex flex-col">
                    <div className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <span className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Artículos a Transferir</span>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsProductModalOpen(true)}
                            className="text-hd-orange hover:text-orange-700 hover:bg-orange-50"
                        >
                            <Plus size={16} className="mr-1" /> Agregar Línea (F2)
                        </Button>
                    </div>

                    <div className="overflow-x-auto min-h-[300px]">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="w-[150px]">Código</TableHead>
                                    <TableHead className="">Descripción</TableHead>
                                    <TableHead className="w-[120px]">Plan</TableHead>
                                    <TableHead className="w-[100px]">Unidad</TableHead>
                                    <TableHead className="w-[100px] text-right">Cant. Unid.</TableHead>
                                    <TableHead className="w-[120px] text-right">Existencia</TableHead>
                                    <TableHead className="w-[120px] text-right">Cantidad</TableHead>
                                    <TableHead className="w-[120px] text-right">Total</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-20 text-gray-500 italic">
                                            No hay artículos en esta transferencia. Haga clic en "Agregar Línea" para comenzar.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-mono text-xs">{item.numeroArticulo}</TableCell>
                                            <TableCell className="text-xs">{item.descripcion}</TableCell>
                                            <TableCell className="text-xs">
                                                <select
                                                    className="w-full text-xs border rounded p-1"
                                                    value={item.planUoM || ''}
                                                    onChange={(e) => handleUpdateItem(index, 'planUoM', e.target.value)}
                                                >
                                                    <option value="">(Sin Plan)</option>
                                                    {planesUoM.map(p => (
                                                        <option key={p.planId} value={p.planId}>{p.descripcion || p.planId}</option>
                                                    ))}
                                                </select>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                <select
                                                    className="w-full text-xs border rounded p-1"
                                                    value={item.unidadMedida}
                                                    onChange={(e) => handleUpdateItem(index, 'unidadMedida', e.target.value)}
                                                >
                                                    <option value={item.unidadOriginal}>{item.unidadOriginal}</option>
                                                    {planesUoM
                                                        .find(p => p.planId === item.planUoM)?.detalles // Find plan details for this item
                                                        ?.filter(u => u.unidadMedida !== item.unidadOriginal) // Avoid duplicate if original is in plan
                                                        ?.map(u => (
                                                            <option key={u.unidadMedida} value={u.unidadMedida}>{u.unidadMedida}</option>
                                                        ))
                                                    }
                                                </select>
                                            </TableCell>
                                            <TableCell className="text-xs text-right">
                                                <Input
                                                    type="number"
                                                    className="h-8 text-right text-xs bg-gray-100 text-gray-500"
                                                    value={item.cantidadUnidad || 1}
                                                    disabled
                                                />
                                            </TableCell>
                                            <TableCell className={`text-xs text-right font-medium ${item.existencia <= 0 ? 'text-red-500' : 'text-blue-600'}`}>
                                                {item.existencia !== undefined ? item.existencia.toLocaleString() : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    className="h-8 text-right text-xs"
                                                    value={item.cantidad || ''}
                                                    min="0.0001"
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        handleUpdateItem(index, 'cantidad', isNaN(val) ? 0 : val);
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell className="text-xs text-right font-bold text-gray-800">
                                                {((item.cantidad || 0) * (item.cantidadUnidad || 1)).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveItem(index)}
                                                    className="h-9 w-9 p-0 text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 size={20} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

            </div>
            <ProductSearchModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSelect={handleSelectProduct}
            />
        </div>
    );
};

export default TransferenciaForm;


