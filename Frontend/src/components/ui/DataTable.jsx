import React, { useState, useEffect } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronsUpDown, Settings2, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const DataTable = ({
    columns,
    data,
    storageKey,
    showGlobalFilter = true
}) => {
    // --- State Persistence Logic ---
    const loadState = (key, defaultVal) => {
        if (!storageKey) return defaultVal;
        try {
            const saved = localStorage.getItem(`pos_datatable_${storageKey}_${key}`);
            return saved ? JSON.parse(saved) : defaultVal;
        } catch (e) {
            console.warn("Failed to load table state", e);
            return defaultVal;
        }
    };

    const [sorting, setSorting] = useState(() => loadState('sorting', []));
    const [columnVisibility, setColumnVisibility] = useState(() => loadState('visibility', {}));
    const [columnSizing, setColumnSizing] = useState(() => loadState('sizing', {}));
    const [globalFilter, setGlobalFilter] = useState('');

    // Save State Effect
    useEffect(() => {
        if (!storageKey) return;
        localStorage.setItem(`pos_datatable_${storageKey}_sorting`, JSON.stringify(sorting));
        localStorage.setItem(`pos_datatable_${storageKey}_visibility`, JSON.stringify(columnVisibility));
        localStorage.setItem(`pos_datatable_${storageKey}_sizing`, JSON.stringify(columnSizing));
    }, [sorting, columnVisibility, columnSizing, storageKey]);


    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnVisibility,
            columnSizing,
            globalFilter,
        },
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onColumnSizingChange: setColumnSizing,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        columnResizeMode: 'onChange',
        enableColumnResizing: true,
    });

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                {showGlobalFilter && (
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <input
                            placeholder="Buscar en todas las columnas..."
                            value={globalFilter ?? ''}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="h-9 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-hd-orange focus:ring-1 focus:ring-hd-orange"
                        />
                    </div>
                )}

                {/* Column Toggle Dropdown (Simple implementation) */}
                <div className="relative group">
                    <button className="flex items-center gap-2 h-9 px-3 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50">
                        <Settings2 size={16} />
                        Columnas
                    </button>
                    {/* Dropdown Content */}
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg p-2 hidden group-hover:block z-20">
                        <div className="text-xs font-bold text-gray-500 mb-2 px-2">Mostrar/Ocultar</div>
                        {table.getAllLeafColumns().map(column => {
                            return (
                                <div key={column.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={column.getIsVisible()}
                                        onChange={column.getToggleVisibilityHandler()}
                                        className="rounded border-gray-300 text-hd-orange focus:ring-hd-orange"
                                    />
                                    <span className="text-sm text-gray-700">{column.id}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border border-gray-200 overflow-hidden bg-white shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left" style={{ minWidth: table.getTotalSize() }}>
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-xs">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th
                                        key={header.id}
                                        colSpan={header.colSpan}
                                        style={{ width: header.getSize() }}
                                        className="relative px-4 py-3 group select-none border-r border-transparent hover:border-gray-300 transition-colors"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            {/* Header Content & Sort */}
                                            <div
                                                className={cn(
                                                    "flex items-center gap-1 cursor-pointer hover:text-gray-900",
                                                    header.column.getCanSort() ? "cursor-pointer" : ""
                                                )}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {{
                                                    asc: <ChevronUp size={14} />,
                                                    desc: <ChevronDown size={14} />,
                                                }[header.column.getIsSorted()] ?? (header.column.getCanSort() ? <ChevronsUpDown size={14} className="text-gray-300 group-hover:text-gray-500" /> : null)}
                                            </div>
                                        </div>

                                        {/* Resize Handle */}
                                        <div
                                            onMouseDown={header.getResizeHandler()}
                                            onTouchStart={header.getResizeHandler()}
                                            className={cn(
                                                "absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none bg-gray-300 opacity-0 group-hover:opacity-100 transition-opacity",
                                                header.column.getIsResizing() ? "bg-hd-orange opacity-100 w-1.5" : ""
                                            )}
                                        />
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="h-24 text-center text-gray-500">
                                    No hay resultados.
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                    {row.getVisibleCells().map(cell => (
                                        <td
                                            key={cell.id}
                                            style={{ width: cell.column.getSize() }}
                                            className="px-4 py-3"
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between px-2 text-xs text-gray-500">
                <div>
                    Total: {table.getFilteredRowModel().rows.length} registros
                </div>
            </div>
        </div>
    );
};

export default DataTable;

