import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, ListFilter, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '../../components/ui/Table';
import { getProveedores, deleteProveedor } from '../../api/proveedores';

const ProveedoresList = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getProveedores();
            setProveedores(data);
        } catch (error) {
            console.error("Error loading suppliers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este proveedor?')) {
            try {
                await deleteProveedor(id);
                loadData(); // Reload list
            } catch (error) {
                console.error("Error deleting supplier:", error);
                alert("Error al eliminar proveedor");
            }
        }
    };

    const filteredProveedores = proveedores.filter(item =>
        item.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.contacto && item.contacto.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Proveedores</h1>
                    <p className="text-sm text-gray-500">Gestione la información de sus proveedores y órdenes de compra.</p>
                </div>
                <Button onClick={() => navigate('/proveedores/nuevo')} className="bg-gray-800 hover:bg-gray-900 shadow-lg">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Proveedor
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle>Listado General</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Buscar proveedor..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                                        Empresa <ListFilter size={14} className="text-gray-400 group-hover:text-gray-600" />
                                    </div>
                                </TableHead>
                                <TableHead className="hidden md:table-cell">
                                    <div className="flex items-center gap-2 cursor-pointer hover:text-gray-900 group">
                                        Contacto <ListFilter size={14} className="text-gray-400 group-hover:text-gray-600" />
                                    </div>
                                </TableHead>
                                <TableHead className="hidden md:table-cell">
                                    <div className="flex items-center gap-2 cursor-pointer hover:text-gray-900 group">
                                        Teléfono <ListFilter size={14} className="text-gray-400 group-hover:text-gray-600" />
                                    </div>
                                </TableHead>
                                <TableHead className="hidden lg:table-cell">
                                    <div className="flex items-center gap-2 cursor-pointer hover:text-gray-900 group">
                                        Email <ListFilter size={14} className="text-gray-400 group-hover:text-gray-600" />
                                    </div>
                                </TableHead>
                                <TableHead>
                                    <div className="flex items-center gap-2 cursor-pointer hover:text-gray-900 group">
                                        Estado <ListFilter size={14} className="text-gray-400 group-hover:text-gray-600" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-right">
                                    <div className="flex items-center justify-end gap-2 cursor-pointer hover:text-gray-900 group">
                                        Deuda Total <ListFilter size={14} className="text-gray-400 group-hover:text-gray-600" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProveedores.map((item) => (
                                <TableRow key={item.id} className="cursor-pointer">
                                    <TableCell className="font-medium">{item.codigoProveedor}</TableCell>
                                    <TableCell>
                                        <div className="font-medium text-gray-900">{item.razonSocial}</div>
                                        <div className="text-xs text-gray-500">{item.numeroDocumento}</div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-gray-600">{item.contacto}</TableCell>
                                    <TableCell className="hidden md:table-cell text-gray-600">{item.telefono}</TableCell>
                                    <TableCell className="hidden lg:table-cell text-gray-600">{item.correo}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.activo ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {item.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end">
                                            <span className={`font-bold ${item.deudaTotal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                RD$ {item.deudaTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                            {item.deudaTotal > 0 && <span className="text-[10px] text-gray-400 italic">Balance Consolidado</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => navigate('/cuentas-por-pagar/pagos')}
                                                className="h-10 w-10 p-2 rounded-full text-green-600 hover:text-green-800 hover:bg-green-100 transition-all border border-transparent hover:border-green-200 shadow-sm"
                                                title="Registrar Pago"
                                            >
                                                <DollarSign className="h-6 w-6 stroke-[1.5]" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => navigate(`/proveedores/editar/${item.id}`)}
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
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};

export default ProveedoresList;


