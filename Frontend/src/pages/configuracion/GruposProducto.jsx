import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, ArrowRight, Package } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { getGruposProducto, saveGrupoProducto, deleteGrupoProducto } from '../../api/gruposProducto';
import GrupoProductoModal from '../../components/inventario/GrupoProductoModal';

const GruposProducto = () => {
    const navigate = useNavigate();
    const [grupos, setGrupos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGrupo, setSelectedGrupo] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getGruposProducto();
            setGrupos(data);
        } catch (error) {
            console.error("Error loading product groups:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (formData) => {
        try {
            await saveGrupoProducto(formData);
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error("Error saving group:", error);
            alert("Error al guardar el grupo");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este grupo?')) {
            try {
                await deleteGrupoProducto(id);
                loadData();
            } catch (error) {
                console.error("Error deleting group:", error);
                alert("Error al eliminar el grupo");
            }
        }
    };

    const handleEdit = (grupo) => {
        setSelectedGrupo(grupo);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setSelectedGrupo(null);
        setIsModalOpen(true);
    };

    const filteredGrupos = grupos.filter(g =>
        g.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-hd-orange/10 rounded-lg">
                        <Package className="h-6 w-6 text-hd-orange" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Grupos de Producto</h1>
                        <p className="text-sm text-gray-500">Categorización y agrupación técnica de artículos.</p>
                    </div>
                </div>
                <Button className="bg-hd-orange hover:bg-orange-700 text-white shadow-lg" onClick={handleNew}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Grupo
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-orange-50 border-orange-100">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-hd-orange uppercase">Total Grupos</p>
                        <p className="text-3xl font-bold text-hd-black">{grupos.length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-green-600 uppercase">Activos</p>
                        <p className="text-3xl font-bold text-green-700">{grupos.filter(g => g.activo).length}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle>Catálogo de Grupos</CardTitle>
                    <div className="relative w-64 text-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Buscar grupo..."
                            className="pl-9 h-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50">
                                <TableHead className="w-32 font-bold">Código</TableHead>
                                <TableHead className="font-bold">Nombre</TableHead>
                                <TableHead className="font-bold">Descripción</TableHead>
                                <TableHead className="w-24 text-center font-bold">Estado</TableHead>
                                <TableHead className="w-32 text-center font-bold">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-8">Cargando grupos...</TableCell></TableRow>
                            ) : filteredGrupos.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500 font-medium">No se encontraron grupos registrados.</TableCell></TableRow>
                            ) : (
                                filteredGrupos.map((grupo) => (
                                    <TableRow key={grupo.id} className="hover:bg-gray-50 transition-colors group">
                                        <TableCell className="font-mono text-hd-orange font-bold text-sm tracking-widest">{grupo.codigo}</TableCell>
                                        <TableCell className="font-bold text-hd-black">{grupo.nombre}</TableCell>
                                        <TableCell className="text-gray-500 text-sm italic">{grupo.descripcion || 'Sin descripción'}</TableCell>
                                        <TableCell className="text-center">
                                            <span className={`inline-flex px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wider ${grupo.activo
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {grupo.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(grupo)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50" onClick={() => handleDelete(grupo.id)}>
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

            <GrupoProductoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                grupo={selectedGrupo}
            />
        </div>
    );
};

export default GruposProducto;

