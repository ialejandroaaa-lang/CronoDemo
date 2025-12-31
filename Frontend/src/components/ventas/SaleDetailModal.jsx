import React from 'react';
import { Dialog, DialogContent } from '../ui/Dialog';
import { X, Printer } from 'lucide-react';
import { Button } from '../ui/Button';
import { printReceipt } from '../receipt/PrintService';

const SaleDetailModal = ({ isOpen, onClose, sale }) => {
    if (!sale) return null;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: sale.monedaCodigo || 'DOP'
        }).format(amount || 0);
    };

    const handlePrint = async () => {
        // Construct receipt data object expected by PrintService
        const receiptData = {
            receipt: {
                number: sale.numeroFactura,
                NumeroRecibo: sale.numeroFactura,
                NumeroFactura: sale.numeroFactura,
                ncf: sale.ncf,
                tipoNCF: sale.tipoNCF,
                date: sale.fecha,
                time: sale.fecha,
                cashier: sale.usuario || 'Sistema',
                client: sale.clienteNombre,
                subtotal: sale.subtotal,
                tax: sale.itbis,
                total: sale.total,
                paymentMethod: sale.metodoPago,
                receivedAmount: sale.montoRecibido,
                change: sale.cambio
            },
            company: {
                name: 'POS CRONO',
                address: 'Calle Principal #1',
                rnc: '123456789',
                phone: '809-555-5555'
            },
            items: (sale.detalles || []).map(d => ({
                description: d.descripcion || 'Artículo',
                qty: d.cantidad,
                price: d.precioUnitario,
                total: d.totalLinea
            }))
        };
        await printReceipt(receiptData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-white p-0 overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-gray-900 px-6 py-4 flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-xl font-bold">Detalle de Venta</h2>
                        <p className="text-sm text-gray-400 font-mono">{sale.numeroFactura}</p>
                    </div>
                    <Button variant="ghost" className="text-white hover:bg-white/10" onClick={onClose}>
                        <X />
                    </Button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[80vh]">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <label className="block text-xs font-bold text-gray-400 uppercase">Fecha</label>
                            <span className="font-semibold text-gray-800">{new Date(sale.fecha).toLocaleString()}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <label className="block text-xs font-bold text-gray-400 uppercase">Cliente</label>
                            <span className="font-semibold text-gray-800">{sale.clienteNombre}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <label className="block text-xs font-bold text-gray-400 uppercase">NCF</label>
                            <span className="font-mono font-semibold text-blue-700">{sale.ncf || 'N/A'}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <label className="block text-xs font-bold text-gray-400 uppercase">Método Pago</label>
                            <span className="font-semibold text-gray-800">{sale.metodoPago}</span>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="border rounded-lg overflow-hidden mb-6">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 border-b">
                                <tr>
                                    <th className="px-4 py-2 text-left text-gray-600">Código</th>
                                    <th className="px-4 py-2 text-left text-gray-600">Descripción</th>
                                    <th className="px-4 py-2 text-right text-gray-600">Cant</th>
                                    <th className="px-4 py-2 text-right text-gray-600">Precio</th>
                                    <th className="px-4 py-2 text-right text-gray-600">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {sale.detalles?.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 font-mono text-xs text-gray-500">{item.codigo}</td>
                                        <td className="px-4 py-2 font-medium text-gray-800">{item.descripcion}</td>
                                        <td className="px-4 py-2 text-right">{item.cantidad}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(item.precioUnitario)}</td>
                                        <td className="px-4 py-2 text-right font-bold">{formatCurrency(item.totalLinea)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Totals */}
                    <div className="flex justify-between items-end border-t pt-4">
                        <div>
                            <Button variant="outline" onClick={handlePrint} className="flex gap-2 items-center">
                                <Printer size={16} /> Imprimir Recibo
                            </Button>
                        </div>
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(sale.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>ITBIS:</span>
                                <span>{formatCurrency(sale.itbis)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-black text-hd-orange border-t pt-2 border-gray-200">
                                <span>Total:</span>
                                <span>{formatCurrency(sale.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SaleDetailModal;


