import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ListFilter, Eye, FileText, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '../../components/ui/Table';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const TransferenciasList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [transferencias, setTransferencias] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const handleDelete = async (id) => {
        if (!window.confirm("¿Está seguro que desea eliminar esta transferencia? Esta acción no se puede deshacer.")) return;

        try {
            const res = await fetch(`${API_BASE}/Transferencias/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setTransferencias(prev => prev.filter(t => (t.id || t.Id) !== id));
            } else {
                alert("Error al eliminar la transferencia");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión al eliminar");
        }
    };

    useEffect(() => {
        const fetchTransferencias = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_BASE}/Transferencias`);
                if (!res.ok) throw new Error("Error loading transfers");
                const data = await res.json();
                setTransferencias(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchTransferencias();
    }, []);

    const filtered = transferencias.filter(t => {
        const num = t.numeroTransferencia || t.NumeroTransferencia || '';
        const origen = t.almacenOrigen || t.AlmacenOrigen || '';
        const destino = t.almacenDestino || t.AlmacenDestino || '';
        const term = searchTerm.toLowerCase();

        return num.toLowerCase().includes(term) ||
            origen.toLowerCase().includes(term) ||
            destino.toLowerCase().includes(term);
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Transferencias de Inventario</h1>
                    <p className="text-sm text-gray-500">Gestione y rastree el movimiento de artículos entre ubicaciones.</p>
                </div>
                <Button onClick={() => navigate('/transferencias/nuevo')} className="bg-hd-orange hover:bg-orange-600 shadow-md">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Transferencia
                </Button>
            </div>

            <Card className="border-none shadow-lg overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gray-50/50">
                    <CardTitle className="text-lg font-bold">Historial de Movimientos</CardTitle>
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar por No. u Almacén..."
                            className="pl-10 h-10 border-gray-200 focus:border-hd-orange"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>

                <div className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-100/50">
                            <TableRow>
                                <TableHead className="w-[140px] font-bold">No. Documento</TableHead>
                                <TableHead className="w-[120px] font-bold">Fecha</TableHead>
                                <TableHead className="font-bold">Origen</TableHead>
                                <TableHead className="font-bold">Destino</TableHead>
                                <TableHead className="w-[120px] text-center font-bold">Estado</TableHead>
                                <TableHead className="w-[100px] text-right font-bold">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-gray-400">
                                        Cargando transferencias...
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-gray-500">
                                        No se encontraron transferencias que coincidan con la búsqueda.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((t) => (
                                    <TableRow key={t.id || t.Id} className="hover:bg-gray-50 transition-colors">
                                        <TableCell className="font-mono text-xs font-bold text-hd-orange">{t.numeroTransferencia || t.NumeroTransferencia}</TableCell>
                                        <TableCell className="text-xs">
                                            {new Date(t.fecha || t.Fecha).toLocaleDateString('es-DO')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-xs">
                                                <div className="h-2 w-2 rounded-full bg-red-400 mr-2"></div>
                                                {t.almacenOrigen || t.AlmacenOrigen}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-xs">
                                                <div className="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
                                                {t.almacenDestino || t.AlmacenDestino}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-tighter">
                                                {t.estado || t.Estado}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 w-9 p-0 hover:bg-orange-50 hover:text-hd-orange transition-colors"
                                                    title="Ver detalles"
                                                    onClick={() => navigate(`/transferencias/editar/${t.id || t.Id}`)}
                                                >
                                                    <Eye size={20} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-500 transition-colors"
                                                    title="Eliminar"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(t.id || t.Id); }}
                                                >
                                                    <Trash2 size={20} />
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
        </div>
    );
};

export default TransferenciasList;

