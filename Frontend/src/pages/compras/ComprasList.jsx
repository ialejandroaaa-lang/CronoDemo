import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, FileText, ArrowUpDown, ArrowUp, ArrowDown, ArrowRight, Filter, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '../../components/ui/Table';
import { getCompras, anularCompra } from '../../api/compras';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

const ComprasList = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, numero: '' });

    const handleAnular = async () => {
        const { id, numero } = confirmModal;

        try {
            setLoading(true);
            await anularCompra(id);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            await loadData(); // Refresh list
        } catch (error) {
            console.error("Error anular compra:", error);
        } finally {
            setLoading(false);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    };

    // Sorting state
    const [sortConfig, setSortConfig] = useState({ key: 'fechaCompra', direction: 'desc' });

    // Column Filters state
    const [activeFilters, setActiveFilters] = useState({});
    const [selectedValues, setSelectedValues] = useState({}); // { field: [val1, val2] }
    const [numericFilters, setNumericFilters] = useState({}); // { field: { min, max } }
    const [showFilterFor, setShowFilterFor] = useState(null);

    const [groupingEnabled, setGroupingEnabled] = useState(false);

    useEffect(() => {
        loadData();
    }, []);



    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getCompras();
            setCompras(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading purchases:", error);
            setCompras([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleFilter = (field, e) => {
        e.stopPropagation();
        setShowFilterFor(showFilterFor === field ? null : field);
    };

    const handleFilterChange = (field, value) => {
        setActiveFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNumericFilterChange = (field, type, value) => {
        setNumericFilters(prev => ({
            ...prev,
            [field]: {
                ...(prev[field] || { min: '', max: '' }),
                [type]: value
            }
        }));
    };

    const handleValueToggle = (field, value) => {
        setSelectedValues(prev => {
            const current = prev[field] || [];
            // value is a path string for dates (e.g. "2025/octubre/27")
            if (current.includes(value)) {
                return { ...prev, [field]: current.filter(v => v !== value) };
            } else {
                return { ...prev, [field]: [...current, value] };
            }
        });
    };

    const handleTreeToggle = (field, path, isActive) => {
        setSelectedValues(prev => {
            const current = prev[field] || [];
            let newSelected = [...current];

            const tree = getDateTree();
            const allLeafPaths = [];
            const findLeaves = (node, currentPath) => {
                if (!node.children) {
                    allLeafPaths.push(currentPath);
                    return;
                }
                Object.keys(node.children).forEach(k => {
                    findLeaves(node.children[k], currentPath ? `${currentPath}/${k}` : k);
                });
            };

            if (path === "") {
                if (isActive) return { ...prev, [field]: [] };
                findLeaves(tree, "");
                return { ...prev, [field]: allLeafPaths };
            }

            const pathParts = path.split('/').filter(Boolean);
            let targetNode = tree;
            for (const part of pathParts) {
                targetNode = targetNode.children?.[part];
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

    const clearFilters = () => {
        setActiveFilters({});
        setSelectedValues({});
        setNumericFilters({});
        setSearchTerm('');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatForFilter = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'long',
            day: '2-digit'
        });
    };

    // Apply Filters and Search
    const getFilteredData = () => {
        let filtered = Array.isArray(compras) ? [...compras] : [];

        // Global search
        if (searchTerm) {
            filtered = filtered.filter(item =>
                Object.keys(item).some(key => {
                    const val = key === 'fechaCompra' ? formatForFilter(item[key]) : String(item[key]);
                    return val.toLowerCase().includes(searchTerm.toLowerCase());
                })
            );
        }

        // Column specific text filters
        Object.keys(activeFilters).forEach(field => {
            if (activeFilters[field]) {
                filtered = filtered.filter(item => {
                    if (field === 'fechaCompra') {
                        const d = new Date(item[field]);
                        const val = `${d.getFullYear()} ${d.toLocaleDateString('es-DO', { month: 'long' })} ${d.getDate()}`;
                        return val.toLowerCase().includes(activeFilters[field].toLowerCase());
                    }
                    const displayVal = String(item[field] || '');
                    return displayVal.toLowerCase().includes(activeFilters[field].toLowerCase());
                });
            }
        });

        // Column value (checkbox) filters
        Object.keys(selectedValues).forEach(field => {
            if (selectedValues[field] && selectedValues[field].length > 0) {
                filtered = filtered.filter(item => {
                    if (field === 'fechaCompra') {
                        const d = new Date(item[field]);
                        const path = `${d.getFullYear()}/${d.toLocaleDateString('es-DO', { month: 'long' })}/${d.getDate()}`;
                        return selectedValues[field].includes(path);
                    }
                    return selectedValues[field].includes(String(item[field]));
                });
            }
        });

        // Numeric range filters
        Object.keys(numericFilters).forEach(field => {
            const { min, max } = numericFilters[field];
            if (min !== '') {
                filtered = filtered.filter(item => (item[field] || 0) >= parseFloat(min));
            }
            if (max !== '') {
                filtered = filtered.filter(item => (item[field] || 0) <= parseFloat(max));
            }
        });

        // Sorting
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

    const filteredCompras = getFilteredData();

    // Grouping Logic
    const getGroupedData = () => {
        if (!groupingEnabled) return null;

        const groups = {};
        const visited = new Set();

        // Helper to find root
        const findRoot = (id) => {
            let current = compras.find(c => c.id === id);
            if (!current) return null;

            // Limit depth to prevent infinite loops, though logic prevents cycles ideally
            let depth = 0;
            while (current.documentoReferenciaId && depth < 20) {
                const parent = compras.find(c => c.id === current.documentoReferenciaId);
                if (parent) {
                    current = parent;
                } else {
                    break; // Parent not in list (maybe paged out), treat current as known root
                }
                depth++;
            }
            return current;
        };

        filteredCompras.forEach(item => {
            if (!item) return;
            // Find the "Thread Root" for this item
            const root = findRoot(item.id);
            if (root) {
                const rootId = root.id;
                if (!groups[rootId]) {
                    groups[rootId] = {
                        root: root,
                        items: []
                    };
                }
                groups[rootId].items.push(item);
            } else {
                // Should not happen if item is in list, but fallback
                if (!groups[item.id]) {
                    groups[item.id] = { root: item, items: [item] };
                } else {
                    groups[item.id].items.push(item);
                }
            }
        });

        // Sort items within groups by date
        Object.values(groups).forEach(g => {
            g.items.sort((a, b) => new Date(a.fechaCompra) - new Date(b.fechaCompra));
        });

        // Convert to array and sort groups by Root Date (most recent root first)
        return Object.values(groups).sort((a, b) => new Date(b.root.fechaCompra) - new Date(a.root.fechaCompra));
    };

    const groupedData = getGroupedData();

    const getUniqueValues = (field) => {
        const values = compras.map(c => String(c[field] || ''));
        return [...new Set(values)].sort();
    };

    const getDateTree = () => {
        const tree = { children: {} };
        compras.forEach(c => {
            const d = new Date(c.fechaCompra);
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

    const renderTableContent = (data) => {
        return data.map((item) => (
            <TableRow key={item.id} className={`cursor-pointer hover:bg-gray-50 ${(groupingEnabled && item.id !== item.documentoReferenciaId) ? 'bg-gray-50/50' : ''}`} onClick={() => navigate(`/compras/editar/${item.id}`)}>
                <TableCell className="font-mono text-sm font-medium text-blue-600 pl-4">{item.numeroCompra}</TableCell>
                <TableCell>
                    {/* Indent if grouped and not root (simplified check) */}
                    <div className="flex items-center">
                        {groupingEnabled && item.documentoReferenciaId && (
                            <div className="w-4 h-4 mr-2 border-l-2 border-b-2 border-gray-300 rounded-bl-none" style={{ marginLeft: '10px' }}></div>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${item.tipoDocumento === 'Recepcion' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            item.tipoDocumento === 'OrdenCompra' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                            }`}>
                            {item.tipoDocumento === 'OrdenCompra' ? 'Orden' : item.tipoDocumento || 'Factura'}
                        </span>
                    </div>
                </TableCell>
                <TableCell>
                    {item.documentoReferenciaNumero ? (
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            ref: {item.documentoReferenciaNumero}
                        </span>
                    ) : (
                        <span className="text-xs text-gray-300">-</span>
                    )}
                </TableCell>
                <TableCell>
                    <div className="font-medium text-gray-900">{item.proveedorNombre}</div>
                    <div className="text-xs text-gray-500">{item.codigoProveedor}</div>
                </TableCell>
                <TableCell className="text-gray-600">{formatDate(item.fechaCompra)}</TableCell>
                <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.estado === 'Completado' ? 'bg-green-100 text-green-800' :
                        item.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                            item.estado === 'Anulado' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                        }`}>
                        {item.estado}
                    </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                    <div className="flex flex-col items-end">
                        <span>
                            {item.monedaSimbolo || 'RD$'} {item.total?.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {item.monedaCodigo && item.monedaCodigo !== 'DOP' && (
                            <span className="text-[10px] text-gray-500 font-normal italic">
                                (Equiv. DOP {(item.total * (item.tasaCambio || 1)).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                            </span>
                        )}
                    </div>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end space-x-2">
                        {item.estado !== 'Anulado' && item.tipoDocumento === 'OrdenCompra' && !item.yaTransferido && (
                            <button
                                type="button"
                                className="h-10 w-10 p-2 rounded-full text-purple-600 hover:text-purple-800 hover:bg-purple-50 transition-all border border-transparent hover:border-purple-200 shadow-sm flex items-center justify-center cursor-pointer"
                                title="Convertir a Recepción"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/compras/nuevo', { state: { transferFrom: item, targetType: 'Recepcion' } });
                                }}
                            >
                                <ArrowRight className="h-6 w-6 stroke-[1.5]" />
                            </button>
                        )}
                        {item.estado !== 'Anulado' && item.tipoDocumento === 'Recepcion' && !item.yaTransferido && (
                            <button
                                type="button"
                                className="h-10 w-10 p-2 rounded-full text-green-600 hover:text-green-800 hover:bg-green-50 transition-all border border-transparent hover:border-green-200 shadow-sm flex items-center justify-center cursor-pointer"
                                title="Crear Factura"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/compras/nuevo', { state: { transferFrom: item, targetType: 'Factura' } });
                                }}
                            >
                                <FileText className="h-6 w-6 stroke-[1.5]" />
                            </button>
                        )}

                        <button
                            type="button"
                            className="h-10 w-10 p-2 rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200 shadow-sm flex items-center justify-center cursor-pointer"
                            title="Ver Detalle"
                            onClick={() => navigate(`/compras/editar/${item.id}`)}
                        >
                            <Eye className="h-6 w-6 stroke-[1.5]" />
                        </button>
                        {item.estado !== 'Anulado' && (
                            <button
                                type="button"
                                className="h-10 w-10 p-2 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 transition-all border border-transparent hover:border-red-200 shadow-sm flex items-center justify-center cursor-pointer"
                                title="Anular Compra"
                                onClick={() => setConfirmModal({ isOpen: true, id: item.id, numero: item.numeroCompra })}
                            >
                                <X className="h-6 w-6 stroke-[2]" />
                            </button>
                        )}
                    </div>
                </TableCell>
            </TableRow>
        ));
    };

    return (
        <div className="space-y-6">
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleAnular}
                title="Anular Compra"
                message={`¿Está seguro que desea anular la compra ${confirmModal.numero}? Esta acción no se puede deshacer y reversará el inventario.`}
                confirmLabel="Confirmar Anulación"
            />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Compras e Ingresos</h1>
                    <p className="text-sm text-gray-500">Gestione sus órdenes de compra y recepción de mercancía.</p>
                </div>
                <Button onClick={() => navigate('/compras/nuevo')} className="bg-gray-800 hover:bg-gray-900 shadow-lg">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Compra
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle>Historial de Compras</CardTitle>
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center mr-4">
                            <span className="text-sm text-gray-600 mr-2 font-medium">Agrupar por Flujo</span>
                            <button
                                onClick={() => setGroupingEnabled(!groupingEnabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-hd-orange focus:ring-offset-2 ${groupingEnabled ? 'bg-hd-orange' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${groupingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

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
                                placeholder="Buscar compra..."
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
                                    label="Número"
                                    field="numeroCompra"
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    onFilter={toggleFilter}
                                    showFilter={showFilterFor === 'numeroCompra'}
                                    filterValue={activeFilters['numeroCompra']}
                                    onFilterChange={handleFilterChange}
                                    uniqueValues={getUniqueValues('numeroCompra')}
                                    selectedValues={selectedValues['numeroCompra']}
                                    onValueToggle={handleValueToggle}
                                    className="w-[140px]"
                                />
                                <SortableHeader
                                    label="Tipo"
                                    field="tipoDocumento"
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    onFilter={toggleFilter}
                                    showFilter={showFilterFor === 'tipoDocumento'}
                                    filterValue={activeFilters['tipoDocumento']}
                                    onFilterChange={handleFilterChange}
                                    uniqueValues={getUniqueValues('tipoDocumento')}
                                    selectedValues={selectedValues['tipoDocumento']}
                                    onValueToggle={handleValueToggle}
                                    className="w-[120px]"
                                />
                                <TableHead className="w-[100px] text-gray-700 font-bold">Ref.</TableHead>
                                <SortableHeader
                                    label="Proveedor"
                                    field="proveedorNombre"
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    onFilter={toggleFilter}
                                    showFilter={showFilterFor === 'proveedorNombre'}
                                    filterValue={activeFilters['proveedorNombre']}
                                    onFilterChange={handleFilterChange}
                                    uniqueValues={getUniqueValues('proveedorNombre')}
                                    selectedValues={selectedValues['proveedorNombre']}
                                    onValueToggle={handleValueToggle}
                                />
                                <SortableHeader
                                    label="Fecha"
                                    field="fechaCompra"
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    onFilter={toggleFilter}
                                    showFilter={showFilterFor === 'fechaCompra'}
                                    filterValue={activeFilters['fechaCompra']}
                                    onFilterChange={handleFilterChange}
                                    dateTree={getDateTree()}
                                    selectedValues={selectedValues['fechaCompra']}
                                    onTreeToggle={handleTreeToggle}
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
                                <SortableHeader
                                    label="Total"
                                    field="total"
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    onFilter={toggleFilter}
                                    showFilter={showFilterFor === 'total'}
                                    numericValue={numericFilters['total']}
                                    onNumericFilterChange={handleNumericFilterChange}
                                    className="text-right"
                                />
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8">Cargando compras...</TableCell>
                                </TableRow>
                            ) : filteredCompras.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">No se encontraron compras.</TableCell>
                                </TableRow>
                            ) : (
                                groupingEnabled ? (
                                    groupedData.map(group => (
                                        <React.Fragment key={group.root.id + '_group'}>
                                            {/* Separation Row if needed */}
                                            {group.items.length > 1 && (
                                                <TableRow key={group.root.id + '_sep'}>
                                                    <TableCell colSpan={8} className="bg-gray-100 py-1 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                        Flujo: {group.root.numeroCompra} ({group.items.length} documentos)
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {renderTableContent(group.items)}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    renderTableContent(filteredCompras)
                                )
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div >
    );
};

const SortableHeader = ({
    label,
    field,
    sortConfig,
    onSort,
    onFilter,
    showFilter,
    filterValue = '',
    onFilterChange,
    numericValue = { min: '', max: '' },
    onNumericFilterChange,
    uniqueValues = [],
    selectedValues = [],
    onValueToggle,
    dateTree,
    onTreeToggle,
    className = ''
}) => {
    const isSorted = sortConfig.key === field;
    const isNumeric = onNumericFilterChange !== undefined;
    const isDate = dateTree !== undefined;
    const hasFilter = filterValue || (selectedValues && selectedValues.length > 0) || (isNumeric && (numericValue.min !== '' || numericValue.max !== ''));

    const sortAscLabel = field === 'fechaCompra' ? "Más antiguo a más reciente" : "De A a Z";
    const sortDescLabel = field === 'fechaCompra' ? "Más reciente a más antiguo" : "De Z a A";

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
                    <button
                        onClick={(e) => onFilter(field, e)}
                        className={`p-1 rounded-sm hover:bg-gray-300 transition-colors ${hasFilter ? 'text-hd-orange' : 'text-gray-400'}`}
                    >
                        <Filter size={14} fill={hasFilter ? 'currentColor' : 'none'} />
                    </button>
                )}
            </div>

            {showFilter && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 shadow-2xl rounded-sm z-[100] animate-in fade-in zoom-in duration-200 overflow-hidden text-xs" onClick={e => e.stopPropagation()}>
                    {/* Excel Style Sort Options */}
                    <div className="p-1 border-b border-gray-100">
                        <div className="flex items-center px-3 py-2 hover:bg-hd-orange/10 cursor-pointer text-gray-700 font-medium" onClick={() => { onSort(field); onFilter(field, { stopPropagation: () => { } }); }}>
                            <ArrowUp size={14} className="mr-2 text-gray-400" /> {sortAscLabel}
                        </div>
                        <div className="flex items-center px-3 py-2 hover:bg-hd-orange/10 cursor-pointer text-gray-700 font-medium" onClick={() => { onSort(field); onFilter(field, { stopPropagation: () => { } }); }}>
                            <ArrowDown size={14} className="mr-2 text-gray-400" /> {sortDescLabel}
                        </div>
                    </div>

                    <div className="p-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Filtrar {label}</p>

                        {isNumeric ? (
                            <div className="space-y-2">
                                <div>
                                    <label className="text-[9px] text-gray-500 uppercase font-bold">Mayor que {'>'}</label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={numericValue.min}
                                        onChange={(e) => onNumericFilterChange(field, 'min', e.target.value)}
                                        className="h-8 text-xs font-mono"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-gray-500 uppercase font-bold">Menor que {'<'}</label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={numericValue.max}
                                        onChange={(e) => onNumericFilterChange(field, 'max', e.target.value)}
                                        className="h-8 text-xs font-mono"
                                    />
                                </div>
                            </div>
                        ) : (
                            <Input
                                placeholder={`Buscar...`}
                                value={filterValue}
                                onChange={(e) => onFilterChange(field, e.target.value)}
                                className="h-8 text-xs"
                                autoFocus
                            />
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
                                <div
                                    className="flex items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer group sticky top-0 bg-white z-10 border-b border-gray-100 mb-1"
                                    onClick={() => {
                                        const allSelected = uniqueValues.every(v => selectedValues.includes(v));
                                        uniqueValues.forEach(v => {
                                            if (allSelected) {
                                                if (selectedValues.includes(v)) onValueToggle(field, v);
                                            } else {
                                                if (!selectedValues.includes(v)) onValueToggle(field, v);
                                            }
                                        });
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={uniqueValues.length > 0 && uniqueValues.every(v => selectedValues.includes(v))}
                                        ref={el => {
                                            if (el) {
                                                const some = uniqueValues.some(v => selectedValues.includes(v));
                                                const all = uniqueValues.every(v => selectedValues.includes(v));
                                                el.indeterminate = some && !all;
                                            }
                                        }}
                                        readOnly
                                        className="h-3 w-3 rounded border-gray-300 text-hd-orange focus:ring-hd-orange"
                                    />
                                    <span className="ml-2 text-xs font-bold text-gray-700">(Seleccionar todo)</span>
                                </div>
                                {uniqueValues.map(val => (
                                    <div key={val} className="flex items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer group" onClick={() => onValueToggle(field, val)}>
                                        <input
                                            type="checkbox"
                                            checked={selectedValues.includes(val)}
                                            readOnly
                                            className="h-3 w-3 rounded border-gray-300 text-hd-orange focus:ring-hd-orange"
                                        />
                                        <span className="ml-2 text-xs text-gray-600 truncate">{val}</span>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <div className="flex justify-between items-center p-2 bg-gray-50 border-t border-gray-100">
                        <Button size="xs" variant="ghost" className="text-[10px]" onClick={() => onFilter(field, { stopPropagation: () => { } })}>Cerrar</Button>
                        <Button size="xs" variant="ghost" className="text-[10px] text-hd-orange" onClick={() => {
                            if (isNumeric) {
                                onNumericFilterChange(field, 'min', '');
                                onNumericFilterChange(field, 'max', '');
                            } else {
                                onFilterChange(field, '');
                                if (selectedValues.length > 0) {
                                    // General clear
                                    if (isDate) {
                                        // Clear all date selections
                                        selectedValues.forEach(v => onTreeToggle(field, v, true));
                                    } else {
                                        selectedValues.forEach(v => onValueToggle(field, v));
                                    }
                                }
                            }
                        }}>Limpiar</Button>
                    </div>
                </div>
            )}
        </TableHead>
    );
};

// Tree Helper Component
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
            {depth === 0 && (
                <div
                    className="flex items-center py-1 hover:bg-gray-100 rounded cursor-pointer group sticky top-0 bg-white z-10 border-b border-gray-100 mb-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        const allSelected = allLeafPaths.length > 0 && allLeafPaths.every(p => selectedPaths.includes(p));
                        onToggle("", allSelected);
                    }}
                >
                    <div className="w-4 h-4 mr-1" />
                    <input
                        type="checkbox"
                        checked={allLeafPaths.length > 0 && allLeafPaths.every(p => selectedPaths.includes(p))}
                        ref={el => {
                            if (el) {
                                const some = allLeafPaths.some(p => selectedPaths.includes(p));
                                const all = allLeafPaths.every(p => selectedPaths.includes(p));
                                el.indeterminate = some && !all;
                            }
                        }}
                        readOnly
                        className="h-3 w-3 rounded border-gray-300 text-hd-orange focus:ring-hd-orange"
                    />
                    <span className="ml-2 text-[11px] font-bold text-gray-700">(Seleccionar todo)</span>
                </div>
            )}
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
                            <input
                                type="checkbox"
                                checked={allSelected}
                                ref={el => {
                                    if (el) {
                                        el.indeterminate = someSelected && !allSelected;
                                    }
                                }}
                                readOnly
                                className="h-3 w-3 rounded border-gray-300 text-hd-orange focus:ring-hd-orange"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <span className="ml-2 text-[11px] text-gray-700 select-none">{key}</span>
                        </div>
                        {expanded && !isLeaf && (
                            <DateTreeComponent tree={node} selectedPaths={selectedPaths} onToggle={onToggle} depth={depth + 1} path={currentPath} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ComprasList;
