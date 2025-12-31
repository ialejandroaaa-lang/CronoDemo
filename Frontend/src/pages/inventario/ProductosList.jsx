import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Package, ListFilter } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '../../components/ui/Table';
// import { mockProductos } from '../../data/mockData'; // Removed mock data
import { getArticulos, deleteArticulo } from '../../api/articulos';
import { getAlmacenes } from '../../api/almacenes';
import { getSecuencias } from '../../api/articuloConfig';
import { ArrowUp, ArrowDown, Warehouse, Loader2, CheckCircle2, ChevronRight, X as XIcon, History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Dialog';

const ProductosList = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // New states for real data
    const [productos, setProductos] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [loading, setLoading] = useState(true);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedFeedProduct, setSelectedFeedProduct] = useState(null);
    const [feedQty, setFeedQty] = useState(0);
    const [feedWarehouse, setFeedWarehouse] = useState(1);
    const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
    const [feeding, setFeeding] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // 1. Load Groups and Defaults
                const secuencias = await getSecuencias();
                const activeGroups = secuencias.filter(s => s.activo);
                const groupNames = activeGroups.map(s => s.grupo);
                setGrupos(groupNames);

                const defaultGroup = activeGroups.find(s => s.esDefecto);
                if (defaultGroup) {
                    setSelectedGroup(defaultGroup.grupo);
                }

                // 2. Load Articles
                const data = await getArticulos();
                // Map backend DTO to UI format
                const mappedProducts = data.map(item => ({
                    id: item.id,
                    codigo: item.numeroArticulo,
                    descripcion: item.descripcion,
                    categoria: item.categoria || item.grupoProducto || 'Sin Categoría',
                    grupo: item.grupoProducto, // Needed for filtering
                    precio: item.precioUnitario,
                    stock: item.stockActual || 0,
                    estado: item.bloqueado ? 'Inactivo' : 'Activo'
                }));
                setProductos(mappedProducts);

                // 3. Load Warehouses
                const whs = await getAlmacenes();
                setWarehouses(whs);
                if (whs.length > 0) setFeedWarehouse(whs[0].id);
            } catch (error) {
                console.error("Error loading products:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleQuickFeed = (product) => {
        setSelectedFeedProduct(product);
        setFeedQty(0);
        setIsFeedModalOpen(true);
    };

    const processQuickFeed = async () => {
        try {
            setFeeding(true);
            const res = await fetch(`http://localhost:5006/api/Articulos/${selectedFeedProduct.id}/QuickStock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cantidad: parseFloat(feedQty),
                    almacenId: feedWarehouse
                })
            });

            if (res.ok) {
                // Refresh data
                const updated = await getArticulos();
                setProductos(updated.map(item => ({
                    id: item.id,
                    codigo: item.numeroArticulo,
                    descripcion: item.descripcion,
                    categoria: item.categoria || item.grupoProducto || 'Sin Categoría',
                    grupo: item.grupoProducto,
                    precio: item.precioUnitario,
                    stock: item.stockActual || 0,
                    estado: item.bloqueado ? 'Inactivo' : 'Activo'
                })));
                setIsFeedModalOpen(false);
            } else {
                alert("Error al actualizar inventario");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setFeeding(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro que desea eliminar este artículo?')) {
            try {
                await deleteArticulo(id);
                setProductos(prev => prev.filter(p => p.id !== id));
            } catch (error) {
                console.error("Error deleting article:", error);
                alert("Error al eliminar el artículo");
            }
        }
    };


    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedProductos = useMemo(() => {
        let sortableItems = [...productos];

        // 1. Filter by Group
        if (selectedGroup) {
            sortableItems = sortableItems.filter(item => item.grupo === selectedGroup);
        }

        // 2. Filter by Search Term
        if (searchTerm) {
            sortableItems = sortableItems.filter(item =>
                item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.codigo.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key] ? a[sortConfig.key].toString().toLowerCase() : '';
                const bValue = b[sortConfig.key] ? b[sortConfig.key].toString().toLowerCase() : '';

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [productos, searchTerm, sortConfig, selectedGroup]);

    const renderSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) return <ListFilter size={14} className="opacity-30" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} className="text-hd-orange" />
            : <ArrowDown size={14} className="text-hd-orange" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Catálogo de Productos</h1>
                    <p className="text-sm text-gray-500">Gestión maestra de inventario y servicios.</p>
                </div>
                <Button onClick={() => navigate('/productos/nuevo')} className="bg-hd-orange hover:bg-orange-600 shadow-md">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                <Card className="p-4 flex items-center space-x-4 bg-orange-50 border-orange-100">
                    <div className="p-3 bg-orange-100 rounded-full text-orange-600">
                        <Package size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Total Items</div>
                        <div className="text-2xl font-bold text-gray-800">{productos.length}</div>
                    </div>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 pb-4">
                    <CardTitle>Lista de Artículos</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <select
                            className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange w-full sm:w-48"
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                        >
                            <option value="">Todos los Grupos</option>
                            {grupos.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Buscar por código o nombre..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>

                <div className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-100/90 border-b-2 border-gray-200">
                            <TableRow>
                                <TableHead onClick={() => handleSort('codigo')} className="w-[120px] font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors select-none">
                                    <div className="flex items-center space-x-2">
                                        <span>No. Artículo</span>
                                        {renderSortIcon('codigo')}
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('descripcion')} className="font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors select-none">
                                    <div className="flex items-center space-x-2">
                                        <span>Descripción</span>
                                        {renderSortIcon('descripcion')}
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('categoria')} className="hidden md:table-cell font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors select-none">
                                    <div className="flex items-center space-x-2">
                                        <span>Categoría/Grupo</span>
                                        {renderSortIcon('categoria')}
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('precio')} className="text-right font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors select-none">
                                    <div className="flex items-center justify-end space-x-2">
                                        <span>Precio Unitario</span>
                                        {renderSortIcon('precio')}
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('stock')} className="text-right font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors select-none">
                                    <div className="flex items-center justify-end space-x-2">
                                        <span>Stock</span>
                                        {renderSortIcon('stock')}
                                    </div>
                                </TableHead>
                                <TableHead className="font-bold text-gray-700 select-none">
                                    <span>Estado</span>
                                </TableHead>
                                <TableHead className="text-right font-bold text-gray-700">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">Cargando...</TableCell>
                                </TableRow>
                            ) : sortedProductos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">No se encontraron artículos</TableCell>
                                </TableRow>
                            ) : (
                                sortedProductos.map((item) => (
                                    <TableRow key={item.id} className="cursor-pointer hover:bg-gray-50 transition-colors">
                                        <TableCell className="font-medium text-gray-900">{item.codigo}</TableCell>
                                        <TableCell>
                                            <div className="font-medium text-gray-800">{item.descripcion}</div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-gray-600">{item.categoria}</TableCell>
                                        <TableCell className="text-right font-medium text-gray-900">${item.precio.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-bold text-hd-orange">{item.stock}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {item.estado}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Ajuste Manual (Corrección)"
                                                >
                                                    <Plus className="h-6 w-6 stroke-[1.5]" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => navigate(`/inventario/historial/${item.id}`)}
                                                    className="h-10 w-10 p-2 rounded-full text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 transition-all border border-transparent hover:border-indigo-200 shadow-sm"
                                                    title="Historial de Movimientos"
                                                >
                                                    <History className="h-6 w-6 stroke-[1.5]" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => navigate(`/productos/editar/${item.id}`)}
                                                    className="h-10 w-10 p-2 rounded-full text-blue-600 hover:text-blue-800 hover:bg-blue-100 transition-all border border-transparent hover:border-blue-200 shadow-sm"
                                                    title="Editar"
                                                >
                                                    <Edit className="h-6 w-6 stroke-[1.5]" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(item.id)}
                                                    className="h-10 w-10 p-2 rounded-full text-red-600 hover:text-red-800 hover:bg-red-100 transition-all border border-transparent hover:border-red-200 shadow-sm"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="h-6 w-6 stroke-[1.5]" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Dialog open={isFeedModalOpen} onOpenChange={setIsFeedModalOpen}>
                <DialogContent className="max-w-md bg-white p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-hd-black p-6 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-hd-orange rounded-lg">
                                <Warehouse className="text-white" size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black italic tracking-tighter">AJUSTE MANUAL</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Corrección de Stock</p>
                            </div>
                        </div>
                        <Button variant="ghost" onClick={() => setIsFeedModalOpen(false)} className="text-white hover:bg-white/10"><XIcon /></Button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        <span className="font-bold">Nota:</span> Este botón debe usarse solo para correcciones rápidas (ej. conteo físico, mermas encontradas al momento).
                                    </p>
                                    <p className="text-sm text-yellow-700 mt-2">
                                        Para ingresar mercancía de proveedores, por favor sigue usando el módulo de <span className="font-bold">Compras -&gt; Recepción</span>, el cual sí genera las "Entradas de Inventario" formales.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Artículo Seleccionado</p>
                            <p className="font-bold text-gray-800">{selectedFeedProduct?.descripcion}</p>
                            <p className="text-xs text-hd-orange font-bold uppercase">{selectedFeedProduct?.codigo}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Almacén de Destino</label>
                                <select
                                    className="w-full h-12 px-4 rounded-xl border-2 border-gray-100 bg-gray-50 font-bold text-gray-700 focus:border-hd-orange transition-all outline-none appearance-none"
                                    value={feedWarehouse}
                                    onChange={(e) => setFeedWarehouse(parseInt(e.target.value))}
                                >
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Cantidad a Ajustar</label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        autoFocus
                                        className="h-14 text-2xl font-black text-right pr-4 focus:ring-hd-orange border-2 rounded-xl"
                                        value={feedQty}
                                        onChange={(e) => setFeedQty(e.target.value)}
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-black italic text-xl">
                                        QTY
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            className="w-full h-14 bg-hd-orange hover:bg-orange-600 text-white font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 rounded-xl transition-all active:scale-[0.98]"
                            onClick={processQuickFeed}
                            disabled={feeding || !feedQty || feedQty == 0}
                        >
                            {feeding ? <Loader2 className="animate-spin" /> : <div className="flex items-center gap-2"><CheckCircle2 /> REGISTRAR AJUSTE</div>}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProductosList;

