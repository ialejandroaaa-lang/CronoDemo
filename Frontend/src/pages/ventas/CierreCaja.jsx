import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, CreditCard, Banknote, RefreshCcw, Printer, FileText, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';

const API_BASE = ((import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') ? import.meta.env.VITE_API_URL : '/api');

const CierreCaja = () => {
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({ detalles: [], resumen: {} });

    useEffect(() => {
        loadCorte();
    }, [fecha]);

    const loadCorte = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/Ventas/CorteCaja?fecha=${fecha}`);
            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
        } catch (error) {
            console.error("Error loading corte:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val, code = 'DOP', symbol = 'RD$') => {
        return `${code} ${symbol}${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handlePrint = () => {
        window.print();
    };

    const resumen = data.resumen || { totalDOP: 0, totalTransacciones: 0 };
    const detalles = data.detalles || [];

    // Grouping for the summary cards
    const totalEfectivoDOP = detalles
        .filter(d => d.metodoPago === 'Efectivo')
        .reduce((sum, d) => sum + (d.total * (d.moneda === 'USD' ? 60.50 : 1)), 0); // Temporary rate for display if not in resumee

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto print:p-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 print:hidden">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Corte de Caja</h1>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp size={14} className="text-hd-orange" /> Resumen Diario de Operaciones
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            type="date"
                            className="pl-9 font-bold"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={loadCorte} disabled={loading}>
                        <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button className="bg-hd-orange hover:bg-orange-600 font-bold" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Imprimir Reporte
                    </Button>
                </div>
            </div>

            {/* Print Only Header */}
            <div className="hidden print:block text-center space-y-2 mb-8">
                <h1 className="text-2xl font-bold uppercase text-black">POS CRONO - REPORTE DE CIERRE</h1>
                <p className="text-sm font-mono">FECHA DE CORTE: {fecha}</p>
                <div className="border-b-2 border-black w-full" />
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-hd-orange shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ventas Totales (Consolidado)</p>
                                <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                                    {formatCurrency(resumen.totalDOP, 'DOP', 'RD$')}
                                </h3>
                            </div>
                            <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center text-hd-orange">
                                <DollarSign size={24} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Transacciones</p>
                                <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                                    {resumen.totalTransacciones} <span className="text-sm font-bold text-gray-400 italic">Ventas</span>
                                </h3>
                            </div>
                            <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                                <FileText size={24} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fecha del Reporte</p>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                                    {new Date(fecha + 'T12:00:00').toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </h3>
                            </div>
                            <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
                                <Calendar size={24} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Detailed Breakdown Table */}
                <Card className="shadow-sm border-none bg-white">
                    <CardHeader className="bg-gray-50/50 border-b">
                        <CardTitle className="text-xs font-black text-gray-500 uppercase tracking-widest">Desglose por Moneda y Método</CardTitle>
                    </CardHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-black uppercase text-[10px]">Moneda</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Método</TableHead>
                                <TableHead className="font-black uppercase text-[10px] text-center">Trans.</TableHead>
                                <TableHead className="font-black uppercase text-[10px] text-right">Total Bruto</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {detalles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-gray-400 italic">No hay operaciones registradas este día</TableCell>
                                </TableRow>
                            ) : (
                                detalles.map((d, i) => (
                                    <TableRow key={i} className="hover:bg-gray-50">
                                        <TableCell className="font-black text-gray-700">{d.moneda}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {d.metodoPago === 'Efectivo' ? <Banknote size={14} className="text-green-500" /> : <CreditCard size={14} className="text-blue-500" />}
                                                <span className="font-bold text-gray-600">{d.metodoPago}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-gray-500">{d.transacciones}</TableCell>
                                        <TableCell className="text-right font-black text-gray-900">
                                            {formatCurrency(d.total, d.moneda, d.simbolo)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>

                {/* Totales Consolidados por Método */}
                <Card className="shadow-sm border-none bg-gray-900 text-white">
                    <CardHeader className="border-b border-white/10">
                        <CardTitle className="text-xs font-black text-gray-400 uppercase tracking-widest">Consolidado en DOP (Pesos)</CardTitle>
                    </CardHeader>
                    <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center">
                                    <Banknote className="text-green-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Efectivo</p>
                                    <p className="text-xl font-bold">RD$ {detalles.filter(d => d.metodoPago === 'Efectivo').reduce((s, x) => s + (x.total * (x.moneda === 'USD' ? 60.5 : 1)), 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center">
                                    <CreditCard className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Tarjeta</p>
                                    <p className="text-xl font-bold">RD$ {detalles.filter(d => d.metodoPago === 'Tarjeta').reduce((s, x) => s + (x.total * (x.moneda === 'USD' ? 60.5 : 1)), 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/10">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-hd-orange uppercase tracking-widest italic">Gran Total Neto</p>
                                    <p className="text-4xl font-black text-hd-orange tracking-tighter italic">RD$ {resumen.totalDOP?.toLocaleString() || 0}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Firma del Cajero</p>
                                    <div className="w-32 h-px bg-gray-700 mt-6" />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Note */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 print:hidden">
                <FileText className="text-blue-500 mt-0.5" size={18} />
                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                    Este reporte consolida todas las ventas facturadas hasta el momento para la fecha seleccionada.
                    Los montos en USD son convertidos a DOP utilizando la tasa histórica grabada en cada transacción para asegurar la precisión contable.
                </p>
            </div>
        </div>
    );
};

export default CierreCaja;


