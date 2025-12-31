import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';

const Tipos = () => {
    const navigate = useNavigate();
    const [tipos, setTipos] = useState([
        { id: 1, codigo: 'ELECT', nombre: 'Eléctrico', descripcion: 'Productos eléctricos', activo: true },
        { id: 2, codigo: 'MANUAL', nombre: 'Manual', descripcion: 'Herramientas manuales', activo: true },
        { id: 3, codigo: 'NEUMAT', nombre: 'Neumático', descripcion: 'Herramientas neumáticas', activo: true },
        { id: 4, codigo: 'HIDRA', nombre: 'Hidráulico', descripcion: 'Sistemas hidráulicos', activo: true },
    ]);

    const [searchTerm, setSearchTerm] = useState('');

    const filteredTipos = tipos.filter(t =>
        t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" onClick={() => navigate('/configuracion')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Tipos de Artículos</h1>
                        <p className="text-sm text-gray-500">Gestión de tipos de productos</p>
                    </div>
                </div>
                <Button className="bg-hd-orange hover:bg-orange-600">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Tipo
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
                    <CardTitle>Tipos Registrados ({filteredTipos.length})</CardTitle>
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
                            {filteredTipos.map((tipo) => (
                                <TableRow key={tipo.id}>
                                    <TableCell className="font-medium">{tipo.codigo}</TableCell>
                                    <TableCell className="font-semibold">{tipo.nombre}</TableCell>
                                    <TableCell className="text-gray-600">{tipo.descripcion}</TableCell>
                                    <TableCell className="text-center">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${tipo.activo
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {tipo.activo ? 'Activo' : 'Inactivo'}
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

export default Tipos;

