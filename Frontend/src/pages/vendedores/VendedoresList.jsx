import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, ListFilter } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';

const VendedoresList = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSellers();
    }, []);

    const fetchSellers = async () => {
        try {
            const response = await fetch('http://localhost:5006/api/Sellers');
            if (response.ok) {
                const data = await response.json();
                setSellers(data);
            } else {
                console.error('Failed to fetch sellers');
            }
        } catch (error) {
            console.error('Error fetching sellers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este vendedor?')) {
            try {
                const response = await fetch(`http://localhost:5006/api/Sellers/${id}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    fetchSellers();
                } else {
                    alert('Error al eliminar');
                }
            } catch (error) {
                console.error('Error deleting seller:', error);
            }
        }
    };

    const filteredSellers = sellers.filter(seller =>
        seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Vendedores</h1>
                    <p className="text-sm text-gray-500">Gestión del equipo de ventas</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => navigate('/vendedores/nuevo')} className="bg-hd-orange hover:bg-orange-600 text-white shadow-md">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Vendedor
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar por nombre o código..."
                            className="pl-9 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-100/80">
                            <TableRow>
                                <TableHead className="w-[100px] font-semibold text-gray-700">Código</TableHead>
                                <TableHead className="font-semibold text-gray-700">Nombre</TableHead>
                                <TableHead className="font-semibold text-gray-700">Teléfono</TableHead>
                                <TableHead className="font-semibold text-gray-700">Email</TableHead>
                                <TableHead className="font-semibold text-gray-700">Estado</TableHead>
                                <TableHead className="text-right font-semibold text-gray-700">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">Cargando vendedores...</TableCell>
                                </TableRow>
                            ) : filteredSellers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">No se encontraron vendedores</TableCell>
                                </TableRow>
                            ) : (
                                filteredSellers.map((seller) => (
                                    <TableRow key={seller.id} className="hover:bg-gray-50 transition-colors">
                                        <TableCell className="font-medium text-gray-900">{seller.code}</TableCell>
                                        <TableCell className="font-medium text-gray-800">{seller.name}</TableCell>
                                        <TableCell className="text-gray-600 text-sm">{seller.phone}</TableCell>
                                        <TableCell className="text-gray-600 text-sm">{seller.email}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${seller.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {seller.status === 'Active' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => navigate(`/vendedores/editar/${seller.id}`)}
                                                    className="h-10 w-10 p-2 rounded-full text-blue-600 hover:text-blue-800 hover:bg-blue-100 transition-all border border-transparent hover:border-blue-200 shadow-sm"
                                                    title="Editar"
                                                >
                                                    <Edit className="h-6 w-6 stroke-[1.5]" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(seller.id)}
                                                    className="h-10 w-10 p-2 rounded-full text-red-600 hover:text-red-800 hover:bg-red-100 transition-all border border-transparent hover:border-red-200 shadow-sm"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="h-6 w-6 stroke-[1.5]" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default VendedoresList;


