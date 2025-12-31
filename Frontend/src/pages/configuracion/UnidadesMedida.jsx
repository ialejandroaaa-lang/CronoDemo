import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';

const UnidadesMedida = () => {
    const navigate = useNavigate();
    const [unidades, setUnidades] = useState([
        { id: 1, codigo: 'UND', nombre: 'Unidad', tipo: 'Cantidad', decimales: 0, activo: true },
        { id: 2, codigo: 'CAJA', nombre: 'Caja', tipo: 'Cantidad', decimales: 0, activo: true },
        { id: 3, codigo: 'M', nombre: 'Metro', tipo: 'Longitud', decimales: 2, activo: true },
        { id: 4, codigo: 'M2', nombre: 'Metro Cuadrado', tipo: 'Área', decimales: 2, activo: true },
        { id: 5, codigo: 'M3', nombre: 'Metro Cúbico', tipo: 'Volumen', decimales: 3, activo: true },
        { id: 6, codigo: 'KG', nombre: 'Kilogramo', tipo: 'Peso', decimales: 3, activo: true },
        { id: 7, codigo: 'LT', nombre: 'Litro', tipo: 'Volumen', decimales: 2, activo: true },
        { id: 8, codigo: 'GL', nombre: 'Galón', tipo: 'Volumen', decimales: 2, activo: true },
    ]);

    const [searchTerm, setSearchTerm] = useState('');

    const filteredUnidades = unidades.filter(u =>
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" onClick={() => navigate('/configuracion')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Unidades de Medida</h1>
                        <p className="text-sm text-gray-500">Gestión de unidades para control de inventario</p>
                    </div>
                </div>
                <Button className="bg-hd-orange hover:bg-orange-600">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Unidad
                </Button>
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
                    <CardTitle>Unidades Registradas ({filteredUnidades.length})</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-24">Código</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead className="w-32">Tipo</TableHead>
                                <TableHead className="w-32 text-center">Decimales</TableHead>
                                <TableHead className="w-24 text-center">Estado</TableHead>
                                <TableHead className="w-32 text-center">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUnidades.map((unidad) => (
                                <TableRow key={unidad.id}>
                                    <TableCell className="font-medium">{unidad.codigo}</TableCell>
                                    <TableCell className="font-semibold">{unidad.nombre}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                                            {unidad.tipo}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">{unidad.decimales}</TableCell>
                                    <TableCell className="text-center">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${unidad.activo
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {unidad.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};

export default UnidadesMedida;

