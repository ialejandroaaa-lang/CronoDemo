import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { getNivelesPrecio, saveNivelPrecio, updateNivelPrecio, deleteNivelPrecio } from '../../api/nivelesPrecio';
import { useNavigate } from 'react-router-dom';

const NivelesPrecioManager = () => {
    const navigate = useNavigate();
    const [niveles, setNiveles] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState({ id: 0, nombre: '', descripcion: '', activo: true });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getNivelesPrecio();
            setNiveles(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setCurrentItem(item);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setCurrentItem({ id: 0, nombre: '', descripcion: '', activo: true });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Está seguro de eliminar este nivel de precio?')) return;
        try {
            await deleteNivelPrecio(id);
            loadData();
        } catch (err) {
            console.error(err);
            alert("Error al eliminar");
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (currentItem.id) {
                await updateNivelPrecio(currentItem.id, currentItem);
            } else {
                await saveNivelPrecio(currentItem);
            }
            setIsModalOpen(false);
            loadData();
        } catch (err) {
            console.error(err);
            alert("Error al guardar");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/inventario/lista-precios')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Niveles de Precio</h1>
                        <p className="text-gray-500 text-sm">Administre los niveles de precios disponibles para los artículos.</p>
                    </div>
                </div>
                <Button onClick={handleAddNew} className="bg-hd-orange hover:bg-orange-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Nivel
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="w-24 text-center">Activo</TableHead>
                                <TableHead className="w-32 text-center">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">Cargando...</TableCell>
                                </TableRow>
                            ) : niveles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">No hay niveles configurados</TableCell>
                                </TableRow>
                            ) : (
                                niveles.map((nivel) => (
                                    <TableRow key={nivel.id}>
                                        <TableCell className="font-medium">{nivel.nombre}</TableCell>
                                        <TableCell>{nivel.descripcion}</TableCell>
                                        <TableCell className="text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${nivel.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {nivel.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(nivel)}>
                                                    <Edit2 className="h-4 w-4 text-blue-600" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(nivel.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold">
                                {currentItem.id ? 'Editar Nivel' : 'Nuevo Nivel'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <Input
                                    value={currentItem.nombre}
                                    onChange={(e) => setCurrentItem({ ...currentItem, nombre: e.target.value })}
                                    placeholder="Ej: Mayorista"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <Input
                                    value={currentItem.descripcion || ''}
                                    onChange={(e) => setCurrentItem({ ...currentItem, descripcion: e.target.value })}
                                    placeholder="Opcional"
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="activeCheck"
                                    checked={currentItem.activo}
                                    onChange={(e) => setCurrentItem({ ...currentItem, activo: e.target.checked })}
                                    className="h-4 w-4 text-hd-orange border-gray-300 rounded focus:ring-hd-orange"
                                />
                                <label htmlFor="activeCheck" className="text-sm font-medium text-gray-700">Activo</label>
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" className="bg-hd-orange hover:bg-orange-600">Guardar</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NivelesPrecioManager;

