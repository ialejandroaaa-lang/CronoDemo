import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { QuickAddModal, QuickAddButton } from '../../components/ui/QuickAddModal';
import { getSecuencias, generarNumeroArticulo, getConfig } from '../../api/articuloConfig';
import { saveArticulo, getArticulo, updateArticulo, getPrecios, uploadProductImage } from '../../api/articulos';
import { getPlanes } from '../../api/unidadMedida';
import { getCategorias, saveCategoria, getMarcas, saveMarca, getTipos, saveTipo } from '../../api/categorias';
import { getAlmacenes, saveAlmacen } from '../../api/almacenes';

import { getGruposImpuestos, saveGrupoImpuesto } from '../../api/gruposImpuestos';
import { getNivelesPrecio, saveNivelPrecio } from '../../api/nivelesPrecio';
import { getGruposProducto, saveGrupoProducto } from '../../api/gruposProducto';
import AttributeModal from '../../components/inventario/AttributeModal';
import AlmacenModal from '../../components/inventario/AlmacenModal';
import GrupoImpuestoModal from '../../components/inventario/GrupoImpuestoModal';
import GrupoProductoModal from '../../components/inventario/GrupoProductoModal';

const ProductoForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    // Estados para campos del formulario
    const [descripcion, setDescripcion] = useState('');
    const [codigoBarras, setCodigoBarras] = useState('');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
    const [unidadSeleccionada, setUnidadSeleccionada] = useState('UND');
    const [marcaSeleccionada, setMarcaSeleccionada] = useState('');
    const [tipoSeleccionado, setTipoSeleccionado] = useState('');

    const [ubicacion, setUbicacion] = useState('');

    const [margen, setMargen] = useState('');
    const [costoUnitario, setCostoUnitario] = useState('');
    const [precioUnitario, setPrecioUnitario] = useState('');
    const [nivelPrecio, setNivelPrecio] = useState('');
    const [stockSeguridad, setStockSeguridad] = useState('');
    const [puntoPedido, setPuntoPedido] = useState('');
    const [proveedor, setProveedor] = useState('');

    // Cost States
    const [metodoCosteo, setMetodoCosteo] = useState('Promedio');
    const [costoEstandar, setCostoEstandar] = useState('');
    const [costoDisplay, setCostoDisplay] = useState('');

    // UoM Plans State
    const [planesUoM, setPlanesUoM] = useState([]);
    const [planSeleccionado, setPlanSeleccionado] = useState('');
    const [unidadMedidaBase, setUnidadMedidaBase] = useState('');
    const [listaPrecios, setListaPrecios] = useState([]);
    const [imagenUrl, setImagenUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    // Estado para Materiales
    const [materiales, setMateriales] = useState([
        { id: 1, codigo: 'MAT-001', descripcion: 'Cemento Portland Tipo I, 42.5 kg', cantidad: 8.5, unidad: 'SACO', desperdicio: 3, precio: 285 },
        { id: 2, codigo: 'MAT-002', descripcion: 'Arena gruesa lavada, puesto en obra', cantidad: 0.52, unidad: 'M3', desperdicio: 5, precio: 450 },
        { id: 3, codigo: 'MAT-003', descripcion: 'Grava triturada 3/4", puesto en obra', cantidad: 0.73, unidad: 'M3', desperdicio: 5, precio: 520 },
    ]);
    // ... (rest of existing code)

    const handleSave = async () => {
        if (!numeroArticulo || !descripcion) {
            alert('Por favor complete los campos obligatorios (Número de Artículo, Descripción)');
            return;
        }

        const articuloData = {
            NumeroArticulo: numeroArticulo,
            CodigoBarras: codigoBarras,
            Descripcion: descripcion,
            GrupoProducto: grupoSeleccionado,
            Categoria: categoriaSeleccionada,
            Marca: marcaSeleccionada,
            Tipo: tipoSeleccionado,
            UnidadMedida: unidadSeleccionada,
            AlmacenPrincipal: selectedAlmacen,
            UbicacionAlmacen: ubicacion,
            GrupoImpuesto: impuestoSeleccionado,
            MargenPorcentaje: parseFloat(margen) || 0,
            CostoUnitario: parseFloat(costoUnitario) || 0,
            PrecioUnitario: parseFloat(precioUnitario) || 0,
            NivelPrecio: nivelPrecio,
            StockSeguridad: parseFloat(stockSeguridad) || 0,
            PuntoPedido: parseFloat(puntoPedido) || 0,
            ProveedorPrincipal: proveedor,
            Bloqueado: false,
            // New Fields
            MetodoCosteo: metodoCosteo,
            CostoEstandar: parseFloat(costoEstandar) || 0,
            PlanMedida: planSeleccionado,
            ImagenUrl: imagenUrl,
        };

        try {
            if (isEditMode) {
                await updateArticulo(parseInt(id), { ...articuloData, Id: parseInt(id) });
                // Mensaje de éxito en header
                const headerMsg = document.getElementById('header-message');
                if (headerMsg) {
                    headerMsg.innerHTML = '<div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Artículo actualizado correctamente</div>';
                    setTimeout(() => headerMsg.innerHTML = '', 3000);
                }
            } else {
                await saveArticulo(articuloData);
                // Mensaje de éxito en header
                const headerMsg = document.getElementById('header-message');
                if (headerMsg) {
                    headerMsg.innerHTML = '<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Artículo guardado correctamente</div>';
                    setTimeout(() => headerMsg.innerHTML = '', 3000);
                }
            }

        } catch (error) {
            console.error('Error saving Article:', error);
            alert('Error al guardar el artículo: ' + error.message);
        }
    };


    // Estado para Equipos
    const [equipos, setEquipos] = useState([
        { id: 1, codigo: 'EQ-101', descripcion: 'Mezcladora de concreto 9 p3 (7HP)', cantidad: 1, unidad: 'HM', rendimiento: 0.25, costoHora: 185 },
        { id: 2, codigo: 'EQ-102', descripcion: 'Vibrador de concreto 4HP gasolina', cantidad: 1, unidad: 'HM', rendimiento: 0.2, costoHora: 95 },
    ]);

    // Estado para Mano de Obra
    const [manoObra, setManoObra] = useState([
        { id: 1, codigo: 'MO-201', descripcion: 'Oficial albañil especializado', cantidad: 1, unidad: 'HH', salario: 225 },
        { id: 2, codigo: 'MO-202', descripcion: 'Operario (fierrero)', cantidad: 0.5, unidad: 'HH', salario: 195 },
        { id: 3, codigo: 'MO-203', descripcion: 'Peón / Ayudante general', cantidad: 2, unidad: 'HH', salario: 165 },
    ]);

    // Porcentajes configurables
    const [porcentajes, setPorcentajes] = useState({
        cargasSociales: 85,
        seguros: 12,
        herramientas: 8,
        financiamiento: 3,
        imprevistos: 5,
        utilidad: 15
    });

    // Costos indirectos
    const [indirectosCampo, setIndirectosCampo] = useState([
        { concepto: 'Supervisión técnica', monto: 285 },
        { concepto: 'Personal administrativo obra', monto: 165 },
        { concepto: 'Instalaciones temporales', monto: 125 },
        { concepto: 'Servicios (agua, luz temporal)', monto: 95 },
        { concepto: 'Seguridad y vigilancia', monto: 85 },
    ]);

    const [indirectosOficina, setIndirectosOficina] = useState([
        { concepto: 'Dirección y gerencia', monto: 425 },
        { concepto: 'Contabilidad y finanzas', monto: 195 },
        { concepto: 'Alquiler oficina central', monto: 285 },
        { concepto: 'Servicios básicos oficina', monto: 125 },
        { concepto: 'Depreciación equipos', monto: 95 },
    ]);

    // Cálculos automáticos
    const calcularTotalMaterial = (item) => {
        const subtotal = item.cantidad * item.precio;
        const conDesperdicio = subtotal * (1 + item.desperdicio / 100);
        return conDesperdicio;
    };

    const totalMateriales = materiales.reduce((sum, item) => sum + calcularTotalMaterial(item), 0);

    const calcularTotalEquipo = (item) => {
        return item.cantidad * item.rendimiento * item.costoHora;
    };

    const totalEquipos = equipos.reduce((sum, item) => sum + calcularTotalEquipo(item), 0);

    const subtotalSalarios = manoObra.reduce((sum, item) => sum + (item.cantidad * item.salario), 0);
    const cargasSociales = subtotalSalarios * (porcentajes.cargasSociales / 100);
    const segurosLaborales = subtotalSalarios * (porcentajes.seguros / 100);
    const herramientasEPP = subtotalSalarios * (porcentajes.herramientas / 100);
    const totalManoObra = subtotalSalarios + cargasSociales + segurosLaborales + herramientasEPP;

    const totalCostosDirectos = totalMateriales + totalEquipos + totalManoObra;

    const totalIndirectosCampo = indirectosCampo.reduce((sum, item) => sum + item.monto, 0);
    const totalIndirectosOficina = indirectosOficina.reduce((sum, item) => sum + item.monto, 0);
    const totalCostosIndirectos = totalIndirectosCampo + totalIndirectosOficina;

    const costoTotal = totalCostosDirectos + totalCostosIndirectos;
    const financiamiento = costoTotal * (porcentajes.financiamiento / 100);
    const imprevistos = costoTotal * (porcentajes.imprevistos / 100);
    const subtotalConCargos = costoTotal + financiamiento + imprevistos;
    const utilidad = subtotalConCargos * (porcentajes.utilidad / 100);
    const precioUnitarioFinal = subtotalConCargos + utilidad;

    // Funciones para agregar/eliminar items
    const agregarMaterial = () => {
        const newId = Math.max(...materiales.map(m => m.id), 0) + 1;
        setMateriales([...materiales, {
            id: newId,
            codigo: `MAT-${String(newId).padStart(3, '0')}`,
            descripcion: '',
            cantidad: 0,
            unidad: 'UND',
            desperdicio: 0,
            precio: 0
        }]);
    };

    const eliminarMaterial = (id) => {
        setMateriales(materiales.filter(m => m.id !== id));
    };

    const actualizarMaterial = (id, campo, valor) => {
        setMateriales(materiales.map(m =>
            m.id === id ? { ...m, [campo]: valor } : m
        ));
    };

    const agregarEquipo = () => {
        const newId = Math.max(...equipos.map(e => e.id), 0) + 1;
        setEquipos([...equipos, {
            id: newId,
            codigo: `EQ-${String(newId).padStart(3, '0')}`,
            descripcion: '',
            cantidad: 0,
            unidad: 'HM',
            rendimiento: 0,
            costoHora: 0
        }]);
    };

    const eliminarEquipo = (id) => {
        setEquipos(equipos.filter(e => e.id !== id));
    };

    const actualizarEquipo = (id, campo, valor) => {
        setEquipos(equipos.map(e =>
            e.id === id ? { ...e, [campo]: valor } : e
        ));
    };

    const agregarManoObra = () => {
        const newId = Math.max(...manoObra.map(m => m.id), 0) + 1;
        setManoObra([...manoObra, {
            id: newId,
            codigo: `MO-${String(newId).padStart(3, '0')}`,
            descripcion: '',
            cantidad: 0,
            unidad: 'HH',
            salario: 0
        }]);
    };

    const eliminarManoObra = (id) => {
        setManoObra(manoObra.filter(m => m.id !== id));
    };

    const actualizarManoObra = (id, campo, valor) => {
        setManoObra(manoObra.map(m =>
            m.id === id ? { ...m, [campo]: valor } : m
        ));
    };

    // Estado para modales de quick-add
    const [modalCategoria, setModalCategoria] = useState(false);
    const [modalUnidad, setModalUnidad] = useState(false);
    const [modalAlmacen, setModalAlmacen] = useState(false);
    const [modalImpuesto, setModalImpuesto] = useState(false);
    const [modalMarca, setModalMarca] = useState(false);
    const [modalTipo, setModalTipo] = useState(false);
    const [modalGrupoProducto, setModalGrupoProducto] = useState(false);
    const [modalNivelPrecio, setModalNivelPrecio] = useState(false);

    // Estado para secciones colapsables
    const [facturacionExpanded, setFacturacionExpanded] = useState(true);
    const [reposicionExpanded, setReposicionExpanded] = useState(true);

    // Listas de catálogos
    // Listas de catálogos
    const [categorias, setCategorias] = useState([]);

    const [gruposImpuestos, setGruposImpuestos] = useState([]);
    const [impuestoSeleccionado, setImpuestoSeleccionado] = useState('');

    const [marcas, setMarcas] = useState([]);

    const [tipos, setTipos] = useState([]);

    const [almacenes, setAlmacenes] = useState([]);
    const [selectedAlmacen, setSelectedAlmacen] = useState('');

    const [gruposProducto, setGruposProducto] = useState(['Sin Grupo']);


    // Attribute Modals State


    // Estado para número de artículo y secuencias
    const [numeroArticulo, setNumeroArticulo] = useState('');
    const [grupoSeleccionado, setGrupoSeleccionado] = useState('Sin Grupo');
    const [secuenciasConfig, setSecuenciasConfig] = useState([]);

    // Cargar secuencias de configuración al montar el componente
    useEffect(() => {
        const loadAllData = async () => {
            try {
                // 1. Load UoM Plans
                const planes = await getPlanes();
                setPlanesUoM(planes);

                // Load Attributes
                const [cats, brands, types, warehouses, taxes, prices, groups] = await Promise.all([
                    getCategorias(),
                    getMarcas(),
                    getTipos(),
                    getAlmacenes(),
                    getGruposImpuestos(),
                    getNivelesPrecio(),
                    getGruposProducto()
                ]);
                setCategorias(cats);
                setMarcas(brands);
                setTipos(types);
                setAlmacenes(warehouses);
                setGruposImpuestos(taxes);
                setNivelesPrecio(prices.map(p => p.nombre));

                // Load and merge product groups
                const gruposData = groups || [];
                const gruposNombres = gruposData.map(g => g.nombre);
                if (!gruposNombres.includes('Sin Grupo')) gruposNombres.unshift('Sin Grupo');
                setGruposProducto(gruposNombres);


                // 2. Load Configuration for Defaults
                let config = {};
                try {
                    config = await getConfig();
                } catch (e) { console.error("Error loading config", e); }

                // 3. Apply Defaults if New Product
                if (config.planDefecto) {
                    setPlanSeleccionado(config.planDefecto);
                    const p = planes.find(x => x.planId === config.planDefecto);
                    if (p) {
                        setUnidadMedidaBase(p.unidadBase);
                        // If default UoM is set, use it. Otherwise use Base.
                        setUnidadSeleccionada(config.unidadMedidaDefecto || p.unidadBase);
                    }
                }

                // 4. Load Sequences
                const sequences = await getSecuencias();
                setSecuenciasConfig(sequences);

                const gruposActivos = sequences.filter(s => s.activo);
                const grupos = gruposActivos.map(s => s.grupo);

                if (!grupos.includes('Sin Grupo')) grupos.unshift('Sin Grupo');
                setGruposProducto(grupos);

                // Default Group Logic
                // Default Group Logic (Only for New Articles)
                if (!isEditMode) {
                    const defaultGroup = gruposActivos.find(s => s.esDefecto);
                    if (defaultGroup) {
                        setGrupoSeleccionado(defaultGroup.grupo);

                        // Apply UoM Defaults (Using local variables)
                        if (defaultGroup.planDefecto) {
                            setPlanSeleccionado(defaultGroup.planDefecto);
                            const p = planes.find(x => x.planId === defaultGroup.planDefecto);
                            if (p) {
                                setUnidadMedidaBase(p.unidadBase);
                                setUnidadSeleccionada(defaultGroup.unidadMedidaDefecto || p.unidadBase);
                            }
                        }

                        // Call the helper directly if possible, or just duplicate logic to avoid closure issues
                        if (defaultGroup.grupo && defaultGroup.grupo !== 'Sin Grupo') {
                            try {
                                const resp = await generarNumeroArticulo(defaultGroup.grupo);
                                setNumeroArticulo(resp.numeroArticulo);
                            } catch (e) { console.error(e); }
                        } else {
                            setNumeroArticulo('(Auto)');
                        }
                    }
                }

            } catch (error) {
                console.error('Error loading initial data:', error);
            }
        };
        loadAllData();
    }, []);

    // Load Article Data if Edit Mode
    useEffect(() => {
        if (!isEditMode) return;

        const loadArticle = async () => {
            try {
                const data = await getArticulo(id);
                // Populate state (Handle both camelCase and PascalCase)
                setNumeroArticulo(data.numeroArticulo || data.NumeroArticulo);
                setCodigoBarras(data.codigoBarras || data.CodigoBarras || '');
                setDescripcion(data.descripcion || data.Descripcion);
                setGrupoSeleccionado(data.grupoProducto || data.GrupoProducto || 'Sin Grupo');
                setCategoriaSeleccionada(data.categoria || data.Categoria || '');
                setMarcaSeleccionada(data.marca || data.Marca || '');
                setTipoSeleccionado(data.tipo || data.Tipo || '');
                setUnidadSeleccionada(data.unidadMedida || data.UnidadMedida || 'UND');
                setSelectedAlmacen(data.almacenPrincipal || data.AlmacenPrincipal || '');
                setUbicacion(data.ubicacionAlmacen || data.UbicacionAlmacen || '');
                setImpuestoSeleccionado(data.grupoImpuesto || data.GrupoImpuesto || '');

                const margenVal = data.margenPorcentaje ?? data.MargenPorcentaje;
                setMargen(margenVal?.toString() || '');

                // Cost & Price robust handling
                const costVal = data.costoUnitario ?? data.CostoUnitario;
                setCostoUnitario(costVal?.toString() || '');

                const priceVal = data.precioUnitario ?? data.PrecioUnitario;
                setPrecioUnitario(priceVal?.toString() || '');

                setNivelPrecio(data.nivelPrecio || data.NivelPrecio || '');

                const stockSecVal = data.stockSeguridad ?? data.StockSeguridad;
                setStockSeguridad(stockSecVal?.toString() || '');

                const puntoPedVal = data.puntoPedido ?? data.PuntoPedido;
                setPuntoPedido(puntoPedVal?.toString() || '');

                setProveedor(data.proveedorPrincipal || data.ProveedorPrincipal || '');

                // Cost Logic
                setMetodoCosteo(data.metodoCosteo || data.MetodoCosteo || 'Promedio');
                const cEstVal = data.costoEstandar ?? data.CostoEstandar;
                const cEst = cEstVal?.toString() || '';
                const cAvg = costVal?.toString() || '';
                setCostoEstandar(cEst);

                // Set initial display
                const currentMethod = data.metodoCosteo || data.MetodoCosteo || 'Promedio';
                if (currentMethod === 'Estándar') {
                    setCostoDisplay(cEst);
                } else {
                    setCostoDisplay(cAvg);
                }

                const planVal = data.planMedida || data.PlanMedida;
                if (planVal) {
                    setPlanSeleccionado(planVal);
                    // Defer setting base unit until planes are loaded or check existing state
                }

                // Fetch Prices
                try {
                    const precios = await getPrecios(id);
                    setListaPrecios(precios);
                    setImagenUrl(data.imagenUrl || data.ImagenUrl || '');
                } catch (e) { console.error("Could not load prices:", e); }


                // UoM Logic might need adjustment but sticking to basic population first
            } catch (error) {
                console.error("Error loading article for edit:", error);
                alert("Error al cargar el artículo para editar");
            }
        };
        loadArticle();
    }, [id, isEditMode]);

    // Helper para generar número (reutilizable)
    const cargarNumeroGenerado = async (grupo) => {
        if (!grupo || grupo === 'Sin Grupo') {
            setNumeroArticulo('(Auto)');
            return;
        }
        try {
            const response = await generarNumeroArticulo(grupo);
            setNumeroArticulo(response.numeroArticulo);
        } catch (error) {
            console.error('Error generating article number:', error);
            setNumeroArticulo('(Error al generar)');
        }
    };

    // Generar número de artículo cuando cambia el grupo
    const handleGrupoProductoChange = (evento) => {
        const grupoNombre = evento.target.value;
        setGrupoSeleccionado(grupoNombre);

        // Only generate number if NOT in edit mode
        if (!isEditMode) {
            cargarNumeroGenerado(grupoNombre);
        }

        // Apply Config
        const groupConfig = secuenciasConfig.find(s => s.grupo === grupoNombre);
        if (groupConfig && groupConfig.planDefecto) {
            setPlanSeleccionado(groupConfig.planDefecto);
            const p = planesUoM.find(x => x.planId === groupConfig.planDefecto);
            if (p) {
                setUnidadMedidaBase(p.unidadBase);
                setUnidadSeleccionada(groupConfig.unidadMedidaDefecto || p.unidadBase);
            }
        }
    };

    const [nivelesPrecio, setNivelesPrecio] = useState([]);

    // Handlers para guardar desde modales
    const handleSaveCategoria = async (data) => {
        try {
            await saveCategoria(data);
            const fresh = await getCategorias();
            setCategorias(fresh);
            setCategoriaSeleccionada(data.nombre);
            setModalCategoria(false);
        } catch (e) { console.error(e); alert('Error al guardar categoría'); }
    };

    const handleSaveUnidad = (data) => {
        // This function is not fully implemented to update a global list of units,
        // as units are primarily driven by UoM Plans.
        // For now, it just logs the data.
        console.log("Saving new unit:", data);
        // If you want to add it to a local list for display, you'd need a state for it.
        // setUnidadesMedida([...unidadesMedida, data.codigo]);
    };

    const handleSaveAlmacen = async (data) => {
        try {
            await saveAlmacen(data);
            const fresh = await getAlmacenes();
            setAlmacenes(fresh);
            setSelectedAlmacen(data.nombre);
            setModalAlmacen(false);
        } catch (e) {
            console.error(e);
            alert('Error al guardar almacén');
        }
    };

    const handleSaveImpuesto = async (data) => {
        try {
            await saveGrupoImpuesto(data);
            const fresh = await getGruposImpuestos();
            setGruposImpuestos(fresh);
            setImpuestoSeleccionado(data.codigo);
            setModalImpuesto(false);
        } catch (e) {
            console.error(e);
            alert('Error al guardar impuesto');
        }
    };

    const handleSaveMarca = async (data) => {
        try {
            await saveMarca(data);
            const fresh = await getMarcas();
            setMarcas(fresh);
            setMarcaSeleccionada(data.nombre);
            setModalMarca(false);
        } catch (e) { console.error(e); alert('Error al guardar marca'); }
    };

    const handleSaveTipo = async (data) => {
        try {
            await saveTipo(data);
            const fresh = await getTipos();
            setTipos(fresh);
            setTipoSeleccionado(data.nombre);
            setModalTipo(false);
        } catch (e) { console.error(e); alert('Error al guardar tipo'); }
    };

    const handleSaveGrupoProducto = async (data) => {
        try {
            await saveGrupoProducto(data);
            const fresh = await getGruposProducto();
            const nombres = fresh.map(g => g.nombre);
            if (!nombres.includes('Sin Grupo')) nombres.unshift('Sin Grupo');
            setGruposProducto(nombres);
            setGrupoSeleccionado(data.nombre);
            setModalGrupoProducto(false);

            // Trigger number generation for the new group
            if (!isEditMode) {
                cargarNumeroGenerado(data.nombre);
            }
        } catch (e) {
            console.error(e);
            alert('Error al guardar grupo de producto');
        }
    };

    const handleSaveNivelPrecio = async (data) => {
        try {
            await saveNivelPrecio(data);
            const fresh = await getNivelesPrecio();
            setNivelesPrecio(fresh.map(p => p.nombre));
            setNivelPrecio(data.nombre);
            setModalNivelPrecio(false);
        } catch (e) {
            console.error(e);
            alert('Error al guardar nivel de precio');
        }
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const result = await uploadProductImage(file);
            setImagenUrl(result.url);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error al subir la imagen: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = () => {
        setImagenUrl('');
    };

    const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api')?.replace('/api', '') || window.location.origin;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" onClick={() => navigate('/productos')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Editar Artículo' : 'Maestro de Artículos'}</h1>
                        <p className="text-sm text-gray-500">Creación y configuración de productos</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <X className="mr-2 h-4 w-4" /> Cancelar
                    </Button>
                    <Button className="bg-hd-orange hover:bg-orange-600" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" /> Guardar Producto
                    </Button>
                </div>
            </div>

            {/* In-Page Alert Message */}
            <div id="header-message"></div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="general">Información General</TabsTrigger>
                    <TabsTrigger value="costos">Estructura de Costos</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Left Column: Information */}
                        <div className="md:col-span-3 space-y-6">
                            {/* General Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Generales</CardTitle>
                                </CardHeader>
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <Input
                                            label={<span>No. Artículo <span className="text-red-500">*</span></span>}
                                            value={numeroArticulo || '(Auto)'}
                                            disabled
                                            title="Número único de identificación del artículo. Generado automáticamente según el grupo de producto."
                                        />
                                        <Input label="Código de Barras" placeholder="" title="Código EAN/UPC para escaneo en caja." />
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-1 block" title="Grupo de producto según clasificación comercial.">Grupo de Producto</label>
                                            <div className="flex items-center">
                                                <select
                                                    value={grupoSeleccionado}
                                                    onChange={handleGrupoProductoChange}
                                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange"
                                                    title="Grupo de producto según clasificación comercial. El número de artículo se generará automáticamente según la configuración del grupo."
                                                >
                                                    {gruposProducto.map((grupo, idx) => (
                                                        <option key={idx} value={grupo}>{grupo}</option>
                                                    ))}
                                                </select>
                                                <QuickAddButton onClick={() => setModalGrupoProducto(true)} />
                                            </div>
                                        </div>
                                    </div>
                                    <Input
                                        label={<span>Descripción <span className="text-red-500">*</span></span>}
                                        value={descripcion}
                                        onChange={(e) => setDescripcion(e.target.value)}
                                        placeholder="Descripción del artículo..."
                                        title="Nombre comercial o descripción detallada del producto tal como aparecerá en la factura."
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-1 block" title="Agrupación lógica para reportes y búsquedas.">Categoría Artículo</label>
                                            <div className="flex items-center">
                                                <select
                                                    value={categoriaSeleccionada}
                                                    onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange"
                                                    title="Agrupación lógica para reportes y búsquedas.">
                                                    <option value="">Seleccione Categoría</option>
                                                    {categorias.map((cat, idx) => (
                                                        <option key={idx} value={cat.nombre}>{cat.nombre}</option>
                                                    ))}
                                                </select>
                                                <QuickAddButton onClick={() => setModalCategoria(true)} />
                                            </div>
                                        </div>

                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-1 block" title="Marca del fabricante del producto.">Marca</label>
                                            <div className="flex items-center">
                                                <select
                                                    value={marcaSeleccionada}
                                                    onChange={(e) => setMarcaSeleccionada(e.target.value)}
                                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange"
                                                    title="Marca del fabricante del producto.">
                                                    <option value="">Seleccione Marca</option>
                                                    {marcas.map((marca, idx) => (
                                                        <option key={idx} value={marca.nombre}>{marca.nombre}</option>
                                                    ))}
                                                </select>
                                                <QuickAddButton onClick={() => setModalMarca(true)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-1 block" title="Tipo de producto según su funcionamiento.">Tipo</label>
                                            <div className="flex items-center">
                                                <select
                                                    value={tipoSeleccionado}
                                                    onChange={(e) => setTipoSeleccionado(e.target.value)}
                                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange"
                                                    title="Tipo de producto según su funcionamiento.">
                                                    <option value="">Seleccione Tipo</option>
                                                    {tipos.map((tipo, idx) => (
                                                        <option key={idx} value={tipo.nombre}>{tipo.nombre}</option>
                                                    ))}
                                                </select>
                                                <QuickAddButton onClick={() => setModalTipo(true)} />
                                            </div>
                                        </div>

                                    </div>


                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-1 block" title="Ubicación física donde se almacena el artículo.">Almacén</label>
                                            <div className="flex items-center">
                                                <select
                                                    value={selectedAlmacen}
                                                    onChange={(e) => setSelectedAlmacen(e.target.value)}
                                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange"
                                                    title="Ubicación física donde se almacena el artículo."
                                                >
                                                    <option value="">Seleccione Almacén</option>
                                                    {almacenes.map((alm, idx) => (
                                                        <option key={idx} value={alm.nombre}>{alm.nombre}</option>
                                                    ))}
                                                </select>
                                                <QuickAddButton onClick={() => setModalAlmacen(true)} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-1 block" title="Ubicación específica dentro del almacén (pasillo, estante, nivel).">Ubicación en Almacén</label>
                                            <Input
                                                value={ubicacion}
                                                onChange={(e) => setUbicacion(e.target.value)}
                                                placeholder="Ej: A-12-3"
                                                title="Código de ubicación física: Pasillo-Estante-Nivel"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-1 block" title="Grupo de impuestos aplicable al producto.">Grupo Impto. Prod.</label>
                                            <div className="flex items-center">
                                                <select
                                                    value={impuestoSeleccionado}
                                                    onChange={(e) => setImpuestoSeleccionado(e.target.value)}
                                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange"
                                                    title="Grupo de impuestos aplicable al producto."
                                                >
                                                    <option value="">Seleccione Impuesto</option>
                                                    {gruposImpuestos.map((grupo, idx) => (
                                                        <option key={idx} value={grupo.codigo}>{grupo.nombre}</option>
                                                    ))}
                                                </select>
                                                <QuickAddButton onClick={() => setModalImpuesto(true)} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Input
                                                label="Margen %"
                                                type="number"
                                                placeholder="0.00"
                                                step="0.01"
                                                title="Porcentaje de margen de ganancia sobre el costo (estilo SalePad)"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Invoicing / Costing */}
                            <Card>
                                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setFacturacionExpanded(!facturacionExpanded)}>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Facturación</CardTitle>
                                        {facturacionExpanded ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronRight className="h-5 w-5 text-gray-500" />}
                                    </div>
                                </CardHeader>
                                {facturacionExpanded && (
                                    <div className="p-6 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 mb-1 block" title="Plan de Unidad de Medida que define la unidad base y conversiones.">Plan de U. de M.</label>
                                                <div className="flex flex-col gap-1 w-full">
                                                    <div className="flex items-center">
                                                        <select
                                                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange"
                                                            value={planSeleccionado}
                                                            onChange={(e) => {
                                                                const pid = e.target.value;
                                                                setPlanSeleccionado(pid);
                                                                const p = planesUoM.find(x => x.planId === pid);
                                                                if (p) {
                                                                    setUnidadMedidaBase(p.unidadBase);
                                                                    setUnidadSeleccionada(p.unidadBase); // Maintain compatibility with existing save logic if needed
                                                                } else {
                                                                    setUnidadMedidaBase('');
                                                                }
                                                            }}
                                                        >
                                                            <option value="">Seleccione Plan</option>
                                                            {planesUoM.map((p, idx) => (
                                                                <option key={idx} value={p.planId}>{p.planId} - {p.descripcion}</option>
                                                            ))}
                                                        </select>

                                                    </div>
                                                    {unidadMedidaBase && (
                                                        <div className="flex items-center space-x-4 mt-2 px-1">
                                                            <span className="text-xs text-blue-600 font-medium">
                                                                Unidad Base: {unidadMedidaBase}
                                                            </span>
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-xs text-gray-500 font-medium">U.M. Def:</span>
                                                                <select
                                                                    className="h-6 text-xs rounded border-gray-300 bg-white px-1 py-0 focus:ring-hd-orange"
                                                                    value={unidadSeleccionada}
                                                                    onChange={(e) => {
                                                                        const newUnit = e.target.value;
                                                                        setUnidadSeleccionada(newUnit);
                                                                        if (nivelPrecio) {
                                                                            const match = listaPrecios.find(p => p.nivelPrecio === nivelPrecio && p.unidadMedida === newUnit);
                                                                            if (match) {
                                                                                setPrecioUnitario(match.precio.toFixed(2));
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                    {(() => {
                                                                        const plan = planesUoM.find(p => p.planId === planSeleccionado);
                                                                        let units = plan
                                                                            ? [plan.unidadBase, ...(plan.detalles ? plan.detalles.map(d => d.unidadMedida) : [])]
                                                                            : [unidadMedidaBase];

                                                                        // Deduplicate
                                                                        units = [...new Set(units)];

                                                                        // Filter by Level if selected
                                                                        if (nivelPrecio && listaPrecios && listaPrecios.length > 0) {
                                                                            const unitsInLevel = listaPrecios
                                                                                .filter(p => (p.nivelPrecio || p.NivelPrecio) === nivelPrecio)
                                                                                .map(p => p.unidadMedida || p.UnidadMedida);

                                                                            // Optimization: If the level has defined units, restricting to them.
                                                                            if (unitsInLevel.length > 0) {
                                                                                units = units.filter(u => unitsInLevel.includes(u));
                                                                            }
                                                                        }

                                                                        return units.map((u, idx) => (
                                                                            <option key={idx} value={u}>{u}</option>
                                                                        ));
                                                                    })()}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 mb-1 block" title="Determina cómo se valora el inventario al salir.">Método de Costeo</label>
                                                <select
                                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange"
                                                    title="Determina cómo se valora el inventario al salir."
                                                    value={metodoCosteo}
                                                    onChange={(e) => {
                                                        const nuevoMetodo = e.target.value;
                                                        setMetodoCosteo(nuevoMetodo);
                                                        // Update displayed cost based on method
                                                        if (nuevoMetodo === 'Estándar') {
                                                            setCostoDisplay(costoEstandar);
                                                        } else {
                                                            setCostoDisplay(costoUnitario);
                                                        }
                                                    }}
                                                >
                                                    <option value="Promedio">Promedio</option>
                                                    <option value="Estándar">Estándar</option>
                                                    <option value="FIFO">FIFO</option>
                                                    <option value="LIFO">LIFO</option>
                                                </select>
                                            </div>
                                            <Input
                                                label="Costo Unitario"
                                                type="number"
                                                placeholder="0.00"
                                                title="Costo directo de adquisición o producción por unidad."
                                                value={costoDisplay}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setCostoDisplay(val);
                                                    if (metodoCosteo === 'Estándar') {
                                                        setCostoEstandar(val);
                                                    } else {
                                                        setCostoUnitario(val);
                                                    }

                                                    // Auto-calc Price if Margin exists
                                                    if (margen && val) {
                                                        const cost = parseFloat(val);
                                                        const margin = parseFloat(margen);
                                                        const price = cost * (1 + margin / 100);
                                                        setPrecioUnitario(price.toFixed(2));
                                                    }
                                                }}
                                            />
                                            <Input
                                                label="Margen %"
                                                type="number"
                                                placeholder="0.00"
                                                title="Porcentaje de ganancia sobre el costo."
                                                value={margen}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setMargen(val);

                                                    // Auto-calc Price
                                                    if (costoDisplay && val) {
                                                        const cost = parseFloat(costoDisplay);
                                                        const margin = parseFloat(val);
                                                        const price = cost * (1 + margin / 100);
                                                        setPrecioUnitario(price.toFixed(2));
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 mb-1 block" title="Nivel de precio asignado para venta rápida.">Nivel de Precio</label>
                                                <div className="flex items-center">
                                                    <select
                                                        value={nivelPrecio}
                                                        onChange={(e) => {
                                                            const selectedLevel = e.target.value;
                                                            setNivelPrecio(selectedLevel);
                                                            // Auto-update price if level matches a price list entry
                                                            const match = listaPrecios.find(p => p.nivelPrecio === selectedLevel && p.unidadMedida === unidadSeleccionada);
                                                            if (match) {
                                                                setPrecioUnitario(match.precio.toFixed(2));
                                                            }
                                                        }}
                                                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange"
                                                        title="Nivel de precio asignado para venta rápida."
                                                    >
                                                        <option value="">Seleccione Nivel</option>
                                                        {nivelesPrecio.map((nivel, idx) => (
                                                            <option key={idx} value={nivel}>{nivel}</option>
                                                        ))}
                                                    </select>
                                                    <QuickAddButton onClick={() => setModalNivelPrecio(true)} />
                                                </div>
                                            </div>
                                            <Input
                                                label="Precio Unitario"
                                                type="number"
                                                placeholder="0.00"
                                                className="font-bold text-green-700"
                                                title="Precio de venta al público antes de descuentos."
                                                value={precioUnitario}
                                                onChange={(e) => setPrecioUnitario(e.target.value)}
                                            />
                                            <div></div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 mb-1 block" title="Configuración de impuestos aplicables al vender este artículo.">Grupo Impto. Prod.</label>
                                                <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange" title="Configuración de impuestos aplicables al vender este artículo.">
                                                    <option>ITBIS 18%</option>
                                                    <option>EXENTO</option>
                                                </select>
                                            </div>
                                            <div className="text-xs text-gray-500 pt-8 italic">
                                                * El precio unitario incluye impuestos según grupo.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>

                            {/* Replenishment */}
                            <Card>
                                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setReposicionExpanded(!reposicionExpanded)}>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Reposición</CardTitle>
                                        {reposicionExpanded ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronRight className="h-5 w-5 text-gray-500" />}
                                    </div>
                                </CardHeader>
                                {reposicionExpanded && (
                                    <div className="p-6 space-y-4">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 mb-1 block" title="Cómo se reabastece este artículo habitualmente.">Sistema Reposición</label>
                                                <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange" title="Cómo se reabastece este artículo habitualmente.">
                                                    <option>Compra</option>
                                                    <option>Prod. Orden</option>
                                                </select>
                                            </div>
                                            <Input label="Stock Seguridad" type="number" placeholder="0" title="Cantidad mínima a mantener para evitar quiebres de stock." />
                                            <Input label="Punto de Pedido" type="number" placeholder="0" title="Nivel de inventario que dispara una alerta de reorden." />
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            <Input label="Proveedor Principal" placeholder="Seleccionar..." title="Proveedor predeterminado para generar órdenes de compra." />
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Right Column: Image & Status */}
                        <div className="md:col-span-1 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Imagen del Producto</CardTitle>
                                </CardHeader>
                                <div className="p-6 flex flex-col items-center justify-center space-y-4">
                                    <div
                                        className={`relative w-full aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden transition-colors ${!imagenUrl && 'hover:bg-gray-50 cursor-pointer'}`}
                                        onClick={() => !imagenUrl && document.getElementById('imageInput').click()}
                                    >
                                        {imagenUrl ? (
                                            <>
                                                <img
                                                    src={`${API_BASE_URL}${imagenUrl}`}
                                                    alt="Producto"
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeImage(); }}
                                                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                {uploading ? (
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hd-orange mx-auto"></div>
                                                ) : (
                                                    <>
                                                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                                        <span className="mt-2 block text-sm font-medium text-gray-600">Subir foto</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            id="imageInput"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                    <div className="w-full text-xs text-center text-gray-500 italic">
                                        Formatos soportados: JPG, PNG. Máx 5MB.
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent >

                <TabsContent value="costos">
                    <Card>
                        <CardHeader>
                            <CardTitle>Análisis de Precios Unitarios (APU)</CardTitle>
                            <p className="text-sm text-gray-500 mt-2">
                                Sistema de costeo basado en estándares de construcción y manufactura. Incluye costos directos, indirectos, y cálculo de precio final.
                            </p>
                        </CardHeader>
                        <div className="p-6 space-y-8">
                            {/* COSTOS DIRECTOS */}
                            <div className="border-2 border-orange-300 rounded-lg p-4 bg-orange-50/30">
                                <h2 className="text-xl font-bold text-orange-800 mb-4 flex items-center gap-2">
                                    <span className="bg-orange-600 text-white px-3 py-1 rounded">A</span>
                                    COSTOS DIRECTOS
                                </h2>

                                {/* Materials Section */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800 border-b-2 border-orange-200 inline-block">1. MATERIALES</h3>
                                            <p className="text-xs text-gray-500 mt-1">Insumos que se incorporan físicamente al producto final</p>
                                        </div>
                                        <Button onClick={agregarMaterial} size="sm" className="bg-orange-600 hover:bg-orange-700">
                                            <Plus className="h-4 w-4 mr-1" /> Agregar Material
                                        </Button>
                                    </div>
                                    <div className="border rounded-sm overflow-hidden bg-white">
                                        <Table className="border-0">
                                            <TableHeader>
                                                <TableRow className="bg-orange-100/70">
                                                    <TableHead className="w-24">Código</TableHead>
                                                    <TableHead>Descripción</TableHead>
                                                    <TableHead className="w-24 text-right">Cantidad</TableHead>
                                                    <TableHead className="w-20 text-center">Unidad</TableHead>
                                                    <TableHead className="w-20 text-right">Desp %</TableHead>
                                                    <TableHead className="w-28 text-right">Precio Unit.</TableHead>
                                                    <TableHead className="w-28 text-right">Total</TableHead>
                                                    <TableHead className="w-16"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {materiales.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium">
                                                            <input
                                                                type="text"
                                                                value={item.codigo}
                                                                onChange={(e) => actualizarMaterial(item.id, 'codigo', e.target.value)}
                                                                className="w-full px-2 py-1 text-sm border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-hd-orange rounded"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <input
                                                                type="text"
                                                                value={item.descripcion}
                                                                onChange={(e) => actualizarMaterial(item.id, 'descripcion', e.target.value)}
                                                                className="w-full px-2 py-1 text-sm border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-hd-orange rounded"
                                                                placeholder="Descripción del material..."
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <input
                                                                type="number"
                                                                value={item.cantidad}
                                                                onChange={(e) => actualizarMaterial(item.id, 'cantidad', parseFloat(e.target.value) || 0)}
                                                                className="w-full px-2 py-1 text-sm text-right border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-hd-orange rounded"
                                                                step="0.01"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <input
                                                                type="text"
                                                                value={item.unidad}
                                                                onChange={(e) => actualizarMaterial(item.id, 'unidad', e.target.value)}
                                                                className="w-full px-2 py-1 text-sm text-center border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-hd-orange rounded"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <input
                                                                type="number"
                                                                value={item.desperdicio}
                                                                onChange={(e) => actualizarMaterial(item.id, 'desperdicio', parseFloat(e.target.value) || 0)}
                                                                className="w-full px-2 py-1 text-sm text-right border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-hd-orange rounded"
                                                                step="0.1"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <input
                                                                type="number"
                                                                value={item.precio}
                                                                onChange={(e) => actualizarMaterial(item.id, 'precio', parseFloat(e.target.value) || 0)}
                                                                className="w-full px-2 py-1 text-sm text-right border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-hd-orange rounded"
                                                                step="0.01"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            ${calcularTotalMaterial(item).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => eliminarMaterial(item.id)}
                                                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="bg-orange-50 font-bold border-t-2 border-orange-300">
                                                    <TableCell colSpan={6} className="text-right pr-4">Subtotal Materiales (A1)</TableCell>
                                                    <TableCell className="text-right text-orange-700 text-lg">${totalMateriales.toFixed(2)}</TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                {/* Equipment Section */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800 border-b-2 border-blue-200 inline-block">2. EQUIPOS Y HERRAMIENTAS</h3>
                                            <p className="text-xs text-gray-500 mt-1">Maquinaria y equipos necesarios para la ejecución</p>
                                        </div>
                                        <Button onClick={agregarEquipo} size="sm" className="bg-blue-600 hover:bg-blue-700">
                                            <Plus className="h-4 w-4 mr-1" /> Agregar Equipo
                                        </Button>
                                    </div>
                                    <div className="border rounded-sm overflow-hidden bg-white">
                                        <Table className="border-0">
                                            <TableHeader>
                                                <TableRow className="bg-blue-100/70">
                                                    <TableHead className="w-24">Código</TableHead>
                                                    <TableHead>Descripción</TableHead>
                                                    <TableHead className="w-24 text-right">Cantidad</TableHead>
                                                    <TableHead className="w-20 text-center">Unidad</TableHead>
                                                    <TableHead className="w-24 text-right">Rendimiento</TableHead>
                                                    <TableHead className="w-28 text-right">Costo/Hora</TableHead>
                                                    <TableHead className="w-28 text-right">Total</TableHead>
                                                    <TableHead className="w-16"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {equipos.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium">
                                                            <input
                                                                type="text"
                                                                value={item.codigo}
                                                                onChange={(e) => actualizarEquipo(item.id, 'codigo', e.target.value)}
                                                                className="w-full px-2 py-1 text-sm border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-hd-orange rounded"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <input
                                                                type="text"
                                                                value={item.descripcion}
                                                                onChange={(e) => actualizarEquipo(item.id, 'descripcion', e.target.value)}
                                                                className="w-full px-2 py-1 text-sm border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-hd-orange rounded"
                                                                placeholder="Descripción del equipo..."
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <input
                                                                type="number"
                                                                value={item.cantidad}
                                                                onChange={(e) => actualizarEquipo(item.id, 'cantidad', parseFloat(e.target.value) || 0)}
                                                                className="w-full px-2 py-1 text-sm text-right border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-hd-orange rounded"
                                                                step="0.01"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <input
                                                                type="text"
                                                                value={item.unidad}
                                                                onChange={(e) => actualizarEquipo(item.id, 'unidad', e.target.value)}
                                                                className="w-full px-2 py-1 text-sm text-center border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-hd-orange rounded"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <input
                                                                type="number"
                                                                value={item.rendimiento}
                                                                onChange={(e) => actualizarEquipo(item.id, 'rendimiento', parseFloat(e.target.value) || 0)}
                                                                className="w-full px-2 py-1 text-sm text-right border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-hd-orange rounded"
                                                                step="0.01"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <input
                                                                type="number"
                                                                value={item.costoHora}
                                                                onChange={(e) => actualizarEquipo(item.id, 'costoHora', parseFloat(e.target.value) || 0)}
                                                                className="w-full px-2 py-1 text-sm text-right border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-hd-orange rounded"
                                                                step="0.01"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            ${calcularTotalEquipo(item).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => eliminarEquipo(item.id)}
                                                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="bg-blue-50 font-bold border-t-2 border-blue-300">
                                                    <TableCell colSpan={6} className="text-right pr-4">Subtotal Equipos (A2)</TableCell>
                                                    <TableCell className="text-right text-blue-700 text-lg">${totalEquipos.toFixed(2)}</TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                {/* Labor Section */}
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800 border-b-2 border-green-200 inline-block">3. MANO DE OBRA DIRECTA</h3>
                                            <p className="text-xs text-gray-500 mt-1">Personal que ejecuta directamente la actividad productiva</p>
                                        </div>
                                        <Button onClick={agregarManoObra} size="sm" className="bg-green-600 hover:bg-green-700">
                                            <Plus className="h-4 w-4 mr-1" /> Agregar Trabajador
                                        </Button>
                                    </div>
                                    <div className="border rounded-sm overflow-hidden bg-white">
                                        <Table className="border-0">
                                            <TableHeader>
                                                <TableRow className="bg-green-100/70">
                                                    <TableHead className="w-24">Código</TableHead>
                                                    <TableHead>Descripción / Categoría</TableHead>
                                                    <TableHead className="w-24 text-right">Cantidad</TableHead>
                                                    <TableHead className="w-20 text-center">Unidad</TableHead>
                                                    <TableHead className="w-28 text-right">Salario Base</TableHead>
                                                    <TableHead className="w-28 text-right">Subtotal</TableHead>
                                                    <TableHead className="w-16"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {manoObra.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium">
                                                            <input
                                                                type="text"
                                                                value={item.codigo}
                                                                onChange={(e) => actualizarManoObra(item.id, 'codigo', e.target.value)}
                                                                className="w-full px-2 py-1 text-sm border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-hd-orange rounded"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <input
                                                                type="text"
                                                                value={item.descripcion}
                                                                onChange={(e) => actualizarManoObra(item.id, 'descripcion', e.target.value)}
                                                                className="w-full px-2 py-1 text-sm border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-hd-orange rounded"
                                                                placeholder="Categoría del trabajador..."
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <input
                                                                type="number"
                                                                value={item.cantidad}
                                                                onChange={(e) => actualizarManoObra(item.id, 'cantidad', parseFloat(e.target.value) || 0)}
                                                                className="w-full px-2 py-1 text-sm text-right border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-hd-orange rounded"
                                                                step="0.01"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <input
                                                                type="text"
                                                                value={item.unidad}
                                                                onChange={(e) => actualizarManoObra(item.id, 'unidad', e.target.value)}
                                                                className="w-full px-2 py-1 text-sm text-center border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-hd-orange rounded"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <input
                                                                type="number"
                                                                value={item.salario}
                                                                onChange={(e) => actualizarManoObra(item.id, 'salario', parseFloat(e.target.value) || 0)}
                                                                className="w-full px-2 py-1 text-sm text-right border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-hd-orange rounded"
                                                                step="0.01"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            ${(item.cantidad * item.salario).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => eliminarManoObra(item.id)}
                                                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="bg-gray-50 font-semibold border-t border-gray-300">
                                                    <TableCell colSpan={5} className="text-right pr-4 text-sm">Subtotal Salarios Base</TableCell>
                                                    <TableCell className="text-right">${subtotalSalarios.toFixed(2)}</TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                                <TableRow className="bg-green-50/50">
                                                    <TableCell colSpan={5} className="text-right pr-4 text-sm">
                                                        + Cargas Sociales y Prestaciones ({porcentajes.cargasSociales}%)*
                                                    </TableCell>
                                                    <TableCell className="text-right text-gray-700">${cargasSociales.toFixed(2)}</TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                                <TableRow className="bg-green-50/50">
                                                    <TableCell colSpan={5} className="text-right pr-4 text-sm">
                                                        + Seguros y Riesgos Laborales ({porcentajes.seguros}%)
                                                    </TableCell>
                                                    <TableCell className="text-right text-gray-700">${segurosLaborales.toFixed(2)}</TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                                <TableRow className="bg-green-50/50 border-b-2 border-green-300">
                                                    <TableCell colSpan={5} className="text-right pr-4 text-sm">
                                                        + Herramientas y EPP ({porcentajes.herramientas}%)
                                                    </TableCell>
                                                    <TableCell className="text-right text-gray-700">${herramientasEPP.toFixed(2)}</TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                                <TableRow className="bg-green-100 font-bold">
                                                    <TableCell colSpan={5} className="text-right pr-4">
                                                        Subtotal Mano de Obra (A3)
                                                        <span className="block text-xs font-normal text-gray-500">*Incluye: vacaciones, aguinaldo, cesantía, seguro social</span>
                                                    </TableCell>
                                                    <TableCell className="text-right text-green-700 text-lg">${totalManoObra.toFixed(2)}</TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                {/* Direct Costs Total */}
                                <div className="bg-orange-100 border-2 border-orange-400 rounded p-3 flex justify-between items-center">
                                    <span className="font-bold text-gray-800">TOTAL COSTOS DIRECTOS (A = A1 + A2 + A3)</span>
                                    <span className="text-2xl font-bold text-orange-700">${totalCostosDirectos.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* COSTOS INDIRECTOS */}
                            <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50/30">
                                <h2 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                                    <span className="bg-purple-600 text-white px-3 py-1 rounded">B</span>
                                    COSTOS INDIRECTOS
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {/* Field Indirect Costs */}
                                    <div className="border rounded-lg p-4 bg-white">
                                        <h3 className="font-bold text-purple-700 mb-3 border-b pb-2">B1. Indirectos de Campo</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">• Supervisión técnica</span>
                                                <span className="font-medium">$285.00</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">• Personal administrativo obra</span>
                                                <span className="font-medium">$165.00</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">• Instalaciones temporales</span>
                                                <span className="font-medium">$125.00</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">• Servicios (agua, luz temporal)</span>
                                                <span className="font-medium">$95.00</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">• Seguridad y vigilancia</span>
                                                <span className="font-medium">$85.00</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-2 font-bold text-purple-700">
                                                <span>Subtotal Campo (B1)</span>
                                                <span>$755.00</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Office Indirect Costs */}
                                    <div className="border rounded-lg p-4 bg-white">
                                        <h3 className="font-bold text-purple-700 mb-3 border-b pb-2">B2. Indirectos de Oficina Central</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">• Dirección y gerencia</span>
                                                <span className="font-medium">$425.00</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">• Contabilidad y finanzas</span>
                                                <span className="font-medium">$195.00</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">• Alquiler oficina central</span>
                                                <span className="font-medium">$285.00</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">• Servicios básicos oficina</span>
                                                <span className="font-medium">$125.00</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">• Depreciación equipos</span>
                                                <span className="font-medium">$95.00</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-2 font-bold text-purple-700">
                                                <span>Subtotal Oficina (B2)</span>
                                                <span>$1,125.00</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-purple-100 border-2 border-purple-400 rounded p-3 flex justify-between items-center">
                                    <span className="font-bold text-gray-800">TOTAL COSTOS INDIRECTOS (B = B1 + B2)</span>
                                    <span className="text-2xl font-bold text-purple-700">$1,880.00</span>
                                </div>
                            </div>

                            {/* CALCULATION SUMMARY */}
                            <div className="border-2 border-gray-400 rounded-lg p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                                <h2 className="text-xl font-bold text-gray-800 mb-6 text-center border-b-2 pb-3">
                                    CÁLCULO DE PRECIO UNITARIO FINAL
                                </h2>

                                <div className="space-y-3 max-w-2xl mx-auto">
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <span className="font-medium text-gray-700">Costos Directos (A)</span>
                                        <span className="font-bold text-lg">${totalCostosDirectos.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <span className="font-medium text-gray-700">Costos Indirectos (B)</span>
                                        <span className="font-bold text-lg">${totalCostosIndirectos.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b-2 border-gray-400 bg-blue-50 px-3 rounded">
                                        <span className="font-bold text-gray-800">Costo Total (C = A + B)</span>
                                        <span className="font-bold text-xl text-blue-700">${costoTotal.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between items-center py-2 border-b">
                                        <span className="font-medium text-gray-700">
                                            + Financiamiento ({porcentajes.financiamiento}% sobre C)
                                            <span className="block text-xs text-gray-500">Costo de oportunidad del capital</span>
                                        </span>
                                        <span className="font-bold">${financiamiento.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between items-center py-2 border-b">
                                        <span className="font-medium text-gray-700">
                                            + Imprevistos ({porcentajes.imprevistos}% sobre C)
                                            <span className="block text-xs text-gray-500">Contingencias y variaciones</span>
                                        </span>
                                        <span className="font-bold">${imprevistos.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between items-center py-2 border-b-2 border-gray-400">
                                        <span className="font-bold text-gray-800">Subtotal con Cargos (D)</span>
                                        <span className="font-bold text-lg">${subtotalConCargos.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between items-center py-2 border-b-2 border-orange-400 bg-orange-50 px-3 rounded">
                                        <span className="font-medium text-gray-700">
                                            + Utilidad ({porcentajes.utilidad}% sobre D)
                                            <span className="block text-xs text-gray-500">Margen de ganancia del contratista</span>
                                        </span>
                                        <span className="font-bold text-orange-600">${utilidad.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between items-center py-3 bg-gradient-to-r from-green-100 to-green-50 border-2 border-green-500 rounded-lg px-4 mt-4">
                                        <div>
                                            <span className="block font-bold text-gray-800 text-lg">PRECIO UNITARIO FINAL</span>
                                            <span className="block text-xs text-gray-600">Por unidad de medida (M3, KG, etc.)</span>
                                        </div>
                                        <span className="text-3xl font-bold text-green-700">${precioUnitarioFinal.toFixed(2)}</span>
                                    </div>

                                    <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                                        <p className="text-xs text-gray-600">
                                            <strong>Nota:</strong> Los porcentajes de indirectos, financiamiento, imprevistos y utilidad
                                            pueden variar según el tipo de proyecto, ubicación geográfica, condiciones del mercado y
                                            políticas de la empresa. Los valores mostrados son referenciales basados en estándares de la industria.
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </Card>
                </TabsContent>
            </Tabs >

            {/* QuickAdd Modals */}
            <AttributeModal
                isOpen={modalCategoria}
                onClose={() => setModalCategoria(false)}
                onSave={handleSaveCategoria}
                title="Nueva Categoría"
                type="categoria"
            />

            <QuickAddModal
                isOpen={modalUnidad}
                onClose={() => setModalUnidad(false)}
                onSave={handleSaveUnidad}
                title="Nueva Unidad de Medida"
                fields={[
                    { name: 'codigo', label: 'Código', placeholder: 'UND' },
                    { name: 'nombre', label: 'Nombre', placeholder: 'Unidad' },
                    {
                        name: 'tipo', label: 'Tipo', type: 'select', options: [
                            { value: 'Cantidad', label: 'Cantidad' },
                            { value: 'Longitud', label: 'Longitud' },
                            { value: 'Área', label: 'Área' },
                            { value: 'Volumen', label: 'Volumen' },
                            { value: 'Peso', label: 'Peso' }
                        ]
                    },
                    { name: 'decimales', label: 'Decimales', type: 'number', placeholder: '0' }
                ]}
            />

            <AlmacenModal
                isOpen={modalAlmacen}
                onClose={() => setModalAlmacen(false)}
                onSave={handleSaveAlmacen}
            />

            <GrupoImpuestoModal
                isOpen={modalImpuesto}
                onClose={() => setModalImpuesto(false)}
                onSave={handleSaveImpuesto}
            />

            <AttributeModal
                isOpen={modalMarca}
                onClose={() => setModalMarca(false)}
                onSave={handleSaveMarca}
                title="Nueva Marca"
                type="marca"
            />

            <AttributeModal
                isOpen={modalTipo}
                onClose={() => setModalTipo(false)}
                onSave={handleSaveTipo}
                title="Nuevo Tipo"
                type="tipo"
            />

            <GrupoProductoModal
                isOpen={modalGrupoProducto}
                onClose={() => setModalGrupoProducto(false)}
                onSave={handleSaveGrupoProducto}
            />

            <QuickAddModal
                isOpen={modalNivelPrecio}
                onClose={() => setModalNivelPrecio(false)}
                onSave={handleSaveNivelPrecio}
                title="Nuevo Nivel de Precio"
                fields={[
                    { name: 'nombre', label: 'Nombre del Nivel', placeholder: 'Ej. Mayorista' },
                    { name: 'descripcion', label: 'Descripción', placeholder: 'Descripción opcional' }
                ]}
            />
        </div >
    );
};

export default ProductoForm;

