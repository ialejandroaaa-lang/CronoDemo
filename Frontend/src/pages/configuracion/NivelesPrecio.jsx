import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';

const NivelesPrecio = () => {
    const navigate = useNavigate();
    const [niveles, setNiveles] = useState([
        {
            id: 1,
            codigo: 'RETAIL',
            nombre: 'Precio al Detalle',
            descripcion: 'Precio estándar para venta al público',
            margen: 30.00,
            activo: true
        },
        {
            id: 2,
            codigo: 'MAYOREO',
            nombre: 'Precio al Mayoreo',
            descripcion: 'Precio para compras al por mayor',
            margen: 15.00,
            activo: true
        },
        {
            id: 3,
            codigo: 'DISTRIBUIDOR',
            nombre: 'Precio Distribuidor',
            descripcion: 'Precio especial para distribuidores',
            margen: 10.00,
            activo: true
        },
        {
            id: 4,
            codigo: 'VIP',
            nombre: 'Precio VIP',
            descripcion: 'Precio preferencial para clientes VIP',
            margen: 25.00,
            activo: true
        },
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingNivel, setEditingNivel] = useState(null);

    const filteredNiveles = niveles.filter(n =>
        n.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleNew = () => {
        setEditingNivel({
            codigo: '',
            nombre: '',
            descripcion: '',
            margen: 0,
            activo: true
        });
        setShowForm(true);
    };

    const handleEdit = (nivel) => {
        setEditingNivel({ ...nivel });
        setShowForm(true);
    };

    const handleSave = () => {
        if (editingNivel.id) {
            setNiveles(niveles.map(n => n.id === editingNivel.id ? editingNivel : n));
        } else {
            setNiveles([...niveles, { ...editingNivel, id: Date.now() }]);
        }
        setShowForm(false);
        setEditingNivel(null);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingNivel(null);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" onClick={() => navigate('/configuracion')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Niveles de Precio</h1>
                        <p className="text-sm text-gray-500">Configuración de niveles de precio para productos</p>
                    </div>
                </div>
                {!showForm && (
                    <Button className="bg-hd-orange hover:bg-orange-600" onClick={handleNew}>
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Nivel
                    </Button>
                )}
            </div>

            {showForm ? (
                <Card>
                    <CardHeader>
                        <CardTitle>{editingNivel?.id ? 'Editar Nivel de Precio' : 'Nuevo Nivel de Precio'}</CardTitle>
                    </CardHeader>
                    <div className="p-6 space-y-6">
                        {/* Dynamics GP Style Form */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Código *</label>
                                    <Input
                                        value={editingNivel?.codigo || ''}
                                        onChange={(e) => setEditingNivel({ ...editingNivel, codigo: e.target.value.toUpperCase() })}
                                        placeholder="Ej: RETAIL"
                                        className="uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Nombre *</label>
                                    <Input
                                        value={editingNivel?.nombre || ''}
                                        onChange={(e) => setEditingNivel({ ...editingNivel, nombre: e.target.value })}
                                        placeholder="Ej: Precio al Detalle"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Margen % *</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={editingNivel?.margen || ''}
                                        onChange={(e) => setEditingNivel({ ...editingNivel, margen: parseFloat(e.target.value) })}
                                        placeholder="0.00"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Porcentaje de margen sobre el costo</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Descripción</label>
                                    <textarea
                                        value={editingNivel?.descripcion || ''}
                                        onChange={(e) => setEditingNivel({ ...editingNivel, descripcion: e.target.value })}
                                        placeholder="Descripción del nivel de precio..."
                                        rows="4"
                                        className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange resize-none"
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="activo"
                                        checked={editingNivel?.activo || false}
                                        onChange={(e) => setEditingNivel({ ...editingNivel, activo: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300 text-hd-orange focus:ring-hd-orange"
                                    />
                                    <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                                        Nivel Activo
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons - Dynamics GP Style */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="outline" onClick={handleCancel}>
                                <X className="mr-2 h-4 w-4" />
                                Cancelar
                            </Button>
                            <Button className="bg-hd-orange hover:bg-orange-600" onClick={handleSave}>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar
                            </Button>
                        </div>
                    </div>
                </Card>
            ) : (
                <>
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
                            <CardTitle>Niveles de Precio Registrados ({filteredNiveles.length})</CardTitle>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-32">Código</TableHead>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead className="w-24 text-right">Margen %</TableHead>
                                        <TableHead className="w-24 text-center">Estado</TableHead>
                                        <TableHead className="w-32 text-center">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredNiveles.map((nivel) => (
                                        <TableRow key={nivel.id}>
                                            <TableCell className="font-medium">{nivel.codigo}</TableCell>
                                            <TableCell className="font-semibold">{nivel.nombre}</TableCell>
                                            <TableCell className="text-gray-600">{nivel.descripcion}</TableCell>
                                            <TableCell className="text-right font-medium text-green-700">{nivel.margen.toFixed(2)}%</TableCell>
                                            <TableCell className="text-center">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${nivel.activo
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {nivel.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(nivel)}>
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
                </>
            )}
        </div>
    );
};

export default NivelesPrecio;


