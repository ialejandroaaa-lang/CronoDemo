import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowDown, ArrowUp, PauseCircle, Filter } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '../../components/ui/Table';
import { getKardex } from '../../api/kardex';
import { getAlmacenes } from '../../api/almacenes';

const KardexList = () => {
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [almacenes, setAlmacenes] = useState([]);
    const [selectedAlmacen, setSelectedAlmacen] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const alms = await getAlmacenes();
            setAlmacenes(alms);

            // If we have query param or saved preference, we could use it here.
            // For now default to All (empty string)

            const data = await getKardex(selectedAlmacen);
            setMovimientos(data);
        } catch (error) {
            console.error("Error loading kardex:", error);
        } finally {
            setLoading(false);
        }
    };

    // Reload when filter changes
    useEffect(() => {
        loadKardexData();
    }, [selectedAlmacen]);

    const loadKardexData = async () => {
        try {
            setLoading(true);
            const data = await getKardex(selectedAlmacen);
            setMovimientos(data);
        } catch (error) {
            console.error("Error loading kardex data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMovimientos = movimientos.filter(item =>
        (item.producto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.documento || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Kardex de Inventario</h1>
                    <p className="text-sm text-gray-500">Historial detallado de movimientos por producto.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        label="Buscar Producto"
                        placeholder="Código o Nombre"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Filtrar por Almacén</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange"
                            value={selectedAlmacen}
                            onChange={(e) => setSelectedAlmacen(e.target.value)}
                        >
                            <option value="">Todos los Almacenes</option>
                            {almacenes.map(a => (
                                <option key={a.id} value={a.id}>{a.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Movimientos Recientes</CardTitle>
                </CardHeader>
                <div className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Documento</TableHead>
                                <TableHead>Producto</TableHead>
                                <TableHead>Cant Adq</TableHead>
                                <TableHead>U.M.</TableHead>
                                <TableHead className="text-right text-green-700 bg-green-50">Entrada</TableHead>
                                <TableHead className="text-right text-red-700 bg-red-50">Salida</TableHead>
                                <TableHead className="text-right">Costo</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right text-xs text-gray-500">Stock</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={12} className="text-center py-8">Cargando...</TableCell></TableRow>
                            ) : filteredMovimientos.length === 0 ? (
                                <TableRow><TableCell colSpan={12} className="text-center py-8 text-gray-500">No hay movimientos registrados.</TableCell></TableRow>
                            ) : (
                                filteredMovimientos.map((mov) => (
                                    <TableRow key={mov.id}>
                                        <TableCell className="text-gray-600">
                                            {new Date(mov.fechaMovimiento).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center space-x-1 font-medium ${mov.tipoMovimiento === 'Entrada' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {mov.tipoMovimiento === 'Entrada' || mov.cantidad > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                                <span>{mov.tipoMovimiento}</span>
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-blue-600 font-medium">{mov.documento}</TableCell>
                                        <TableCell className="font-medium text-gray-800">{mov.producto}</TableCell>
                                        <TableCell className="font-medium text-orange-700">
                                            {Math.abs(parseFloat(mov.cantidadOriginal ?? mov.cantidad)).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-gray-500">
                                            {mov.unidadOriginal || mov.unidadMedida}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-green-600 bg-green-50/30">
                                            {mov.cantidad > 0 ? parseFloat(mov.cantidad).toLocaleString() : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-red-600 bg-red-50/30">
                                            {mov.cantidad < 0 ? Math.abs(parseFloat(mov.cantidad)).toLocaleString() : '-'}
                                        </TableCell>
                                        <TableCell className="text-right text-gray-600">${parseFloat(mov.costoUnitario).toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-medium">${parseFloat(mov.total).toFixed(2)}</TableCell>
                                        <TableCell className="text-right text-xs text-gray-500">
                                            {mov.stockAnterior?.toFixed(0)} <span className="mx-1">→</span> <strong>{mov.stockNuevo?.toFixed(0)}</strong>
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

export default KardexList;

