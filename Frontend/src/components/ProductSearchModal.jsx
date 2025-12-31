import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Package, Tag, ArrowRight, CornerDownLeft } from 'lucide-react';
import { Dialog, DialogContent } from './ui/Dialog';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { getArticulos } from '../api/articulos';

const ProductSearchModal = ({ isOpen, onClose, onSelect, clientContext }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sellableItems, setSellableItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    // const [filteredItems, setFilteredItems] = useState([]); // Removed state for derived value

    const inputRef = useRef(null);
    const listRef = useRef(null);

    // Helper to resolve price based on context - This function will be simplified/removed
    // as the flattening logic now pre-calculates the display price/unit for each variant.
    // However, it's still used in the original onSelect calls, so we'll adapt it.
    // For the new flattened structure, the 'item' itself already contains the resolved price/unit.
    const resolvePrice = (item) => {
        // If the item is a flattened variant, its displayPrice and displayUnit are already resolved.
        if (item.isVariant || item.displayLevel === 'General') {
            return { price: item.displayPrice, unit: item.displayUnit };
        }

        // Fallback for non-flattened items (shouldn't happen with new loadArticulos)
        let resolvedPrice = item.precioVenta || item.precioUnitario || 0;
        let resolvedUnit = item.unidadMedida || 'UND';

        if (clientContext?.nivelPrecio && item.preciosList && item.preciosList.length > 0) {
            const targetCurrency = clientContext.moneda || 'USD';

            const levelMatches = item.preciosList.filter(p => p.nivelPrecio === clientContext.nivelPrecio && p.activo);

            if (levelMatches.length > 0) {
                const currencyMatch = levelMatches.find(p => p.moneda === targetCurrency);
                if (currencyMatch) {
                    resolvedPrice = currencyMatch.precio;
                    resolvedUnit = currencyMatch.unidadMedida;
                } else {
                    resolvedPrice = levelMatches[0].precio;
                    resolvedUnit = levelMatches[0].unidadMedida;
                }
            }
        }
        return { price: resolvedPrice, unit: resolvedUnit };
    };

    useEffect(() => {
        if (isOpen) {
            loadArticulos();
            setSearchTerm('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const loadArticulos = async () => {
        try {
            setLoading(true);
            const data = await getArticulos();

            // FLATTEN LOGIC: Create a row for every valid price/unit combo
            const flattened = [];
            const targetCurrency = clientContext?.moneda || 'DOP'; // Default currency

            data.forEach(item => {
                let hasSpecificsForTargetCurrency = false;

                if (item.preciosList && item.preciosList.length > 0) {
                    // Add specific levels filtered by currency
                    item.preciosList.forEach(p => {
                        const dbMoneda = (p.moneda || 'DOP').trim().toUpperCase();
                        const contextMoneda = (targetCurrency || 'DOP').trim().toUpperCase();

                        if (p.activo && (dbMoneda === contextMoneda)) {
                            flattened.push({
                                ...item,
                                uniqueKey: `${item.id || item.Id}-lvl-${p.id || p.nivelPrecio}`, // Use p.id if available, else nivelPrecio
                                isVariant: true,
                                displayLevel: p.nivelPrecio,
                                displayUnit: p.unidadMedida,
                                displayPrice: p.precio,
                                variantInfo: p
                            });
                            hasSpecificsForTargetCurrency = true;
                        }
                    });
                }

                // Conditionally add the "Base/Standard" definition ONLY if no specific prices were found for this currency
                if (!hasSpecificsForTargetCurrency) {
                    flattened.push({
                        ...item,
                        uniqueKey: `${item.id || item.Id}-base`,
                        isVariant: false,
                        displayLevel: 'General',
                        displayUnit: item.unidadMedida || 'UND',
                        displayPrice: item.precioVenta || item.precioUnitario || 0,
                        variantInfo: null
                    });
                }
            });

            setSellableItems(flattened);
        } catch (error) {
            console.error("Error loading articles:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = useMemo(() => {
        const term = searchTerm.toLowerCase();
        let results = [];

        if (!term) {
            results = sellableItems.slice(0, 50);
        } else {
            results = sellableItems.filter(item => {
                const desc = item.descripcion || item.Descripcion || '';
                const code = item.numeroArticulo || item.NumeroArticulo || '';
                const level = item.displayLevel || '';
                const unit = item.displayUnit || '';

                return desc.toLowerCase().includes(term) ||
                    code.toLowerCase().includes(term) ||
                    level.toLowerCase().includes(term) ||
                    unit.toLowerCase().includes(term);
            }).slice(0, 100);
        }

        // SORTING: Prioritize Client's Price Level
        if (clientContext?.nivelPrecio) {
            results.sort((a, b) => {
                const aMatch = a.displayLevel === clientContext.nivelPrecio;
                const bMatch = b.displayLevel === clientContext.nivelPrecio;
                if (aMatch && !bMatch) return -1; // a matches, b doesn't -> a comes first
                if (!aMatch && bMatch) return 1;  // b matches, a doesn't -> b comes first
                return 0; // Both match or neither match, maintain original order
            });
        }

        return results;
    }, [sellableItems, searchTerm, clientContext]);

    // Reset index when filter changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredItems]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    const item = filteredItems[selectedIndex];
                    // Pass flattened info directly
                    onSelect({
                        ...item,
                        precio: item.displayPrice, // Override base
                        precioVenta: item.displayPrice, // Override base
                        unidad: item.displayUnit, // Important for logic
                        unidadMedida: item.displayUnit, // Visual
                        nivelPrecioApplied: item.displayLevel
                    });
                    onClose();
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredItems, selectedIndex, onSelect, onClose]);

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current) {
            const selectedElement = listRef.current.children[selectedIndex];
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    const getStockClass = (qty) => {
        if (qty > 10) return 'text-green-600 bg-green-50 border-green-100';
        if (qty > 0) return 'text-orange-600 bg-orange-50 border-orange-100';
        return 'text-red-600 bg-red-50 border-red-100';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl p-0 overflow-hidden border-0 shadow-2xl bg-white rounded-xl h-[85vh] flex flex-col">
                {/* Compact Header Section (D365 Style) */}
                <div className="bg-white border-b border-gray-200 p-4 flex flex-col gap-4 shrink-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 tracking-tight">Buscar Productos</h2>
                            <p className="text-xs text-gray-500">
                                {clientContext?.moneda ? `Lista de Precios: ${clientContext.moneda}` : 'Lista de Precios: DOP'}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full h-8 w-8"
                        >
                            <X size={20} />
                        </Button>
                    </div>

                    {/* Search Input Compact & Sharp */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-700" />
                        </div>
                        <Input
                            ref={inputRef}
                            className="w-full pl-9 pr-4 h-9 bg-white text-sm rounded-sm border border-gray-300 focus:border-blue-700 focus:ring-0 focus:outline-none placeholder:text-gray-400 transition-colors"
                            placeholder="Buscar por código, descripción, unidad o nivel..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto bg-gray-50 pt-2 pb-2" style={{ scrollBehavior: 'smooth' }}>
                    {/* Column Headers */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50/95 sticky top-0 z-10 backdrop-blur-sm">
                        <div className="col-span-2">Código</div>
                        <div className="col-span-4">Descripción</div>
                        <div className="col-span-2">Nivel Precio</div>
                        <div className="col-span-1">Unidad</div>
                        <div className="col-span-2 text-right">Existencia</div>
                        <div className="col-span-1 text-right">Precio</div>
                    </div>

                    <div ref={listRef} className="px-2">
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 animate-pulse">
                                <div className="p-4 bg-gray-200 rounded-full mb-4"></div>
                                <div className="h-4 w-48 bg-gray-200 rounded"></div>
                            </div>
                        )}

                        {!loading && filteredItems.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <Package size={64} className="mb-4 text-gray-300" />
                                <p className="text-lg font-medium text-gray-500">No se encontraron productos</p>
                                <p className="text-sm">Verifique los filtros o el término de búsqueda</p>
                            </div>
                        )}

                        {filteredItems.map((item, index) => {
                            const isSelected = index === selectedIndex;
                            const stock = item.stockActual !== undefined ? item.stockActual : (item.StockActual !== undefined ? item.StockActual : 0);
                            const price = item.displayPrice || 0;
                            const level = item.displayLevel || 'General';
                            const unit = item.displayUnit || 'UND';

                            // Highlight if it matches client's assigned level
                            const isClientLevel = clientContext?.nivelPrecio && level === clientContext.nivelPrecio;

                            return (
                                <div
                                    key={item.uniqueKey || index}
                                    onClick={() => {
                                        onSelect({
                                            ...item,
                                            precio: price,
                                            precioVenta: price,
                                            unidad: unit,
                                            unidadMedida: unit,
                                            nivelPrecioApplied: level
                                        });
                                        onClose();
                                    }}
                                    className={`
                                        group grid grid-cols-12 gap-4 px-4 py-3 mb-1 rounded-lg cursor-pointer transition-all duration-150 border items-center
                                        ${isSelected
                                            ? 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-600 shadow-sm z-10'
                                            : 'bg-white border-transparent border-l-4 border-l-transparent hover:border-gray-300 hover:shadow-sm'
                                        }
                                        ${isClientLevel && !isSelected ? 'bg-blue-50 border-blue-200' : ''}
                                    `}
                                >
                                    {/* Code */}
                                    <div className={`col-span-2 font-mono text-xs font-bold ${isSelected ? 'text-blue-800' : 'text-gray-900'}`}>
                                        {item.numeroArticulo || item.NumeroArticulo}
                                    </div>

                                    {/* Description */}
                                    <div className="col-span-4 flex flex-col justify-center">
                                        <div className={`text-sm font-bold truncate ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}>
                                            {item.descripcion || item.Descripcion}
                                        </div>
                                        <div className={`text-xs truncate flex items-center gap-2 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                                            {(item.marca || item.Marca) && (
                                                <span className="flex items-center gap-1"><Tag size={10} /> {item.marca || item.Marca}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Level */}
                                    <div className="col-span-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border
                                            ${isSelected ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                isClientLevel ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                                            }
                                        `}>
                                            {level}
                                        </span>
                                    </div>

                                    {/* Unit */}
                                    <div className="col-span-1">
                                        <span className={`text-xs font-bold ${isSelected ? 'text-gray-800' : 'text-gray-700'}`}>
                                            {unit}
                                        </span>
                                    </div>

                                    {/* Stock */}
                                    <div className="col-span-2 text-right">
                                        <span className={`
                                            inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border
                                            ${isSelected
                                                ? 'bg-white text-gray-800 border-transparent shadow-sm'
                                                : getStockClass(stock)
                                            }
                                        `}>
                                            {stock}
                                        </span>
                                    </div>

                                    {/* Price */}
                                    <div className={`col-span-1 text-right font-black text-sm ${isSelected ? 'text-gray-900' : 'text-gray-900'}`}>
                                        ${Number(price).toFixed(2)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="bg-gray-100 p-2 text-center text-xs text-gray-400 border-t border-gray-200">
                    Mostrando {filteredItems.length} opciones
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProductSearchModal;


