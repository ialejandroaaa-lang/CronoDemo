import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
    Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, X,
    Plus, DollarSign, CreditCard, Calendar, CheckCircle, Clock, ArrowRight,
    ChevronDown, ChevronRight, Layers, LayoutGrid, Eye, FileText
} from 'lucide-react';
import { getProveedores } from '../../api/proveedores';
import ProviderDetails from './ProviderDetails';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';

const PagoProveedor = () => {
    const [pagos, setPagos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [proveedores, setProveedores] = useState([]);
    const [stats, setStats] = useState({
        deudaPendiente: 0,
        pagadoMes: 0,
        vencido: 0,
        deudaTotal: 0,
        cantidadFacturas: 0
    });
    const [deudaPorProveedor, setDeudaPorProveedor] = useState({});
    const [monedas, setMonedas] = useState([]);

    const [facturasPendientes, setFacturasPendientes] = useState([]);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const provs = await getProveedores();
            setProveedores(provs);

            await loadPagos();
            await loadDeudaTotal();
            await loadMonedas();
        } catch (error) {
            console.error("Error loading initial data:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadMonedas = async () => {
        try {
            const res = await fetch(`${API_BASE}/Monedas`);
            if (res.ok) {
                const data = await res.json();
                setMonedas(data);
            }
        } catch (error) {
            console.error("Error loading currencies:", error);
        }
    };

    const loadDeudaTotal = async () => {
        try {
            const res = await fetch(`${API_BASE}/Pagos/DeudaTotal`);
            if (res.ok) {
                const data = await res.json();
                setStats(prev => ({
                    ...prev,
                    deudaTotal: data.totalDeuda || data.TotalDeuda || 0,
                    cantidadFacturas: data.cantidadFacturas || data.CantidadFacturas || 0
                }));

                const porProv = {};
                data.porProveedor.forEach(p => {
                    const name = p.proveedorNombre || p.ProveedorNombre;
                    const balance = p.saldoTotal || p.SaldoTotal || 0;
                    if (name) porProv[name] = balance;
                });
                setDeudaPorProveedor(porProv);
            }
        } catch (error) {
            console.error("Error loading total debt:", error);
        }
    };

    const loadPagos = async () => {
        try {
            const res = await fetch(`${API_BASE}/Pagos`);
            if (res.ok) {
                const data = await res.json();
                setPagos(data);

                // Calculate basic stats for this view
                const pagado = data.filter(p => p.estado === 'Completado').reduce((acc, curr) => acc + curr.monto, 0);
                const pendiente = data.filter(p => p.estado === 'Pendiente').reduce((acc, curr) => acc + curr.monto, 0);
                setStats(prev => ({ ...prev, pagadoMes: pagado, deudaPendiente: pendiente }));
            }
        } catch (error) {
            console.error("Error loading payments:", error);
        }
    };

    const loadFacturasPendientes = async (proveedorId) => {
        if (!proveedorId) {
            setFacturasPendientes([]);
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/Pagos/FacturasPendientes/${proveedorId}`);
            if (res.ok) {
                const data = await res.json();
                setFacturasPendientes(data);
            }
        } catch (error) {
            console.error("Error loading pending invoices:", error);
        }
    };

    // --- Filter & Sort Logic ---
    const [sortConfig, setSortConfig] = useState({ key: 'fecha', direction: 'desc' });
    const [activeFilters, setActiveFilters] = useState({});
    const [selectedValues, setSelectedValues] = useState({});
    const [numericFilters, setNumericFilters] = useState({});
    const [showFilterFor, setShowFilterFor] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isGrouped, setIsGrouped] = useState(false);
    const [expandedSuppliers, setExpandedSuppliers] = useState(new Set());

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const toggleFilter = (field, e) => {
        if (e) e.stopPropagation();
        setShowFilterFor(showFilterFor === field ? null : field);
    };

    const handleFilterChange = (field, value) => {
        setActiveFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleNumericFilterChange = (field, type, value) => {
        setNumericFilters(prev => ({
            ...prev,
            [field]: { ...(prev[field] || { min: '', max: '' }), [type]: value }
        }));
    };

    const handleValueToggle = (field, value) => {
        setSelectedValues(prev => {
            const current = prev[field] || [];
            if (current.includes(value)) return { ...prev, [field]: current.filter(v => v !== value) };
            return { ...prev, [field]: [...current, value] };
        });
    };

    const handleTreeToggle = (field, path, isActive) => {
        setSelectedValues(prev => {
            const current = prev[field] || [];
            let newSelected = [...current];
            const tree = getDateTree();

            const findLeaves = (node, currentPath) => {
                if (!node.children) {
                    allLeafPaths.push(currentPath);
                    return;
                }
                Object.keys(node.children).forEach(k => {
                    findLeaves(node.children[k], currentPath ? `${currentPath}/${k}` : k);
                });
            };
            const allLeafPaths = [];

            if (path === "") {
                if (isActive) return { ...prev, [field]: [] };
                findLeaves(tree, "");
                return { ...prev, [field]: allLeafPaths };
            }

            const pathParts = path.split('/').filter(Boolean);
            let targetNode = tree;
            for (const part of pathParts) {
                targetNode = targetNode?.children?.[part];
                if (!targetNode) break;
            }

            if (targetNode) {
                const subLeaves = [];
                const findSubLeaves = (node, currentP) => {
                    if (!node.children) {
                        subLeaves.push(currentP);
                        return;
                    }
                    Object.keys(node.children).forEach(k => {
                        findSubLeaves(node.children[k], `${currentP}/${k}`);
                    });
                };
                findSubLeaves(targetNode, path);

                if (isActive) {
                    newSelected = newSelected.filter(p => !subLeaves.includes(p));
                } else {
                    subLeaves.forEach(p => {
                        if (!newSelected.includes(p)) newSelected.push(p);
                    });
                }
            }
            return { ...prev, [field]: newSelected };
        });
    };

    const getDateTree = () => {
        const tree = { children: {} };
        pagos.forEach(c => {
            const d = new Date(c.fecha);
            const year = String(d.getFullYear());
            const month = d.toLocaleDateString('es-DO', { month: 'long' });
            const day = String(d.getDate());

            if (!tree.children[year]) tree.children[year] = { children: {} };
            if (!tree.children[year].children[month]) tree.children[year].children[month] = { children: {} };
            if (!tree.children[year].children[month].children[day]) tree.children[year].children[month].children[day] = { count: 0 };
            tree.children[year].children[month].children[day].count++;
        });
        return tree;
    };

    const getUniqueValues = (field) => {
        const values = pagos.map(c => String(c[field] || ''));
        return [...new Set(values)].sort();
    };

    const formatForFilter = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: '2-digit' });
    };

    const clearFilters = () => {
        setActiveFilters({});
        setSelectedValues({});
        setNumericFilters({});
    };

    const getFilteredData = () => {
        let filtered = [...pagos];

        if (searchTerm) {
            filtered = filtered.filter(item =>
                Object.keys(item).some(key => {
                    if (key === 'facturasAfectadas') return false;
                    const val = key === 'fecha' ? formatForFilter(item[key]) : String(item[key]);
                    return val.toLowerCase().includes(searchTerm.toLowerCase());
                })
            );
        }

        Object.keys(activeFilters).forEach(field => {
            if (activeFilters[field]) {
                filtered = filtered.filter(item => {
                    if (field === 'fecha') {
                        const d = new Date(item[field]);
                        const val = `${d.getFullYear()} ${d.toLocaleDateString('es-DO', { month: 'long' })} ${d.getDate()}`;
                        return val.toLowerCase().includes(activeFilters[field].toLowerCase());
                    }
                    return String(item[field] || '').toLowerCase().includes(activeFilters[field].toLowerCase());
                });
            }
        });

        Object.keys(selectedValues).forEach(field => {
            if (selectedValues[field] && selectedValues[field].length > 0) {
                filtered = filtered.filter(item => {
                    if (field === 'fecha') {
                        const d = new Date(item[field]);
                        const path = `${d.getFullYear()}/${d.toLocaleDateString('es-DO', { month: 'long' })}/${d.getDate()}`;
                        return selectedValues[field].includes(path);
                    }
                    return selectedValues[field].includes(String(item[field]));
                });
            }
        });

        Object.keys(numericFilters).forEach(field => {
            const { min, max } = numericFilters[field];
            if (min !== '') filtered = filtered.filter(item => (item[field] || 0) >= parseFloat(min));
            if (max !== '') filtered = filtered.filter(item => (item[field] || 0) <= parseFloat(max));
        });

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    };

    const filteredPagos = getFilteredData();
    const dateTree = getDateTree();

    const groupedData = useMemo(() => {
        if (!isGrouped) return null;
        const groups = {};
        filteredPagos.forEach(p => {
            if (!groups[p.proveedorNombre]) {
                groups[p.proveedorNombre] = {
                    proveedor: p.proveedorNombre,
                    pagos: [],
                    totalCompletado: 0,
                    totalPendiente: 0,
                    deudaActual: 0
                };
            }
            groups[p.proveedorNombre].pagos.push(p);

            // CONTABILIDAD: Siempre sumar montos funcionales (DOP) para totales consolidados
            // Si el pago es en USD, p.monto estará en USD, pero necesitamos DOP para agrupar con otros.
            // Asumimos que si no tiene tasa o monto funcional, el monto ya está en DOP.
            const montoDOP = p.montoFuncional || (p.monedaCodigo === 'DOP' ? p.monto : p.monto * (p.tasaCambio || 1));

            if (p.estado === 'Completado') groups[p.proveedorNombre].totalCompletado += montoDOP;
            if (p.estado === 'Pendiente') groups[p.proveedorNombre].totalPendiente += montoDOP;
        });

        // Add providers with debt but no payments in the current filter
        Object.keys(deudaPorProveedor).forEach(name => {
            const matchesSearch = !searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return;

            if (!groups[name] && deudaPorProveedor[name] > 0) {
                groups[name] = {
                    proveedor: name,
                    pagos: [],
                    totalCompletado: 0,
                    totalPendiente: 0,
                    deudaActual: deudaPorProveedor[name]
                };
            } else if (groups[name]) {
                groups[name].deudaActual = deudaPorProveedor[name];
            }
        });

        return Object.values(groups).sort((a, b) => a.proveedor.localeCompare(b.proveedor));
    }, [filteredPagos, isGrouped, deudaPorProveedor]);

    const toggleSupplierExpansion = (supplier) => {
        const newExpanded = new Set(expandedSuppliers);
        if (newExpanded.has(supplier)) newExpanded.delete(supplier);
        else newExpanded.add(supplier);
        setExpandedSuppliers(newExpanded);
    };

    // --- Modal Logic ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPayment, setNewPayment] = useState({
        proveedorId: '',
        fecha: new Date().toISOString().split('T')[0],
        metodo: 'Transferencia',
        monto: 0,
        nota: '',
        monedaId: '',
        tasaCambio: 1,
        allocations: {}
    });

    // Set default functional currency when modal opens
    useEffect(() => {
        if (isModalOpen && monedas.length > 0 && !newPayment.monedaId) {
            const func = monedas.find(m => m.esFuncional);
            if (func) {
                setNewPayment(prev => ({ ...prev, monedaId: func.id, tasaCambio: 1 }));
            }
        }
    }, [isModalOpen, monedas]);

    const handleInputChange = async (field, value) => {
        if (field === 'proveedorId') {
            setNewPayment(prev => ({ ...prev, proveedorId: value, allocations: {}, monto: 0 }));
            loadFacturasPendientes(value);
        } else if (field === 'monedaId') {
            const monId = parseInt(value);
            const mon = monedas.find(m => m.id === monId);
            let tasa = 1;
            if (mon && !mon.esFuncional) {
                // Fetch rate
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
            setNewPayment(prev => ({ ...prev, monedaId: value, tasaCambio: tasa, allocations: {}, monto: 0, tasaOficial: tasa }));
        } else {
            setNewPayment(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleAllocationChange = (invoiceId, amount, maxSaldo) => {
        // maxSaldo is in the Invoice Currency
        let val = parseFloat(amount) || 0;

        // Validation: Cannot pay more than balance
        if (val > maxSaldo) val = maxSaldo;
        if (val < 0) val = 0;

        const newAllocations = { ...newPayment.allocations, [invoiceId]: val };
        if (val === 0) delete newAllocations[invoiceId];

        // Total of payment in the Payment Currency
        // If Payment Currency == Invoice Currency -> 1:1
        // If Payment Currency is DOP and Invoice is USD -> PaymentAmount = val * tasaCambio
        // If Payment Currency is USD and Invoice is DOP -> PaymentAmount = val / tasaCambio

        const computePaymentTotal = () => {
            let total = 0;
            const payMonId = parseInt(newPayment.monedaId);
            const payMon = monedas.find(m => m.id === payMonId);

            Object.keys(newAllocations).forEach(id => {
                const inv = facturasPendientes.find(f => f.id === parseInt(id));
                const applied = newAllocations[id]; // Amount in Invoice Currency

                if (!inv) return;

                if (inv.monedaId === payMonId) {
                    total += applied;
                } else if (payMon?.esFuncional) {
                    // Payment in DOP, Invoice in USD
                    total += applied * newPayment.tasaCambio;
                } else {
                    // Payment in USD, Invoice in DOP
                    total += applied / newPayment.tasaCambio;
                }
            });
            return total;
        };

        setNewPayment(prev => ({
            ...prev,
            allocations: newAllocations,
            monto: computePaymentTotal()
        }));
    };

    const handlePayAll = (invoiceId, saldo) => {
        handleAllocationChange(invoiceId, saldo, saldo);
    };

    const handleRegisterPayment = async (e) => {
        e.preventDefault();
        if (newPayment.monto <= 0) return alert("El monto del pago debe ser mayor a 0");

        try {
            const body = {
                proveedorId: parseInt(newPayment.proveedorId),
                fecha: newPayment.fecha,
                metodo: newPayment.metodo,
                monto: newPayment.monto,
                nota: newPayment.nota,
                monedaId: parseInt(newPayment.monedaId),
                tasaCambio: parseFloat(newPayment.tasaCambio),
                allocations: Object.keys(newPayment.allocations).map(key => {
                    const invId = parseInt(key);
                    const inv = facturasPendientes.find(f => f.id === invId);
                    const appliedAmount = newPayment.allocations[key]; // Monto en la moneda de la factura

                    // Cálculo Contable (Moneda Funcional - DOP)
                    const invMon = monedas.find(m => m.id === inv.monedaId);
                    const valorContableFactura = appliedAmount * (inv.tasaFactura || 1);

                    let functionalAmount = appliedAmount;
                    if (!invMon?.esFuncional) {
                        functionalAmount = appliedAmount * newPayment.tasaCambio;
                    }

                    const diferencia = functionalAmount - valorContableFactura;

                    return {
                        invoiceId: invId,
                        monto: appliedAmount,
                        montoFuncional: functionalAmount,
                        diferenciaCambiaria: diferencia
                    };
                })
            };

            const res = await fetch(`${API_BASE}/Pagos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setIsModalOpen(false);
                setNewPayment({
                    proveedorId: '', fecha: new Date().toISOString().split('T')[0], metodo: 'Transferencia', monto: 0, nota: '', allocations: {}
                });
                loadPagos();
            } else {
                const err = await res.json();
                alert(err.message || "Error al registrar pago");
            }
        } catch (error) {
            console.error("Error creating payment:", error);
            alert("Error de conexión");
        }
    };

    // --- Confirmation Modal Logic ---
    // --- Confirmation Modal Logic ---
    const [confirmingPago, setConfirmingPago] = useState(null);
    const [viewingPayment, setViewingPayment] = useState(null);
    const [confirmReference, setConfirmReference] = useState('');

    const handleOpenConfirm = (pago) => {
        setConfirmingPago(pago);
        setConfirmReference('');
    };

    const handleCompletePayment = async (e) => {
        if (e) e.preventDefault();
        if (!confirmReference && confirmingPago.metodo !== 'Efectivo') {
            return alert("Debe ingresar el número de referencia");
        }

        try {
            const res = await fetch(`${API_BASE}/Pagos/${confirmingPago.id}/confirmar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referencia: confirmReference || 'PAGADO' })
            });

            if (res.ok) {
                setConfirmingPago(null);
                loadPagos();
            } else {
                const err = await res.json();
                alert(err.message || "Error al confirmar pago");
            }
        } catch (error) {
            console.error("Error confirming payment:", error);
            alert("Error de conexión");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Pagos a Proveedores</h1>
                    <p className="text-sm text-gray-500">Gestión de histórico y nuevos pagos.</p>
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        className={`${isGrouped ? 'bg-orange-50 text-hd-orange border-hd-orange' : 'text-gray-500'}`}
                        onClick={() => setIsGrouped(!isGrouped)}
                    >
                        {isGrouped ? <LayoutGrid size={18} className="mr-2" /> : <Layers size={18} className="mr-2" />}
                        {isGrouped ? 'Vista Lista' : 'Agrupar por Proveedor'}
                    </Button>
                    <Button className="bg-hd-orange hover:bg-orange-700 text-white" onClick={() => setIsModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Pago
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-red-50 border-red-100">
                    <div className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-600">Deuda en Pagos Pendientes</p>
                            <p className="text-2xl font-bold text-red-900">RD$ {stats.deudaPendiente.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="p-2 bg-red-100 rounded-full text-red-600"><DollarSign size={24} /></div>
                    </div>
                </Card>
                <Card className="bg-blue-50 border-blue-100">
                    <div className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600">Total Pagado</p>
                            <p className="text-2xl font-bold text-blue-900">RD$ {stats.pagadoMes.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-full text-blue-600"><CheckCircle size={24} /></div>
                    </div>
                </Card>
                <Card className="bg-hd-black border-hd-orange border-l-4 shadow-md">
                    <div className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-hd-orange uppercase tracking-wider text-[10px]">Deuda Total Consolidada</p>
                            <p className="text-2xl font-bold text-white">RD$ {stats.deudaTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                            <p className="text-[10px] text-gray-400">{stats.cantidadFacturas} Facturas (Valores en Pesos)</p>
                        </div>
                        <div className="p-2 bg-hd-orange/20 rounded-full text-hd-orange"><Layers size={24} /></div>
                    </div>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row justify-between items-center pb-4">
                    <CardTitle>{isGrouped ? 'Resumen por Proveedor' : 'Historial de Pagos'}</CardTitle>
                    <div className="flex items-center space-x-2">
                        {(Object.keys(activeFilters).length > 0 ||
                            Object.keys(selectedValues).some(k => Array.isArray(selectedValues[k]) && selectedValues[k].length > 0) ||
                            Object.keys(numericFilters).some(k => numericFilters[k].min !== '' || numericFilters[k].max !== '')) && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-hd-orange hover:text-orange-700">
                                    <X size={14} className="mr-1" /> Limpiar Filtros
                                </Button>
                            )}
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Buscar pago..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>

                <div className="p-0 overflow-visible relative min-h-[500px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {isGrouped && <TableHead className="w-10"></TableHead>}
                                <SortableHeader label="Fecha" field="fecha" sortConfig={sortConfig} onSort={handleSort} onFilter={toggleFilter} showFilter={showFilterFor === 'fecha'} filterValue={activeFilters['fecha']} onFilterChange={handleFilterChange} dateTree={dateTree} selectedValues={selectedValues['fecha']} onTreeToggle={handleTreeToggle} />
                                <SortableHeader label="Referencia" field="referencia" sortConfig={sortConfig} onSort={handleSort} onFilter={toggleFilter} showFilter={showFilterFor === 'referencia'} filterValue={activeFilters['referencia']} onFilterChange={handleFilterChange} className="font-mono text-xs" />
                                <SortableHeader label="Proveedor" field="proveedorNombre" sortConfig={sortConfig} onSort={handleSort} onFilter={toggleFilter} showFilter={showFilterFor === 'proveedorNombre'} filterValue={activeFilters['proveedorNombre']} onFilterChange={handleFilterChange} uniqueValues={getUniqueValues('proveedorNombre')} selectedValues={selectedValues['proveedorNombre']} onValueToggle={handleValueToggle} />
                                <SortableHeader label="Método" field="metodo" sortConfig={sortConfig} onSort={handleSort} onFilter={toggleFilter} showFilter={showFilterFor === 'metodo'} filterValue={activeFilters['metodo']} onFilterChange={handleFilterChange} uniqueValues={getUniqueValues('metodo')} selectedValues={selectedValues['metodo']} onValueToggle={handleValueToggle} />
                                <SortableHeader label="Monto" field="monto" sortConfig={sortConfig} onSort={handleSort} onFilter={toggleFilter} showFilter={showFilterFor === 'monto'} numericValue={numericFilters['monto']} onNumericFilterChange={handleNumericFilterChange} className="text-right" />
                                <SortableHeader label="Estado" field="estado" sortConfig={sortConfig} onSort={handleSort} onFilter={toggleFilter} showFilter={showFilterFor === 'estado'} filterValue={activeFilters['estado']} onFilterChange={handleFilterChange} uniqueValues={getUniqueValues('estado')} selectedValues={selectedValues['estado']} onValueToggle={handleValueToggle} />
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={isGrouped ? 8 : 7} className="text-center py-8">Cargando...</TableCell></TableRow>
                            ) : isGrouped ? (
                                groupedData.map(group => (
                                    <React.Fragment key={group.proveedor}>
                                        <TableRow
                                            className="bg-gray-50/50 hover:bg-gray-50 cursor-pointer font-medium"
                                            onClick={() => toggleSupplierExpansion(group.proveedor)}
                                        >
                                            <TableCell>
                                                {expandedSuppliers.has(group.proveedor) ? <ChevronDown size={14} className="text-hd-orange" /> : <ChevronRight size={14} />}
                                            </TableCell>
                                            <TableCell className="text-gray-400 font-sans italic text-[10px]">Múltiples fechas</TableCell>
                                            <TableCell className="text-blue-600 font-mono text-[10px]">GRUPO</TableCell>
                                            <TableCell className="font-bold text-gray-800">{group.proveedor}</TableCell>
                                            <TableCell className="text-gray-400 font-sans italic text-[10px]">Múltiples</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-green-600 font-bold">Pagado: RD$ {group.totalCompletado.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    {group.totalPendiente > 0 && (
                                                        <span className="text-yellow-600 text-[10px]">Programado: RD$ {group.totalPendiente.toLocaleString()}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-gray-900 font-bold text-[11px]">Deuda: RD$ {group.deudaActual.toLocaleString()}</span>
                                                    <span className={`text-[10px] text-blue-600`}>
                                                        {group.pagos.length} Pagos
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                        {expandedSuppliers.has(group.proveedor) && (
                                            <TableRow className="bg-white border-l-4 border-hd-orange">
                                                <TableCell colSpan={8} className="p-0">
                                                    <ProviderDetails proveedor={group.proveedor} proveedorId={group.pagos[0]?.proveedorId} />
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : filteredPagos.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No se encontraron pagos.</TableCell></TableRow>
                            ) : (
                                filteredPagos.map((pago) => (
                                    <TableRow key={pago.id} className="hover:bg-gray-50 group text-xs font-sans">
                                        <TableCell className="font-sans">{new Date(pago.fecha).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-[11px]">
                                                <span className={`font-mono ${pago.referencia === 'PENDIENTE' ? 'text-orange-400 italic' : 'text-blue-600'}`}>
                                                    {pago.referencia}
                                                </span>
                                                {pago.facturasAfectadas?.length > 0 && (
                                                    <span className="text-[10px] text-gray-400">
                                                        {pago.facturasAfectadas.map(f => f.numero).join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-gray-700">{pago.proveedorNombre}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <CreditCard size={14} className="text-gray-400" />
                                                <span>{pago.metodo}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {pago.monedaSimbolo || 'RD$'} {pago.monto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${pago.estado === 'Completado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {pago.estado}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex space-x-1">
                                                <Button size="xs" variant="ghost" className="h-7 w-7 p-0 text-gray-500 hover:text-hd-orange hover:bg-orange-50" onClick={() => setViewingPayment(pago)} title="Ver detalles">
                                                    <Eye size={16} />
                                                </Button>
                                                {pago.estado === 'Pendiente' && (
                                                    <Button size="xs" className="h-7 text-[10px] bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleOpenConfirm(pago)}>
                                                        Confirmar
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Modal de Registro de Pago (Solo selección y abonos) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-hd-orange p-4 flex justify-between items-center text-white">
                            <h2 className="text-lg font-bold flex items-center"><DollarSign className="mr-2" size={20} /> Programar Pago a Proveedor</h2>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-orange-700 p-1 rounded transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleRegisterPayment} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                                    <select className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-hd-orange focus:ring-hd-orange" value={newPayment.proveedorId} onChange={(e) => handleInputChange('proveedorId', e.target.value)} required>
                                        <option value="">Seleccione un proveedor</option>
                                        {proveedores.map(p => <option key={p.id} value={p.id}>{p.razonSocial}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Programada</label>
                                        <Input type="date" value={newPayment.fecha} onChange={(e) => handleInputChange('fecha', e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
                                        <select className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-hd-orange focus:ring-hd-orange" value={newPayment.metodo} onChange={(e) => handleInputChange('metodo', e.target.value)}>
                                            <option value="Transferencia">Transferencia</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="Efectivo">Efectivo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-orange-50/50 p-3 rounded-md border border-orange-100">
                                <div>
                                    <label className="block text-xs font-bold text-orange-800 uppercase mb-1 tracking-wider">Moneda de Pago</label>
                                    <select
                                        className="w-full rounded-md border border-orange-200 p-2 text-sm focus:ring-hd-orange focus:border-hd-orange bg-white shadow-sm"
                                        value={newPayment.monedaId}
                                        onChange={(e) => handleInputChange('monedaId', e.target.value)}
                                    >
                                        {monedas.map(m => <option key={m.id} value={m.id}>{m.codigo} - {m.nombre}</option>)}
                                    </select>
                                </div>
                                {monedas.find(m => m.id === parseInt(newPayment.monedaId))?.esFuncional === false && (
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-xs font-bold text-orange-800 uppercase tracking-wider">Tasa de Cambio</label>
                                            {newPayment.tasaOficial > 0 && Math.abs(newPayment.tasaCambio - newPayment.tasaOficial) / newPayment.tasaOficial > 0.05 && (
                                                <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded animate-pulse font-bold">Variación Inusual</span>
                                            )}
                                        </div>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={newPayment.tasaCambio}
                                            onChange={(e) => handleInputChange('tasaCambio', e.target.value)}
                                            className={`border-orange-200 bg-white ${Math.abs(newPayment.tasaCambio - newPayment.tasaOficial) / newPayment.tasaOficial > 0.05 ? 'ring-1 ring-red-400 border-red-400' : ''}`}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-50 border border-gray-100 rounded-md p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-bold text-gray-700 flex items-center">
                                        <Calendar className="mr-2" size={16} /> Facturas Pendientes
                                        {newPayment.proveedorId && <span className="ml-2 px-2 py-0.5 bg-hd-orange/10 text-hd-orange rounded-full text-[10px]">{facturasPendientes.length} totales</span>}
                                    </h3>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="showAllCurrencies"
                                            className="rounded border-gray-300 text-hd-orange focus:ring-hd-orange h-3 w-3"
                                            checked={newPayment.showAllCurrencies || false}
                                            onChange={(e) => setNewPayment(prev => ({ ...prev, showAllCurrencies: e.target.checked }))}
                                        />
                                        <label htmlFor="showAllCurrencies" className="text-xs text-gray-600 cursor-pointer select-none">Mostrar todas las monedas</label>
                                    </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-sm bg-white">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-gray-100 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2">Factura #</th>
                                                <th className="px-3 py-2 text-right">Saldo Original</th>
                                                <th className="px-3 py-2 text-right w-32">Monto a Aplicar</th>
                                                <th className="px-3 py-2 text-center w-24">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 font-mono">
                                            {!newPayment.proveedorId ? (
                                                <tr><td colSpan={5} className="p-4 text-center text-gray-400">Seleccione un proveedor.</td></tr>
                                            ) : (
                                                (() => {
                                                    const displayedInvoices = facturasPendientes.filter(inv =>
                                                        newPayment.showAllCurrencies ||
                                                        !newPayment.monedaId ||
                                                        inv.monedaId === parseInt(newPayment.monedaId)
                                                    );

                                                    if (displayedInvoices.length === 0) {
                                                        return <tr><td colSpan={5} className="p-4 text-center text-gray-400 font-sans">No hay facturas pendientes en esta moneda.</td></tr>;
                                                    }

                                                    return displayedInvoices.map(inv => (
                                                        <tr key={inv.id} className="hover:bg-blue-50/30">
                                                            <td className="px-3 py-1 font-medium text-[10px]">{inv.numero}</td>
                                                            <td className="px-3 py-1 text-right text-gray-500 font-sans">
                                                                {inv.monedaSimbolo || 'RD$'} {inv.saldo.toLocaleString()}
                                                            </td>
                                                            <td className="px-3 py-1 text-right">
                                                                <div className="flex items-center justify-end">
                                                                    <span className="text-[10px] text-gray-400 mr-1">{inv.monedaCodigo}</span>
                                                                    <Input type="number" step="0.01" className="h-6 w-24 text-right text-[10px]" value={newPayment.allocations[inv.id] || ''} onChange={(e) => handleAllocationChange(inv.id, e.target.value, inv.saldo)} />
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-1 text-center font-sans">
                                                                <Button type="button" size="xs" variant="ghost" className="text-[9px] h-6 text-blue-600 font-bold" onClick={() => handlePayAll(inv.id, inv.saldo)}>Saldar</Button>
                                                            </td>
                                                        </tr>
                                                    ));
                                                })()
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-between items-end">
                                <div className="flex-1 mr-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nota / Comentario</label>
                                    <Input placeholder="Opcional..." value={newPayment.nota} onChange={(e) => handleInputChange('nota', e.target.value)} />
                                </div>
                                <div className="flex flex-col space-y-2">
                                    {(() => {
                                        let diffTotal = 0;
                                        let totalDOP = 0;
                                        Object.keys(newPayment.allocations).forEach(key => {
                                            const inv = facturasPendientes.find(f => f.id === parseInt(key));
                                            const applied = newPayment.allocations[key];
                                            const originalDOP = applied * (inv.tasaFactura || 1);
                                            const payMon = monedas.find(m => m.id === parseInt(newPayment.monedaId));
                                            let currentDOP = applied;
                                            if (payMon?.esFuncional) {
                                                currentDOP = (inv.monedaId !== payMon.id) ? (applied * newPayment.tasaCambio) : applied;
                                            } else {
                                                currentDOP = applied * newPayment.tasaCambio;
                                            }
                                            diffTotal += (currentDOP - originalDOP);
                                            totalDOP += currentDOP;
                                        });

                                        return (
                                            <>
                                                {Math.abs(diffTotal) > 0.01 && (
                                                    <div className={`text-[10px] px-2 py-1 rounded border ${diffTotal > 0 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                                                        <span className="font-bold">Diferencia Cambiaria:</span> RD$ {diffTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        <p className="opacity-70">{diffTotal > 0 ? '↑ Pérdida por tasa' : '↓ Ganancia por tasa'}</p>
                                                    </div>
                                                )}
                                                <div className="w-48 bg-gray-900 shadow-inner text-white p-3 rounded-md text-right border-l-4 border-hd-orange">
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total a Pagar</p>
                                                    <p className="text-xl font-bold font-mono">
                                                        {monedas.find(m => m.id === parseInt(newPayment.monedaId))?.simbolo || 'RD$'} {newPayment.monto.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <p className="text-[9px] text-gray-500 mt-1 italic">Equivalente: RD$ {totalDOP.toLocaleString()}</p>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>


                            <div className="pt-4 flex justify-end space-x-2 border-t border-gray-100">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cerrar</Button>
                                <Button type="submit" className="bg-hd-orange hover:bg-orange-700 text-white shadow-lg">Registrar como Pendiente</Button>
                            </div>
                        </form>
                    </div>
                </div >
            )}

            {/* Modal de Confirmación (Aquí se pide la referencia) */}
            {confirmingPago && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-t-4 border-blue-600">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-blue-50">
                            <h2 className="text-blue-900 font-bold flex items-center"><CheckCircle className="mr-2" size={20} /> Confirmar Ejecución de Pago</h2>
                            <button onClick={() => setConfirmingPago(null)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <form onSubmit={handleCompletePayment} className="p-6 space-y-4">
                            <div className="bg-gray-50 p-3 rounded-md border border-gray-200 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Proveedor:</span>
                                    <span className="font-bold">{confirmingPago.proveedorNombre}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Monto:</span>
                                    <span className="font-bold text-blue-700">{confirmingPago.monedaSimbolo || 'RD$'} {confirmingPago.monto.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Método:</span>
                                    <span className="font-bold flex items-center"><CreditCard size={12} className="mr-1" /> {confirmingPago.metodo}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {confirmingPago.metodo === 'Cheque' ? 'Número de Cheque' :
                                        confirmingPago.metodo === 'Transferencia' ? 'Número de Transferencia' : 'Referencia de Pago'}
                                </label>
                                <Input
                                    className="border-blue-200 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={confirmingPago.metodo === 'Efectivo' ? 'Referencia opcional...' : `Ingrese ${confirmingPago.metodo === 'Cheque' ? 'No. Cheque' : 'No. Transferencia'}...`}
                                    value={confirmReference}
                                    onChange={(e) => setConfirmReference(e.target.value)}
                                    required={confirmingPago.metodo !== 'Efectivo'}
                                    autoFocus
                                />
                                {confirmingPago.metodo !== 'Efectivo' && (
                                    <p className="text-[10px] text-orange-600 mt-1">* Este dato es obligatorio para cerrar el pago.</p>
                                )}
                            </div>

                            <div className="pt-2 flex justify-end space-x-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setConfirmingPago(null)}>Volver</Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                                    Marcar como Pagado
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Detalle de Pago */}
            {viewingPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gray-100 p-4 flex justify-between items-center border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center"><FileText className="mr-2" size={20} /> Detalle de Pago</h2>
                            <button onClick={() => setViewingPayment(null)} className="hover:bg-gray-200 p-1 rounded transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-xs text-gray-500">Proveedor</p>
                                    <p className="font-bold text-gray-800">{viewingPayment.proveedorNombre}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Fecha</p>
                                    <p className="font-bold text-gray-800">{new Date(viewingPayment.fecha).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Referencia / Método</p>
                                    <p className="font-bold text-gray-800">{viewingPayment.referencia} <span className="text-xs font-normal text-gray-500">({viewingPayment.metodo})</span></p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Monto Total</p>
                                    <p className="font-bold text-blue-600 text-lg">
                                        {viewingPayment.monedaSimbolo || 'RD$'} {viewingPayment.monto.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>

                            <h3 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">Facturas Afectadas</h3>
                            <div className="max-h-60 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="py-2 h-8 text-xs">Factura</TableHead>
                                            <TableHead className="py-2 h-8 text-xs text-right">Monto Aplicado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {viewingPayment.facturasAfectadas && viewingPayment.facturasAfectadas.length > 0 ? (
                                            viewingPayment.facturasAfectadas.map((f, idx) => (
                                                <TableRow key={idx} className="hover:bg-gray-50">
                                                    <TableCell className="py-2 text-xs font-mono">{f.numero}</TableCell>
                                                    <TableCell className="py-2 text-xs text-right font-medium">
                                                        {viewingPayment.monedaSimbolo || 'RD$'} {(f.monto || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center py-4 text-gray-400 text-xs">No hay detalles de facturas.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
                            <Button variant="outline" onClick={() => setViewingPayment(null)}>Cerrar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

// Reusable Components
const SortableHeader = ({ label, field, sortConfig, onSort, onFilter, showFilter, filterValue = '', onFilterChange, numericValue = { min: '', max: '' }, onNumericFilterChange, uniqueValues = [], selectedValues = [], onValueToggle, dateTree, onTreeToggle, className = '' }) => {
    const isSorted = sortConfig.key === field;
    const isNumeric = onNumericFilterChange !== undefined;
    const isDate = dateTree !== undefined;
    const hasFilter = filterValue || (selectedValues && selectedValues.length > 0) || (isNumeric && (numericValue.min !== '' || numericValue.max !== ''));
    return (
        <TableHead className={`relative group p-0 ${className}`}>
            <div className="flex items-center justify-between h-full px-4 py-2 hover:bg-gray-200 cursor-pointer transition-colors" onClick={() => onSort(field)}>
                <div className="flex items-center space-x-1 text-[11px]">
                    <span className="font-bold text-gray-700">{label}</span>
                    {isSorted ? (sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-hd-orange" /> : <ArrowDown size={12} className="text-hd-orange" />) : (<ArrowUpDown size={12} className="text-gray-400 opacity-0 group-hover:opacity-100" />)}
                </div>
                {onFilter && <button onClick={(e) => onFilter(field, e)} className={`p-1 rounded-sm ${hasFilter ? 'text-hd-orange' : 'text-gray-400'}`}><Filter size={12} fill={hasFilter ? 'currentColor' : 'none'} /></button>}
            </div>
            {showFilter && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 shadow-2xl rounded-sm z-[100] text-[11px]" onClick={e => e.stopPropagation()}>
                    <div className="p-1 border-b border-gray-100">
                        <div className="flex items-center px-3 py-2 hover:bg-hd-orange/10 cursor-pointer" onClick={() => { onSort(field); onFilter(field); }}><ArrowUp size={12} className="mr-2" /> {field === 'fecha' ? 'Antiguo' : 'Ascendente'}</div>
                        <div className="flex items-center px-3 py-2 hover:bg-hd-orange/10 cursor-pointer" onClick={() => { onSort(field); onFilter(field); }}><ArrowDown size={12} className="mr-2" /> {field === 'fecha' ? 'Reciente' : 'Descendente'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 border-b border-gray-100">
                        {isNumeric ? (
                            <div className="space-y-2"><Input type="number" placeholder="Min" value={numericValue.min} onChange={(e) => onNumericFilterChange(field, 'min', e.target.value)} className="h-7 text-[10px]" /><Input type="number" placeholder="Max" value={numericValue.max} onChange={(e) => onNumericFilterChange(field, 'max', e.target.value)} className="h-7 text-[10px]" /></div>
                        ) : (<Input placeholder="Buscar..." value={filterValue} onChange={(e) => onFilterChange(field, e.target.value)} className="h-7 text-[10px]" />)}
                    </div>
                    <div className="max-h-56 overflow-y-auto p-2">
                        {isDate ? (<DateTreeComponent tree={dateTree} selectedPaths={selectedValues} onToggle={(path, active) => onTreeToggle(field, path, active)} />) : uniqueValues.length > 0 ? (
                            <div className="space-y-0.5">{uniqueValues.map(val => (<div key={val} className="flex items-center px-2 py-0.5 hover:bg-gray-100 rounded cursor-pointer" onClick={() => onValueToggle(field, val)}><input type="checkbox" checked={selectedValues.includes(val)} readOnly className="h-3 w-3" /><span className="ml-2 truncate">{val}</span></div>))}</div>
                        ) : null}
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 border-t"><Button size="xs" variant="ghost" onClick={() => onFilter(field)}>Cerrar</Button><Button size="xs" variant="ghost" className="text-hd-orange" onClick={() => { if (isNumeric) { onNumericFilterChange(field, 'min', ''); onNumericFilterChange(field, 'max', ''); } else { onFilterChange(field, ''); if (selectedValues.length > 0) isDate ? selectedValues.forEach(v => onTreeToggle(field, v, true)) : selectedValues.forEach(v => onValueToggle(field, v)); } }}>Limpiar</Button></div>
                </div>
            )}
        </TableHead>
    );
};

const DateTreeComponent = ({ tree, selectedPaths, onToggle, depth = 0, path = "" }) => {
    const [expanded, setExpanded] = useState(depth < 1);
    const keys = Object.keys(tree.children || {}).sort((a, b) => b.localeCompare(a));
    const getLeavesUnder = (node, p) => {
        const leaves = [];
        const find = (n, curr) => { if (!n.children) { leaves.push(curr); return; } Object.keys(n.children).forEach(k => find(n.children[k], `${curr}/${k}`)); };
        find(node, p); return leaves;
    };
    return (
        <div className={depth > 0 ? "ml-3" : ""}>
            {keys.map(key => {
                const currentPath = path ? `${path}/${key}` : key;
                const node = tree.children[key];
                const isLeaf = !node.children;
                const leavesUnder = isLeaf ? [currentPath] : getLeavesUnder(node, currentPath);
                const allSelected = leavesUnder.every(p => selectedPaths.includes(p));
                const someSelected = leavesUnder.some(p => selectedPaths.includes(p));
                return (
                    <div key={key}>
                        <div className="flex items-center py-0.5 hover:bg-gray-50 rounded cursor-pointer" onClick={() => onToggle(currentPath, allSelected)}>
                            <div className="w-4 h-4 flex items-center justify-center mr-0.5" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>{!isLeaf && (expanded ? <ArrowDown size={8} /> : <ArrowRight size={8} />)}</div>
                            <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }} readOnly className="h-3 w-3" />
                            <span className="ml-1.5">{key}</span>
                        </div>
                        {expanded && !isLeaf && <DateTreeComponent tree={node} selectedPaths={selectedPaths} onToggle={onToggle} depth={depth + 1} path={currentPath} />}
                    </div>
                )
            })}
        </div>
    )
}

export default PagoProveedor;
