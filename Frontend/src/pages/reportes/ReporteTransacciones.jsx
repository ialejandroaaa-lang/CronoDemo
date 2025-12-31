import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FileText, Download, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, X, ChevronRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';

const ReporteTransacciones = () => {
    const [transacciones, setTransacciones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await fetch(`${API_BASE}/ReportesInventario/Transacciones`);
                if (!res.ok) throw new Error("Error fetching report");
                const data = await res.json();
                setTransacciones(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, []);

    const totalDOP = transacciones.reduce((acc, curr) => acc + curr.montoDOP, 0);
    const totalUSD = transacciones.reduce((acc, curr) => acc + curr.montoUSD, 0);

    // --- Filter & Sort Logic ---
    const [sortConfig, setSortConfig] = useState({ key: 'fecha', direction: 'desc' });
    const [activeFilters, setActiveFilters] = useState({});
    const [selectedValues, setSelectedValues] = useState({});
    const [numericFilters, setNumericFilters] = useState({});
    const [showFilterFor, setShowFilterFor] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [columnWidths, setColumnWidths] = useState({
        fecha: 150,
        documento: 120, // Slightly reduced
        proveedor: 250,
        monedaOriginal: 90, // Reduced
        montoOriginal: 120, // Reduced as requested
        montoDOP: 120,
        montoUSD: 120
    });

    const totalTableWidth = Object.values(columnWidths).reduce((acc, width) => acc + width, 0);

    const handleResize = (field, newWidth) => {
        setColumnWidths(prev => ({ ...prev, [field]: newWidth }));
    };

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
        transacciones.forEach(c => {
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
        const values = transacciones.map(c => String(c[field] || ''));
        return [...new Set(values)].sort();
    };

    const formatForFilter = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: '2-digit' });
    };

    const getFilteredData = () => {
        let filtered = [...transacciones];

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

    const filteredData = getFilteredData();
    const dateTree = getDateTree();

    const clearFilters = () => {
        setActiveFilters({});
        setSelectedValues({});
        setNumericFilters({});
        setSearchTerm('');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Reporte de Compras Multi-Moneda</h1>
                <p className="text-sm text-gray-500">Visualización de compras en Pesos y Dólares con filtros avanzados.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-blue-50 border-blue-100">
                    <div className="p-4">
                        <p className="text-sm font-medium text-blue-600">Total en Pesos (DOP)</p>
                        <p className="text-2xl font-bold text-blue-900">RD$ {totalDOP.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                    </div>
                </Card>
                <Card className="bg-green-50 border-green-100">
                    <div className="p-4">
                        <p className="text-sm font-medium text-green-600">Total en Dólares (USD)</p>
                        <p className="text-2xl font-bold text-green-900">US$ {totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row justify-between items-center pb-4">
                    <CardTitle>Detalle de Transacciones</CardTitle>
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
                                placeholder="Buscar..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" /> Exportar
                        </Button>
                    </div>
                </CardHeader>
                <div className="p-0 overflow-visible relative min-h-[500px]">
                    <Table className="table-fixed" style={{ width: totalTableWidth }}>
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
                                    width={columnWidths['fecha']}
                                    onResize={handleResize}
                                />
                                <SortableHeader
                                    label="Documento"
                                    field="documento"
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    onFilter={toggleFilter}
                                    showFilter={showFilterFor === 'documento'}
                                    filterValue={activeFilters['documento']}
                                    onFilterChange={handleFilterChange}
                                    width={columnWidths['documento']}
                                    onResize={handleResize}
                                />
                                <SortableHeader
                                    label="Proveedor"
                                    field="proveedor"
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    onFilter={toggleFilter}
                                    showFilter={showFilterFor === 'proveedor'}
                                    filterValue={activeFilters['proveedor']}
                                    onFilterChange={handleFilterChange}
                                    uniqueValues={getUniqueValues('proveedor')}
                                    selectedValues={selectedValues['proveedor']}
                                    onValueToggle={handleValueToggle}
                                    width={columnWidths['proveedor']}
                                    onResize={handleResize}
                                />
                                <SortableHeader
                                    label="Moneda Orig"
                                    field="monedaOriginal"
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    onFilter={toggleFilter}
                                    showFilter={showFilterFor === 'monedaOriginal'}
                                    filterValue={activeFilters['monedaOriginal']}
                                    onFilterChange={handleFilterChange}
                                    uniqueValues={getUniqueValues('monedaOriginal')}
                                    selectedValues={selectedValues['monedaOriginal']}
                                    onValueToggle={handleValueToggle}
                                    width={columnWidths['monedaOriginal']}
                                    onResize={handleResize}
                                />
                                <SortableHeader
                                    label="Monto Orig"
                                    field="montoOriginal"
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    onFilter={toggleFilter}
                                    showFilter={showFilterFor === 'montoOriginal'}
                                    numericValue={numericFilters['montoOriginal']}
                                    onNumericFilterChange={handleNumericFilterChange}
                                    width={columnWidths['montoOriginal']}
                                    onResize={handleResize}
                                    className="text-right"
                                />
                                <SortableHeader
                                    label="Monto DOP"
                                    field="montoDOP"
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    onFilter={toggleFilter}
                                    showFilter={showFilterFor === 'montoDOP'}
                                    numericValue={numericFilters['montoDOP']}
                                    onNumericFilterChange={handleNumericFilterChange}
                                    width={columnWidths['montoDOP']}
                                    onResize={handleResize}
                                    className="text-right bg-blue-50/50 text-blue-800"
                                />
                                <SortableHeader
                                    label="Monto USD"
                                    field="montoUSD"
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    onFilter={toggleFilter}
                                    showFilter={showFilterFor === 'montoUSD'}
                                    numericValue={numericFilters['montoUSD']}
                                    onNumericFilterChange={handleNumericFilterChange}
                                    width={columnWidths['montoUSD']}
                                    onResize={handleResize}
                                    className="text-right bg-green-50/50 text-green-800"
                                />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-8">Cargando...</TableCell></TableRow>
                            ) : filteredData.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No hay transacciones.</TableCell></TableRow>
                            ) : (
                                filteredData.map((tx) => (
                                    <TableRow key={tx.id} className="hover:bg-gray-50">
                                        <TableCell>{new Date(tx.fecha).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-mono text-xs">{tx.documento}</TableCell>
                                        <TableCell className="font-medium text-gray-700">{tx.proveedor}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tx.monedaOriginal === 'USD' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {tx.monedaOriginal}
                                            </span>
                                        </TableCell>
                                        <TableCell style={{ width: columnWidths['montoOriginal'] }} className="text-right font-medium">
                                            {tx.monedaOriginal === 'USD' ? '$' : 'RD$'} {tx.montoOriginal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell style={{ width: columnWidths['montoDOP'] }} className="text-right font-bold text-blue-700 bg-blue-50/30">
                                            {tx.montoDOP?.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell style={{ width: columnWidths['montoUSD'] }} className="text-right font-bold text-green-700 bg-green-50/30">
                                            {tx.montoUSD?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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

// --- Reusable Components (Copied) ---

const SortableHeader = ({
    label, field, sortConfig, onSort, onFilter, showFilter, filterValue = '', onFilterChange,
    numericValue = { min: '', max: '' }, onNumericFilterChange, uniqueValues = [], selectedValues = [],
    onValueToggle, dateTree, onTreeToggle, className = '', width, onResize
}) => {
    const isSorted = sortConfig.key === field;
    const isNumeric = onNumericFilterChange !== undefined;
    const isDate = dateTree !== undefined;
    const hasFilter = filterValue || (selectedValues && selectedValues.length > 0) || (isNumeric && (numericValue.min !== '' || numericValue.max !== ''));

    const handleMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent sorting
        const startX = e.pageX;
        const startWidth = width;

        const onMouseMove = (eMove) => {
            const newWidth = Math.max(50, startWidth + (eMove.pageX - startX)); // Min width 50px
            onResize(field, newWidth);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    return (
        <TableHead
            className={`relative group p-0 ${className}`}
            style={width ? { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` } : {}}
        >
            <div className={`flex items-center justify-between h-full px-4 py-2 hover:bg-gray-200 cursor-pointer transition-colors ${onResize ? 'pr-2' : ''}`} onClick={() => onSort(field)}>
                <div className="flex items-center space-x-1 overflow-hidden">
                    <span className="font-bold text-gray-700 truncate">{label}</span>
                    {isSorted ? (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-hd-orange" /> : <ArrowDown size={14} className="text-hd-orange" />
                    ) : (
                        <ArrowUpDown size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                </div>
            </div>
            {/* Resize Handle */}
            {onResize && (
                <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-hd-orange z-10"
                    onMouseDown={handleMouseDown}
                    onClick={(e) => e.stopPropagation()}
                />
            )}
            {
                showFilter && (
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
                )
            }
        </TableHead >
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

export default ReporteTransacciones;
