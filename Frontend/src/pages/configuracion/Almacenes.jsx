import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { getAlmacenes, saveAlmacen, deleteAlmacen } from '../../api/almacenes';
import AlmacenModal from '../../components/inventario/AlmacenModal';

const Almacenes = () => {
    const navigate = useNavigate();
    const [almacenes, setAlmacenes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [error, setError] = useState('');

    const loadAlmacenes = async () => {
        setLoading(true);
        try {
            const data = await getAlmacenes();
            setAlmacenes(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAlmacenes();
    }, []);

    const filteredAlmacenes = almacenes.filter(a =>
        (a.nombre || a.Nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.codigo || a.Codigo || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (item = null) => {
        setCurrentItem(item);
        setIsModalOpen(true);
        setError('');
    };

    const handleSave = async (data) => {
        await saveAlmacen(data);
        await loadAlmacenes();
        setIsModalOpen(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Está seguro de eliminar este almacén?')) return;
        try {
            await deleteAlmacen(id);
            loadAlmacenes();
        } catch (err) {
            console.error(err);
            alert('Error al eliminar');
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" onClick={() => navigate('/configuracion')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Almacenes</h1>
                        <p className="text-sm text-gray-500">Gestión de ubicaciones de inventario</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={loadAlmacenes} title="Recargar">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button className="bg-hd-orange hover:bg-orange-600" onClick={() => handleOpenModal()}>
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Almacén
                    </Button>
                </div>
            </div>

            {/* Search */}
            <Card>
                <div className="p-4">
                    <Input
                        placeholder="Buscar por código o nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </Card>

            {/* Grid */}
            <Card>
                <CardHeader>
                    <CardTitle>Almacenes Registrados ({filteredAlmacenes.length})</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-32">Código</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Dirección</TableHead>
                                <TableHead className="w-40">Ciudad</TableHead>
                                <TableHead className="w-24 text-center">Estado</TableHead>
                                <TableHead className="w-32 text-center">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell></TableRow>
                            ) : filteredAlmacenes.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No hay registros</TableCell></TableRow>
                            ) : (
                                filteredAlmacenes.map((almacen) => {
                                    const id = almacen.id || almacen.Id;
                                    const codigo = almacen.codigo || almacen.Codigo;
                                    const nombre = almacen.nombre || almacen.Nombre;
                                    const direccion = almacen.direccion || almacen.Direccion;
                                    const ciudad = almacen.ciudad || almacen.Ciudad;
                                    const activo = almacen.activo !== undefined ? almacen.activo : almacen.Activo;

                                    return (
                                        <TableRow key={id}>
                                            <TableCell className="font-medium">{codigo}</TableCell>
                                            <TableCell className="font-semibold">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-gray-400" />
                                                    {nombre}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600">{direccion}</TableCell>
                                            <TableCell>{ciudad}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${activo
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal(almacen)}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(id)} className="hover:bg-red-100 hover:text-red-600">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <AlmacenModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={currentItem}
                error={error}
            />
        </div>
    );
};

export default Almacenes;
