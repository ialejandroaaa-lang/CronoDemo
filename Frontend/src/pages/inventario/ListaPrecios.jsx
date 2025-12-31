
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Save, Trash2, Printer, Copy, AlertTriangle, Calculator, X, ArrowLeft, ArrowUp, ArrowDown, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import ProductSearchModal from '../../components/ProductSearchModal';
import { getPrecios, savePrecios, copyPrecios, getReportePrecios } from '../../api/precios';


import { getNavigationList, getArticulo } from '../../api/articulos';

import { getPlanes } from '../../api/unidadMedida';
import { getNivelesPrecio, saveNivelPrecio } from '../../api/nivelesPrecio';
import { QuickAddModal, QuickAddButton } from '../../components/ui/QuickAddModal';

const ListaPrecios = () => {
    const navigate = useNavigate();

    // Estado del artículo seleccionado
    const [articulo, setArticulo] = useState(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [isMarginModalOpen, setIsMarginModalOpen] = useState(false);
    const [massMargin, setMassMargin] = useState('');
    const [massTargetLevel, setMassTargetLevel] = useState('all');

    // Niveles de precio state
    const [nivelesPrecio, setNivelesPrecio] = useState([]);
    const [loading, setLoading] = useState(false);
    const [decimalesMoneda, setDecimalesMoneda] = useState(2);



    const [unidadesMedida, setUnidadesMedida] = useState(['UND']);
    const [nivelesDisponibles, setNivelesDisponibles] = useState([]);

    // Navigation State
    const [navList, setNavList] = useState([]);
    const [currentNavIndex, setCurrentNavIndex] = useState(-1);

    // Quick Add Modal State
    const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);

    // Load Data

    useEffect(() => {
        loadUom();
        loadNiveles();
        loadNavigation();
    }, []);

    const loadNavigation = async () => {
        try {
            const list = await getNavigationList();
            setNavList(list || []);
        } catch (e) { console.error(e); }
    };

    const loadUom = async () => {
        try {
            const planes = await getPlanes();
            const set = new Set(['UND']);
            planes.forEach(p => {
                set.add(p.unidadBase);
                if (p.detalles) p.detalles.forEach(d => set.add(d.unidadMedida));
            });
            setUnidadesMedida(Array.from(set));
        } catch (e) { console.error(e); }
    };

    const loadNiveles = async () => {
        try {
            const niveles = await getNivelesPrecio();
            setNivelesDisponibles(niveles);
        } catch (e) { console.error(e); }
    };

    const handleSaveNuevoNivel = async (formData) => {
        try {
            const nuevo = await saveNivelPrecio({
                nombre: formData.nombre,
                descripcion: formData.descripcion
            });
            await loadNiveles(); // Reload list
            alert("Nivel de precio creado exitosamente.");
        } catch (error) {
            console.error(error);
            alert("Error al crear nivel de precio");
        }
    };

    // Load Prices when Article Changes
    useEffect(() => {
        if (articulo?.id) {
            loadPrecios(articulo.id);
        }
    }, [articulo]);

    const loadPrecios = async (id) => {
        setLoading(true);
        try {
            const data = await getPrecios(id);
            // Si hay datos, cargar; si no, crear defaults
            if (data && data.length > 0) {
                setNivelesPrecio(data);
            } else {
                setNivelesPrecio([]);
            }
        } catch (error) {
            console.error("Error loading prices:", error);
            alert("Error al cargar lista de precios");
        } finally {
            setLoading(false);
        }
    };

    const getDefaultPrices = (art) => {
        // Generate some default levels based on request or standard logic
        return [
            { id: 1, nivelPrecio: 'Precio al Detalle', unidadMedida: art?.unidadMedida || 'UND', cantidadInicial: 0, porcentaje: 0, precio: art?.precioUnitario || 0, moneda: 'USD', activo: true },
            { id: 2, nivelPrecio: 'Precio al Mayoreo', unidadMedida: art?.unidadMedida || 'UND', cantidadInicial: 10, porcentaje: 0, precio: 0, moneda: 'USD', activo: true },
            { id: 3, nivelPrecio: 'Precio Distribuidor', unidadMedida: art?.unidadMedida || 'UND', cantidadInicial: 50, porcentaje: 0, precio: 0, moneda: 'USD', activo: true },
        ];
    };

    const handleSave = async () => {
        if (!articulo) return;
        try {
            // Sanitize payload: Set Id to 0 for all items to avoid int overflow from Date.now()
            // Backend does a full replace, so Id is not needed for matching
            const payload = nivelesPrecio.map(n => ({
                ...n,
                id: 0
            }));

            await savePrecios(articulo.id, payload);
            const headerMsg = document.getElementById('header-message');
            if (headerMsg) {
                headerMsg.innerHTML = '<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded flex items-center gap-2">Precios guardados correctamente</div>';
                setTimeout(() => headerMsg.innerHTML = '', 3000);
            }
        } catch (error) {
            console.error(error);
            alert("Error al guardar precios");
        }
    };


    const handleCopy = async (targetArticle) => {
        // ... (existing code) ...
        if (!articulo || !targetArticle) return;
        try {
            await copyPrecios(articulo.id, targetArticle.id);
            setIsCopyModalOpen(false);
            const headerMsg = document.getElementById('header-message');
            if (headerMsg) {
                headerMsg.innerHTML = `<div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded flex items-center gap-2">Precios copiados exitosamente a ${targetArticle.descripcion}</div>`;
                setTimeout(() => headerMsg.innerHTML = '', 4000);
            }
        } catch (error) {
            console.error(error);
            alert("Error al copiar precios");
        }
    };

    // Navigation Logic
    useEffect(() => {
        if (articulo && navList.length > 0) {
            const idx = navList.findIndex(x => x.id === articulo.id || x.Id === articulo.id);
            setCurrentNavIndex(idx);
        }
    }, [articulo, navList]);

    const navigateTo = (index) => {
        if (index < 0 || index >= navList.length) return;
        const item = navList[index];
        // Set article via existing setArticulo which triggers loadPrecios
        // We might only have limited info in item, but setArticulo state structure depends on what Search returns.
        // Search usually returns full object. NavList likely has subset.
        // But `loadPrecios` only needs ID. `getDefaultPrices` uses `unidadMedida` and `precioUnitario`.
        // Nav list needs those fields if not full.
        // `ArticuloDto` in NavList: { Id, Descripcion, NumeroArticulo }. 
        // Missing: UnidadMedida, PrecioUnitario.
        // Solution: We should fetch full article or robustly default. 
        // Better: Fetch full article data when navigating.
        // Wait, `loadPrecios` loads PRECIOS. It doesn't load the article itself.
        // We need `getArticulo(id)` to update the `articulo` state fully.
        // Let's add that.
        loadFullArticle(item.id || item.Id);
    };

    const loadFullArticle = async (id) => {
        try {
            const fullArt = await getArticulo(id);
            if (fullArt) {
                setArticulo(fullArt);
            }
        } catch (e) { console.error("Nav Error", e); }
    };

    const handleAgregarNivel = () => {
        const nuevoNivel = {
            id: Date.now(), // Temp ID
            nivelPrecio: '',
            unidadMedida: articulo?.unidadMedida || 'UND',
            cantidadInicial: 0,
            porcentaje: 0.00,
            precio: 0.00,
            moneda: 'USD',
            activo: true
        };
        setNivelesPrecio([...nivelesPrecio, nuevoNivel]);
    };

    const handleEliminarNivel = (index) => {
        const nuevos = [...nivelesPrecio];
        nuevos.splice(index, 1);
        setNivelesPrecio(nuevos);
    };

    const handleActualizarNivel = (index, campo, valor) => {
        const nuevos = [...nivelesPrecio];
        nuevos[index] = { ...nuevos[index], [campo]: valor };

        const nivel = nuevos[index];
        const costo = parseFloat(articulo.costoUnitario) || parseFloat(articulo.costoEstandar) || 0;
        const cantidad = parseFloat(nivel.cantidadInicial) || 1; // Default to 1 if 0/empty to avoid zero price

        // Auto-calculate Price if Margin OR Quantity changes
        if ((campo === 'porcentaje' || campo === 'cantidadInicial') && articulo) {
            const porcentaje = parseFloat(nivel.porcentaje) || 0;
            // Formula: Cost * Qty * (1 + Margin%)
            const nuevoPrecio = (costo * cantidad) * (1 + porcentaje / 100);
            nuevos[index].precio = parseFloat(nuevoPrecio.toFixed(2));
        }

        // Auto-calculate Margin if Price changes
        if (campo === 'precio' && articulo) {
            const precio = parseFloat(valor) || 0;
            const totalCosto = costo * cantidad;

            if (totalCosto > 0) {
                const nuevoPorcentaje = ((precio / totalCosto) - 1) * 100;
                nuevos[index].porcentaje = parseFloat(nuevoPorcentaje.toFixed(2));
            } else if (precio > 0) {
                nuevos[index].porcentaje = 100;
            }
        }

        setNivelesPrecio(nuevos);
    };

    const handleMassMarginApply = () => {
        if (!massMargin || isNaN(parseFloat(massMargin))) {
            alert("Por favor ingrese un margen válido.");
            return;
        }
        if (!articulo) return;

        const costo = parseFloat(articulo.costoUnitario) || parseFloat(articulo.costoEstandar) || 0;
        const marginPct = parseFloat(massMargin);

        const newLevels = nivelesPrecio.map(nivel => {
            // Check if we should update this level
            if (massTargetLevel !== 'all' && nivel.nivelPrecio !== massTargetLevel) {
                return nivel;
            }

            const cantidad = parseFloat(nivel.cantidadInicial) || 1;

            // Calculate new price: Cost * Qty * (1 + Margin%)
            const newPrice = (costo * cantidad) * (1 + marginPct / 100);

            return {
                ...nivel,
                porcentaje: marginPct,
                precio: parseFloat(newPrice.toFixed(2))
            };
        });

        setNivelesPrecio(newLevels);
        setIsMarginModalOpen(false);
        setMassMargin('');
    };

    const handleMoveRow = (index, direction) => {
        const newLevels = [...nivelesPrecio];
        if (direction === 'up' && index > 0) {
            [newLevels[index], newLevels[index - 1]] = [newLevels[index - 1], newLevels[index]];
        } else if (direction === 'down' && index < newLevels.length - 1) {
            [newLevels[index], newLevels[index + 1]] = [newLevels[index + 1], newLevels[index]];
        }
        setNivelesPrecio(newLevels);
    };

    const handlePrintReport = async () => {
        try {
            const data = await getReportePrecios();

            // Group data by Article
            const grouped = {};
            data.forEach(item => {
                const key = item.numeroArticulo;
                if (!grouped[key]) {
                    grouped[key] = {
                        info: item,
                        precios: []
                    };
                }
                if (item.nivelPrecio) {
                    grouped[key].precios.push(item);
                }
            });

            // Build HTML
            let html = `
    < html >
                <head>
                    <title>Reporte de Listas de Precios</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; font-size: 12px; }
                        h1 { text-align: center; color: #333; margin-bottom: 20px; }
                        .article-card { border: 1px solid #ccc; margin-bottom: 15px; page-break-inside: avoid; border-radius: 4px; overflow: hidden; }
                        .article-header { background: #f0f0f0; padding: 8px; font-weight: bold; display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; }
                        .article-details { padding: 8px; font-size: 11px; color: #555; background: #fafafa; border-bottom: 1px solid #eee; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
                        table { width: 100%; border-collapse: collapse; font-size: 11px; }
                        th, td { padding: 6px; text-align: left; border-bottom: 1px solid #eee; }
                        th { background: #fff; border-bottom: 2px solid #ddd; font-weight: 600; }
                        .price-row:nth-child(even) { background-color: #f9f9f9; }
                        @media print {
                            body { -webkit-print-color-adjust: exact; }
                            .article-header { background: #e0e0e0 !important; }
                        }
                    </style>
                </head>
                <body>
                    <h1>Listado General de Precios</h1>
            `;

            for (const key in grouped) {
                const art = grouped[key];
                html += `
                    <div class="article-card">
                        <div class="article-header">
                            <span>${art.info.numeroArticulo} - ${art.info.descripcion}</span>
                            <span>UND: ${art.info.unidadMedida}</span>
                        </div>
                        <div class="article-details">
                            <div><strong>Costo Estándar:</strong> ${art.info.costoEstandar?.toFixed(2)}</div>
                            <div><strong>Costo Último:</strong> ${art.info.costoUnitario?.toFixed(2)}</div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Nivel de Precio</th>
                                    <th>Unidad</th>
                                    <th>Precio</th>
                                    <th>Moneda</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                if (art.precios.length > 0) {
                    art.precios.forEach(p => {
                        html += `
                            <tr class="price-row">
                                <td>${p.nivelPrecio}</td>
                                <td>${p.unidadPrecio}</td>
                                <td><strong>${p.precio?.toFixed(2)}</strong></td>
                                <td>${p.moneda}</td>
                            </tr>
                        `;
                    });
                } else {
                    html += `<tr><td colspan="4" style="text-align:center; color: #999; font-style: italic;">Sin precios configurados</td></tr>`;
                }

                html += `</tbody></table></div>`;
            }

            html += `</body></html > `;

            const win = window.open('', '_blank');
            win.document.write(html);
            win.document.close();
            win.print();

        } catch (error) {
            console.error(error);
            alert("Error al generar el reporte");
        }
    };

    const handlePrintCurrentArticle = () => {
        if (!articulo) return;

        try {
            let html = `
                <html>
                <head>
                    <title>Reporte de Artículo - ${articulo.descripcion}</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; font-size: 14px; }
                        h1 { text-align: center; color: #333; margin-bottom: 5px; }
                        h3 { text-align: center; color: #666; margin-top: 0; margin-bottom: 25px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #f9f9f9; }
                        .info-item { margin-bottom: 5px; }
                        .label { font-weight: bold; color: #555; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; }
                        th { background: #f0f0f0; border-bottom: 2px solid #ccc; font-weight: bold; }
                        .price-val { font-weight: bold; font-family: monospace; font-size: 1.1em; }
                    </style>
                </head>
                <body>
                    <h1>${articulo.descripcion}</h1>
                    <h3>${articulo.numeroArticulo}</h3>

                    <div class="info-grid">
                        <div class="col">
                            <div class="info-item"><span class="label">Unidad Base:</span> ${articulo.unidadMedida}</div>
                            <div class="info-item"><span class="label">Categoría:</span> ${articulo.categoria || '-'}</div>
                            <div class="info-item"><span class="label">Marca:</span> ${articulo.marca || '-'}</div>
                        </div>
                        <div class="col">
                            <div class="info-item"><span class="label">Costo Estándar:</span> $${Number(articulo.costoEstandar || 0).toFixed(2)}</div>
                            <div class="info-item"><span class="label">Costo Actual:</span> $${Number(articulo.costoUnitario || 0).toFixed(2)}</div>
                        </div>
                    </div>

                    <h2>Niveles de Precio</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Nivel</th>
                                <th>Unidad</th>
                                <th>Cant. Inicial</th>
                                <th>Margen %</th>
                                <th>Precio Final</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            if (nivelesPrecio.length > 0) {
                nivelesPrecio.forEach(p => {
                    if (!p.activo) return;
                    html += `
                        <tr>
                            <td>${p.nivelPrecio}</td>
                            <td>${p.unidadMedida}</td>
                            <td>${p.cantidadInicial}</td>
                            <td>${p.porcentaje}%</td>
                            <td class="price-val">${p.precio?.toFixed(2)} <small>${p.moneda}</small></td>
                        </tr>
                    `;
                });
            } else {
                html += `<tr><td colspan="5" style="text-align:center; padding: 20px; color: #999;">Sin precios configurados</td></tr>`;
            }

            html += `</tbody></table></body></html>`;

            const win = window.open('', '_blank');
            win.document.write(html);
            win.document.close();
            win.print();

        } catch (error) {
            console.error(error);
            alert("Error al imprimir artículo");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
            {/* In-Page Alert Message */}
            <div id="header-message"></div>

            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/productos')} className="hover:bg-gray-100 rounded-full h-10 w-10">
                            <ArrowLeft className="h-6 w-6 text-gray-600" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Lista de Precios</h1>
                            <p className="text-sm text-gray-500">Gestione y configure los niveles de precios por artículo</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handlePrintReport}
                            className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm"
                        >
                            <span className="flex items-center gap-2">
                                <Printer className="h-4 w-4" />
                                <span>Reporte Global</span>
                            </span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handlePrintCurrentArticle}
                            disabled={!articulo}
                            className="bg-white hover:bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                        >
                            <span className="flex items-center gap-2">
                                <Printer className="h-4 w-4" />
                                <span>Imprimir Artículo</span>
                            </span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => setIsCopyModalOpen(true)}
                            disabled={!articulo}
                            className="bg-white hover:bg-orange-50 text-gray-700 border-gray-200 hover:border-orange-200 hover:text-orange-600 transition-all duration-200 shadow-sm"
                        >
                            <span className="flex items-center gap-2">
                                <Save className="h-4 w-4" />
                                <span>Copiar a...</span>
                            </span>
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!articulo}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 px-6"
                        >
                            <span className="flex items-center gap-2 font-medium">
                                <Save className="h-5 w-5" />
                                <span>Guardar Cambios</span>
                            </span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Información del Artículo</h2>

                    {/* Navigation Bar */}
                    <div className="flex items-center gap-2 bg-white rounded-md border border-gray-200 p-1 shadow-sm">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateTo(0)} disabled={currentNavIndex <= 0} title="Primero">
                            <ChevronFirst size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateTo(currentNavIndex - 1)} disabled={currentNavIndex <= 0} title="Anterior">
                            <ChevronLeft size={16} />
                        </Button>

                        <div className="px-3 py-0.5 bg-gray-50 rounded border border-gray-100 text-xs font-bold min-w-[80px] text-center text-gray-600">
                            {navList.length > 0 && currentNavIndex >= 0 ?
                                `${currentNavIndex + 1} / ${navList.length}` :
                                '0 / 0'}
                        </div>

                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateTo(currentNavIndex + 1)} disabled={currentNavIndex >= navList.length - 1} title="Siguiente">
                            <ChevronRight size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateTo(navList.length - 1)} disabled={currentNavIndex >= navList.length - 1} title="Último">
                            <ChevronLast size={16} />
                        </Button>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-5">
                        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1.5">Artículo Seleccionado</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            value={articulo?.numeroArticulo || ''}
                                            className="bg-white border-blue-200 text-black placeholder:text-gray-500 font-bold h-11"
                                            readOnly
                                            placeholder="Busque un artículo..."
                                        />
                                        {!articulo && (
                                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                                <span className="text-xs text-blue-400 italic">Requerido</span>
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        onClick={() => setIsSearchOpen(true)}
                                        className="h-11 w-11 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                                    >
                                        <Search className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                                    <Input value={articulo?.descripcion || ''} className="bg-transparent border-0 border-b border-blue-200 rounded-none px-0 h-8 font-medium text-gray-900 focus:ring-0" readOnly />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Método de Precio</label>
                                    <div className="h-8 flex items-center text-sm font-medium text-gray-700 border-b border-blue-200">
                                        Monto Monetario
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="grid grid-cols-3 gap-6 pt-2">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-center">
                            <label className="block text-xs font-medium text-gray-500 mb-2">Unidad Base</label>
                            <div className="text-lg font-bold text-gray-900">{articulo?.unidadMedida || '-'}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-center">
                            <label className="block text-xs font-medium text-gray-500 mb-2">Costo Estándar</label>
                            <div className="text-lg font-mono text-gray-600">{Number(articulo?.costoEstandar || 0).toFixed(2)}</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-8 h-8 bg-orange-100 rounded-bl-full"></div>
                            <label className="block text-xs font-bold text-orange-800 mb-2">Costo Actual</label>
                            <div className="text-xl font-mono font-bold text-orange-600">{Number(articulo?.costoUnitario || 0).toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Price Grid Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px] flex flex-col">
                <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        Niveles de Precio
                    </h3>

                    <div className="flex items-center gap-4 bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center px-3 border-r border-gray-200">
                            <span className="text-xs font-medium text-gray-500 mr-3">Decimales</span>
                            <input
                                type="number"
                                value={decimalesMoneda}
                                onChange={(e) => setDecimalesMoneda(parseInt(e.target.value))}
                                className="w-12 text-center text-sm font-bold text-gray-900 border-0 focus:ring-0 p-0"
                            />
                        </div>
                        <div className="flex gap-2 p-1">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsMarginModalOpen(true)}
                                disabled={!articulo || nivelesPrecio.length === 0}
                                className="h-8 px-3 text-purple-600 border-purple-200 hover:bg-purple-50"
                                title="Aplicar Margen Masivo"
                            >
                                <Calculator className="h-4 w-4 mr-1.5" />
                                <span className="text-xs">Aplicar Margen</span>
                            </Button>
                            {nivelesPrecio.length === 0 && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setNivelesPrecio(getDefaultPrices(articulo))}
                                    disabled={!articulo}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium h-8"
                                >
                                    <Plus className="h-4 w-4 mr-1.5" />
                                    Cargar Sugerencias
                                </Button>
                            )}
                            <Button
                                size="sm"
                                onClick={handleAgregarNivel}
                                disabled={!articulo}
                                className="bg-gray-900 text-white hover:bg-black h-8 px-4"
                            >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Agregar Nivel
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto flex-1 p-0">
                    <Table className="w-full">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="border-b border-gray-200">
                                <TableHead className="w-16 text-center py-4 font-semibold text-gray-600">Activo</TableHead>
                                <TableHead className="py-4 font-semibold text-gray-600 pl-4">Nivel de Precio</TableHead>
                                <TableHead className="w-32 py-4 font-semibold text-gray-600">Unidad</TableHead>
                                <TableHead className="w-32 text-center py-4 font-semibold text-gray-600">Cant. Inicial</TableHead>
                                <TableHead className="w-32 text-center py-4 font-semibold text-gray-600">Margen %</TableHead>
                                <TableHead className="w-40 text-right py-4 font-semibold text-gray-600 pr-6">Precio Final</TableHead>
                                <TableHead className="w-24 text-center py-4 font-semibold text-gray-600">Moneda</TableHead>
                                <TableHead className="w-16"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {articulo ? (
                                nivelesPrecio.map((nivel, index) => (
                                    <TableRow key={index} className="group hover:bg-orange-50/30 transition-colors border-b border-gray-100 last:border-0">
                                        <TableCell className="text-center py-3">
                                            <div className="flex justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={nivel.activo}
                                                    onChange={(e) => handleActualizarNivel(index, 'activo', e.target.checked)}
                                                    className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-2">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={nivel.nivelPrecio}
                                                    onChange={(e) => handleActualizarNivel(index, 'nivelPrecio', e.target.value)}
                                                    className="w-full bg-transparent border-0 font-medium text-gray-900 focus:ring-0 cursor-pointer hover:bg-gray-100/50 rounded px-2 py-1.5 transition-colors"
                                                >
                                                    <option value="">Seleccionar Nivel...</option>
                                                    {nivelesDisponibles.map(n => (
                                                        <option key={n.id} value={n.nombre}>{n.nombre}</option>
                                                    ))}
                                                </select>
                                                <QuickAddButton onClick={() => setIsLevelModalOpen(true)} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-2">
                                            <select
                                                value={nivel.unidadMedida}
                                                onChange={(e) => handleActualizarNivel(index, 'unidadMedida', e.target.value)}
                                                className="w-full text-sm bg-gray-50 border-0 rounded-md text-gray-600 focus:ring-0 py-1.5 cursor-pointer"
                                            >
                                                {unidadesMedida.map(u => (
                                                    <option key={u} value={u}>{u}</option>
                                                ))}
                                            </select>
                                        </TableCell>
                                        <TableCell className="p-2">
                                            <Input
                                                type="number"
                                                value={nivel.cantidadInicial}
                                                onChange={(e) => handleActualizarNivel(index, 'cantidadInicial', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                className="text-center border-0 bg-transparent hover:bg-gray-100/50 focus:bg-white focus:ring-1 focus:ring-orange-200 rounded font-mono text-sm"
                                            />
                                        </TableCell>
                                        <TableCell className="p-2">
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={nivel.porcentaje}
                                                    onChange={(e) => handleActualizarNivel(index, 'porcentaje', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                    className="text-center border-0 bg-transparent hover:bg-gray-100/50 focus:bg-white focus:ring-1 focus:ring-orange-200 rounded font-mono text-sm pr-6"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-2">
                                            <Input
                                                type="number"
                                                value={nivel.precio}
                                                onChange={(e) => handleActualizarNivel(index, 'precio', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                className="text-right border border-transparent bg-orange-50/50 text-orange-700 font-bold shadow-sm rounded focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-100 text-base"
                                            />
                                        </TableCell>
                                        <TableCell className="p-2 text-center">
                                            <select
                                                value={nivel.moneda}
                                                onChange={(e) => handleActualizarNivel(index, 'moneda', e.target.value)}
                                                className="text-xs font-bold text-gray-700 bg-gray-100 border-0 rounded px-1 py-1 cursor-pointer focus:ring-2 focus:ring-orange-200"
                                            >
                                                <option value="DOP">DOP</option>
                                                <option value="USD">USD</option>
                                            </select>
                                        </TableCell>
                                        <TableCell className="text-center p-2">
                                            <div className="flex items-center justify-center gap-1 opacity-100 group-hover:opacity-100 transition-opacity">
                                                <div className="flex flex-col gap-0.5 mr-2">
                                                    <button
                                                        onClick={() => handleMoveRow(index, 'up')}
                                                        disabled={index === 0}
                                                        className="text-gray-400 hover:text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-gray-100 rounded"
                                                    >
                                                        <ArrowUp className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleMoveRow(index, 'down')}
                                                        disabled={index === nivelesPrecio.length - 1}
                                                        className="text-gray-400 hover:text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-gray-100 rounded"
                                                    >
                                                        <ArrowDown className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                <button
                                                    className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    onClick={() => handleEliminarNivel(index)}
                                                    title="Eliminar fila"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                <Search className="h-8 w-8 text-gray-300" />
                                            </div>
                                            <p className="text-lg font-medium text-gray-600">No hay artículo seleccionado</p>
                                            <p className="text-sm text-gray-400 mt-1">Utilice el buscador para cargar un producto y ver sus precios</p>
                                            <Button
                                                variant="outline"
                                                className="mt-6 border-orange-200 text-orange-600 hover:bg-orange-50"
                                                onClick={() => setIsSearchOpen(true)}
                                            >
                                                Buscar Artículo Ahora
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <ProductSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSelect={(prod) => {
                    setArticulo(prod);
                    setIsSearchOpen(false);
                }}
            />

            <ProductSearchModal
                isOpen={isCopyModalOpen}
                onClose={() => setIsCopyModalOpen(false)}
                onSelect={handleCopy}
            />

            <QuickAddModal
                isOpen={isLevelModalOpen}
                onClose={() => setIsLevelModalOpen(false)}
                onSave={handleSaveNuevoNivel}
                title="Nuevo Nivel de Precio"
                fields={[
                    { name: 'nombre', label: 'Nombre del Nivel', placeholder: 'Ej. Mayorista' },
                    { name: 'descripcion', label: 'Descripción', placeholder: 'Descripción opcional' }
                ]}
            />

            {/* Mass Margin Modal */}
            {isMarginModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2">
                                <Calculator size={20} />
                                Aplicar Margen
                            </h3>
                            <button onClick={() => setIsMarginModalOpen(false)} className="text-white/80 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Margen de Ganancia (%)</label>
                                <Input
                                    type="number"
                                    autoFocus
                                    placeholder="Ej: 30"
                                    value={massMargin}
                                    onChange={(e) => setMassMargin(e.target.value)}
                                    className="text-lg font-bold text-center"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Aplicar a</label>
                                <select
                                    className="w-full h-10 rounded-md border-gray-300 bg-gray-50 text-sm focus:ring-purple-500 focus:border-purple-500"
                                    value={massTargetLevel}
                                    onChange={(e) => setMassTargetLevel(e.target.value)}
                                >
                                    <option value="all">Todo (Todos los Niveles)</option>
                                    {[...new Set(nivelesPrecio.map(n => n.nivelPrecio))].filter(Boolean).map((nivel, i) => (
                                        <option key={i} value={nivel}>{nivel}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-2 flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => setIsMarginModalOpen(false)}>Cancelar</Button>
                                <Button onClick={handleMassMarginApply} className="bg-purple-600 hover:bg-purple-700 text-white">
                                    Aplicar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaPrecios;

