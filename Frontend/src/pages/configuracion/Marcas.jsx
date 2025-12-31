import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';

const Marcas = () => {
    const navigate = useNavigate();
    const [marcas, setMarcas] = useState([
        { id: 1, codigo: 'DEWALT', nombre: 'DeWalt', descripcion: 'Herramientas profesionales', activo: true },
        { id: 2, codigo: 'BOSCH', nombre: 'Bosch', descripcion: 'Tecnología alemana', activo: true },
        { id: 3, codigo: 'MAKITA', nombre: 'Makita', descripcion: 'Herramientas eléctricas', activo: true },
        { id: 4, codigo: 'STANLEY', nombre: 'Stanley', descripcion: 'Herramientas manuales', activo: true },
    ]);

    const [searchTerm, setSearchTerm] = useState('');

    const filteredMarcas = marcas.filter(m =>
        m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" onClick={() => navigate('/configuracion')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Marcas</h1>
                        <p className="text-sm text-gray-500">Gestión de marcas de productos</p>
                    </div>
                </div>
                <Button className="bg-hd-orange hover:bg-orange-600">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Marca
                </Button>
            </div>

            <Card>
                <div className="p-4">
                    <Input
                        placeholder="Buscar por código o nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Marcas Registradas ({filteredMarcas.length})</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-32">Código</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="w-24 text-center">Estado</TableHead>
                                <TableHead className="w-32 text-center">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMarcas.map((marca) => (
                                <TableRow key={marca.id}>
                                    <TableCell className="font-medium">{marca.codigo}</TableCell>
                                    <TableCell className="font-semibold">{marca.nombre}</TableCell>
                                    <TableCell className="text-gray-600">{marca.descripcion}</TableCell>
                                    <TableCell className="text-center">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${marca.activo
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {marca.activo ? 'Activo' : 'Inactivo'}
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

export default Marcas;
