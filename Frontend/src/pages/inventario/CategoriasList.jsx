import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, ListFilter } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '../../components/ui/Table';

const CategoriasList = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Categorías</h1>
                    <p className="text-sm text-gray-500">Gestione las familias y categorías de productos.</p>
                </div>
                <Button onClick={() => navigate('/categorias/nuevo')} className="bg-hd-orange hover:bg-orange-600 shadow-md">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle>Listado de Categorías</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Buscar categoría..."
                            className="pl-9"
                        />
                    </div>
                </CardHeader>

                <div className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">
                                    <div className="flex items-center gap-2 cursor-pointer hover:text-gray-900 group">
                                        Código <ListFilter size={14} className="text-gray-400 group-hover:text-gray-600" />
                                    </div>
                                </TableHead>
                                <TableHead>
                                    <div className="flex items-center gap-2 cursor-pointer hover:text-gray-900 group">
                                        Nombre <ListFilter size={14} className="text-gray-400 group-hover:text-gray-600" />
                                    </div>
                                </TableHead>
                                <TableHead>
                                    <div className="flex items-center gap-2 cursor-pointer hover:text-gray-900 group">
                                        Descripción <ListFilter size={14} className="text-gray-400 group-hover:text-gray-600" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                    No hay categorías registradas.
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};

export default CategoriasList;

