import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, ListFilter, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Card, CardContent } from '../../components/ui/Card';

const ClientesList = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await fetch('http://localhost:5006/api/Clients');
            if (response.ok) {
                const data = await response.json();
                const items = Array.isArray(data) ? data : (data.value || []);
                setClients(items);
            } else {
                const errorText = await response.text();
                console.error('Failed to fetch clients:', response.status, errorText);
                alert('Error al cargar clientes: ' + errorText);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este cliente?')) {
            try {
                const response = await fetch(`http://localhost:5006/api/Clients/${id}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    fetchClients();
                } else {
                    alert('Error al eliminar');
                }
            } catch (error) {
                console.error('Error deleting client:', error);
            }
        }
    };

    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedClients = React.useMemo(() => {
        let sortableItems = [...clients];
        if (searchTerm) {
            sortableItems = sortableItems.filter(client => {
                const name = client.name || client.Name || '';
                const company = client.company || client.Company || '';
                const code = client.code || client.Code || '';
                return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    code.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }

        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key] ? a[sortConfig.key].toString().toLowerCase() : '';
                const bValue = b[sortConfig.key] ? b[sortConfig.key].toString().toLowerCase() : '';

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [clients, searchTerm, sortConfig]);

    const renderSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) return <ListFilter size={14} className="opacity-30" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} className="text-hd-orange" />
            : <ArrowDown size={14} className="text-hd-orange" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Clientes</h1>
                    <p className="text-sm text-gray-500">Gestión de cartera de clientes</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="text-gray-600 border-gray-300 hover:bg-gray-50">
                        <Filter className="mr-2 h-4 w-4" /> Filtros
                    </Button>
                    <Button onClick={() => navigate('/clientes/nuevo')} className="bg-hd-orange hover:bg-orange-600 text-white shadow-md">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
                    </Button>
                </div>
            </div>

            {/* Summary Cards (Static for now or calculated from data) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500 font-medium">Total Clientes</p>
                        <h3 className="text-2xl font-bold text-gray-800">{clients.length}</h3>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500 font-medium">Activos</p>
                        <h3 className="text-2xl font-bold text-gray-800">{clients.filter(c => c.status === 'Active').length}</h3>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500 font-medium">Crédito Disponible</p>
                        <h3 className="text-2xl font-bold text-gray-800">$1.2M</h3>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500 font-medium">Saldo Vencido</p>
                        <h3 className="text-2xl font-bold text-gray-800">$45.2k</h3>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar por nombre, empresa o código..."
                            className="pl-9 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-100/90 border-b-2 border-gray-200">
                            <TableRow>
                                <TableHead onClick={() => handleSort('code')} className="w-[100px] font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors select-none">
                                    <div className="flex items-center space-x-2">
                                        <span>Código</span>
                                        {renderSortIcon('code')}
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('name')} className="font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors select-none">
                                    <div className="flex items-center space-x-2">
                                        <span>Nombre</span>
                                        {renderSortIcon('name')}
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('company')} className="font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors select-none">
                                    <div className="flex items-center space-x-2">
                                        <span>Empresa</span>
                                        {renderSortIcon('company')}
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('phone')} className="font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors select-none">
                                    <div className="flex items-center space-x-2">
                                        <span>Teléfono</span>
                                        {renderSortIcon('phone')}
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('email')} className="font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors select-none">
                                    <div className="flex items-center space-x-2">
                                        <span>Email</span>
                                        {renderSortIcon('email')}
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('status')} className="font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors select-none">
                                    <div className="flex items-center space-x-2">
                                        <span>Estado</span>
                                        {renderSortIcon('status')}
                                    </div>
                                </TableHead>
                                <TableHead className="text-right font-bold text-gray-700">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">Cargando clientes...</TableCell>
                                </TableRow>
                            ) : sortedClients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">No se encontraron clientes</TableCell>
                                </TableRow>
                            ) : (
                                sortedClients.map((client) => (
                                    <TableRow key={client.id || client.Id} className="hover:bg-gray-50 transition-colors">
                                        <TableCell className="font-medium text-gray-900">{client.code || client.Code}</TableCell>
                                        <TableCell className="font-medium text-gray-800">{client.name || client.Name}</TableCell>
                                        <TableCell className="text-gray-600">{(client.company || client.Company) || '-'}</TableCell>
                                        <TableCell className="text-gray-600 text-sm">{client.phone || client.Phone}</TableCell>
                                        <TableCell className="text-gray-600 text-sm">{client.email || client.Email}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(client.status || client.Status) === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {(client.status || client.Status) === 'Active' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => navigate(`/clientes/editar/${client.id}`)}
                                                    className="h-10 w-10 p-2 rounded-full text-blue-600 hover:text-blue-800 hover:bg-blue-100 transition-all border border-transparent hover:border-blue-200 shadow-sm"
                                                    title="Editar"
                                                >
                                                    <Edit className="h-6 w-6 stroke-[1.5]" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(client.id)}
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

export default ClientesList;
