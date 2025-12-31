import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, ChevronDown, ChevronRight, X, Trash2, Plus, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { getMotivos } from '../../api/motivosAjuste';
import { getArticulos } from '../../api/articulos';
import { getAlmacenes } from '../../api/almacenes';
import ErrorBoundary from '../../components/ErrorBoundary';
import { useAuth } from '../../context/AuthContext';

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

const AjusteForm = () => {
    const navigate = useNavigate();
    const { hasPermission, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !hasPermission('INVENTORY_ADJUSTMENT_CREATE')) {
            navigate('/ajustes');
        }
    }, [authLoading, hasPermission, navigate]);

    const [motivos, setMotivos] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [loadingMotivos, setLoadingMotivos] = useState(true);

    if (authLoading) return <div className="p-6">Verificando permisos...</div>;

    // Product Search State
    const [allProducts, setAllProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);

    // Form State
    const [header, setHeader] = useState({
        fecha: new Date().toISOString().split('T')[0],
        tipoAjuste: 'out', // 'in' or 'out'
        motivoId: '',
        almacenId: '',
        observaciones: ''
    });

    const [items, setItems] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [motivosData, productosData, almacenesData] = await Promise.all([
                    getMotivos(),
                    getArticulos(),
                    getAlmacenes()
                ]);

                if (Array.isArray(motivosData)) {
                    setMotivos(motivosData.filter(m => m.activo));
                } else if (motivosData && Array.isArray(motivosData.data)) {
                    setMotivos(motivosData.data.filter(m => m.activo));
                } else {
                    console.error("Structure of motivosData unexpected", motivosData);
                    setMotivos([]);
                }

                if (Array.isArray(almacenesData)) {
                    setAlmacenes(almacenesData);
                } else {
                    setAlmacenes([]);
                }

                if (Array.isArray(productosData)) {
                    setAllProducts(productosData);
                } else if (productosData && Array.isArray(productosData.data)) {
                    setAllProducts(productosData.data);
                } else {
                    console.error("Structure of productosData unexpected", productosData);
                    setAllProducts([]);
                }
            } catch (err) {
                console.error("Error loading data", err);
                setMotivos([]);
                setAllProducts([]);
            } finally {
                setLoadingMotivos(false);
            }
        };
        load();

        // Click outside to close search
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);

    }, []);

    // Helper to Group Reasons in Select
    const groupedMotivos = motivos.reduce((acc, curr) => {
        if (!acc[curr.grupo]) acc[curr.grupo] = [];
        acc[curr.grupo].push(curr);
        return acc;
    }, {});

    // Filtered Products for Search
    const filteredProducts = useMemo(() => {
        if (!searchTerm) return [];
        const lowerTerm = searchTerm.toLowerCase();
        return allProducts.filter(p =>
            (p.descripcion && p.descripcion.toLowerCase().includes(lowerTerm)) ||
            (p.codigo && p.codigo.toLowerCase().includes(lowerTerm)) ||
            (p.referencia && p.referencia.toLowerCase().includes(lowerTerm))
        ).slice(0, 10);
    }, [searchTerm, allProducts]);

    // Helper to get plan is imported dynamically inside
    // We also need config
    const [defaultConfig, setDefaultConfig] = useState(null);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const { getAjusteConfig } = await import('../../api/ajusteConfig');
                const conf = await getAjusteConfig();
                setDefaultConfig(conf);
            } catch (e) { console.error(e); }
        };
        loadConfig();
    }, []);

    const handleAddItem = async (product) => {
        // Check if already exists
        const exists = items.find(i => i.id === product.id);
        if (exists) {
            alert("El artículo ya está en la lista. Ajuste la cantidad en la línea existente.");
            return;
        }

        let unidadesPosibles = [];
        let unidadSeleccionada = product.unidadMedida || 'UND';
        let equivalente = 1;

        // 1. Try to use Default Plan if set, otherwise product's plan
        let planId = defaultConfig?.defaultPlanId || product.planMedida || product.PlanMedida;
        let planName = 'N/A';

        if (planId) {
            try {
                // Dynamic import or ensure getPlan is imported at top
                const { getPlan } = await import('../../api/unidades');
                const plan = await getPlan(planId);
                planName = plan.descripcion || plan.Descripcion || "Plan " + planId;
                const detalles = plan.detalles || plan.Detalles;
                if (plan && detalles) {
                    unidadesPosibles = detalles.map(d => ({
                        unidad: d.unidadMedida || d.UnidadMedida,
                        equivalente: parseFloat(d.cantidad || d.Cantidad || 1)
                    }));

                    // 2. Try to use Default Unit if available in plan
                    if (defaultConfig?.defaultUnit) {
                        const found = unidadesPosibles.find(u => u.unidad === defaultConfig.defaultUnit);
                        if (found) {
                            unidadSeleccionada = found.unidad;
                            equivalente = found.equivalente;
                        } else if (unidadesPosibles.length > 0) {
                            unidadSeleccionada = unidadesPosibles[0].unidad;
                            equivalente = unidadesPosibles[0].equivalente;
                        }
                    } else if (unidadesPosibles.length > 0) {
                        unidadSeleccionada = unidadesPosibles[0].unidad;
                        equivalente = unidadesPosibles[0].equivalente;
                    }
                }
            } catch (err) {
                console.error("Error fetching plan", err);
            }
        } else {
            unidadesPosibles.push({ unidad: unidadSeleccionada, equivalente: 1 });
        }

        const safeCostoBase = parseFloat(product.costoUnitario || product.costo || 0) || 0;
        const safeEquivalente = parseFloat(equivalente) || 1;
        const safeCosto = safeCostoBase * safeEquivalente;

        const newItem = {
            id: product.id,
            codigo: product.numeroArticulo || product.codigoBarras || product.codigo,
            descripcion: product.descripcion,
            unidad: unidadSeleccionada,
            unidadesPosibles: unidadesPosibles,
            equivalente: safeEquivalente,
            cantidad: 1,
            costoBase: safeCostoBase,
            costo: safeCosto,
            stockActual: product.stockActual || 0,
            planUoM: planId,
            planName: planName
        };
        setItems([...items, newItem]);
        setSearchTerm('');
        setShowResults(false);
    };

    const handleUpdateItem = (id, field, value) => {
        setItems(items.map(item => {
            if (item.id === id) {
                if (field === 'unidad') {
                    const selectedOption = item.unidadesPosibles.find(u => u.unidad === value);
                    const newEquivalente = selectedOption ? (parseFloat(selectedOption.equivalente) || 1) : 1;
                    const newCosto = (parseFloat(item.costoBase) || 0) * newEquivalente;

                    return {
                        ...item,
                        unidad: value,
                        equivalente: newEquivalente,
                        costo: newCosto
                    };
                }
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleRemoveItem = (id) => {
        setItems(items.filter(i => i.id !== id));
    };

    const totalAjuste = items.reduce((sum, item) => sum + (item.cantidad * item.costo), 0);

    const handleSave = async () => {
        if (!header.motivoId) {
            alert("Debe seleccionar un motivo.");
            return;
        }
        if (items.length === 0) {
            alert("Debe agregar al menos un artículo.");
            return;
        }

        const motivoDesc = motivos.find(m => m.id == header.motivoId)?.motivo || 'N/A';

        const ajusteDto = {
            ...header,
            motivoDescripcion: motivoDesc,
            motivoId: parseInt(header.motivoId),
            almacenId: parseInt(header.almacenId) || 1,
            detalles: items.map(i => ({
                articuloId: i.id,
                codigo: i.codigo,
                descripcion: i.descripcion,
                unidad: i.unidad,
                cantidad: i.cantidad,
                equivalente: i.equivalente,
                costo: i.costo,
                planUoM: i.planUoM
            }))
        };


        try {
            // Dynamic import to avoid top-level issues if not cleaned up
            const { createAjuste } = await import('../../api/ajustes');
            const res = await createAjuste(ajusteDto);
            alert(`Ajuste registrado con éxito. Documento: ${res.documento}`);
            navigate('/ajustes'); // Redirect to list
        } catch (error) {
            console.error(error);
            alert("Error al guardar el ajuste: " + error.message);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 min-h-screen">
            {/* Header Toolbar */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/ajustes')} className="text-gray-500 hover:text-gray-800">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 font-medium">Inventario</span>
                            <span className="text-gray-400 text-xs">/</span>
                            <span className="text-sm text-gray-800 font-bold">Nuevo Ajuste</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">Hoja de Ajuste</h1>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/ajustes')} className="border-gray-300 text-gray-700">
                        <X className="mr-2 h-4 w-4" /> Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSave} className="bg-hd-orange hover:bg-orange-600 text-white shadow-sm border border-transparent">
                        <Save className="mr-2 h-4 w-4" /> Registrar Ajuste
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-6 max-w-7xl mx-auto w-full">

                <Section title="General">
                    <Field label="No. Documento">
                        <Input placeholder="(Auto)" disabled className="bg-gray-50 border-gray-200" />
                    </Field>
                    <Field label="Fecha Registro" required>
                        <Input
                            type="date"
                            className="font-medium"
                            value={header.fecha}
                            onChange={(e) => setHeader({ ...header, fecha: e.target.value })}
                        />
                    </Field>
                    <div className="col-span-1">
                        <Field label="Tipo Ajuste" required>
                            <div className="flex flex-col">
                                <select
                                    className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-hd-orange focus:border-hd-orange cursor-help"
                                    value={header.tipoAjuste}
                                    title="Seleccione si el ajuste aumenta o disminuye el inventario"
                                    onChange={(e) => setHeader({ ...header, tipoAjuste: e.target.value })}
                                >
                                    <option value="in" title="Aumenta la cantidad de artículos en el almacén">Entrada (+) </option>
                                    <option value="out" title="Disminuye la cantidad de artículos en el almacén">Salida (-)</option>
                                </select>
                                <span className={`text-xs mt-1 font-medium ${header.tipoAjuste === 'in' ? 'text-green-600' : 'text-red-500'}`}>
                                    {header.tipoAjuste === 'in'
                                        ? "Aumenta el Stock: Para sobrantes, devoluciones o ingresos manuales."
                                        : "Disminuye el Stock: Para mermas, daños, robos o consumo interno."}
                                </span>
                            </div>
                        </Field>
                    </div>
                    <Field label="Almacén">
                        <select
                            className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-hd-orange focus:border-hd-orange"
                            value={header.almacenId}
                            onChange={(e) => setHeader({ ...header, almacenId: e.target.value })}
                        >
                            <option value="">Seleccione Almacén</option>
                            {loadingMotivos ? (
                                <option disabled>Cargando almacenes...</option>
                            ) : (
                                almacenes.map(a => (
                                    <option key={a.id} value={a.id}>{a.nombre}</option>
                                ))
                            )}
                        </select>
                    </Field>
                    <div className="col-span-1 md:col-span-2">
                        <Field label="Motivo del Ajuste" required>
                            <select
                                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-hd-orange focus:border-hd-orange"
                                value={header.motivoId}
                                onChange={(e) => setHeader({ ...header, motivoId: e.target.value })}
                            >
                                <option value="">-- Seleccione un Motivo --</option>
                                {loadingMotivos ? (
                                    <option disabled>Cargando motivos...</option>
                                ) : (
                                    Object.entries(groupedMotivos).map(([grupo, items]) => (
                                        <optgroup key={grupo} label={grupo}>
                                            {items.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.codigo} - {m.motivo}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))
                                )}
                            </select>
                        </Field>
                    </div>
                </Section>

                {/* Search Bar */}
                <div className="mb-4 relative" ref={searchRef}>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Buscar artículo por código o descripción para agregar..."
                            className="pl-10 py-6 text-lg border-hd-orange/30 focus:border-hd-orange shadow-sm"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowResults(true);
                            }}
                            onFocus={() => setShowResults(true)}
                        />
                    </div>
                    {showResults && searchTerm && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 mt-1 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(product => (
                                    <div
                                        key={product.id}
                                        className="px-4 py-3 hover:bg-orange-50 cursor-pointer border-b border-gray-50 last:border-0 flex justify-between items-center group"
                                        onClick={() => handleAddItem(product)}
                                    >
                                        <div>
                                            <div className="font-semibold text-gray-800">{product.descripcion}</div>
                                            <div className="text-xs text-gray-500 font-mono">
                                                {product.codigo}
                                                {product.referencia && ` | Ref: ${product.referencia}`}
                                            </div>
                                        </div>
                                        <div className="text-xs font-medium text-gray-500 group-hover:text-hd-orange">
                                            Stock: {product.stockActual || 0}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-gray-500 text-sm">No se encontraron productos</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Lines Section */}
                <div className="border border-gray-200 bg-white rounded-sm mb-4 shadow-sm overflow-hidden flex flex-col">
                    <div className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <span className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Líneas de Ajuste - {items.length} Items</span>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="w-[120px]">Código</TableHead>
                                    <TableHead className="w-[250px]">Descripción</TableHead>
                                    <TableHead className="w-[100px]">Plan</TableHead>
                                    <TableHead className="w-[100px]">Unidad</TableHead>
                                    <TableHead className="w-[80px] text-right">Cant. Unid.</TableHead>
                                    <TableHead className="w-[100px] text-right">Cantidad</TableHead>
                                    <TableHead className="w-[100px] text-right text-xs text-gray-500">Total Unidades</TableHead>
                                    <TableHead className="w-[100px] text-right">Costo Unit.</TableHead>
                                    <TableHead className="w-[100px] text-right">Total</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center text-gray-400 italic">
                                            Busque y agregue productos arriba para comenzar
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                                            <TableCell className="text-sm">{item.descripcion}</TableCell>
                                            <TableCell className="text-xs text-gray-500">{item.planName || 'N/A'}</TableCell>
                                            <TableCell>
                                                {item.unidadesPosibles && item.unidadesPosibles.length > 1 ? (
                                                    <select
                                                        className="h-8 text-xs border border-gray-300 rounded p-1 w-full"
                                                        value={item.unidad}
                                                        onChange={(e) => handleUpdateItem(item.id, 'unidad', e.target.value)}
                                                    >
                                                        {item.unidadesPosibles.map(u => (
                                                            <option key={u.unidad} value={u.unidad}>{u.unidad}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="text-xs">{item.unidad}</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-gray-500">
                                                {item.equivalente}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    className="h-8 text-right text-xs"
                                                    value={!isNaN(item.cantidad) ? item.cantidad : ''}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        handleUpdateItem(item.id, 'cantidad', isNaN(val) ? 0 : val);
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-semibold text-gray-600 bg-gray-50/50">
                                                {((!isNaN(item.cantidad) ? item.cantidad : 0) * (item.equivalente || 1)).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    className="h-8 text-right text-xs bg-gray-50"
                                                    value={!isNaN(item.costo) ? item.costo : ''}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        handleUpdateItem(item.id, 'costo', isNaN(val) ? 0 : val);
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-medium">
                                                {(item.cantidad * item.costo).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                                                    onClick={() => handleRemoveItem(item.id)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                        <div className="text-sm font-semibold text-gray-700">Total Valor Ajuste: <span className="text-lg ml-2 text-hd-orange">DOP {totalAjuste.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                    </div>
                </div>

            </div>
        </div>
    );
};

const AjusteFormWithBoundary = (props) => (
    <ErrorBoundary>
        <AjusteForm {...props} />
    </ErrorBoundary>
);

export default AjusteFormWithBoundary;
