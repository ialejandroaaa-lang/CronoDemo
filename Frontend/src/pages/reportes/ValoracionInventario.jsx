import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { getValoracionInventario } from '../../api/reportes';
import { DollarSign, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

const ValoracionInventario = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const result = await getValoracionInventario();
            setData(result);
        } catch (error) {
            console.error("Error loading valuation:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data.filter(item =>
        (item.numeroArticulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate Totals
    const totals = filteredData.reduce((acc, item) => ({
        promedio: acc.promedio + item.totalPromedio,
        fifo: acc.fifo + item.totalFIFO,
        lifo: acc.lifo + item.totalLIFO,
        estandar: acc.estandar + item.totalEstandar
    }), { promedio: 0, fifo: 0, lifo: 0, estandar: 0 });

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Valoración de Inventario</h1>
                <p className="text-sm text-gray-500">Comparativa de métodos de valuación (Promedio, FIFO, LIFO, Estándar).</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600">Costo Promedio</p>
                                <p className="text-2xl font-bold text-blue-900">{formatCurrency(totals.promedio)}</p>
                            </div>
                            <BarChart3 className="text-blue-400" size={24} />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600">FIFO (PEPS)</p>
                                <p className="text-2xl font-bold text-green-900">{formatCurrency(totals.fifo)}</p>
                            </div>
                            <TrendingUp className="text-green-400" size={24} />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-orange-600">LIFO (UEPS)</p>
                                <p className="text-2xl font-bold text-orange-900">{formatCurrency(totals.lifo)}</p>
                            </div>
                            <TrendingDown className="text-orange-400" size={24} />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Costo Estándar</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.estandar)}</p>
                            </div>
                            <DollarSign className="text-gray-400" size={24} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <div className="p-4 border-b border-gray-200">
                    <Input
                        placeholder="Buscar por código o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-md"
                    />
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead rowSpan={2}>Artículo</TableHead>
                                <TableHead rowSpan={2} className="text-right">Stock</TableHead>
                                <TableHead colSpan={2} className="text-center bg-blue-50/50">Promedio</TableHead>
                                <TableHead colSpan={2} className="text-center bg-green-50/50">FIFO</TableHead>
                                <TableHead colSpan={2} className="text-center bg-orange-50/50">LIFO</TableHead>
                                <TableHead colSpan={2} className="text-center bg-gray-50/50">Estándar</TableHead>
                            </TableRow>
                            <TableRow>
                                {/* Promedio */}
                                <TableHead className="text-right bg-blue-50/30 text-xs">Costo</TableHead>
                                <TableHead className="text-right bg-blue-50/30 text-xs font-bold">Total</TableHead>
                                {/* FIFO */}
                                <TableHead className="text-right bg-green-50/30 text-xs">Costo</TableHead>
                                <TableHead className="text-right bg-green-50/30 text-xs font-bold">Total</TableHead>
                                {/* LIFO */}
                                <TableHead className="text-right bg-orange-50/30 text-xs">Costo</TableHead>
                                <TableHead className="text-right bg-orange-50/30 text-xs font-bold">Total</TableHead>
                                {/* Estandar */}
                                <TableHead className="text-right bg-gray-50/30 text-xs">Costo</TableHead>
                                <TableHead className="text-right bg-gray-50/30 text-xs font-bold">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-8">Cargando valoración...</TableCell>
                                </TableRow>
                            ) : filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">No se encontraron artículos con existencia.</TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium">{item.numeroArticulo}</div>
                                            <div className="text-xs text-gray-500">{item.descripcion}</div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{item.stockActual.toFixed(2)}</TableCell>

                                        {/* Promedio */}
                                        <TableCell className="text-right bg-blue-50/10 text-xs">{formatCurrency(item.costoPromedio)}</TableCell>
                                        <TableCell className="text-right bg-blue-50/10 font-medium text-blue-700">{formatCurrency(item.totalPromedio)}</TableCell>

                                        {/* FIFO */}
                                        <TableCell className="text-right bg-green-50/10 text-xs">{formatCurrency(item.costoFIFO)}</TableCell>
                                        <TableCell className="text-right bg-green-50/10 font-medium text-green-700">{formatCurrency(item.totalFIFO)}</TableCell>

                                        {/* LIFO */}
                                        <TableCell className="text-right bg-orange-50/10 text-xs">{formatCurrency(item.costoLIFO)}</TableCell>
                                        <TableCell className="text-right bg-orange-50/10 font-medium text-orange-700">{formatCurrency(item.totalLIFO)}</TableCell>

                                        {/* Estandar */}
                                        <TableCell className="text-right bg-gray-50/10 text-xs">{formatCurrency(item.costoEstandar)}</TableCell>
                                        <TableCell className="text-right bg-gray-50/10 font-medium text-gray-700">{formatCurrency(item.totalEstandar)}</TableCell>
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

export default ValoracionInventario;


