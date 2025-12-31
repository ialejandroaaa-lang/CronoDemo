import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Search, RefreshCw, Tag, Bookmark, Layers } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import {
    getCategorias, saveCategoria, deleteCategoria,
    getMarcas, saveMarca, deleteMarca,
    getTipos, saveTipo, deleteTipo
} from '../../api/categorias';
import AttributeModal from '../../components/inventario/AttributeModal';

const AttributeSection = ({ title, icon: Icon, data, loading, onAdd, onEdit, onDelete }) => {
    const [filter, setFilter] = useState('');
    const filtered = data.filter(item =>
        item.nombre.toLowerCase().includes(filter.toLowerCase()) ||
        item.codigo.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-hd-orange/10 rounded-lg">
                        <Icon className="h-5 w-5 text-hd-orange" />
                    </div>
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <p className="text-sm text-gray-500">Gestión de {title.toLowerCase()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            placeholder="Buscar..."
                            className="pl-8 w-64 h-9"
                        />
                    </div>
                    <Button size="sm" className="bg-hd-orange hover:bg-orange-600" onClick={onAdd}>
                        <Plus className="h-4 w-4 mr-1" />
                        Nuevo
                    </Button>
                </div>
            </CardHeader>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-32">Código</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="w-24 text-center">Estado</TableHead>
                            <TableHead className="w-24 text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8">Cargando...</TableCell></TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No hay registros</TableCell></TableRow>
                        ) : (
                            filtered.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.codigo}</TableCell>
                                    <TableCell className="font-semibold">{item.nombre}</TableCell>
                                    <TableCell className="text-gray-600">{item.descripcion}</TableCell>
                                    <TableCell className="text-center">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {item.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} className="hover:bg-red-100 hover:text-red-600">
                                                <Trash2 className="h-4 w-4" />
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
    );
};

const AtributosArticulos = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Data States
    const [categorias, setCategorias] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [tipos, setTipos] = useState([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: '', type: '' });
    const [currentItem, setCurrentItem] = useState(null);
    const [error, setError] = useState('');

    const loadRef = {
        categoria: getCategorias,
        marca: getMarcas,
        tipo: getTipos
    };

    const saveRef = {
        categoria: saveCategoria,
        marca: saveMarca,
        tipo: saveTipo
    };

    const deleteRef = {
        categoria: deleteCategoria,
        marca: deleteMarca,
        tipo: deleteTipo
    };

    const loadAll = async () => {
        setLoading(true);
        try {
            const [catData, marcaData, tipoData] = await Promise.all([
                getCategorias(),
                getMarcas(),
                getTipos()
            ]);
            setCategorias(catData);
            setMarcas(marcaData);
            setTipos(tipoData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    const handleOpenModal = (type, item = null) => {
        const titles = { categoria: 'Categoría', marca: 'Marca', tipo: 'Tipo' };
        setModalConfig({ title: titles[type], type });
        setCurrentItem(item); // Pass null or item, let modal handle default
        setIsModalOpen(true);
        setError('');
    };

    const handleSave = async (data) => {
        // Parent does not catch error here, letting Modal catch it to show error message
        await saveRef[modalConfig.type](data);
        await loadAll();
        setIsModalOpen(false);
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm('¿Está seguro de eliminar este registro?')) return;
        try {
            await deleteRef[type](id);
            loadAll();
        } catch (err) {
            console.error(err);
            alert('Error al eliminar');
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" onClick={() => navigate('/configuracion')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Atributos de Artículos</h1>
                        <p className="text-sm text-gray-500">Gestión centralizada de Categorías, Marcas y Tipos</p>
                    </div>
                </div>
                <Button variant="outline" onClick={loadAll} title="Recargar Todo">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <AttributeSection
                title="Categorías"
                icon={Layers}
                data={categorias}
                loading={loading}
                onAdd={() => handleOpenModal('categoria')}
                onEdit={(item) => handleOpenModal('categoria', item)}
                onDelete={(id) => handleDelete('categoria', id)}
            />

            <AttributeSection
                title="Marcas"
                icon={Tag}
                data={marcas}
                loading={loading}
                onAdd={() => handleOpenModal('marca')}
                onEdit={(item) => handleOpenModal('marca', item)}
                onDelete={(id) => handleDelete('marca', id)}
            />

            <AttributeSection
                title="Tipos"
                icon={Bookmark}
                data={tipos}
                loading={loading}
                onAdd={() => handleOpenModal('tipo')}
                onEdit={(item) => handleOpenModal('tipo', item)}
                onDelete={(id) => handleDelete('tipo', id)}
            />

            <AttributeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                title={modalConfig.title}
                type={modalConfig.type}
                initialData={currentItem}
                error={error}
            />
        </div>
    );
};

export default AtributosArticulos;
