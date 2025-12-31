import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
    TrendingUp,
    ShoppingCart,
    Package,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    Search,
    Filter,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    X,
    Calendar,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '../../components/ui/Table';

const ManagerReport = () => {
    // Mock Data for KPIs
    const [stats, setStats] = useState({
        ventasHoy: 12500.00,
        ventasMes: 458000.00,
        comprasMes: 215000.00,
        inventarioValor: 1250000.00,
        topProductos: [
            { nombre: 'Cemento Gris 42.5kg', cantidad: 450, total: 225000 },
            { nombre: 'Varilla Corrugada 3/8', cantidad: 1200, total: 360000 },
            { nombre: 'Block 6"', cantidad: 3000, total: 105000 },
            { nombre: 'Pintura Blanca 5gal', cantidad: 85, total: 340000 },
            { nombre: 'Arena Lavada (m3)', cantidad: 120, total: 180000 },
        ],
        ventasPorDia: [
            { dia: 'Lun', valor: 45000 },
            { dia: 'Mar', valor: 52000 },
            { dia: 'Mie', valor: 38000 },
            { dia: 'Jue', valor: 65000 },
            { dia: 'Vie', valor: 89000 },
            { dia: 'Sab', valor: 95000 },
            { dia: 'Dom', valor: 25000 },
        ]
    });

    // Mock Data for Transactions Table
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate fetching transactions
        setTimeout(() => {
            const mockData = Array.from({ length: 50 }, (_, i) => ({
                id: i + 1,
                fecha: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
                tipo: Math.random() > 0.5 ? 'Venta' : 'Compra',
                entidad: Math.random() > 0.5 ? `Cliente ${i}` : `Proveedor ${i}`,
                monto: Math.floor(Math.random() * 50000) + 1000,
                estado: Math.random() > 0.8 ? 'Pendiente' : 'Completado'
            }));
            setTransactions(mockData);
            setLoading(false);
        }, 1000);
    }, []);

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // --- Filter Logic (Copied from ComprasList) ---
    const [sortConfig, setSortConfig] = useState({ key: 'fecha', direction: 'desc' });
    const [activeFilters, setActiveFilters] = useState({});
    const [selectedValues, setSelectedValues] = useState({});
    const [numericFilters, setNumericFilters] = useState({});
    const [showFilterFor, setShowFilterFor] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const toggleFilter = (field, e) => {
        e.stopPropagation();
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
            const tree = getDateTree(); // Accessing derived tree within state update might be tricky if memoized, but here direct call is fine

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
        transactions.forEach(c => {
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
        const values = transactions.map(c => String(c[field] || ''));
        return [...new Set(values)].sort();
    };

    const formatForFilter = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: '2-digit' });
    };

    const getFilteredData = () => {
        let filtered = [...transactions];

        if (searchTerm) {
            filtered = filtered.filter(item =>
                Object.keys(item).some(key => {
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

    const filteredTransactions = getFilteredData();
    const dateTree = getDateTree();

    const clearFilters = () => {
        setActiveFilters({});
        setSelectedValues({});
        setNumericFilters({});
        setSearchTerm('');
    };


    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manager Dashboard</h1>
                    <p className="text-gray-500 mt-1">Visión general del rendimiento del negocio.</p>
                </div>
                <div className="flex bg-white rounded-lg border p-1 shadow-sm">
                    <button className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded">Hoy</button>
                    <button className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-900 rounded shadow-sm">Este Mes</button>
                    <button className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded">Año</button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Ventas del Mes"
                    value={formatMoney(stats.ventasMes)}
                    icon={DollarSign}
                    trend="+12.5%"
                    trendUp={true}
                    color="green"
                />
                <KPICard
                    title="Compras del Mes"
                    value={formatMoney(stats.comprasMes)}
                    icon={ShoppingCart}
                    trend="+5.2%"
                    trendUp={true}
                    color="blue"
                />
                <KPICard
                    title="Valor Inventario"
                    value={formatMoney(stats.inventarioValor)}
                    icon={Package}
                    trend="-2.1%"
                    trendUp={false}
                    color="orange"
                />
                <KPICard
                    title="Nuevos Clientes"
                    value="24"
                    icon={Users}
                    trend="+4"
                    trendUp={true}
                    color="purple"
                />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Area */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Comportamiento de Ventas (Semana Actual)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-end justify-between space-x-2 pt-6">
                            {stats.ventasPorDia.map((d, i) => {
                                const heightPercent = (d.valor / 100000) * 100;
                                return (
                                    <div key={i} className="flex flex-col items-center flex-1 group relative">
                                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold bg-gray-800 text-white px-2 py-1 rounded">
                                            {formatMoney(d.valor)}
                                        </div>
                                        <div
                                            className="w-full bg-blue-500 rounded-t-md hover:bg-blue-600 transition-all duration-300"
                                            style={{ height: `${heightPercent}%`, opacity: 0.7 + (i * 0.05) }}
                                        ></div>
                                        <span className="text-xs font-medium text-gray-500 mt-2">{d.dia}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Productos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.topProductos.map((prod, i) => (
                                <div key={i} className="flex items-center justify-between border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{prod.nombre}</p>
                                            <p className="text-xs text-gray-500">{prod.cantidad} unidades</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">{formatMoney(prod.total)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle>Transacciones Recientes</CardTitle>
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
                                placeholder="Buscar transacción..."
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
                                <SortableHeader
                                    label="Fecha"
                                    field="fecha"
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    onFilter={toggleFilter}
                                    showFilter={showFilterFor === 'fecha'}
                                    filterValue={activeFilters['fecha']}
                                    onFilterChange={handleFilterChange}
                                    dateTree={dateTree}
                                    selectedValues={selectedValues['fecha']}
                                    onTreeToggle={handleTreeToggle}
                                />
                                <SortableHeader
                                    label="Tipo"
                                    field="tipo"
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    onFilter={toggleFilter}
                                    showFilter={showFilterFor === 'tipo'}
                                    filterValue={activeFilters['tipo']}
                                    onFilterChange={handleFilterChange}
                                    uniqueValues={getUniqueValues('tipo')}
                                    selectedValues={selectedValues['tipo']}
                                    onValueToggle={handleValueToggle}
                                />
                                <SortableHeader
                                    label="Entidad"
                                    field="entidad"
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    onFilter={toggleFilter}
                                    showFilter={showFilterFor === 'entidad'}
                                    filterValue={activeFilters['entidad']}
                                    onFilterChange={handleFilterChange}
                                    uniqueValues={getUniqueValues('entidad')}
                                    selectedValues={selectedValues['entidad']}
                                    onValueToggle={handleValueToggle}
                                />
                                <SortableHeader
                                    label="Monto"
                                    field="monto"
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    onFilter={toggleFilter}
                                    showFilter={showFilterFor === 'monto'}
                                    numericValue={numericFilters['monto']}
                                    onNumericFilterChange={handleNumericFilterChange}
                                    className="text-right"
                                />
                                <SortableHeader
                                    label="Estado"
                                    field="estado"
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    onFilter={toggleFilter}
                                    showFilter={showFilterFor === 'estado'}
                                    filterValue={activeFilters['estado']}
                                    onFilterChange={handleFilterChange}
                                    uniqueValues={getUniqueValues('estado')}
                                    selectedValues={selectedValues['estado']}
                                    onValueToggle={handleValueToggle}
                                />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">Cargando...</TableCell>
                                </TableRow>
                            ) : filteredTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">No se encontraron registros.</TableCell>
                                </TableRow>
                            ) : (
                                filteredTransactions.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-gray-50">
                                        <TableCell className="text-gray-600">{new Date(item.fecha).toLocaleDateString('es-DO')}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.tipo === 'Venta' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                                                }`}>
                                                {item.tipo}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-medium text-gray-900">{item.entidad}</TableCell>
                                        <TableCell className="text-right font-medium">{formatMoney(item.monto)}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.estado === 'Completado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {item.estado}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};

const KPICard = ({ title, value, icon: Icon, trend, trendUp, color }) => {
    const colorClasses = {
        green: "bg-green-50 text-green-600",
        blue: "bg-blue-50 text-blue-600",
        orange: "bg-orange-50 text-orange-600",
        purple: "bg-purple-50 text-purple-600",
    };

    return (
        <Card className="transform transition-all hover:-translate-y-1 duration-200 shadow-sm hover:shadow-md">
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-gray-500">{title}</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
                    </div>
                    <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                    {trendUp ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={trendUp ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                        {trend}
                    </span>
                    <span className="text-gray-400 ml-2">vs mes anterior</span>
                </div>
            </div>
        </Card>
    );
};

// --- Reusable Components for Sorting/Filtering (Ideally moved to a separate file) ---

const SortableHeader = ({
    label, field, sortConfig, onSort, onFilter, showFilter, filterValue = '', onFilterChange,
    numericValue = { min: '', max: '' }, onNumericFilterChange, uniqueValues = [], selectedValues = [],
    onValueToggle, dateTree, onTreeToggle, className = ''
}) => {
    const isSorted = sortConfig.key === field;
    const isNumeric = onNumericFilterChange !== undefined;
    const isDate = dateTree !== undefined;
    const hasFilter = filterValue || (selectedValues && selectedValues.length > 0) || (isNumeric && (numericValue.min !== '' || numericValue.max !== ''));

    return (
        <TableHead className={`relative group p-0 ${className}`}>
            <div className="flex items-center justify-between h-full px-4 py-2 hover:bg-gray-200 cursor-pointer transition-colors" onClick={() => onSort(field)}>
                <div className="flex items-center space-x-1">
                    <span className="font-bold text-gray-700">{label}</span>
                    {isSorted ? (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-hd-orange" /> : <ArrowDown size={14} className="text-hd-orange" />
                    ) : (
                        <ArrowUpDown size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                </div>
                {onFilter && (
                    <button onClick={(e) => onFilter(field, e)} className={`p-1 rounded-sm hover:bg-gray-300 transition-colors ${hasFilter ? 'text-hd-orange' : 'text-gray-400'}`}>
                        <Filter size={14} fill={hasFilter ? 'currentColor' : 'none'} />
                    </button>
                )}
            </div>
            {showFilter && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 shadow-2xl rounded-sm z-[100] animate-in fade-in zoom-in duration-200 overflow-hidden text-xs" onClick={e => e.stopPropagation()}>
                    <div className="p-1 border-b border-gray-100">
                        <div className="flex items-center px-3 py-2 hover:bg-hd-orange/10 cursor-pointer text-gray-700 font-medium" onClick={() => { onSort(field); onFilter(field, { stopPropagation: () => { } }); }}>
                            <ArrowUp size={14} className="mr-2 text-gray-400" /> {field === 'fecha' ? 'Más antiguo' : 'Ascendente'}
                        </div>
                        <div className="flex items-center px-3 py-2 hover:bg-hd-orange/10 cursor-pointer text-gray-700 font-medium" onClick={() => { onSort(field); onFilter(field, { stopPropagation: () => { } }); }}>
                            <ArrowDown size={14} className="mr-2 text-gray-400" /> {field === 'fecha' ? 'Más reciente' : 'Descendente'}
                        </div>
                    </div>
                    <div className="p-3 bg-gray-50 border-b border-gray-100">
                        {isNumeric ? (
                            <div className="space-y-2">
                                <Input type="number" placeholder="Min" value={numericValue.min} onChange={(e) => onNumericFilterChange(field, 'min', e.target.value)} className="h-8 text-xs font-mono" autoFocus />
                                <Input type="number" placeholder="Max" value={numericValue.max} onChange={(e) => onNumericFilterChange(field, 'max', e.target.value)} className="h-8 text-xs font-mono" />
                            </div>
                        ) : (
                            <Input placeholder="Buscar..." value={filterValue} onChange={(e) => onFilterChange(field, e.target.value)} className="h-8 text-xs" autoFocus />
                        )}
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2">
                        {isDate ? (
                            <DateTreeComponent
                                tree={dateTree}
                                selectedPaths={selectedValues}
                                onToggle={(path, active) => onTreeToggle(field, path, active)}
                                allLeafPaths={(() => {
                                    const leaves = [];
                                    const find = (n, p) => {
                                        if (!n.children) { leaves.push(p); return; }
                                        Object.keys(n.children).forEach(k => find(n.children[k], p ? `${p}/${k}` : k));
                                    };
                                    find(dateTree, "");
                                    return leaves;
                                })()}
                            />
                        ) : uniqueValues.length > 0 ? (
                            <div className="space-y-1">
                                {uniqueValues.map(val => (
                                    <div key={val} className="flex items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer group" onClick={() => onValueToggle(field, val)}>
                                        <input type="checkbox" checked={selectedValues.includes(val)} readOnly className="h-3 w-3 rounded border-gray-300 text-hd-orange focus:ring-hd-orange" />
                                        <span className="ml-2 text-xs text-gray-600 truncate">{val}</span>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 border-t border-gray-100">
                        <Button size="xs" variant="ghost" className="text-[10px]" onClick={() => onFilter(field, { stopPropagation: () => { } })}>Cerrar</Button>
                        <Button size="xs" variant="ghost" className="text-[10px] text-hd-orange" onClick={() => {
                            if (isNumeric) { onNumericFilterChange(field, 'min', ''); onNumericFilterChange(field, 'max', ''); }
                            else { onFilterChange(field, ''); if (selectedValues.length > 0) isDate ? selectedValues.forEach(v => onTreeToggle(field, v, true)) : selectedValues.forEach(v => onValueToggle(field, v)); }
                        }}>Limpiar</Button>
                    </div>
                </div>
            )}
        </TableHead>
    );
};

const DateTreeComponent = ({ tree, selectedPaths, onToggle, depth = 0, path = "", allLeafPaths = [] }) => {
    const [expanded, setExpanded] = useState(true);
    const keys = Object.keys(tree.children || {}).sort((a, b) => b.localeCompare(a));
    const getLeavesUnder = (node, p) => {
        const leaves = [];
        const find = (n, curr) => {
            if (!n.children) { leaves.push(curr); return; }
            Object.keys(n.children).forEach(k => find(n.children[k], `${curr}/${k}`));
        };
        find(node, p);
        return leaves;
    };

    return (
        <div className={depth > 0 ? "ml-4 pt-1" : ""}>
            {keys.map(key => {
                const currentPath = path ? `${path}/${key}` : key;
                const node = tree.children[key];
                const isLeaf = !node.children;
                const leavesUnder = isLeaf ? [currentPath] : getLeavesUnder(node, currentPath);
                const allSelected = leavesUnder.every(p => selectedPaths.includes(p));
                const someSelected = leavesUnder.some(p => selectedPaths.includes(p));

                return (
                    <div key={key}>
                        <div className="flex items-center py-1 hover:bg-gray-50 rounded cursor-pointer group" onClick={() => onToggle(currentPath, allSelected)}>
                            <div className="w-4 h-4 flex items-center justify-center mr-1" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
                                {!isLeaf && (expanded ? <ArrowDown size={10} /> : <ArrowRight size={10} />)}
                            </div>
                            <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }} readOnly className="h-3 w-3 rounded border-gray-300 text-hd-orange focus:ring-hd-orange" onClick={(e) => e.stopPropagation()} />
                            <span className="ml-2 text-[11px] text-gray-700 select-none">{key}</span>
                        </div>
                        {expanded && !isLeaf && <DateTreeComponent tree={node} selectedPaths={selectedPaths} onToggle={onToggle} depth={depth + 1} path={currentPath} />}
                    </div>
                );
            })}
        </div>
    );
};

export default ManagerReport;

