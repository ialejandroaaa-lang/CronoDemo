import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, X, Grid, List as ListIcon, Loader2, Tag, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { getArticulos, getPrecios } from '../../api/articulos';
import { getAlmacenes } from '../../api/almacenes';
import { getPlanes } from '../../api/unidadMedida';
import { calculateCartPromotions } from '../../api/promotions';
import CheckoutModal from '../../components/ventas/CheckoutModal';
import GateKeeper from '../../components/auth/GateKeeper';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const API_UPLOADS = window.location.origin;

import { useLocation } from 'react-router-dom';

const PosPage = () => {
    const location = useLocation();
    const [creditNote, setCreditNote] = useState(null); // { id, amount }
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState(1);
    const searchInputRef = useRef(null);
    const [stockGlobal, setStockGlobal] = useState({});
    const [config, setConfig] = useState({ showStockBreakdown: true, enableBeep: true });
    const [planesUoM, setPlanesUoM] = useState([]);

    // Promotion State
    const [appliedPromotions, setAppliedPromotions] = useState([]);
    const [autoDiscountTotal, setAutoDiscountTotal] = useState(0);

    useEffect(() => {
        if (location.state?.creditNoteId) {
            setCreditNote({
                id: location.state.creditNoteId,
                amount: location.state.creditAmount
            });
            // Clear state so refresh doesn't keep it? optional.
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        // Load config
        const loadConfig = () => {
            const saved = localStorage.getItem('pos_config');
            if (saved) {
                try { setConfig(JSON.parse(saved)); } catch { /* ignore */ }
            }
        };
        loadConfig();

        const handleConfigChange = () => loadConfig();
        window.addEventListener('pos_config_changed', handleConfigChange);

        fetchProducts();
        fetchCategories();
        fetchWarehouses();
        fetchStockGlobal();
        fetchPlanes();

        const handleKeyDown = (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            if (e.key === ' ' && cart.length > 0 && !isCheckoutOpen) {
                e.preventDefault();
                setIsCheckoutOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('pos_config_changed', handleConfigChange);
        };
    }, [cart.length, isCheckoutOpen]);

    const fetchStockGlobal = async () => {
        try {
            const res = await fetch(`${API_BASE}/Articulos/StockGlobal`);
            if (res.ok) {
                const data = await res.json();
                const map = {};
                data.forEach(item => {
                    // Robust normalization to handle any casing from Dapper/JSON
                    // Keys might be 'ArticuloId', 'articuloId', 'ARTICULOID', etc.
                    const getVal = (obj, key) => obj[key] || obj[key.toLowerCase()] || obj[key.charAt(0).toUpperCase() + key.slice(1)];

                    const aid = getVal(item, 'ArticuloId');
                    const whId = getVal(item, 'AlmacenId');
                    const qty = getVal(item, 'Cantidad');

                    if (aid) {
                        const normItem = { articuloId: aid, almacenId: whId, cantidad: qty };
                        if (!map[aid]) map[aid] = [];
                        map[aid].push(normItem);
                    }
                });
                setStockGlobal(map);
            }
        } catch (e) {
            console.error("Error loading stock breakdown", e);
        }
    };

    const [selectedClient, setSelectedClient] = useState(null);

    const fetchWarehouses = async () => {
        try {
            const data = await getAlmacenes();
            setWarehouses(data);

            // Try to set default from config
            let defaultId = null;
            try {
                const saved = localStorage.getItem('pos_config');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    defaultId = parsed.defaultWarehouseId;
                }
            } catch { /* ignore */ }

            if (defaultId && data.some(w => (w.id || w.Id) == defaultId)) {
                setSelectedWarehouse(parseInt(defaultId));
            } else if (data.length > 0) {
                setSelectedWarehouse(data[0].id || data[0].Id);
            }
        } catch (e) {
            console.error("Error fetching warehouses:", e);
        }
    };

    // Load Default Client
    useEffect(() => {
        const loadDefaultClient = async () => {
            try {
                // 1. Get Company Config to find ID
                const resConfig = await fetch(`${API_BASE}/CompanyConfiguration`);
                if (resConfig.ok) {
                    const compData = await resConfig.json();
                    const clientId = compData.defaultClientId || 1; // Default to 1 (General) if not set

                    // 2. Fetch Client Details
                    const resClient = await fetch(`${API_BASE}/Clients/${clientId}`);
                    if (resClient.ok) {
                        const clientData = await resClient.json();
                        setSelectedClient(clientData);
                    }
                }
            } catch (e) {
                console.error("Error loading default client:", e);
            }
        };
        loadDefaultClient();
    }, []);

    const fetchPlanes = async () => {
        try {
            const data = await getPlanes();
            setPlanesUoM(data);
        } catch (error) { console.error("Error fetching UoM planes", error); }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_BASE}/Categorias`);
            if (res.ok) {
                const data = await res.json();
                setCategories([{ id: 0, nombre: 'Todas' }, ...data]);
            }
        } catch (e) {
            console.error("Error fetching categories:", e);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await getArticulos();
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Promotions Engine Integration ---
    useEffect(() => {
        const fetchPromotions = async () => {
            if (cart.length === 0) {
                setAutoDiscountTotal(0);
                setAppliedPromotions([]);
                return;
            }

            try {
                // Calculate raw total before auto-discounts (sum of item prices * qty)
                const rawTotal = cart.reduce((sum, item) => {
                    const price = item.precioUnitario || item.PrecioUnitario || 0;
                    return sum + (price * item.qty);
                }, 0);

                const cartDto = {
                    Total: rawTotal,
                    ClientId: selectedClient ? (selectedClient.id || selectedClient.Id) : null,
                    ApplyTo: 'POS',
                    Items: cart.map(item => ({
                        ProductId: item.id || item.Id,
                        Quantity: item.qty || 0,
                        Price: item.precioUnitario || item.PrecioUnitario || 0,
                        Category: item.categoria || item.Categoria || null
                    }))
                };

                const result = await calculateCartPromotions(cartDto);
                setAutoDiscountTotal(result.discountTotal);
                setAppliedPromotions(result.appliedPromotions || []);
            } catch (err) {
                console.error("Promotion calculation failed:", err);
            }
        };

        const timer = setTimeout(fetchPromotions, 500); // Debounce
        return () => clearTimeout(timer);
    }, [cart, selectedClient]);

    const filteredProducts = products.filter(p => {
        const matchesSearch =
            (p.descripcion || p.Descripcion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.numeroArticulo || p.NumeroArticulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.codigoBarras || p.CodigoBarras || '').toLowerCase().includes(searchTerm.toLowerCase());


        const matchesCategory = selectedCategory === 'Todas' || (p.categoria || p.Categoria) === selectedCategory;

        // Check Currency Filter
        const filterByCurrency = config.filterByCurrency;

        const normalizeCurrency = (c) => {
            if (!c) return 'DOP';
            const s = c.toString().trim().toUpperCase();
            if (s === 'RD$' || s === 'PESO' || s === 'DOP') return 'DOP';
            if (s === 'US$' || s === 'USD') return 'USD';
            if (s === 'EU' || s === 'EUR') return 'EUR';
            return s;
        };

        let matchesCurrency = true;

        if (filterByCurrency) {
            // Robustly get client currency
            const rawCurrency = selectedClient?.moneda || selectedClient?.Moneda || 'DOP';
            const clientCurrency = normalizeCurrency(rawCurrency);

            const pricesList = p.preciosList || p.PreciosList || [];

            // 1. Get List of available currencies from PRICES (most accurate source)
            let availableCurrencies = pricesList.map(pr => normalizeCurrency(pr.moneda || pr.Moneda));

            // If legacy data, fallback to p.monedasDisponibles
            if (availableCurrencies.length === 0) {
                const legacy = p.monedasDisponibles || p.MonedasDisponibles || [];
                availableCurrencies = legacy.map(m => normalizeCurrency(m));
            }

            // If completely empty, assume DOP (legacy default)
            if (availableCurrencies.length === 0) {
                availableCurrencies = ['DOP'];
            }

            if (!availableCurrencies.includes(clientCurrency)) {
                matchesCurrency = false;
            }
        }

        return matchesSearch && matchesCategory && matchesCurrency;
    });

    const playBeep = () => {
        if (config.enableBeep === false) return;
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
            console.error("Audio error:", e);
        }
    };

    const addToCart = async (product) => {
        playBeep();

        const id = product.id || product.Id;

        // 1. Optimistic Add/Increment
        setCart(prev => {
            const existing = prev.find(item => (item.id || item.Id) === id);
            if (existing) {
                return prev.map(item => (item.id || item.Id) === id ? { ...item, qty: item.qty + 1 } : item);
            }
            // Add with default unit 'UND' initially, will update after fetch if needed
            const defaultUnit = product.UnidadVenta || product.unidadMedida || 'UND';
            // Use config-selected Price Level if 'Filter by Price Level' is active, otherwise default
            let defaultLevel = product.NivelPrecio || product.nivelPrecio || 'Precio al Detalle';
            if (config.filterByPriceLevel && config.selectedPriceLevel) {
                defaultLevel = config.selectedPriceLevel;
            }

            return [...prev, {
                ...product,
                qty: 1,
                selectedUnit: defaultUnit,
                selectedLevel: defaultLevel
            }];
        });

        // 2. Fetch Details (Prices & Plan)
        try {
            const prices = await getPrecios(id).catch(() => []);

            // 3. Update Item with Details
            setCart(prev => {
                return prev.map(item => {
                    if ((item.id || item.Id) === id) {
                        // Only update if missing prices or plan
                        // We also need to determine the plan object now
                        const pid = product.PlanMedida || product.planMedida;
                        const plan = planesUoM.find(p => p.planId === pid);

                        // If we didn't have a valid unit before, maybe update it?
                        // But we set a default above.

                        // We also might need to Recalculate Price if the optimistically added item 
                        // used the default price column but now we have a specific price list match?
                        // Let's check for a better price match.

                        const currentLevel = item.selectedLevel || 'Precio al Detalle';
                        const currentUnit = item.selectedUnit;

                        // Priority: Match Client Currency AND Level AND Unit
                        // Second Priority: Match Client Currency AND Unit (any level, or fallback default level?)
                        // Third Priority: Match Level AND Unit (Legacy behavior)

                        const targetCurrency = selectedClient?.moneda;

                        let match = null;

                        if (targetCurrency) {
                            // Try exact match with currency
                            match = prices.find(p => {
                                const pLevel = p.nivelPrecio || p.NivelPrecio || '';
                                const pUnit = p.unidadMedida || p.UnidadMedida || '';
                                const pCurrency = p.moneda || p.Moneda || '';
                                return pLevel.toUpperCase() === currentLevel.toUpperCase() &&
                                    pUnit.toUpperCase() === currentUnit.toUpperCase() &&
                                    pCurrency === targetCurrency;
                            });

                            // If no exact level match, try ANY price with that currency for that unit?
                            // This might be risky if prices differ widely by level. 
                            // But usually better than wrong currency.
                            if (!match) {
                                match = prices.find(p => {
                                    const pUnit = p.unidadMedida || p.UnidadMedida || '';
                                    const pCurrency = p.moneda || p.Moneda || '';
                                    return pUnit.toUpperCase() === currentUnit.toUpperCase() &&
                                        pCurrency === targetCurrency;
                                });
                            }
                        }

                        // Fallback to legacy behavior (ignore currency, find first matching level/unit)
                        if (!match) {
                            match = prices.find(p => {
                                const pLevel = p.nivelPrecio || p.NivelPrecio || '';
                                const pUnit = p.unidadMedida || p.UnidadMedida || '';
                                return pLevel.toUpperCase() === currentLevel.toUpperCase() &&
                                    pUnit.toUpperCase() === currentUnit.toUpperCase();
                            });
                        }
                        let newPrice = item.precioUnitario || item.PrecioUnitario;
                        let newCurrency = item.Moneda || item.moneda || 'DOP'; // Default

                        if (match) {
                            newPrice = match.precio;
                            newCurrency = match.Moneda || match.moneda || 'DOP';
                        }

                        return {
                            ...item,
                            precios: prices,
                            planObj: plan,
                            precioUnitario: newPrice,
                            PrecioUnitario: newPrice,
                            moneda: newCurrency
                        };
                    }
                    return item;
                });
            });
        } catch (e) {
            console.error("Error fetching prices for cart item", e);
        }
    };

    const handleUnitChange = (itemId, newUnit) => {
        playBeep();
        setCart(prev => prev.map(item => {
            const id = item.id || item.Id;
            if (id === itemId) {
                // Find price
                const currentLevel = item.selectedLevel || 'Precio al Detalle';
                const targetCurrency = selectedClient?.moneda;

                let match = null;

                if (targetCurrency) {
                    // Try exact match with currency
                    match = (item.precios || []).find(p => {
                        const pLevel = p.nivelPrecio || p.NivelPrecio || '';
                        const pUnit = p.unidadMedida || p.UnidadMedida || '';
                        const pCurrency = p.moneda || p.Moneda || '';
                        return pLevel.toUpperCase() === currentLevel.toUpperCase() &&
                            pUnit.toUpperCase() === newUnit.toUpperCase() &&
                            pCurrency === targetCurrency;
                    });

                    if (!match) {
                        match = (item.precios || []).find(p => {
                            const pUnit = p.unidadMedida || p.UnidadMedida || '';
                            const pCurrency = p.moneda || p.Moneda || '';
                            return pUnit.toUpperCase() === newUnit.toUpperCase() &&
                                pCurrency === targetCurrency;
                        });
                    }
                }

                if (!match) {
                    match = (item.precios || []).find(p => {
                        const pLevel = p.nivelPrecio || p.NivelPrecio || '';
                        const pUnit = p.unidadMedida || p.UnidadMedida || '';
                        return pLevel.toUpperCase() === currentLevel.toUpperCase() &&
                            pUnit.toUpperCase() === newUnit.toUpperCase();
                    });
                }

                // Fallback: If not found, maybe just keep current price? Or zero?
                // User expects price update.
                // User expects price update.
                let newPrice = item.precioUnitario || item.PrecioUnitario;
                let newCurrency = item.moneda || 'DOP';

                if (match) {
                    newPrice = match.precio;
                    newCurrency = match.Moneda || match.moneda || 'DOP';
                }

                return { ...item, selectedUnit: newUnit, precioUnitario: newPrice, PrecioUnitario: newPrice, moneda: newCurrency };
            }
            return item;
        }));
    };

    const updateQty = (id, delta) => {
        if (delta > 0) playBeep();
        setCart(prev => prev.map(item => {
            const itemId = item.id || item.Id;
            if (itemId === id) {
                const newQty = Math.max(1, item.qty + delta);
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => (item.id || item.Id) !== id));
    };

    const total = cart.reduce((sum, item) => sum + ((item.precioUnitario || item.PrecioUnitario || 0) * item.qty), 0);
    const tax = (total - autoDiscountTotal) * 0.18;
    const grandTotal = total - autoDiscountTotal + tax;

    const handleSaleComplete = (result) => {
        alert(`Venta registrada: ${result.factura}\nNCF: ${result.ncf}`);
        setCart([]);
        setIsCheckoutOpen(false);
        fetchProducts(); // Refresh stock
        fetchStockGlobal();
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-gray-100 -m-6 animate-in fade-in duration-500 relative">

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                cartData={{
                    items: cart,
                    total,
                    tax,
                    grandTotal,
                    autoDiscountTotal,
                    appliedPromotions
                }}
                onComplete={handleSaleComplete}
                selectedWarehouseId={selectedWarehouse}
                creditNote={creditNote} // Pass CN info
            />

            {/* Credit Note Banner */}
            {creditNote && (
                <div className="absolute top-0 left-0 right-0 h-10 bg-green-600 text-white z-50 flex items-center justify-between px-6 font-bold text-sm shadow-md animate-in slide-in-from-top">
                    <span>💳 NOTA DE CRÉDITO APLICADA: ${creditNote.amount.toLocaleString()}</span>
                    <button onClick={() => setCreditNote(null)} className="hover:bg-green-700 px-2 rounded">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Left Column: Product Grid */}
            <div className="flex-1 flex flex-col border-r border-gray-200 h-full overflow-hidden">
                {/* Search Bar & Categories */}
                <div className="bg-white shadow-sm z-10">
                    <div className="p-4 lg:p-6 pb-2">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="relative group flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-hd-orange transition-colors" size={20} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Escanee o busque [F2]"
                                    className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl border-2 border-transparent focus:border-hd-orange focus:bg-white transition-all text-base lg:text-lg font-bold placeholder:text-gray-400"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="flex flex-row lg:flex-col gap-2 lg:gap-1 w-full lg:w-48 items-center lg:items-stretch">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 whitespace-nowrap lg:whitespace-normal">Almacén Origen</label>
                                <select
                                    className="flex-1 lg:flex-none h-[52px] px-4 rounded-xl border-2 border-gray-100 bg-gray-50 font-bold text-gray-700 focus:border-hd-orange transition-all outline-none appearance-none"
                                    value={selectedWarehouse}
                                    onChange={(e) => setSelectedWarehouse(parseInt(e.target.value))}
                                >
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Category Scroll */}
                    <div className="flex gap-2 overflow-x-auto p-4 pt-0 no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.nombre)}
                                className={`px-4 py-2 rounded-full text-xs font-black uppercase whitespace-nowrap transition-all ${selectedCategory === cat.nombre
                                    ? 'bg-hd-orange text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                {cat.nombre}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6 content-start custom-scrollbar pb-24 lg:pb-6">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <Loader2 className="animate-spin" size={48} />
                            <p className="font-bold uppercase tracking-widest text-xs">Cargando Inventario...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4">
                            {filteredProducts.map(product => {
                                const id = product.id || product.Id;
                                const desc = product.descripcion || product.Descripcion;
                                const cod = product.numeroArticulo || product.NumeroArticulo;

                                // Calculate Display Price
                                let displayPrice = product.precioUnitario || product.PrecioUnitario || 0;
                                let displayCurrency = 'DOP'; // Default

                                // Use pre-fetched PreciosList if available (added in backend update)
                                const pricesList = product.preciosList || product.PreciosList || [];

                                if (selectedClient && selectedClient.moneda) {
                                    // If we are filtering by currency (or even if just showing correct price for client)
                                    // Ideally, we respect the Client's Price Level AND Currency.
                                    // For now, prioritize Currency match.

                                    // Logic: Find price in Client's Currency. 
                                    // If Client also has a Price Level, try to match both.
                                    // Client Level? selectedClient.nivelPrecio? Assume 'General' if not set.

                                    // Simplified: Find FIRST price that matches Currency.
                                    // Better: Sort by some logic? Or just take first.
                                    // Usually there is 1 price per Level per Currency.

                                    const targetCurrency = selectedClient.moneda;
                                    const targetLevel = selectedClient.nivelPrecio || 'General'; // Default level

                                    // Try exact match (Level + Currency)
                                    let match = pricesList.find(p =>
                                        (p.moneda === targetCurrency || p.Moneda === targetCurrency) &&
                                        (p.nivelPrecio === targetLevel || p.NivelPrecio === targetLevel)
                                    );

                                    // Fallback: Match Currency (any level? maybe not safe, but better than wrong currency)
                                    // Actually, if we sell to a "Wholesale" client in USD, we don't want "Retail" USD price?
                                    // Let's stick to strict or fall back to default currency?
                                    // User said "la moneda esta en la lista de precio".

                                    if (!match) {
                                        // Try just currency
                                        match = pricesList.find(p => (p.moneda === targetCurrency || p.Moneda === targetCurrency));
                                    }

                                    if (match) {
                                        displayPrice = match.precio || match.Precio;
                                        displayCurrency = match.moneda || match.Moneda;
                                    }
                                }

                                const myStockList = stockGlobal[id] || [];

                                // Filter stock by selected warehouse if one is selected
                                const stockInWarehouse = myStockList
                                    .filter(s => {
                                        const sWh = s.almacenId || s.AlmacenId;
                                        return sWh == selectedWarehouse;
                                    })
                                    .reduce((sum, s) => sum + (s.cantidad || s.Cantidad || 0), 0);

                                // Display specific stock, but still allow adding if stock exists (or restrict)? 
                                // Usually if filtered by warehouse, we should only sell what's in that warehouse.
                                const displayStock = stockInWarehouse;

                                return (
                                    <div
                                        key={id}
                                        onClick={() => displayStock > 0 && addToCart(product)}
                                        className={`bg-white rounded-2xl shadow-sm hover:shadow-2xl cursor-pointer transition-all hover:-translate-y-1 border-2 overflow-hidden select-none group flex flex-col h-auto ${displayStock <= 0 ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:border-hd-orange border-transparent'
                                            }`}
                                    >
                                        {/* Product Image */}
                                        <div className="h-40 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                                            {(product.imagenUrl || product.ImagenUrl) ? (
                                                <img
                                                    src={(product.imagenUrl || product.ImagenUrl).startsWith('http') ? (product.imagenUrl || product.ImagenUrl) : `${API_UPLOADS}${product.imagenUrl || product.imagenUrl}`}
                                                    alt={desc}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-gray-300">
                                                    <Grid size={40} strokeWidth={1} />
                                                    <span className="text-[10px] font-bold mt-2">SIN IMAGEN</span>
                                                </div>
                                            )}

                                            <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                                {/* Badge Stock by Warehouse */}
                                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg shadow-sm ${displayStock > 0 ? 'bg-white text-green-600' : 'bg-red-500 text-white'}`}>
                                                    {displayStock > 0 ? `${displayStock} UD` : 'AGOTADO'}
                                                </span>
                                            </div>

                                            {/* Detailed Stock Overlay on Hover */}
                                            {config.showStockBreakdown && myStockList.length > 0 && (
                                                <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-sm p-2 text-[10px] text-white flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                                    <div className="text-[8px] uppercase tracking-widest text-gray-400 border-b border-gray-600 mb-1 pb-0.5">Stock x Almacén</div>
                                                    {myStockList.map((s, idx) => {
                                                        const whId = s.almacenId; // Normalized
                                                        const warehouse = warehouses.find(w => (w.id || w.Id) == whId);
                                                        const whName = warehouse ? (warehouse.nombre || warehouse.Nombre) : `Alm ${whId}`;
                                                        const qty = s.cantidad;
                                                        const isSelected = whId == selectedWarehouse;
                                                        return (
                                                            <div key={idx} className={`flex justify-between items-center px-1 ${isSelected ? 'text-hd-orange font-bold' : 'text-gray-300'}`}>
                                                                <span className="truncate max-w-[70%] text-[9px]">{whName}</span>
                                                                <span className="font-mono font-bold">{qty}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 flex-1 flex flex-col justify-between">
                                            <div>
                                                <p className="text-[9px] font-black text-gray-300 uppercase truncate tracking-widest mb-1">{cod}</p>
                                                <h3 className="font-bold text-gray-800 text-xs leading-tight line-clamp-2 group-hover:text-hd-orange transition-colors">
                                                    {desc}
                                                </h3>
                                            </div>

                                            <div className="flex items-end justify-between mt-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase">Neto</span>
                                                    <span className="text-lg font-black text-gray-900 leading-none">
                                                        {displayCurrency} ${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                                                    </span>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-hd-orange group-hover:bg-hd-orange group-hover:text-white transition-all transform group-hover:rotate-90">
                                                    <Plus size={20} strokeWidth={3} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Cart */}
            <div className={`
                w-full lg:w-[450px] flex flex-col bg-white shadow-2xl z-20 border-l border-gray-100
                fixed lg:relative bottom-0 left-0 right-0 lg:bottom-auto lg:left-auto lg:right-auto
                h-[50vh] lg:h-auto rounded-t-3xl lg:rounded-none transition-all duration-300
                ${cart.length > 0 ? 'translate-y-0' : 'translate-y-[90%] lg:translate-y-0'}
            `}>
                {/* Mobile Handle to Indicate Swipe/Collapse */}
                <div className="lg:hidden w-full flex justify-center py-2 bg-hd-black rounded-t-3xl border-b border-gray-700/50 cursor-pointer" onClick={() => {/* toggle expand maybe? for now let's rely on translation */ }}>
                    <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
                </div>

                <div className="p-4 lg:p-6 border-b bg-hd-black text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-hd-orange rounded-lg">
                                <ShoppingCart size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 className="font-black text-lg lg:text-xl italic tracking-tighter"> BILLING TICKET</h2>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest truncate max-w-[150px]">
                                    {selectedClient ? (selectedClient.name || selectedClient.Name) : 'Cliente General'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="lg:hidden font-mono font-bold text-green-400 text-lg">${total.toLocaleString()}</span>
                            <Button variant="ghost" size="icon" onClick={() => setCart([])} className="text-gray-500 hover:text-red-500 hover:bg-white/10" disabled={cart.length === 0}>
                                <Trash2 size={20} />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 custom-scrollbar bg-gray-50/30">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-6 opacity-30 select-none py-10">
                            <ShoppingCart size={80} strokeWidth={1} />
                            <div className="text-center">
                                <p className="text-xl font-black italic">VACÍO</p>
                            </div>
                        </div>
                    ) : (
                        cart.map((item, idx) => {
                            const id = item.id || item.Id;
                            const desc = item.descripcion || item.Descripcion;
                            const price = item.precioUnitario || item.PrecioUnitario || 0;

                            return (
                                <div key={id + '_' + idx} className="bg-white p-3 lg:p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 group animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs lg:text-sm font-black text-gray-800 line-clamp-2 leading-tight mb-1">{desc}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-bold text-hd-orange">{item.moneda || 'DOP'} ${price.toLocaleString()}</p>
                                            {/* Unit Selector */}
                                            {item.planObj && (
                                                <select
                                                    className="text-[10px] h-5 border rounded bg-gray-50 max-w-[80px]"
                                                    value={item.selectedUnit || item.unidadMedida || 'UND'}
                                                    onChange={(e) => handleUnitChange(id, e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {(() => {
                                                        const p = item.planObj;
                                                        let units = [p.unidadBase, ...(p.detalles ? p.detalles.map(d => d.unidadMedida) : [])];
                                                        units = [...new Set(units)];

                                                        const currentLevel = item.selectedLevel || 'Precio al Detalle';
                                                        const prices = item.precios || [];

                                                        // Debug
                                                        // console.log('Item:', item.descripcion, 'Level:', currentLevel, 'Prices:', prices);

                                                        // Filter: Only show units that have a price for this level
                                                        const unitsInLevel = prices
                                                            .filter(px => {
                                                                const level = px.nivelPrecio || px.NivelPrecio || '';
                                                                return level.toUpperCase() === currentLevel.toUpperCase();
                                                            })
                                                            .map(px => (px.unidadMedida || px.UnidadMedida || '').toUpperCase());

                                                        // console.log('UnitsInLevel:', unitsInLevel);

                                                        if (unitsInLevel.length > 0) {
                                                            units = units.filter(u => unitsInLevel.includes(u.toUpperCase()));
                                                        }

                                                        return units.map((u, i) => <option key={i} value={u}>{u}</option>);
                                                    })()}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center bg-gray-100 rounded-lg p-1 border">
                                        <button onClick={() => updateQty(id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-500"><Minus size={14} /></button>
                                        <span className="w-8 lg:w-10 text-center text-xs lg:text-sm font-black text-gray-800">{item.qty}</span>
                                        <button onClick={() => updateQty(id, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-500"><Plus size={14} /></button>
                                    </div>
                                    <div className="text-right min-w-[60px] lg:min-w-[80px]">
                                        <p className="text-xs lg:text-sm font-black text-gray-900">${(price * item.qty).toLocaleString()}</p>
                                    </div>
                                    <GateKeeper permission="POS_DELETE_LINE" behavior="disable">
                                        <Button onClick={() => removeFromCart(id)} className="text-gray-200 hover:text-red-500 transition-colors" variant="ghost" size="icon">
                                            <X size={18} />
                                        </Button>
                                    </GateKeeper>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-4 lg:p-8 bg-white border-t space-y-3 lg:space-y-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] pb-safe">

                    {/* Actions Toolbar */}
                    <div className="flex gap-2 mb-2 lg:mb-4 overflow-x-auto pb-2">
                        <GateKeeper permission="POS_APPLY_DISCOUNT" behavior="disable">
                            <Button variant="outline" size="sm" className="text-xs font-bold uppercase tracking-widest text-hd-orange border-hd-orange/30 hover:bg-hd-orange hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap">
                                <Tag size={14} /> Aplicar Descuento
                            </Button>
                        </GateKeeper>
                    </div>

                    <div className="space-y-1 lg:space-y-2">
                        <div className="flex justify-between items-center text-gray-500 font-bold text-[10px] lg:text-xs uppercase tracking-widest">
                            <span>Subtotal</span>
                            <span>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        {autoDiscountTotal > 0 && (
                            <div className="flex justify-between items-center text-hd-orange font-bold text-[10px] lg:text-xs uppercase tracking-widest">
                                <span>Ahorro Promociones</span>
                                <span>-${autoDiscountTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-gray-500 font-bold text-[10px] lg:text-xs uppercase tracking-widest">
                            <span>ITBIS (18%)</span>
                            <span>${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-end pt-2 border-t-2 border-dashed border-gray-100">
                            <span className="text-lg lg:text-xl font-black italic tracking-tighter text-gray-900">NETO A PAGAR</span>
                            <span className="text-3xl lg:text-4xl font-black text-hd-orange tracking-tight">${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>

                        {/* Applied Promotions List */}
                        {appliedPromotions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {appliedPromotions.map((name, i) => (
                                    <span key={i} className="text-[9px] bg-hd-orange/10 text-hd-orange px-2 py-0.5 rounded-full font-bold">
                                        ★ {name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={() => setIsCheckoutOpen(true)}
                        disabled={cart.length === 0}
                        className="w-full h-14 lg:h-20 bg-hd-black hover:bg-gray-900 text-white rounded-xl lg:rounded-2xl flex flex-col items-center justify-center shadow-2xl shadow-gray-400/20 active:scale-[0.98] transition-all group"
                    >
                        <span className="text-xl lg:text-2xl font-black flex items-center gap-3">
                            COBRAR <CreditCard className="group-hover:rotate-12 transition-transform" />
                        </span>
                        <span className="text-[9px] lg:text-[10px] font-bold text-gray-400 tracking-[0.3em] uppercase mt-0 lg:mt-1 hidden lg:block">Presione SPACE</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PosPage;

