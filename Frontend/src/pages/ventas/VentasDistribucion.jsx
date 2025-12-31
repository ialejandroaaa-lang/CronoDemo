import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, Printer, X, Plus, Trash2, Calendar, User, Search, AlertCircle, Gift, FileText, ArrowUpRight, ClipboardList, ArrowRightLeft, Box, Banknote } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '../../components/ui/Table';

// APIs
import { getClients } from '../../api/clientes';
import { getArticulos } from '../../api/articulos';
import { getAlmacenes } from '../../api/almacenes';
import { createVenta, getSecuenciasNCF } from '../../api/ventas';
import { createCotizacion, updateCotizacion } from '../../api/cotizaciones';
import { updateClient } from '../../api/clientes';
import { calculateCartPromotions } from '../../api/promotions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Dialog';
import { Pencil } from 'lucide-react';
import ProductSearchModal from '../../components/ProductSearchModal';
import InvoiceSelector from '../../components/ventas/InvoiceSelector';
import QuotationSelector from '../../components/ventas/QuotationSelector';
import StockHoverCard from '../../components/ventas/StockHoverCard';
import { getReturnReport, createReturn } from '../../api/returns';
import { getCotizacionById } from '../../api/cotizaciones';
import { getVentaById } from '../../api/ventas';

const VentasDistribucion = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // [NEW] Load Quotation on Mount if ID provided
    useEffect(() => {
        if (location.state?.mode === 'edit_quotation' && location.state?.id) {
            loadQuotationForEdit(location.state.id);
            // Clear state to prevent reload on refresh? Optional.
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const loadQuotationForEdit = async (id) => {
        try {
            setLoadingData(true);
            const data = await getCotizacionById(id);
            const quoteHeader = data.header || data.Header || data;
            const quoteDetails = data.details || data.Details || [];

            // Populate Header
            setEditingQuotationId(id); // [NEW] Set ID

            // Get default warehouse if quoteHeader.almacenId is missing
            let defaultAlmacenId = quoteHeader.almacenId || quoteHeader.AlmacenId;
            if (!defaultAlmacenId && warehouses.length > 0) {
                defaultAlmacenId = warehouses[0].id;
            }

            setHeader(prev => ({
                ...prev,
                clienteId: quoteHeader.clienteId || quoteHeader.ClienteId,
                fecha: new Date().toISOString().split('T')[0],
                almacenId: defaultAlmacenId,
                monedaId: quoteHeader.monedaId || quoteHeader.MonedaId,
                tasaCambio: quoteHeader.tasaCambio || quoteHeader.TasaCambio || 1,
                condicionPago: quoteHeader.terminosPago || quoteHeader.TerminosPago || 'Contado',
                referencia: `Editando Cotización #${quoteHeader.numeroCotizacion || quoteHeader.NumeroCotizacion}`
            }));

            // Populate Items
            const mappedItems = quoteDetails.map(d => ({
                id: Date.now() + Math.random(),
                articuloId: d.articuloId || d.ArticuloId,
                codigo: d.articuloCodigo || d.ArticuloCodigo || 'N/A',
                descripcion: d.articuloDescripcion || d.ArticuloDescripcion || 'Producto',
                unidad: d.unidadMedidaId || d.UnidadMedidaId || 'UND',
                cantidad: d.cantidad || d.Cantidad,
                precio: d.precioUnitario || d.PrecioUnitario,
                descuento: d.descuentoMonto || d.DescuentoMonto || 0,
                taxRate: 0.18, // TODO: proper rate
                total: d.totalLinea || d.TotalLinea,
                availablePrices: []
            }));

            setItems(mappedItems);

            // Switch to Quotation Mode
            setIsQuotationMode(true);
            setIsReturnMode(false);

            // Allow printing/converting immediately by setting transaction ID
            setLastTransactionId(id);

            // Update Saved State for Quotation Mode (async state issue avoided by calculating obj first)
            const newHeaderState = {
                clienteId: quoteHeader.clienteId || quoteHeader.ClienteId,
                fecha: new Date().toISOString().split('T')[0],
                almacenId: defaultAlmacenId,
                monedaId: quoteHeader.monedaId || quoteHeader.MonedaId,
                tasaCambio: Number(quoteHeader.tasaCambio || quoteHeader.TasaCambio || 1), // Ensure Number
                condicionPago: quoteHeader.terminosPago || quoteHeader.TerminosPago || 'Contado',
                referencia: `Editando Cotización #${quoteHeader.numeroCotizacion || quoteHeader.NumeroCotizacion}`
            };

            setSavedStates(prev => ({
                ...prev,
                quotation: {
                    header: newHeaderState,
                    items: mappedItems,
                    appliedPromotions: [],
                    lastTransactionId: id, // Set ID here too
                    successMsg: ''
                }
            }));

            setSuccessMsg(`Cotización #${quoteHeader.numeroCotizacion || quoteHeader.NumeroCotizacion} cargada para edición`);

        } catch (e) {
            console.error(e);
            setError("Error al cargar la cotización.");
        } finally {
            setLoadingData(false);
        }
    };

    // Catalogs
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [ncfSequences, setNcfSequences] = useState([]);
    const [monedas, setMonedas] = useState([]);

    // Loading/Error
    const [loadingData, setLoadingData] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Form State
    const [header, setHeader] = useState({
        clienteId: '',
        fecha: new Date().toISOString().split('T')[0],
        condicionPago: 'Contado',
        referencia: '',
        almacenId: '', // Default warehouse
        tipoNCF: '',
        monedaId: '',
        tasaCambio: 1
    });

    const [isReturnMode, setIsReturnMode] = useState(false);
    const [isQuotationMode, setIsQuotationMode] = useState(false);
    const [showCatalogModal, setShowCatalogModal] = useState(false); // Modal control

    // Product Search State
    const [showProductSearch, setShowProductSearch] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState('');

    const filteredProducts = useMemo(() => {
        if (!productSearchTerm) return [];
        const term = productSearchTerm.toLowerCase();
        return products.filter(p =>
            (p.descripcion?.toLowerCase().includes(term)) ||
            (p.numeroArticulo?.toLowerCase().includes(term)) ||
            (p.codigoBarras?.toLowerCase().includes(term))
        ).slice(0, 8);
    }, [products, productSearchTerm]);

    const [items, setItems] = useState([]); // { id, articuloId, codigo, descripcion, cantidad, precio, itbis (rate), total }
    const [editingQuotationId, setEditingQuotationId] = useState(null); // [NEW] Track ID for updates



    // Client Edit State
    const [isEditClientOpen, setIsEditClientOpen] = useState(false);
    const [editingClient, setEditingClient] = useState({ taxId: '', address: '', phone: '' });

    const [defaultUnit, setDefaultUnit] = useState('UND');

    // Auto-Focus State
    const [lastAddedItemId, setLastAddedItemId] = useState(null);

    // Promotion State
    const [appliedPromotions, setAppliedPromotions] = useState([]);
    const [autoDiscountTotal, setAutoDiscountTotal] = useState(0);

    // New Features State
    const [showInvoiceSelector, setShowInvoiceSelector] = useState(false);
    const [showReturnMethodModal, setShowReturnMethodModal] = useState(false);
    const [hoveredReturnMethod, setHoveredReturnMethod] = useState(null);
    const [showQuotationSelector, setShowQuotationSelector] = useState(false);
    const [activeTooltipId, setActiveTooltipId] = useState(null); // Article ID for tooltip
    const [enableStockTooltip, setEnableStockTooltip] = useState(false);
    const [lastTransactionId, setLastTransactionId] = useState(null); // To enable print

    // Load Config
    useEffect(() => {
        const savedConfig = localStorage.getItem('pos_config');
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig);
                if (parsed.distributionDefaultUnit) {
                    setDefaultUnit(parsed.distributionDefaultUnit);
                }
                setEnableStockTooltip(!!parsed.enableStockTooltip);
            } catch (e) {
                console.error("Error loading config", e);
            }
        }
    }, []);

    // Effect: Auto-focus quantity when new item added
    useEffect(() => {
        if (lastAddedItemId) {
            // Tiny timeout to ensure DOM update
            setTimeout(() => {
                const element = document.getElementById(`qty-${lastAddedItemId}`);
                if (element) {
                    element.focus();
                    element.select();
                }
            }, 100);
            setLastAddedItemId(null); // Reset
        }
    }, [lastAddedItemId, items]);

    // --- State Management for Independent Tabs (Sale / Quote / Return) ---
    const [savedStates, setSavedStates] = useState({
        sale: {
            header: {
                clienteId: '',
                fecha: new Date().toISOString().split('T')[0],
                condicionPago: 'Contado',
                referencia: '',
                almacenId: '',
                tipoNCF: '',
                monedaId: '',
                tasaCambio: 1
            },
            items: [],
            appliedPromotions: [],
            lastTransactionId: null,
            successMsg: ''
        },
        quotation: {
            header: {
                clienteId: '',
                fecha: new Date().toISOString().split('T')[0],
                condicionPago: 'Contado',
                referencia: '',
                almacenId: '',
                tipoNCF: '', // Quotation often doesn't need NCF but keeping structure
                monedaId: '',
                tasaCambio: 1
            },
            items: [],
            appliedPromotions: [],
            lastTransactionId: null,
            successMsg: ''
        },
        return: {
            header: {
                clienteId: '',
                fecha: new Date().toISOString().split('T')[0],
                condicionPago: 'Contado',
                referencia: '',
                almacenId: '',
                tipoNCF: '',
                monedaId: '',
                tasaCambio: 1
            },
            items: [],
            appliedPromotions: [],
            lastTransactionId: null,
            successMsg: ''
        }
    });

    const switchMode = (targetMode) => {
        // 1. Identify current mode
        let currentModeKey = 'sale';
        if (isQuotationMode) currentModeKey = 'quotation';
        else if (isReturnMode) currentModeKey = 'return';

        // 2. Prevent unnecessary switch
        if (currentModeKey === targetMode) return;

        // 3. Save CURRENT state to valid key
        setSavedStates(prev => ({
            ...prev,
            [currentModeKey]: {
                header: { ...header },
                items: [...items],
                appliedPromotions: [...appliedPromotions],
                lastTransactionId: lastTransactionId,
                successMsg: successMsg
            }
        }));

        // 4. Load TARGET state
        const targetData = savedStates[targetMode];
        setHeader({ ...targetData.header });
        setItems([...targetData.items]);
        setAppliedPromotions([...targetData.appliedPromotions]);
        setLastTransactionId(targetData.lastTransactionId);
        setSuccessMsg(targetData.successMsg);

        // 5. Update Flags
        if (targetMode === 'quotation') {
            setIsQuotationMode(true);
            setIsReturnMode(false);
        } else if (targetMode === 'return') {
            setIsQuotationMode(false);
            setIsReturnMode(true);
        } else {
            setIsQuotationMode(false);
            setIsReturnMode(false);
        }
    };

    // --- Data Loading ---
    useEffect(() => {
        const loadAll = async () => {
            try {
                const [clientsData, productsData, warehousesData, ncfData, monData] = await Promise.all([
                    getClients(),
                    getArticulos(),
                    getAlmacenes(),
                    getSecuenciasNCF(),
                    fetch(`${import.meta.env.VITE_API_URL || '/api'}/Monedas`).then(r => r.json())
                ]);

                setClients(clientsData);
                setProducts(productsData);
                setWarehouses(warehousesData);
                setNcfSequences(ncfData);
                setMonedas(monData);

                // Initialize Default Warehouse in all states 
                if (warehousesData.length > 0) {
                    const defaultId = warehousesData[0].id;
                    setHeader(prev => ({ ...prev, almacenId: defaultId })); // Current
                    setSavedStates(prev => ({
                        sale: { ...prev.sale, header: { ...prev.sale.header, almacenId: defaultId } },
                        quotation: { ...prev.quotation, header: { ...prev.quotation.header, almacenId: defaultId } },
                        return: { ...prev.return, header: { ...prev.return.header, almacenId: defaultId } },
                    }));
                }

                if (ncfData.length > 0) {
                    // Default logic handled in useEffect based on mode
                }

                if (monData.length > 0) {
                    const func = monData.find(m => m.esFuncional);
                    if (func) {
                        setHeader(prev => ({ ...prev, monedaId: func.id, tasaCambio: 1 }));
                    }
                }

            } catch (err) {
                console.error(err);
                setError('Error cargando datos iniciales.');
            } finally {
                setLoadingData(false);
            }
        };
        loadAll();
    }, []);

    // --- Promotions Engine Integration ---
    useEffect(() => {
        const fetchPromotions = async () => {
            if (items.length === 0) {
                setAutoDiscountTotal(0);
                setAppliedPromotions([]);
                return;
            }

            try {
                // Calculate raw total before auto-discounts
                const rawTotal = items.reduce((sum, item) => {
                    const price = parseFloat(item.precio) || 0;
                    const qty = parseFloat(item.cantidad) || 0;
                    return sum + (price * qty);
                }, 0);

                const cartDto = {
                    Total: rawTotal,
                    ClientId: header.clienteId ? parseInt(header.clienteId) : null,
                    ApplyTo: 'Distribution',
                    Items: items.map(item => {
                        // Find category from products catalog
                        const productData = products.find(p => p.id === item.articuloId);
                        return {
                            ProductId: item.articuloId,
                            Quantity: parseFloat(item.cantidad) || 0,
                            Price: parseFloat(item.precio) || 0,
                            Category: productData?.categoria || null
                        };
                    })
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
    }, [items, header.clienteId, products]);

    const fetchTasa = async (monId) => {
        if (!monId) return;
        const mon = monedas.find(m => m.id === parseInt(monId));
        if (mon && mon.esFuncional) {
            setHeader(prev => ({ ...prev, tasaCambio: 1 }));
            return;
        }
        try {
            const API_BASE = import.meta.env.VITE_API_URL || '/api';
            const res = await fetch(`${API_BASE}/Monedas/tasas?monedaId=${monId}`);
            if (res.ok) {
                const data = await res.json();
                setHeader(prev => ({ ...prev, tasaCambio: data.tasa || 1 }));
            }
        } catch (e) {
            console.error("Error fetching rate:", e);
        }
    };

    // --- Calculations ---
    const totals = useMemo(() => {
        let subtotal = 0;
        let totalImpuestos = 0;

        items.forEach(item => {
            const qty = parseFloat(item.cantidad) || 0;
            const price = parseFloat(item.precio) || 0;
            const discount = parseFloat(item.descuento) || 0;

            const lineTotal = qty * price;
            // Assuming item.itbis is a rate (e.g. 0.18) or fixed amount included? 
            // Usually ITBIS is calculated. Let's assume price includes tax or tax is extra.
            // For B2B/Distribution usually Tax is Extra.
            // Let's assume product has 'impuesto' rate.
            // Since we need to look up tax rate from product, let's assume we stored it in item or lookup.

            // Simplified: (Qty * Price) = Base. Tax = Base * Rate.
            // We need tax rate on the item.

            // Base = (Qty * Price) - Discount
            const baseAmount = lineTotal - discount;

            subtotal += baseAmount;
            totalImpuestos += (baseAmount * (item.taxRate || 0));
        });

        // If Return Mode, totals should ideally be negative for visual confirmation? 
        // User prefers to see positive numbers usually but we can show "Refund Total".
        // Let's keep signs positive here for the UI table, but indicate "Total a Devolver".

        // Apply Global Discount
        const rawSubtotal = subtotal;
        const globalDiscount = (parseFloat(header.descuentoGlobalMonto) || 0) + autoDiscountTotal;

        let finalSubtotal = rawSubtotal - globalDiscount;
        if (finalSubtotal < 0) finalSubtotal = 0;

        // Propagate discount to Taxes (Proportional reduction of tax base)
        // If Base is reduced by X%, Tax is reduced by X%
        let finalTax = totalImpuestos;
        if (rawSubtotal > 0) {
            const factor = finalSubtotal / rawSubtotal;
            finalTax = totalImpuestos * factor;
        } else {
            finalTax = 0;
            finalSubtotal = 0;
        }

        return {
            rawSubtotal, // Display base subtotal
            globalDiscount,
            subtotal: finalSubtotal, // Net subtotal
            impuestos: finalTax,
            total: finalSubtotal + finalTax
        };
    }, [items, header.descuentoGlobalMonto]);

    // --- Handlers ---

    // Item Replacement State
    const [replacingRowId, setReplacingRowId] = useState(null);

    const handleReplaceItem = (oldItemId, newProduct) => {
        setItems(prev => prev.map(item => {
            if (item.id !== oldItemId) return item;

            // Transform new product to item format (preserving original ID and Quantity)
            return {
                ...item,
                articuloId: newProduct.id,
                codigo: newProduct.numeroArticulo || newProduct.codigo,
                descripcion: newProduct.descripcion || newProduct.nombre,
                unidad: newProduct.unidad || newProduct.unidadMedidaId || defaultUnit,
                precio: newProduct.precio || newProduct.precioVenta || 0,
                availablePrices: newProduct.preciosList || [],
                total: 0 // Will recalc
            };
        }));
        setReplacingRowId(null);
        setShowCatalogModal(false);
    };

    const handleAddItem = (product) => {
        // Validation: Must select client first
        if (!header.clienteId) {
            alert("⚠️ Seleccione un cliente para continuar.");
            return;
        }

        // Check if exists
        const exists = items.find(i => i.articuloId === product.id);
        if (exists) {
            handleUpdateItem(exists.id, { cantidad: exists.cantidad + 1 });
            return;
        }

        // Format new item
        const newItem = {
            id: `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            articuloId: product.id || product.Id,
            codigo: product.numeroArticulo || product.NumeroArticulo || product.codigo || product.Codigo,
            descripcion: product.descripcion || product.Descripcion || product.nombre || product.Nombre,
            unidad: product.unidad || product.unidadMedida || product.UnidadMedida || product.unidadMedidaId || defaultUnit,
            cantidad: 1,
            precio: product.precio || product.precioVenta || product.PrecioVenta || 0,
            descuento: 0,
            taxRate: 0.18, // TODO: Fetch from Tax Group lookup
            total: 0, // Calc later

            // Store full price list for unit switching
            // If it came from the flattened list, it might have 'variantInfo'. If from raw, 'preciosList'.
            // The Modal passes 'variantInfo' if it's a specific variant, but we want ALL options available for this product ID.
            // We might need to fetch them or if the modal passed the full 'preciosList' attached to the item.
            // In ProductSearchModal: '...item' spreads the original props, so 'preciosList' should be there.
            availablePrices: product.preciosList || []
        };
        setItems([...items, newItem]);
        setLastAddedItemId(newItem.id); // Set for auto-focus
        setShowProductSearch(false);
        setProductSearchTerm('');
    };

    const handleUnitChange = (itemId, newUnit) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        // Try to find a matching price for this unit in the current currency
        // We prioritize the CURRENT Price Level if possible, otherwise we default to the first match for this unit/currency?
        // Or we just look for specific unit price.

        let newPrice = item.precio;

        const targetCurrency = monedas.find(m => m.id == header.monedaId)?.codigo || 'DOP';

        // Find available options for this unit and currency
        const validOptions = item.availablePrices.filter(p =>
            p.unidadMedida === newUnit &&
            p.activo &&
            (p.moneda === targetCurrency)
        );

        if (validOptions.length > 0) {
            // If multiple levels (e.g. Detalle, Mayorista) for same unit, which one to pick?
            // Ideally we stick to the client's assigned price level.
            // Or if the item was added via a specific selection, we might want to stay close to that?
            // For now: Just pick the first one found, or maybe Sort by price descending/ascending? 
            // Usually we pick the one matching the Client's NivelPrecioId.

            // Simple logic: Pick the first valid price config for this unit/currency.
            newPrice = validOptions[0].precio;

            // Refinement: If client has a level, try to find that level specifically
            if (currentClient?.nivelPrecioId) {
                const bestMatch = validOptions.find(p => p.nivelPrecioId === currentClient.nivelPrecioId);
                if (bestMatch) newPrice = bestMatch.precio;
            }
        } else {
            // If no specific price found for this unit (maybe it's the Base Unit?), revert to base price logic?
            // Or maybe we shouldn't allow switching to it if it doesn't exist?
            // For now, keep current price if not found (or maybe 0?)
        }

        handleUpdateItem(itemId, { unidad: newUnit, precio: newPrice });
    };

    const handleUpdateItem = (id, changes) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            return { ...item, ...changes };
        }));
    };

    const handleRemoveItem = (id) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const handleSubmit = async () => {
        if (!header.clienteId) { setError('Seleccione un cliente'); return; }

        let finalAlmacenId = header.almacenId;
        if (!finalAlmacenId && warehouses.length > 0) {
            finalAlmacenId = warehouses[0].id;
            // Update header async
            setHeader(prev => ({ ...prev, almacenId: finalAlmacenId }));
        }

        if (!finalAlmacenId) { setError('Seleccione un almacén'); return; }

        if (items.length === 0) { setError('Agregue al menos un producto'); return; }

        setSaving(true);
        setError('');
        setSuccessMsg('');

        try {
            if (isQuotationMode) {
                const cotizacionDto = {
                    Fecha: header.fecha,
                    ClienteId: Number(header.clienteId),
                    AlmacenId: Number(header.almacenId),
                    Usuario: 'Admin',
                    Subtotal: totals.subtotal,
                    ITBIS: totals.impuestos,
                    Total: totals.total,
                    DescuentoMonto: totals.globalDiscount,
                    MonedaId: header.monedaId ? Number(header.monedaId) : null,
                    TasaCambio: Number(header.tasaCambio),
                    Referencia: header.referencia,
                    TerminosPago: header.condicionPago,
                    Detalles: items.map(i => ({
                        ArticuloId: Number(i.articuloId),
                        Cantidad: Number(i.cantidad),
                        PrecioUnitario: Number(i.precio),
                        ITBIS: ((Number(i.cantidad) * Number(i.precio)) - (i.descuento || 0)) * (i.taxRate || 0),
                        TotalLinea: (Number(i.cantidad) * Number(i.precio)) - (i.descuento || 0),
                        AlmacenId: Number(header.almacenId),
                        DescuentoMonto: Number(i.descuento || 0),
                        UnidadMedidaId: i.unidad
                    }))
                };

                if (editingQuotationId) {
                    // [NEW] Update Logic
                    await updateCotizacion(editingQuotationId, cotizacionDto);
                    setSuccessMsg(`Cotización modificada con éxito!`);
                    // Stay in edit mode or clear? Usually stay.
                } else {
                    // Create Logic
                    const result = await createCotizacion(cotizacionDto);
                    setLastTransactionId(result.id || result.Id); // Save for printing
                    setSuccessMsg(`Cotización creada con éxito! #${result.numero}`);
                    // Once created, should we switch to edit mode for the new ID? 
                    // Maybe, but simplest is to leave it to create another if user wants.
                }
            } else if (isReturnMode) {
                // Determine Venta Origin ID 
                // We stored it in 'referencia' as "Devolución Factura #123" but we need the numeric ID.
                // OR we have it in lastTransactionId? No, lastTransactionId holds the CURRENT created doc.
                // We need the ID of the invoice being returned.
                // If we imported it, we set 'referencia'. 
                // Wait, if we 'imported', we probably didn't store the VentaId in a dedicated state variable, 
                // just 'items'. BUT 'handleImportInvoice' sets header.referencia.
                // And 'handleConvertSaleToReturn' sets 'referencia' using 'lastTransactionId' which WAS the sale ID.
                // We need to parse it or better: store existing Sale ID in a stat variable like 'originSaleId'.
                // If we don't have it, we can't link!
                // FIX: Let's extract ID from header.referencia using regex if possible, OR add 'originId' to header.

                // Regex fallback: "Factura #(\d+)"
                const match = header.referencia.match(/#(\d+)/);
                const ventaOrigenId = match ? parseInt(match[1]) : 0;

                if (!ventaOrigenId) throw new Error("No se pudo identificar la factura de origen. Asegúrese de que la referencia diga 'Factura #...'");

                const returnDto = {
                    VentaId: ventaOrigenId,
                    Razon: header.referencia, // Use current reference as reason or add input
                    TipoAccion: header.condicionPago, // 'Efectivo', 'NotaCredito', 'Cambio'
                    TotalReembolsado: totals.total,
                    Usuario: 'Admin',
                    Detalles: items.map(i => ({
                        ArticuloId: Number(i.articuloId),
                        Cantidad: Math.abs(Number(i.cantidad)), // Returns controller expects positive quantity to return
                        PrecioUnitario: Number(i.precio),
                        RetornarAlStock: true // Default true
                    }))
                };

                const result = await createReturn(returnDto);
                // Result is likely an execution that returns an int ID (based on controller: SELECT CAST(SCOPE_IDENTITY() as int))
                setLastTransactionId(result);
                setSuccessMsg(`Devolución creada con éxito! #${result}`);

            } else {
                const ventaDto = {
                    Fecha: header.fecha,
                    ClienteId: Number(header.clienteId),
                    TipoNCF: header.tipoNCF,
                    AlmacenId: Number(header.almacenId),
                    Usuario: 'Admin', // Hardcoded for now
                    Subtotal: totals.subtotal,
                    ITBIS: totals.impuestos,
                    Total: totals.total,
                    MonedaId: header.monedaId ? Number(header.monedaId) : null,
                    TasaCambio: Number(header.tasaCambio),
                    Referencia: header.referencia,
                    TerminosPago: header.condicionPago,
                    Detalles: items.map(i => ({
                        ArticuloId: Number(i.articuloId),
                        Cantidad: Number(i.cantidad),
                        PrecioUnitario: Number(i.precio),
                        ITBIS: ((Number(i.cantidad) * Number(i.precio)) - (i.descuento || 0)) * (i.taxRate || 0),
                        TotalLinea: (Number(i.cantidad) * Number(i.precio)) - (i.descuento || 0), // Base total after discount
                        AlmacenId: Number(header.almacenId),
                        DescuentoMonto: Number(i.descuento || 0),
                        UnidadMedidaId: i.unidad // Pass the string unit code. Backend should handle mapping if scalar or ID.
                    }))
                };

                const result = await createVenta(ventaDto);
                setLastTransactionId(result.id || result.Id); // Save for printing
                setSuccessMsg(`Venta creada con éxito! Factura: ${result.factura}`);
            }

            // Redirect to History (Disabled to allow printing)
            // setTimeout(() => {
            //     navigate('/ventas/historial');
            // }, 1000);

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };



    // Handle Quick Edit Save
    const handleSaveClientEdit = async () => {
        if (!header.clienteId) return;
        try {
            setSaving(true);
            const clientToUpdate = clients.find(c => c.id == header.clienteId);
            if (!clientToUpdate) return;

            const updatedClient = {
                ...clientToUpdate,
                taxId: editingClient.taxId,
                address: editingClient.address,
                phone: editingClient.phone
            };

            await updateClient(clientToUpdate.id, updatedClient);

            // Update local state
            setClients(prev => prev.map(c => c.id === clientToUpdate.id ? updatedClient : c));
            setIsEditClientOpen(false);
            setSuccessMsg('Datos del cliente actualizados');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (e) {
            console.error(e);
            setError('Error al actualizar cliente');
        } finally {
            setSaving(false);
        }
    };

    // Open Edit Modal
    const openEditClient = () => {
        if (!currentClient) return;
        setEditingClient({
            taxId: currentClient.taxId || '',
            address: currentClient.address || '',
            phone: currentClient.phone || ''
        });
        setIsEditClientOpen(true);
    };

    // --- Client Change Effect ---
    useEffect(() => {
        if (!header.clienteId) return;

        const client = clients.find(c => c.id == header.clienteId);
        if (!client) return;

        // Auto-populate Defaults from Client
        if (client.terminosPago) {
            setHeader(prev => ({ ...prev, condicionPago: client.terminosPago }));
        }

        if (client.tipoNCF) {
            setHeader(prev => ({ ...prev, tipoNCF: client.tipoNCF }));
        }

        // Auto-select Currency
        if (client.moneda && monedas.length > 0) {
            const currency = monedas.find(m => m.codigo === client.moneda);
            if (currency) {
                setHeader(prev => ({ ...prev, monedaId: currency.id, tasaCambio: 1 }));
            }
        }
    }, [header.clienteId, clients, monedas]);

    const currentClient = clients.find(c => c.id == header.clienteId);
    const lockNCF = currentClient?.tipoNCF && currentClient.tipoNCF.trim() !== '';

    // Effect to switch NCF based on Mode
    useEffect(() => {
        if (!ncfSequences.length) return;

        if (isReturnMode) {
            const cn = ncfSequences.find(s => s.tipoNCF === '04');
            if (cn) setHeader(h => ({ ...h, tipoNCF: cn.tipoNCF }));
        } else {
            if (!lockNCF) {
                const def = ncfSequences.find(s => s.tipoNCF === '02') || ncfSequences[0];
                if (def) setHeader(h => ({ ...h, tipoNCF: def.tipoNCF }));
            } else {
                if (currentClient?.tipoNCF) setHeader(h => ({ ...h, tipoNCF: currentClient.tipoNCF }));
            }
        }
    }, [isReturnMode, ncfSequences, lockNCF, currentClient]);

    const handleImportInvoice = async (invoice) => {
        setShowInvoiceSelector(false);
        if (!invoice) return;

        setLoadingData(true);
        try {
            // Load full invoice details
            const fullVenta = await getVentaById(invoice.id || invoice.Id);

            setHeader(prev => ({
                ...prev,
                clienteId: fullVenta.clienteId || fullVenta.ClienteId,
                referencia: `Devolución Factura #${fullVenta.numeroFactura || fullVenta.NumeroFactura}`,
                monedaId: fullVenta.monedaId,
                tipoNCF: '04'
            }));

            // Map items to negative quantities
            const mappedItems = (fullVenta.detalles || fullVenta.Detalles || []).map(d => ({
                id: Date.now() + Math.random(),
                articuloId: d.articuloId || d.ArticuloId,
                codigo: d.articuloCodigo || 'N/A',
                descripcion: d.descripcion || d.Descripcion,
                unidad: d.unidadMedida || 'UND',
                cantidad: d.cantidad || d.Cantidad,
                precio: d.precioUnitario || d.PrecioUnitario,
                taxRate: 0.18,
                descuento: 0,
                stockActual: 0
            }));

            setItems(mappedItems);
            // Switch to Return Mode if not already
            if (!isReturnMode) setIsReturnMode(true);

        } catch (e) {
            console.error(e);
            alert("Error al importar la factura");
        } finally {
            setLoadingData(false);
        }
    };

    const handleImportQuotation = async (quotation) => {
        setShowQuotationSelector(false);
        if (!quotation) return;

        setLoadingData(true);
        try {
            const fullQuote = await getCotizacionById(quotation.id || quotation.Id);

            setHeader(prev => ({
                ...prev,
                clienteId: fullQuote.clienteId || fullQuote.ClienteId,
                referencia: `Desde Cotización #${fullQuote.id || fullQuote.Id}`,
            }));

            const mappedItems = (fullQuote.detalles || fullQuote.Detalles || []).map(d => ({
                id: Date.now() + Math.random(),
                articuloId: d.articuloId || d.ArticuloId,
                codigo: d.codigo || 'N/A',
                descripcion: d.descripcion || d.Descripcion,
                unidad: d.unidadMedida || 'UND',
                cantidad: d.cantidad || d.Cantidad,
                precio: d.precioUnitario || d.PrecioUnitario,
                taxRate: d.itbisPorcentaje ? d.itbisPorcentaje / 100 : 0.18,
                descuento: d.descuento || d.Descuento || 0,
                stockActual: 0
            }));

            setItems(mappedItems);
            if (isQuotationMode) setIsQuotationMode(false); // Switch to Sale mode to invoice it

        } catch (e) {
            console.error(e);
            alert("Error al importar la cotización");
        } finally {
            setLoadingData(false);
        }
    };

    if (loadingData) return <div className="p-10 text-center">Cargando datos...</div>;

    const handlePrint = () => {
        if (!lastTransactionId) return;

        const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
        // Remove '/api' if present for report base
        const reportBase = baseUrl.replace('/api', '');

        let url = '';
        if (isQuotationMode) {
            url = `${reportBase}/Reports/Cotizacion?id=${lastTransactionId}`;
        } else if (isReturnMode) {
            url = `${reportBase}/Reports/Devolucion?id=${lastTransactionId}`;
        } else {
            url = `${reportBase}/Reports/Factura?id=${lastTransactionId}`;
        }

        window.open(url, '_blank');
    };

    const handleConvertQuoteToSale = () => {
        if (!isQuotationMode || !lastTransactionId) return;

        // 1. Create Reference
        const refText = `Desde Cotización #${lastTransactionId}`;

        // 2. Clear ID (New Transaction)
        setLastTransactionId(null);
        setSuccessMsg('');

        // 3. Update Header
        setHeader(prev => ({
            ...prev,
            referencia: refText
        }));

        // 4. Switch Mode to Sale (State is preserved because we are NOT loading from savedStates yet, 
        // effectively 'carrying over' the current form to the new mode.
        // HOWEVER, switchMode NORMALLY clears state. We must bypass switchMode or update it.
        // BETTER: Manually set flags.
        setIsQuotationMode(false);
        setIsReturnMode(false);

        // 5. Update Saved State for Sale to match current (optional but good for consistency)
        /* 
        setSavedStates(prev => ({
            ...prev,
            sale: { ...prev.quotation, lastTransactionId: null } 
        }));
        */
    };

    const handleConvertSaleToReturn = () => {
        if (isQuotationMode || isReturnMode || !lastTransactionId) return;
        setShowReturnMethodModal(true);
    };

    const handleConfirmReturnConversion = (method) => {
        // method: 'Efectivo', 'NotaCredito', 'Inventario' (mapped to 'Contado' maybe? Or just 'Inventario')
        setShowReturnMethodModal(false);

        // 1. Create Reference
        const refText = `Devolución Factura #${lastTransactionId}`;

        // 2. Clear ID (New Transaction)
        setLastTransactionId(null);
        setSuccessMsg('');

        // 3. Switch Mode
        setIsReturnMode(true);
        setIsQuotationMode(false);

        // 4. Update Header
        // Find NCF 04
        const refundObs = ncfSequences.find(s => s.tipoNCF === '04');
        setHeader(prev => ({
            ...prev,
            referencia: refText,
            tipoNCF: refundObs?.tipoNCF || '04',
            condicionPago: method // Set selected method
        }));
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20 p-6">
            {/* Header Actions */}
            <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between sticky top-0 bg-gray-50/95 backdrop-blur z-20 py-4 lg:py-4 border-b border-gray-200 -mx-6 px-6 gap-4">
                <div className="w-full lg:w-auto text-center lg:text-left">
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-800 flex items-center justify-center lg:justify-start gap-2 whitespace-nowrap">
                        {isQuotationMode ? <span className="text-blue-600">Cotización</span> : (isReturnMode ? <span className="text-red-500">Devolución / Nota Crédito</span> : 'Orden de Venta')}
                    </h1>
                    <p className="text-xs lg:text-sm text-gray-500">
                        {isQuotationMode ? 'Crear nueva cotización para cliente' : (isReturnMode ? 'Procesar reembolso o cambio' : 'Nueva transacción de venta')}
                    </p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full border border-gray-300 shadow-sm bg-gray-50 scale-90 lg:scale-100">
                        <button
                            onClick={() => switchMode('quotation')}
                            className={`px-2 lg:px-3 py-1 rounded-full text-[10px] lg:text-xs font-bold transition-all ${isQuotationMode ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            COTIZACIÓN
                        </button>
                        <button
                            onClick={() => switchMode('sale')}
                            className={`px-2 lg:px-3 py-1 rounded-full text-[10px] lg:text-xs font-bold transition-all ${(!isQuotationMode && !isReturnMode) ? 'bg-hd-orange text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            VENTA
                        </button>
                        <button
                            onClick={() => switchMode('return')}
                            className={`px-2 lg:px-3 py-1 rounded-full text-[10px] lg:text-xs font-bold transition-all ${isReturnMode ? 'bg-red-600 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            DEVOLUCIÓN
                        </button>
                    </div>
                    <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 lg:space-x-3 w-full lg:w-auto">
                        {/* Import Actions */}
                        {!isReturnMode && !isQuotationMode && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleConvertSaleToReturn}
                                disabled={!lastTransactionId}
                                className={`border-red-600 text-red-600 hover:bg-red-50 ${!lastTransactionId ? 'opacity-50 cursor-not-allowed' : ''} text-xs`}
                                title={!lastTransactionId ? "Guarde la venta primero para convertirla" : "Convertir esta venta en una devolución"}
                            >
                                <ArrowRightLeft className="mr-1 h-3 w-3 lg:h-4 lg:w-4" /> <span className="hidden sm:inline">Convertir a</span> Devolución
                            </Button>
                        )}

                        {isQuotationMode && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleConvertQuoteToSale}
                                disabled={!lastTransactionId}
                                className={`border-green-600 text-green-600 hover:bg-green-50 ${!lastTransactionId ? 'opacity-50 cursor-not-allowed' : ''} text-xs`}
                                title={!lastTransactionId ? "Guarde la cotización primero para facturarla" : "Convertir esta cotización a factura"}
                            >
                                <ArrowUpRight className="mr-1 h-3 w-3 lg:h-4 lg:w-4" /> Facturar <span className="hidden sm:inline">Cotización</span>
                            </Button>
                        )}

                        {isReturnMode && items.length === 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowInvoiceSelector(true)}
                                className="border-red-600 text-red-600 hover:bg-red-50 text-xs"
                                title="Importar una factura para devolución"
                            >
                                <ClipboardList className="mr-1 h-3 w-3 lg:h-4 lg:w-4" /> Importar Factura
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            disabled={!lastTransactionId}
                            className={`border-blue-600 text-blue-600 hover:bg-blue-50 ${!lastTransactionId ? 'opacity-50 cursor-not-allowed' : ''} text-xs`}
                            title={!lastTransactionId ? "Guarde la transacción primero para imprimir" : "Imprimir Documento"}
                        >
                            <Printer className="mr-1 h-3 w-3 lg:h-4 lg:w-4" /> <span className="hidden sm:inline">Imprimir</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate('/ventas/historial')} className="text-xs">
                            <X className="mr-1 h-3 w-3 lg:h-4 lg:w-4" /> <span className="hidden sm:inline">Cancelar</span>
                        </Button>
                        <Button disabled={saving} size="sm" onClick={handleSubmit} className="bg-hd-orange hover:bg-orange-600 text-xs px-2 lg:px-4">
                            {saving ? '...' : <><Save className="mr-1 h-3 w-3 lg:h-4 lg:w-4" /> Guardar</>}
                        </Button>
                    </div>
                </div>
            </div>

            {
                error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
                        <AlertCircle className="mr-2 h-5 w-5" /> {error}
                    </div>
                )
            }

            {
                successMsg && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center">
                        <Save className="mr-2 h-5 w-5" /> {successMsg}
                    </div>
                )
            }

            {/* Main Form Area */}
            <div className="flex flex-col gap-6">

                {/* 1. COMPACT HEADER (ERP Style) */}
                <Card className="mb-4 shadow-sm border-t-4 border-t-hd-orange bg-white">
                    <div className="p-3 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

                        {/* COL 1: CLIENT SELECTION (Span 4) */}
                        <div className="lg:col-span-4 space-y-1">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex justify-between">
                                <span>Cliente</span>
                                {currentClient && (
                                    <span
                                        onClick={openEditClient}
                                        className="text-blue-600 cursor-pointer hover:underline flex items-center gap-1"
                                    >
                                        <Pencil size={10} /> Editar
                                    </span>
                                )}
                            </label>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                                    value={header.clienteId}
                                    onChange={e => {
                                        const cId = e.target.value;
                                        const client = clients.find(c => c.id == cId);
                                        const defaultNCF = client?.tipoNCF || client?.TipoNCF || '';
                                        let newMonedaId = header.monedaId;
                                        if (client?.moneda) {
                                            const foundMoneda = monedas.find(m => m.codigo === client.moneda);
                                            if (foundMoneda) newMonedaId = foundMoneda.id;
                                        }
                                        setHeader(prev => ({ ...prev, clienteId: cId, tipoNCF: defaultNCF || prev.tipoNCF, monedaId: newMonedaId }));
                                        if (newMonedaId != header.monedaId) fetchTasa(newMonedaId);
                                    }}
                                >
                                    <option value="">-- Buscar Cliente --</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Compact Client Info Row */}
                            {currentClient && (
                                <div className="flex gap-3 text-[11px] text-gray-600 pt-1">
                                    <span title="RNC/Cédula" className="font-mono bg-gray-100 px-1 rounded">{currentClient.taxId || 'N/A'}</span>
                                    <span title="Balance Actual" className={`font-semibold ${currentClient.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        Bal: ${currentClient.balance?.toFixed(2)}
                                    </span>
                                    <span className="text-gray-400">|</span>
                                    <span title="Nivel Precio">{currentClient.nivelPrecio}</span>
                                </div>
                            )}
                        </div>

                        {/* COL 2: INVOICING DETAILS (Span 3) */}
                        <div className="lg:col-span-3 grid grid-cols-2 gap-2">
                            <div className="col-span-2">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tipo NCF</label>
                                <select
                                    className={`w-full h-8 rounded border border-gray-300 bg-white px-2 text-xs focus:ring-1 focus:ring-blue-600 ${lockNCF ? 'bg-gray-50 text-gray-500' : ''}`}
                                    value={header.tipoNCF}
                                    onChange={e => setHeader({ ...header, tipoNCF: e.target.value })}
                                    disabled={lockNCF || isQuotationMode}
                                >
                                    <option value="">{isQuotationMode ? '-- No Aplica --' : '-- Seleccionar --'}</option>
                                    {ncfSequences.map(s => <option key={s.id} value={s.tipoNCF}>{s.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Condición</label>
                                <select
                                    className="w-full h-8 rounded border border-gray-300 bg-white px-2 text-xs focus:ring-1 focus:ring-blue-600"
                                    value={header.condicionPago}
                                    onChange={e => setHeader({ ...header, condicionPago: e.target.value })}
                                >
                                    {isReturnMode ? (
                                        <>
                                            <option value="Efectivo">Devolución Efectivo</option>
                                            <option value="NotaCredito">Nota de Crédito</option>
                                            <option value="Cambio">Cambio de Mercancía</option>
                                        </>
                                    ) : (
                                        <>
                                            <option>Contado</option>
                                            <option>Crédito 15 días</option>
                                            <option>Crédito 30 días</option>
                                        </>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Fecha</label>
                                <Input type="date" className="h-8 text-xs px-2" value={header.fecha} onChange={e => setHeader({ ...header, fecha: e.target.value })} />
                            </div>
                        </div>

                        {/* COL 3: WAREHOUSE & CURRENCY (Span 3) */}
                        <div className="lg:col-span-3 grid grid-cols-2 gap-2">
                            <div className="col-span-2">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Almacén</label>
                                <select
                                    className="w-full h-8 rounded border border-gray-300 bg-white px-2 text-xs focus:ring-1 focus:ring-blue-600"
                                    value={header.almacenId}
                                    onChange={e => setHeader({ ...header, almacenId: e.target.value })}
                                >
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Moneda</label>
                                <select
                                    className="w-full h-8 rounded border border-gray-300 bg-white px-2 text-xs focus:ring-1 focus:ring-blue-600"
                                    value={header.monedaId}
                                    onChange={e => {
                                        const mId = e.target.value;
                                        setHeader(prev => ({ ...prev, monedaId: mId }));
                                        fetchTasa(mId);
                                    }}
                                >
                                    <option value="">--</option>
                                    {monedas.map(m => <option key={m.id} value={m.id}>{m.codigo}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tasa</label>
                                <Input
                                    className="h-8 text-xs text-right bg-gray-50"
                                    value={header.tasaCambio}
                                    readOnly
                                />
                            </div>
                        </div>

                        {/* COL 4: META INFO / REFERENCIA (Span 2) */}
                        <div className="lg:col-span-2 space-y-2">
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Referencia</label>
                                <Input
                                    className="h-8 text-xs"
                                    placeholder="Opcional..."
                                    value={header.referencia}
                                    onChange={e => setHeader({ ...header, referencia: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>



                    {/* EXPANDED CLIENT DETAILS ROW */}
                    {currentClient && (
                        <div className="bg-gray-50/80 px-4 py-2 border-t border-gray-100 grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                            <div className="col-span-2">
                                <span className="text-gray-400 font-bold uppercase mr-2">Dirección:</span>
                                <span className="font-medium text-gray-700">{currentClient.address || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-gray-400 font-bold uppercase mr-2">Teléfono:</span>
                                <span className="font-medium text-gray-700">{currentClient.phone || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-gray-400 font-bold uppercase mr-2">Vendedor:</span>
                                <span className="font-medium text-gray-700">{currentClient.vendedorId || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-gray-400 font-bold uppercase mr-2">Límite:</span>
                                <span className="font-medium text-gray-700">${(currentClient.creditLimit || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </Card>

                {/* 2. SECCIÓN CENTRAL: GRID Y BÚSQUEDA */}
                <div className="flex flex-col lg:flex-row gap-6">
                    <Card className="flex-1 shadow-md flex flex-col min-h-[500px]">
                        {/* COMMAND BAR (Dynamics 365 Style) */}
                        <div className="bg-[#f0f0f0] border-b border-[#e1e1e1] flex items-center gap-2 px-2 py-1 h-10">

                            {/* Toolbar Label/Title */}
                            <div className="text-xs font-semibold text-gray-600 px-2 border-r border-gray-300 mr-2">
                                LÍNEAS DE VENTA
                            </div>

                            {/* Search Box */}
                            <div className="relative w-64 md:w-80 group">
                                <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-500 group-focus-within:text-blue-700" />
                                <input
                                    type="text"
                                    placeholder="Escriba para buscar..."
                                    className="w-full h-8 pl-9 pr-2 text-sm bg-white border border-gray-300 focus:border-blue-700 hover:border-gray-500 focus:ring-0 focus:outline-none transition-colors placeholder:text-gray-500"
                                    value={productSearchTerm}
                                    onChange={e => {
                                        setProductSearchTerm(e.target.value);
                                        setShowProductSearch(true);
                                    }}
                                    onFocus={() => setShowProductSearch(true)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            if (!header.clienteId) {
                                                alert("⚠️ Seleccione un cliente para buscar productos.");
                                                return;
                                            }
                                            if (filteredProducts.length > 0) {
                                                handleAddItem(filteredProducts[0]);
                                                setProductSearchTerm('');
                                            } else {
                                                setShowCatalogModal(true);
                                            }
                                        }
                                    }}
                                />
                                {/* Inline Dropdown positioned relative to this input */}
                                {showProductSearch && productSearchTerm && (
                                    <div className="absolute top-8 left-0 w-[500px] bg-white border border-gray-400 shadow-[0_4px_12px_rgba(0,0,0,0.15)] max-h-80 overflow-y-auto z-50 rounded-sm">
                                        {filteredProducts.length === 0 ? (
                                            <div className="p-3 text-center text-gray-500 text-xs cursor-pointer hover:bg-gray-100" onClick={() => setShowCatalogModal(true)}>
                                                Sin resultados. <span className="text-blue-700 font-semibold hover:underline">Abrir Catálogo Avanzado (F4)</span>
                                            </div>
                                        ) : (
                                            filteredProducts.map(prod => (
                                                <div
                                                    key={prod.id}
                                                    className="px-3 py-2 hover:bg-[#EDEBE9] cursor-pointer border-b border-gray-100 grid grid-cols-[1fr,auto] gap-4 items-center group/item transition-colors"
                                                    onClick={() => handleAddItem(prod)}
                                                >
                                                    <div>
                                                        <div className="font-semibold text-gray-800 text-sm group-hover/item:text-black">{prod.descripcion}</div>
                                                        <div className="text-[11px] text-gray-500 font-mono flex gap-2">
                                                            <span className="text-gray-600">{prod.numeroArticulo}</span>
                                                            {prod.codigoBarras && <span className="text-gray-400">| {prod.codigoBarras}</span>}
                                                            <span className="bg-gray-100 text-gray-600 px-1 rounded border border-gray-200">Disp: {prod.stockActual || 0}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-gray-800 text-sm">${(prod.precioVenta || prod.precioUnitario || 0).toFixed(2)}</div>
                                                        <div className="text-[10px] text-gray-400">{prod.unidadMedidaId || 'UND'}</div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>


                            {/* Action Button - D365 Style */}
                            <button
                                onClick={() => {
                                    if (!header.clienteId) {
                                        alert("⚠️ Seleccione un cliente para abrir el catálogo.");
                                        return;
                                    }
                                    setShowCatalogModal(true);
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-white bg-hd-orange hover:bg-orange-600 transition-colors rounded-md shadow-sm"
                                title="Abrir catálogo avanzado de productos"
                            >
                                <Plus className="h-4 w-4 text-white" />
                                <span>Agregar Productos</span>
                            </button>

                            <div className="flex-grow"></div>
                        </div>

                        {/* Hidden Original Container for Reference if needed (Deleted in Replace) */}
                        <div className="hidden">
                            {/* ... */}
                        </div>

                        {/* INLINE DROPDOWN RESULTS (Fast Search) */}





                        <ProductSearchModal
                            isOpen={showCatalogModal}
                            onClose={() => {
                                setShowCatalogModal(false);
                                setReplacingRowId(null);
                            }}
                            onSelect={(product) => {
                                if (replacingRowId) {
                                    handleReplaceItem(replacingRowId, product);
                                } else {
                                    handleAddItem(product);
                                }
                            }}
                            clientContext={{
                                nivelPrecio: currentClient?.nivelPrecio,
                                moneda: monedas.find(m => m.id == header.monedaId)?.codigo || 'DOP'
                            }}
                        />

                        {/* Items count info */}
                        <div className="flex items-center text-sm text-gray-500 ml-auto hidden md:flex px-4 py-2 border-b border-gray-100">
                            <span className="mr-2">Items: <strong>{items.length}</strong></span>
                            <span>Total Qty: <strong>{items.reduce((a, b) => a + b.cantidad, 0)}</strong></span>
                        </div>
                        {/* GRID */}
                        <div className="flex-1 overflow-auto bg-white min-h-[300px]">
                            <Table>
                                <TableHeader className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                                    <TableRow>
                                        <TableHead className="w-[50px] text-center">#</TableHead>
                                        <TableHead className="w-[120px]">Código</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead className="w-[80px]">Unidad</TableHead>
                                        <TableHead className="w-[80px] text-right">Cant.</TableHead>
                                        <TableHead className="w-[100px] text-right">Precio</TableHead>
                                        <TableHead className="w-[80px] text-right">Desc. (%)</TableHead>
                                        <TableHead className="w-[90px] text-right">Desc. ($)</TableHead>
                                        <TableHead className="w-[90px] text-right">Impuesto</TableHead>
                                        <TableHead className="w-[100px] text-right">Total</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item, index) => (
                                        <TableRow key={item.id} className="hover:bg-gray-50 group border-b border-gray-100 last:border-0 transition-colors">
                                            <TableCell className="text-center text-xs text-gray-400 font-normal">{index + 1}</TableCell>
                                            <TableCell className="font-mono text-xs font-semibold text-gray-700 relative">
                                                {item.codigo}
                                                {/* Button next to cell as requested */}
                                                <button
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-hd-orange"
                                                    onClick={() => {
                                                        setReplacingRowId(item.id);
                                                        setShowCatalogModal(true);
                                                    }}
                                                    title="Editar Artículo"
                                                >
                                                    <Search size={14} />
                                                </button>
                                            </TableCell>

                                            <TableCell
                                                className="font-medium text-gray-700 relative"
                                                onMouseEnter={() => enableStockTooltip && setActiveTooltipId(item.articuloId)}
                                                onMouseLeave={() => enableStockTooltip && setActiveTooltipId(null)}
                                            >
                                                {item.descripcion}
                                                {enableStockTooltip && activeTooltipId === item.articuloId && (
                                                    <StockHoverCard articuloId={item.articuloId} warehouses={warehouses} />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    // Logic to determine available units for this row
                                                    const curCurrency = monedas.find(m => m.id == header.monedaId)?.codigo || 'DOP';
                                                    const relevantPrices = (item.availablePrices || []).filter(p =>
                                                        p.activo && (!p.moneda || p.moneda === curCurrency)
                                                    );

                                                    // Extract unique units from the price list
                                                    const unitOptions = [...new Set(relevantPrices.map(p => p.unidadMedida))];

                                                    // Ensure the current unit is always an option (even if not in price list, e.g. base unit)
                                                    if (item.unidad && !unitOptions.includes(item.unidad)) {
                                                        unitOptions.unshift(item.unidad);
                                                    }

                                                    // Use select if we have options, otherwise readonly input
                                                    if (unitOptions.length > 0) {
                                                        return (
                                                            <div className="relative group">
                                                                <select
                                                                    className="w-full bg-transparent border-0 border-b border-gray-100 focus:border-hd-orange focus:ring-0 p-1 h-8 text-xs font-medium text-gray-700"
                                                                    value={item.unidad}
                                                                    onChange={(e) => handleUnitChange(item.id, e.target.value)}
                                                                >
                                                                    {unitOptions.map(u => (
                                                                        <option key={u} value={u}>{u}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            <input
                                                                type="text"
                                                                className="w-full bg-transparent border-0 border-b border-gray-100 focus:border-hd-orange focus:ring-0 p-1 h-8 text-xs font-medium text-gray-600 uppercase"
                                                                value={item.unidad || defaultUnit}
                                                                readOnly
                                                            />
                                                        );
                                                    }
                                                })()}
                                            </TableCell>

                                            {/* Tooltip Injection via Description Cell or Code Cell? Code cell has button. Description cell is cleaner. */}
                                            {/* Wait, the table cell structure is: #, Code, Desc, Unit, Qty...
                                                Let's attach onMouseEnter to the row or specific cell. 
                                                User said "PASE EL MOUSE PUEDA VER EL INVENTARIO". 
                                                Let's put it on Description Cell.
                                            */}

                                            < TableCell >
                                                <input
                                                    id={`qty-${item.id}`} // Auto-focus target
                                                    type="number"
                                                    className="w-full text-right bg-gray-50 border-0 border-b border-transparent focus:border-hd-orange focus:ring-0 focus:bg-white p-1 h-8 rounded text-sm font-bold"
                                                    value={item.cantidad}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        handleUpdateItem(item.id, { cantidad: isNaN(val) ? 0 : val });
                                                    }}
                                                    min="1"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            // Trigger blur or open catalog
                                                            e.target.blur();
                                                            // Optional: Open catalog for next item
                                                            // setShowCatalogModal(true); 
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <input
                                                    type="number"
                                                    className="w-full text-right bg-transparent border-0 border-b border-gray-100 focus:border-hd-orange focus:ring-0 p-1 h-8 text-sm text-gray-600"
                                                    value={item.precio}
                                                    onChange={(e) => handleUpdateItem(item.id, { precio: e.target.value })}
                                                    onBlur={(e) => handleUpdateItem(item.id, { precio: parseFloat(e.target.value) || 0 })}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <input
                                                    type="number"
                                                    className="w-full text-right bg-transparent border-0 border-b border-gray-100 focus:border-hd-orange focus:ring-0 p-1 h-8 text-sm text-gray-600"
                                                    value={item.descuentoPorcentaje || ''}
                                                    placeholder="0%"
                                                    onChange={(e) => {
                                                        const pct = e.target.value;
                                                        // Calc amount
                                                        const qty = parseFloat(item.cantidad) || 0;
                                                        const price = parseFloat(item.precio) || 0;
                                                        const total = qty * price;
                                                        const amount = total * ((parseFloat(pct) || 0) / 100);

                                                        handleUpdateItem(item.id, {
                                                            descuentoPorcentaje: pct,
                                                            descuento: amount.toFixed(2) // Sync amount
                                                        });
                                                    }}
                                                    onBlur={(e) => {
                                                        // Validate percent 0-100
                                                        let pct = parseFloat(e.target.value) || 0;
                                                        if (pct > 100) pct = 100;
                                                        if (pct < 0) pct = 0;

                                                        const qty = parseFloat(item.cantidad) || 0;
                                                        const price = parseFloat(item.precio) || 0;
                                                        const total = qty * price;
                                                        const amount = total * (pct / 100);

                                                        handleUpdateItem(item.id, {
                                                            descuentoPorcentaje: pct, // Clean number
                                                            descuento: amount // Clean amount
                                                        });
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <input
                                                    type="number"
                                                    className="w-full text-right bg-transparent border-0 border-b border-gray-100 focus:border-hd-orange focus:ring-0 p-1 h-8 text-sm text-gray-600"
                                                    value={item.descuento || ''}
                                                    placeholder="0.00"
                                                    onChange={(e) => {
                                                        const val = e.target.value;

                                                        // Calc percent
                                                        const amount = parseFloat(val) || 0;
                                                        const qty = parseFloat(item.cantidad) || 0;
                                                        const price = parseFloat(item.precio) || 0;
                                                        const total = qty * price;
                                                        let pct = 0;
                                                        if (total > 0) {
                                                            pct = (amount / total) * 100;
                                                        }

                                                        handleUpdateItem(item.id, {
                                                            descuento: val,
                                                            descuentoPorcentaje: pct.toFixed(2) // Sync percent
                                                        });
                                                    }}
                                                    onBlur={(e) => {
                                                        let val = parseFloat(e.target.value) || 0;
                                                        const lineTotal = item.cantidad * item.precio;
                                                        if (val > lineTotal) {
                                                            alert("El descuento no puede ser mayor al monto de la línea.");
                                                            val = 0;
                                                        }
                                                        // Re-calc percent cleanly on blur
                                                        let pct = 0;
                                                        if (lineTotal > 0) pct = (val / lineTotal) * 100;

                                                        handleUpdateItem(item.id, {
                                                            descuento: val,
                                                            descuentoPorcentaje: pct // Clean percent
                                                        });
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-gray-500">
                                                ${(((item.cantidad * item.precio) - (item.descuento || 0)) * (item.taxRate || 0)).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-gray-900 bg-gray-50/50">
                                                ${(((item.cantidad * item.precio) - (item.descuento || 0)) * (1 + (item.taxRate || 0))).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="text-gray-300 hover:text-red-500 transition-colors p-2"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {items.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-20">
                                                <div className="flex flex-col items-center opacity-30">
                                                    <div className="bg-gray-100 p-4 rounded-full mb-3">
                                                        <Plus className="h-8 w-8 text-gray-400" />
                                                    </div>
                                                    <div className="text-lg font-medium text-gray-600">Lista Vacia</div>
                                                    <div className="text-sm text-gray-500">Use la barra de búsqueda para agregar productos</div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Totals Footer */}
                        <div className="bg-gray-900 text-white p-6 rounded-b-lg">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="text-sm text-gray-400 space-y-1">
                                    <p>Usuario: Admin</p>
                                    <p>Terminal: POS-01</p>
                                </div>

                                <div className="flex gap-8 items-end">
                                    <div className="text-right">
                                        <div className="text-gray-400 text-xs uppercase mb-1">Subtotal</div>
                                        <div className="text-xl font-medium">${totals.rawSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </div>

                                    {/* Global Discount Inputs */}
                                    <div className="text-right flex flex-col items-end">
                                        <div className="text-gray-400 text-xs uppercase mb-1">Desc. General</div>
                                        <div className="flex gap-2 w-48">
                                            <div className="relative w-1/2">
                                                <input
                                                    type="number"
                                                    className="w-full bg-gray-800 border border-gray-700 rounded text-right p-1 text-sm text-white focus:border-hd-orange focus:outline-none"
                                                    placeholder="%"
                                                    value={header.descuentoGlobalPorcentaje || ''}
                                                    onChange={(e) => {
                                                        const pct = parseFloat(e.target.value) || 0;
                                                        const amount = totals.rawSubtotal * (pct / 100);
                                                        setHeader(prev => ({
                                                            ...prev,
                                                            descuentoGlobalPorcentaje: e.target.value,
                                                            descuentoGlobalMonto: amount.toFixed(2)
                                                        }));
                                                    }}
                                                />
                                                <span className="absolute left-1 top-1 text-xs text-gray-500">%</span>
                                            </div>
                                            <div className="relative w-1/2">
                                                <input
                                                    type="number"
                                                    className="w-full bg-gray-800 border border-gray-700 rounded text-right p-1 text-sm text-white focus:border-hd-orange focus:outline-none"
                                                    placeholder="$"
                                                    value={header.descuentoGlobalMonto || ''}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value) || 0;
                                                        let pct = 0;
                                                        if (totals.rawSubtotal > 0) pct = (val / totals.rawSubtotal) * 100;
                                                        setHeader(prev => ({
                                                            ...prev,
                                                            descuentoGlobalMonto: e.target.value,
                                                            descuentoGlobalPorcentaje: pct.toFixed(2)
                                                        }));
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-gray-400 text-xs uppercase mb-1">Impuestos</div>
                                        <div className="text-xl font-medium">${totals.impuestos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </div>
                                    <div className="text-right pl-8 border-l border-gray-700">
                                        <div className={`text-sm uppercase font-bold mb-1 ${isReturnMode ? 'text-red-500' : 'text-hd-orange'}`}>
                                            {isReturnMode ? 'Total a Devolver' : 'Total General'}
                                        </div>
                                        <div className="text-4xl font-bold tracking-tight">${totals.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Applied Promotions Tags */}
                            {appliedPromotions.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-800 flex flex-wrap gap-2">
                                    <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1 w-full mb-1">
                                        <Gift size={12} className="text-hd-orange" /> Promociones Aplicadas:
                                    </span>
                                    {appliedPromotions.map((name, i) => (
                                        <div key={i} className="bg-hd-orange/10 border border-hd-orange/30 text-hd-orange px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 animate-in fade-in zoom-in duration-300">
                                            {name}
                                        </div>
                                    ))}
                                    <div className="ml-auto text-hd-orange text-xs font-bold">
                                        Ahorro total: -${autoDiscountTotal.toFixed(2)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div >

            </div >

            {/* Quick Edit Client Modal */}
            < Dialog open={isEditClientOpen} onOpenChange={setIsEditClientOpen} >
                <DialogContent className="sm:max-w-fit">
                    <DialogHeader>
                        <DialogTitle>Editar Datos del Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 px-2">
                        <div className="grid grid-cols-[100px_auto] items-center gap-4">
                            <label htmlFor="taxId" className="text-right text-sm font-bold text-gray-700">RNC/Cédula</label>
                            <Input
                                id="taxId"
                                value={editingClient.taxId}
                                onChange={(e) => setEditingClient({ ...editingClient, taxId: e.target.value })}
                                className="h-9 w-[300px]"
                            />
                        </div>
                        <div className="grid grid-cols-[100px_auto] items-center gap-4">
                            <label htmlFor="address" className="text-right text-sm font-bold text-gray-700">Dirección</label>
                            <Input
                                id="address"
                                value={editingClient.address}
                                onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                                className="h-9 w-[300px]"
                            />
                        </div>
                        <div className="grid grid-cols-[100px_auto] items-center gap-4">
                            <label htmlFor="phone" className="text-right text-sm font-bold text-gray-700">Teléfono</label>
                            <Input
                                id="phone"
                                value={editingClient.phone}
                                onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                                className="h-9 w-[300px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditClientOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveClientEdit} className="bg-hd-orange hover:bg-orange-600 font-bold">Guardar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modals */}
            {/* Modals */}
            {showCatalogModal && (
                <ProductSearchModal
                    isOpen={showCatalogModal}
                    onClose={() => setShowCatalogModal(false)}
                    onSelect={(product) => {
                        if (replacingRowId) {
                            handleReplaceItem(replacingRowId, product);
                        } else {
                            handleAddItem(product);
                        }
                        setShowCatalogModal(false);
                    }}
                />
            )}

            {showInvoiceSelector && (
                <InvoiceSelector
                    isOpen={showInvoiceSelector}
                    onClose={() => setShowInvoiceSelector(false)}
                    onSelect={(invoice) => {
                        handleImportInvoice(invoice);
                        setShowInvoiceSelector(false);
                    }}
                />
            )}

            {showQuotationSelector && (
                <QuotationSelector
                    isOpen={showQuotationSelector}
                    onClose={() => setShowQuotationSelector(false)}
                    onSelect={(quotation) => {
                        handleImportQuotation(quotation);
                        setShowQuotationSelector(false);
                    }}
                />
            )}

            {/* Return Method Selection Modal */}
            <Dialog open={showReturnMethodModal} onOpenChange={setShowReturnMethodModal}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl font-bold">Seleccione Método de Devolución</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-6 py-4">
                        <div className="flex flex-col gap-4">
                            <Button
                                onClick={() => handleConfirmReturnConversion('Inventario')}
                                onMouseEnter={() => setHoveredReturnMethod('Inventario')}
                                onMouseLeave={() => setHoveredReturnMethod(null)}
                                className="bg-slate-800 hover:bg-slate-700 text-white h-16 text-lg font-semibold shadow-md justify-start px-6"
                            >
                                <Box className="mr-3 h-6 w-6" /> Solo Devolución (Inv)
                            </Button>
                            <Button
                                onClick={() => handleConfirmReturnConversion('Efectivo')}
                                onMouseEnter={() => setHoveredReturnMethod('Efectivo')}
                                onMouseLeave={() => setHoveredReturnMethod(null)}
                                className="bg-red-600 hover:bg-red-700 text-white h-16 text-lg font-semibold shadow-md justify-start px-6"
                            >
                                <Banknote className="mr-3 h-6 w-6" /> Reembolso (Efectivo)
                            </Button>
                            <Button
                                onClick={() => handleConfirmReturnConversion('NotaCredito')}
                                onMouseEnter={() => setHoveredReturnMethod('NotaCredito')}
                                onMouseLeave={() => setHoveredReturnMethod(null)}
                                className="bg-green-600 hover:bg-green-700 text-white h-16 text-lg font-semibold shadow-md justify-start px-6"
                            >
                                <FileText className="mr-3 h-6 w-6" /> Cambio (Nota Crédito)
                            </Button>
                        </div>

                        {/* Description Panel */}
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 flex flex-col justify-center items-center text-center">
                            {!hoveredReturnMethod && (
                                <p className="text-gray-400 italic">Pase el mouse sobre una opción para ver detalles.</p>
                            )}
                            {hoveredReturnMethod === 'Inventario' && (
                                <div className="space-y-3 animate-in fade-in zoom-in duration-200">
                                    <Box className="h-12 w-12 text-slate-800 mx-auto" />
                                    <h3 className="font-bold text-lg text-slate-800">Solo Devolución</h3>
                                    <ul className="text-sm text-gray-600 space-y-2 text-left bg-white p-4 rounded shadow-sm">
                                        <li>📦 <b>Inventario:</b> Aumenta (regresa el producto).</li>
                                        <li>👤 <b>Cliente:</b> No afecta su saldo (movimiento interno).</li>
                                        <li>📝 ideal para correcciones de inventario.</li>
                                    </ul>
                                </div>
                            )}
                            {hoveredReturnMethod === 'Efectivo' && (
                                <div className="space-y-3 animate-in fade-in zoom-in duration-200">
                                    <Banknote className="h-12 w-12 text-red-600 mx-auto" />
                                    <h3 className="font-bold text-lg text-red-600">Reembolso Efectivo</h3>
                                    <ul className="text-sm text-gray-600 space-y-2 text-left bg-white p-4 rounded shadow-sm">
                                        <li>📦 <b>Inventario:</b> Aumenta.</li>
                                        <li>💰 <b>Caja:</b> Sale dinero inmediatamente.</li>
                                        <li>👤 <b>Cliente:</b> No afecta su saldo (se liquidó la deuda).</li>
                                    </ul>
                                </div>
                            )}
                            {hoveredReturnMethod === 'NotaCredito' && (
                                <div className="space-y-3 animate-in fade-in zoom-in duration-200">
                                    <FileText className="h-12 w-12 text-green-600 mx-auto" />
                                    <h3 className="font-bold text-lg text-green-600">Nota de Crédito</h3>
                                    <ul className="text-sm text-gray-600 space-y-2 text-left bg-white p-4 rounded shadow-sm">
                                        <li>📦 <b>Inventario:</b> Aumenta.</li>
                                        <li>👤 <b>Cliente:</b> <span className="text-green-600 font-bold">Disminuye su deuda</span> o crea saldo a favor.</li>
                                        <li>🔄 Úselo para cambios futuros.</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default VentasDistribucion;

