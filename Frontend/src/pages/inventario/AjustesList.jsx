import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ListFilter } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { getAjustes } from '../../api/ajustes';


import AjusteDetailModal from './AjusteDetailModal'; // Import Modal

const AjustesList = () => {
    const navigate = useNavigate();
    const [ajustes, setAjustes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedAjusteId, setSelectedAjusteId] = useState(null); // State for modal

    useEffect(() => {
        getAjustes()
            .then(data => setAjustes(data))
            .catch(err => console.error('Error loading ajustes', err))
            .finally(() => setLoading(false));
    }, []);

    const filteredAjustes = searchTerm
        ? ajustes.filter(a =>
            (a.documento && a.documento.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (a.motivo && a.motivo.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (a.tipo && a.tipo.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : ajustes;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Ajustes de Inventario</h1>
                    <p className="text-sm text-gray-500">Registre entradas y salidas manuales de mercancía.</p>
                </div>
                <Button onClick={() => navigate('/ajustes/nuevo')} className="bg-hd-orange hover:bg-orange-600 shadow-md">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Ajuste
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle>Historial de Ajustes</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Buscar ajuste..."
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
                                <TableHead className="w-[120px]">Documento</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Motivo</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        Cargando ajustes...
                                    </TableCell>
                                </TableRow>
                            ) : filteredAjustes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        No hay ajustes registrados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAjustes.map((ajuste) => (
                                    <TableRow key={ajuste.id || ajuste.documento} className="group hover:bg-gray-50/50">
                                        <TableCell className="font-mono text-gray-700">{ajuste.documento}</TableCell>
                                        <TableCell>{new Date(ajuste.fecha).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${ajuste.tipo === 'Entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {ajuste.tipo}
                                            </span>
                                        </TableCell>
                                        <TableCell>{ajuste.motivo}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-hd-orange hover:text-orange-700 hover:bg-orange-50"
                                                onClick={() => setSelectedAjusteId(ajuste.id)}
                                            >
                                                Ver Detalle
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Detail Modal */}
            {selectedAjusteId && (
                <AjusteDetailModal
                    ajusteId={selectedAjusteId}
                    onClose={() => setSelectedAjusteId(null)}
                />
            )}
        </div>
    );
};

export default AjustesList;


