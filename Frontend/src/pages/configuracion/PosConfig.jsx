import React, { useState, useEffect } from 'react';
import { Save, Monitor } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

import { getAlmacenes } from '../../api/almacenes';
import { getNivelesPrecio } from '../../api/nivelesPrecio';
// Migrated to generalized Sequences API
import { updateReciboConfig } from '../../api/recibos'; // Still used for legacy or we can remove if fully migrated

const API_BASE = ((import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') ? import.meta.env.VITE_API_URL : '/api');

import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';

const PosConfig = () => {
    const [config, setConfig] = useState({
        showStockBreakdown: true,
        enableBeep: true,
        defaultWarehouseId: null,
        filterByCurrency: false,
        filterByPriceLevel: false,
        selectedPriceLevel: '',

        // Distribution Config (New)
        distributionDefaultUnit: 'UND',
        distributionUseSeparateSequence: false,
        enableStockTooltip: true
    });

    // Main Sales Sequence
    const [salesSequence, setSalesSequence] = useState({
        id: 0,
        code: 'SALES_INVOICE',
        prefix: 'FACT-',
        currentValue: 0,
        length: 6
    });

    // Distribution Sequence (Optional)
    const [distSequence, setDistSequence] = useState({
        id: 0,
        code: 'DIST_INVOICE',
        prefix: 'DIST-',
        currentValue: 0,
        length: 6
    });

    const [companyConfig, setCompanyConfig] = useState({
        defaultClientId: null
    });

    const [warehouses, setWarehouses] = useState([]);
    const [clients, setClients] = useState([]);
    const [priceLevels, setPriceLevels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load saved config, warehouses and sequences
    useEffect(() => {
        // Load saved POS config from localStorage
        const saved = localStorage.getItem('pos_config');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setConfig(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error('Failed to parse saved POS config', e);
            }
        }

        // Load warehouses
        const fetchWarehouses = async () => {
            try {
                const data = await getAlmacenes();
                setWarehouses(data);
                setError(null);
                // Set first warehouse as default if none selected yet
                if (!config.defaultWarehouseId && data.length > 0) {
                    const firstId = data[0].id ?? data[0].Id;
                    setConfig(prev => ({ ...prev, defaultWarehouseId: firstId }));
                }
            } catch (e) {
                console.error(e);
                setError(e.message);
            }
        };

        // Load clients
        const fetchClients = async () => {
            try {
                const res = await fetch(`${API_BASE}/Clients`);
                if (res.ok) {
                    const data = await res.json();
                    setClients(Array.isArray(data) ? data : (data.value || []));
                }
            } catch (e) {
                console.error("Error fetching clients:", e);
            }
        };

        // Load Price Levels
        const fetchPriceLevels = async () => {
            try {
                const levels = await getNivelesPrecio();
                setPriceLevels(levels);
            } catch (e) {
                console.error("Error fetching price levels:", e);
            }
        };

        // Load Sequences
        const fetchSequences = async () => {
            try {
                const res = await fetch(`${API_BASE}/Sequences`);
                if (res.ok) {
                    const data = await res.json();

                    const mainSeq = data.find(s => s.code === 'SALES_INVOICE');
                    if (mainSeq) setSalesSequence(mainSeq);

                    const dSeq = data.find(s => s.code === 'DIST_INVOICE');
                    if (dSeq) setDistSequence(dSeq);
                }
            } catch (e) {
                console.error('Error fetching sequences:', e);
            }
        };

        // Load Company Config
        const fetchCompanyConfig = async () => {
            try {
                const res = await fetch(`${API_BASE}/CompanyConfiguration`);
                if (res.ok) {
                    const data = await res.json();
                    setCompanyConfig(data || {});
                }
            } catch (e) {
                console.error("Error fetching company config:", e);
            }
        };

        fetchWarehouses();
        fetchClients();
        fetchPriceLevels();
        fetchSequences();
        fetchCompanyConfig();
    }, []);

    const updateConfig = (key, value) => {
        setConfig(prev => {
            const newConfig = { ...prev, [key]: value };
            localStorage.setItem('pos_config', JSON.stringify(newConfig));
            window.dispatchEvent(new Event('pos_config_changed'));
            return newConfig;
        });
    };

    const handleSaveReciboConfig = async () => {
        setLoading(true);
        try {
            // Save Sales Sequence
            if (salesSequence.id) {
                await fetch(`${API_BASE}/Sequences/${salesSequence.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(salesSequence)
                });
            }

            // Save Dist Sequence if separate
            if (config.distributionUseSeparateSequence && distSequence.id) {
                await fetch(`${API_BASE}/Sequences/${distSequence.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(distSequence)
                });
            } else if (config.distributionUseSeparateSequence && !distSequence.id) {
                // Create if it doesn't exist (Optional logic, for now we assume it might fail if backend doesn't support auto-create)
                // Or we just don't save it if it has no ID.
            }

            // Save Company Config (Default Client)
            const res = await fetch(`${API_BASE}/CompanyConfiguration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(companyConfig)
            });

            if (res.ok) {
                alert('Configuración guardada correctamente');
            } else {
                throw new Error('Error al guardar configuración de empresa');
            }
        } catch (error) {
            console.error(error);
            alert('Error al guardar cambios');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Configuración de POS</h1>
                <p className="text-sm text-gray-500">Personalice el comportamiento y la visualización del terminal de punto de venta.</p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="distribucion">Ventas Distribución</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                    {/* Default Warehouse & Client Selection */}
                    <Card className="shadow-lg border-none overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                            <CardTitle className="flex items-center gap-2">
                                <Monitor className="h-5 w-5 text-hd-orange" />
                                Interfaz de Venta
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Almacén Predeterminado</label>
                                    <select
                                        value={config.defaultWarehouseId ?? ''}
                                        onChange={e => updateConfig('defaultWarehouseId', parseInt(e.target.value) || null)}
                                        className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-hd-orange focus:border-hd-orange p-2.5"
                                    >
                                        <option value="">-- Seleccione --</option>
                                        {warehouses.map((w, i) => (
                                            <option key={w.id || w.Id || i} value={w.id || w.Id}>
                                                {w.nombre || w.Nombre}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500">Se selecciona al abrir el POS.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Cliente Predeterminado</label>
                                    <select
                                        value={companyConfig.defaultClientId ?? ''}
                                        onChange={e => setCompanyConfig(prev => ({ ...prev, defaultClientId: parseInt(e.target.value) || null }))}
                                        className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-hd-orange focus:border-hd-orange p-2.5"
                                    >
                                        <option value="">-- Seleccione (Por defecto: Consumidor Final) --</option>
                                        {clients.map((c, i) => (
                                            <option key={c.id || c.Id || i} value={c.id || c.Id}>
                                                {c.name || c.Name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500">Se carga automáticamente en la venta.</p>
                                </div>
                            </div>

                            {/* [NEW] Inventory Control */}
                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-medium text-gray-900 text-sm">Permitir Venta sin Stock</h3>
                                        <p className="text-xs text-gray-500">Permitir facturar artículos con inventario cero o negativo.</p>
                                    </div>
                                    <button
                                        onClick={() => setCompanyConfig(prev => ({ ...prev, allowNegativeStock: !prev.allowNegativeStock }))}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-hd-orange focus:ring-offset-2 ${companyConfig.allowNegativeStock ? 'bg-hd-orange' : 'bg-gray-200'}`}
                                    >
                                        <span className={`${companyConfig.allowNegativeStock ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
                                    </button>
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-medium text-gray-900 text-sm">Desglose de Stock</h3>
                                        <p className="text-xs text-gray-500">Ver existencia por almacén al pasar el mouse.</p>
                                    </div>
                                    <button
                                        onClick={() => updateConfig('showStockBreakdown', !config.showStockBreakdown)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-hd-orange focus:ring-offset-2 ${config.showStockBreakdown ? 'bg-hd-orange' : 'bg-gray-200'}`}
                                    >
                                        <span
                                            className={`${config.showStockBreakdown ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-medium text-gray-900 text-sm">Sonido (Beep)</h3>
                                        <p className="text-xs text-gray-500">Reproduce sonido al escanear.</p>
                                    </div>
                                    <button
                                        onClick={() => updateConfig('enableBeep', !config.enableBeep)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-hd-orange focus:ring-offset-2 ${config.enableBeep !== false ? 'bg-hd-orange' : 'bg-gray-200'}`}
                                    >
                                        <span
                                            className={`${config.enableBeep !== false ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-medium text-gray-900 text-sm">Filtrar por Moneda del Cliente</h3>
                                        <p className="text-xs text-gray-500">Ocultar artículos que no tengan precio en la moneda del cliente.</p>
                                    </div>
                                    <button
                                        onClick={() => updateConfig('filterByCurrency', !config.filterByCurrency)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-hd-orange focus:ring-offset-2 ${config.filterByCurrency ? 'bg-hd-orange' : 'bg-gray-200'}`}
                                    >
                                        <span
                                            className={`${config.filterByCurrency ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`}
                                        />
                                    </button>
                                </div>

                                {/* Price Level Filter */}
                                <div className="flex items-center justify-between col-span-1 md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                                    <div className="flex flex-col gap-2 w-full">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="space-y-1">
                                                <h3 className="font-medium text-gray-900 text-sm">Filtrar por Nivel de Precio</h3>
                                                <p className="text-xs text-gray-500">Solo mostrar artículos que tengan precio definido en el nivel seleccionado.</p>
                                            </div>
                                            <button
                                                onClick={() => updateConfig('filterByPriceLevel', !config.filterByPriceLevel)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-hd-orange focus:ring-offset-2 ${config.filterByPriceLevel ? 'bg-hd-orange' : 'bg-gray-200'}`}
                                            >
                                                <span
                                                    className={`${config.filterByPriceLevel ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`}
                                                />
                                            </button>
                                        </div>
                                        {config.filterByPriceLevel && (
                                            <div className="mt-2 animate-in slide-in-from-top-2 duration-300">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Nivel de Precio requerido</label>
                                                <select
                                                    value={config.selectedPriceLevel || ''}
                                                    onChange={(e) => updateConfig('selectedPriceLevel', e.target.value)}
                                                    className="w-full md:w-1/2 bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-hd-orange focus:border-hd-orange p-2.5"
                                                >
                                                    <option value="">-- Seleccione Nivel --</option>
                                                    {priceLevels.map((lvl, index) => (
                                                        <option key={index} value={lvl.nombre || lvl.Nombre}>
                                                            {lvl.nombre || lvl.Nombre}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sales Sequence Configuration */}
                    <Card className="shadow-lg border-none overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                            <CardTitle className="flex items-center gap-2">
                                <Save className="h-5 w-5 text-blue-600" />
                                Secuencia de Ventas (Facturas)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prefijo</label>
                                    <input
                                        type="text"
                                        value={salesSequence.prefix || ''}
                                        onChange={e => setSalesSequence({ ...salesSequence, prefix: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ej: FACT-"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Secuencia Actual</label>
                                    <input
                                        type="number"
                                        value={salesSequence.currentValue}
                                        onChange={e => setSalesSequence({ ...salesSequence, currentValue: parseInt(e.target.value) })}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Siguiente: {salesSequence.prefix}{String(salesSequence.currentValue + 1).padStart(salesSequence.length, '0')}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ceros a la Izquierda</label>
                                    <input
                                        type="number"
                                        value={salesSequence.length}
                                        onChange={e => setSalesSequence({ ...salesSequence, length: parseInt(e.target.value) })}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                                        min="1"
                                        max="20"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-end pt-4">
                                <Button onClick={handleSaveReciboConfig} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                                    {loading ? 'Guardando...' : 'Guardar Configuración'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="distribucion">
                    <Card className="shadow-lg border-none overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                            <CardTitle className="flex items-center gap-2">
                                <Monitor className="h-5 w-5 text-purple-600" />
                                Configuración de Distribución
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">

                            {/* [NEW] Inventory Control (Mirrored) */}
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-medium text-yellow-900 text-sm">Control de Inventario (Global)</h3>
                                        <p className="text-xs text-yellow-700">Permitir facturar artículos con inventario cero o negativo.</p>
                                    </div>
                                    <button
                                        onClick={() => setCompanyConfig(prev => ({ ...prev, allowNegativeStock: !prev.allowNegativeStock }))}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${companyConfig.allowNegativeStock ? 'bg-yellow-500' : 'bg-gray-200'}`}
                                    >
                                        <span className={`${companyConfig.allowNegativeStock ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
                                    </button>
                                </div>
                            </div>

                            {/* [NEW] Stock Tooltip Toggle */}
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-medium text-blue-900 text-sm">Tooltip de Inventario</h3>
                                        <p className="text-xs text-blue-700">Mostrar desglose de stock por almacén al pasar el mouse sobre un producto.</p>
                                    </div>
                                    <button
                                        onClick={() => updateConfig('enableStockTooltip', !config.enableStockTooltip)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${config.enableStockTooltip ? 'bg-blue-600' : 'bg-gray-200'}`}
                                    >
                                        <span className={`${config.enableStockTooltip ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
                                    </button>
                                </div>
                            </div>

                            {/* Default Unit */}
                            <div className="space-y-2 max-w-md">
                                <label className="text-sm font-medium text-gray-700">Unidad Predeterminada</label>
                                <input
                                    type="text"
                                    value={config.distributionDefaultUnit || 'UND'}
                                    onChange={e => updateConfig('distributionDefaultUnit', e.target.value)}
                                    className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-600 focus:border-purple-600 p-2.5"
                                    placeholder="Ej: UND, CAJA, LBS"
                                />
                                <p className="text-xs text-gray-500">Unidad por defecto al agregar productos si no tienen una definida.</p>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Sequence Strategy */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-gray-900 text-sm">Secuencia de Numeración</h3>
                                <div className="flex flex-col gap-3">
                                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="seqStrategy"
                                            checked={!config.distributionUseSeparateSequence}
                                            onChange={() => updateConfig('distributionUseSeparateSequence', false)}
                                            className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                                        />
                                        <div>
                                            <span className="block text-sm font-medium text-gray-900">Usar la misma secuencia de Ventas</span>
                                            <span className="block text-xs text-gray-500">Las facturas de distribución seguirán el consecutivo general ({salesSequence.prefix}...).</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="seqStrategy"
                                            checked={config.distributionUseSeparateSequence}
                                            onChange={() => updateConfig('distributionUseSeparateSequence', true)}
                                            className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                                        />
                                        <div>
                                            <span className="block text-sm font-medium text-gray-900">Usar secuencia independiente</span>
                                            <span className="block text-xs text-gray-500">Crear una numeración separada para el módulo de distribución.</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Conditional Sequence Config */}
                            {config.distributionUseSeparateSequence && (
                                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100 animate-in fade-in slide-in-from-top-2">
                                    <h4 className="text-sm font-bold text-purple-800 mb-3">Configurar Secuencia de Distribución</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-purple-700 mb-1">Prefijo</label>
                                            <input
                                                type="text"
                                                value={distSequence.prefix || ''}
                                                onChange={e => setDistSequence({ ...distSequence, prefix: e.target.value })}
                                                className="w-full bg-white border border-purple-200 rounded p-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-purple-700 mb-1">Actual</label>
                                            <input
                                                type="number"
                                                value={distSequence.currentValue}
                                                onChange={e => setDistSequence({ ...distSequence, currentValue: parseInt(e.target.value) })}
                                                className="w-full bg-white border border-purple-200 rounded p-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-purple-700 mb-1">Longitud</label>
                                            <input
                                                type="number"
                                                value={distSequence.length}
                                                onChange={e => setDistSequence({ ...distSequence, length: parseInt(e.target.value) })}
                                                className="w-full bg-white border border-purple-200 rounded p-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-purple-600 mt-2">
                                        Ejemplo de próxima factura: <strong>{distSequence.prefix}{String(distSequence.currentValue + 1).padStart(distSequence.length, '0')}</strong>
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center justify-end pt-4">
                                <Button onClick={handleSaveReciboConfig} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                            </div>

                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PosConfig;


