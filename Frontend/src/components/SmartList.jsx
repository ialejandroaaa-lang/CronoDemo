import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from './ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import {
    FileText, Download, Search, Filter, ArrowUpDown,
    ArrowUp, ArrowDown, X, ChevronRight, Settings,
    ListFilter, MoreVertical, LayoutGrid
} from 'lucide-react';

const API_BASE = ((import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') ? import.meta.env.VITE_API_URL : '/api');

/**
 * SmartList Component
 * @param {string} endpoint - API endpoint to fetch data from
 * @param {string} title - Report title
 * @param {Array} columns - Array of column definitions { field, label, type, width }
 */
const SmartList = ({ endpoint, title, columns: initialColumns }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
    const [activeFilters, setActiveFilters] = useState({});
    const [selectedValues, setSelectedValues] = useState({});
    const [numericFilters, setNumericFilters] = useState({});
    const [showFilterFor, setShowFilterFor] = useState(null);

    // Initial widths
    const [columnWidths, setColumnWidths] = useState(
        initialColumns.reduce((acc, col) => ({ ...acc, [col.field]: col.width || 150 }), {})
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_BASE}${endpoint}`);
                if (!res.ok) throw new Error("Error fetching data");
                const result = await res.json();
                setData(result);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [endpoint]);

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

    const getUniqueValues = (field) => {
        const values = data.map(c => String(c[field] || ''));
        return [...new Set(values)].sort();
    };

    const getFilteredData = () => {
        let filtered = [...data];

        if (searchTerm) {
            filtered = filtered.filter(item =>
                Object.keys(item).some(key =>
                    String(item[key] || '').toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        Object.keys(activeFilters).forEach(field => {
            if (activeFilters[field]) {
                filtered = filtered.filter(item =>
                    String(item[field] || '').toLowerCase().includes(activeFilters[field].toLowerCase())
                );
            }
        });

        Object.keys(selectedValues).forEach(field => {
            if (selectedValues[field] && selectedValues[field].length > 0) {
                filtered = filtered.filter(item =>
                    selectedValues[field].includes(String(item[field]))
                );
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
    const totalTableWidth = Object.values(columnWidths).reduce((acc, width) => acc + width, 0);

    const exportToExcel = () => {
        if (filteredData.length === 0) return;

        const headers = initialColumns.map(col => col.label).join(',');
        const rows = filteredData.map(item =>
            initialColumns.map(col => `"${String(item[col.field] || '').replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const csv = `${headers}\n${rows}`;
        const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const clearFilters = () => {
        setActiveFilters({});
        setSelectedValues({});
        setNumericFilters({});
        setSearchTerm('');
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500 p-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <LayoutGrid className="text-hd-orange" size={24} />
                        {title}
                    </h1>
                    <p className="text-xs text-gray-500">Vista tipo SmartList con filtros avanzados y exportación.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={exportToExcel} className="border-green-600 text-green-700 hover:bg-green-50">
                        <Download size={16} className="mr-2" /> Exportar CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearFilters} className="text-gray-500">
                        <X size={16} className="mr-2" /> Limpiar
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden border-none shadow-lg">
                <CardHeader className="bg-gray-50 border-b py-3 flex flex-row justify-between items-center">
                    <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                        <span>Total Filas: <span className="text-hd-orange font-bold text-sm tracking-tight">{filteredData.length}</span></span>
                    </div>
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Búsqueda rápida..."
                            className="h-9 pl-10 border-gray-200 focus:border-hd-orange shadow-sm text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>

                <div className="overflow-x-auto overflow-y-visible relative min-h-[600px] bg-white">
                    <Table className="table-fixed border-collapse" style={{ width: totalTableWidth }}>
                        <TableHeader>
                            <TableRow className="bg-white hover:bg-white border-b-2 border-gray-100">
                                {initialColumns.map(col => (
                                    <SortableHeader
                                        key={col.field}
                                        label={col.label}
                                        field={col.field}
                                        type={col.type}
                                        sortConfig={sortConfig}
                                        onSort={handleSort}
                                        onFilter={toggleFilter}
                                        showFilter={showFilterFor === col.field}
                                        filterValue={activeFilters[col.field]}
                                        onFilterChange={handleFilterChange}
                                        numericValue={numericFilters[col.field]}
                                        onNumericFilterChange={handleNumericFilterChange}
                                        uniqueValues={getUniqueValues(col.field)}
                                        selectedValues={selectedValues[col.field]}
                                        onValueToggle={handleValueToggle}
                                        width={columnWidths[col.field]}
                                        onResize={handleResize}
                                    />
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={initialColumns.length} className="text-center py-20 text-gray-400">Cargando SmartList...</TableCell></TableRow>
                            ) : filteredData.length === 0 ? (
                                <TableRow><TableCell colSpan={initialColumns.length} className="text-center py-20 text-gray-500 font-medium italic">No se encontraron registros con los filtros aplicados.</TableCell></TableRow>
                            ) : (
                                filteredData.map((item, idx) => (
                                    <TableRow key={idx} className="hover:bg-orange-50/50 transition-colors group">
                                        {initialColumns.map(col => (
                                            <TableCell
                                                key={col.field}
                                                className={`text-xs py-2.5 border-r border-gray-50 last:border-r-0 ${col.type === 'number' || col.type === 'currency' ? 'text-right font-mono' : ''}`}
                                            >
                                                {formatValue(item[col.field], col.type, item.Simbolo || item.Symbol)}
                                            </TableCell>
                                        ))}
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

// --- Helper Components ---

const SortableHeader = ({
    label, field, type, sortConfig, onSort, onFilter, showFilter, filterValue = '', onFilterChange,
    numericValue = { min: '', max: '' }, onNumericFilterChange, uniqueValues = [], selectedValues = [],
    onValueToggle, width, onResize
}) => {
    const isSorted = sortConfig.key === field;
    const isNumeric = type === 'number' || type === 'currency';

    const handleMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.pageX;
        const startWidth = width;
        const onMouseMove = (eMove) => {
            const newWidth = Math.max(80, startWidth + (eMove.pageX - startX));
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
            className="relative p-0 h-10 border-r border-gray-100 last:border-r-0 group/head"
            style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
        >
            <div
                className={`flex items-center justify-between h-full px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors ${isSorted ? 'bg-orange-50' : ''}`}
                onClick={() => onSort(field)}
            >
                <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className={`text-[11px] font-black uppercase tracking-wider truncate ${isSorted ? 'text-hd-orange' : 'text-gray-500'}`}>
                        {label}
                    </span>
                    {isSorted ? (
                        sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-hd-orange" /> : <ArrowDown size={12} className="text-hd-orange" />
                    ) : (
                        <ArrowUpDown size={12} className="text-gray-300 opacity-0 group-hover/head:opacity-100 transition-opacity" />
                    )}
                </div>
                <button
                    onClick={(e) => onFilter(field, e)}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${filterValue || (selectedValues && selectedValues.length > 0) ? 'text-hd-orange' : 'text-gray-400'}`}
                >
                    <Filter size={12} />
                </button>
            </div>

            {/* Resize Slider */}
            <div
                className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-hd-orange opacity-0 hover:opacity-100 z-10 transition-opacity"
                onMouseDown={handleMouseDown}
                onClick={e => e.stopPropagation()}
            />

            {/* Filter Popover */}
            {showFilter && (
                <div
                    className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 shadow-2xl rounded-sm z-[100] animate-in fade-in zoom-in duration-200 overflow-hidden text-xs"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-1 border-b bg-gray-50">
                        <div className="flex items-center px-4 py-2 hover:bg-hd-orange/10 cursor-pointer text-gray-700 font-bold" onClick={() => { onSort(field); onFilter(field, { stopPropagation: () => { } }); }}>
                            <ArrowUp size={14} className="mr-2 text-gray-400" /> Orden Ascendente
                        </div>
                        <div className="flex items-center px-4 py-2 hover:bg-hd-orange/10 cursor-pointer text-gray-700 font-bold" onClick={() => { onSort(field); onFilter(field, { stopPropagation: () => { } }); }}>
                            <ArrowDown size={14} className="mr-2 text-gray-400" /> Orden Descendente
                        </div>
                    </div>

                    <div className="p-3 border-b">
                        {isNumeric ? (
                            <div className="grid grid-cols-2 gap-2">
                                <Input type="number" placeholder="Min" value={numericValue.min} onChange={(e) => onNumericFilterChange(field, 'min', e.target.value)} className="h-8 text-xs font-mono" />
                                <Input type="number" placeholder="Max" value={numericValue.max} onChange={(e) => onNumericFilterChange(field, 'max', e.target.value)} className="h-8 text-xs font-mono" />
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <Input placeholder="Buscar..." value={filterValue} onChange={(e) => onFilterChange(field, e.target.value)} className="h-8 pl-8 text-xs border-gray-200 shadow-inner" autoFocus />
                            </div>
                        )}
                    </div>

                    <div className="max-h-56 overflow-y-auto p-1 bg-gray-50">
                        <div className="space-y-0.5">
                            {uniqueValues.slice(0, 100).map(val => (
                                <label key={val} className="flex items-center px-3 py-1.5 hover:bg-white rounded cursor-pointer transition-colors group/item">
                                    <input
                                        type="checkbox"
                                        checked={selectedValues.includes(val)}
                                        onChange={() => onValueToggle(field, val)}
                                        className="h-3.5 w-3.5 rounded border-gray-300 text-hd-orange focus:ring-hd-orange"
                                    />
                                    <span className="ml-2 text-[11px] text-gray-600 truncate group-hover/item:text-black">{val}</span>
                                </label>
                            ))}
                            {uniqueValues.length > 100 && <div className="p-2 text-[10px] text-gray-400 text-center">Mostrando primeros 100...</div>}
                        </div>
                    </div>

                    <div className="flex justify-between items-center p-2 bg-gray-100 border-t">
                        <Button size="xs" variant="ghost" className="text-[10px] h-7" onClick={() => onFilter(field, { stopPropagation: () => { } })}>Cerrar</Button>
                        <Button size="xs" variant="ghost" className="text-[10px] h-7 text-hd-orange font-bold uppercase" onClick={() => {
                            if (isNumeric) { onNumericFilterChange(field, 'min', ''); onNumericFilterChange(field, 'max', ''); }
                            else { onFilterChange(field, ''); selectedValues.forEach(v => onValueToggle(field, v)); }
                        }}>Limpiar</Button>
                    </div>
                </div>
            )}
        </TableHead>
    );
};

const formatValue = (val, type, symbol = 'RD$') => {
    if (val === null || val === undefined) return '-';

    if (type === 'date') {
        return new Date(val).toLocaleDateString('es-DO', { year: 'numeric', month: '2-digit', day: '2-digit' });
    }

    if (type === 'currency') {
        return `${symbol || 'RD$'} ${new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2 }).format(val)}`;
    }

    if (type === 'number') {
        return new Intl.NumberFormat('es-DO').format(val);
    }

    return String(val);
};

export default SmartList;


