import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCompra } from '../../api/compras';

const CompraPrint = () => {
    const { id } = useParams();
    const [compra, setCompra] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompra = async () => {
            try {
                const data = await getCompra(id);
                setCompra(data);
                // Optional: Auto-print after a short delay to allow rendering
                // setTimeout(() => window.print(), 500);
            } catch (error) {
                console.error("Error loading purchase for print:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchCompra();
    }, [id]);

    if (loading) return <div className="p-8 text-center">Cargando documento...</div>;
    if (!compra) return <div className="p-8 text-center text-red-600">No se encontró el documento.</div>;

    // Helper to format currency
    const formatMoney = (amount, currency = 'DOP') => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    const getDocumentTitle = (type) => {
        switch (type) {
            case 'OrdenCompra': return 'ORDEN DE COMPRA';
            case 'Recepcion': return 'RECEPCIÓN DE MERCANCÍA';
            case 'Factura': return 'FACTURA DE COMPRA';
            default: return 'DOCUMENTO DE COMPRA';
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 print:p-0 text-gray-900 font-sans">
            {/* Print Button - Hidden when printing */}
            <div className="mb-6 flex justify-end print:hidden">
                <button
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 font-medium"
                >
                    🖨️ Imprimir Documento
                </button>
            </div>

            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-4 mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-widest">
                        {getDocumentTitle(compra.tipoDocumento)}
                    </h1>
                    <p className="text-lg text-gray-600 font-medium mt-1">{compra.numeroCompra}</p>
                    <div className="mt-2 text-sm text-gray-500">
                        <p>Estado: <span className="font-semibold uppercase">{compra.estado}</span></p>
                        {compra.documentoReferenciaNumero && (
                            <p>Ref: {compra.documentoReferenciaNumero}</p>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-gray-800">CRONO POS</h2>
                    <p className="text-sm text-gray-600">Av. Principal #123</p>
                    <p className="text-sm text-gray-600">Santo Domingo, SD</p>
                    <p className="text-sm text-gray-600">RNC: 1-01-00000-0</p>
                    <p className="text-sm text-gray-600">Tel: (809) 555-0123</p>
                </div>
            </div>

            {/* Info Block */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="border border-gray-200 rounded p-4 bg-gray-50">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Proveedor</h3>
                    <p className="font-bold text-lg">{compra.proveedorNombre}</p>
                    {/* Ideally we would have address/phone in the DTO or fetch specific provider details */}
                    <p className="text-sm text-gray-600 mt-1">ID: {compra.proveedorId}</p>
                </div>
                <div className="border border-gray-200 rounded p-4 bg-gray-50">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Detalles</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-600">Fecha Emisión:</div>
                        <div className="font-medium text-right">{new Date(compra.fechaCompra).toLocaleDateString()}</div>

                        <div className="text-gray-600">Términos Pago:</div>
                        <div className="font-medium text-right">{compra.terminosPago || 'Contado'}</div>

                        <div className="text-gray-600">Referencia Prov:</div>
                        <div className="font-medium text-right">{compra.referenciaProveedor || '-'}</div>

                        <div className="text-gray-600">Moneda:</div>
                        <div className="font-medium text-right">{compra.monedaCodigo || 'DOP'}</div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-gray-800">
                            <th className="py-2 text-left font-bold text-sm text-gray-700">CÓDIGO</th>
                            <th className="py-2 text-left font-bold text-sm text-gray-700">DESCRIPCIÓN</th>
                            <th className="py-2 text-right font-bold text-sm text-gray-700">CANT.</th>
                            <th className="py-2 text-center font-bold text-sm text-gray-700">U.M.</th>
                            <th className="py-2 text-right font-bold text-sm text-gray-700">PRECIO</th>
                            <th className="py-2 text-right font-bold text-sm text-gray-700">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {compra.detalles.map((item, index) => (
                            <tr key={index} className="border-b border-gray-200 text-sm">
                                <td className="py-2 font-mono text-gray-600">{item.numeroArticulo}</td>
                                <td className="py-2">{item.descripcion}</td>
                                <td className="py-2 text-right font-medium">{item.cantidad}</td>
                                <td className="py-2 text-center text-gray-500 text-xs">{item.unidadMedida}</td>
                                <td className="py-2 text-right">{formatMoney(item.costoUnitario)}</td>
                                <td className="py-2 text-right font-bold">{formatMoney(item.totalLinea)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-64">
                    <div className="flex justify-between py-1 text-gray-600 text-sm">
                        <span>Subtotal:</span>
                        <span>{formatMoney(compra.subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-1 text-gray-600 text-sm">
                        <span>Impuestos:</span>
                        <span>{formatMoney(compra.impuestos)}</span>
                    </div>
                    <div className="border-t border-gray-400 my-2"></div>
                    <div className="flex justify-between py-1 text-xl font-bold text-gray-900">
                        <span>TOTAL:</span>
                        <span>{formatMoney(compra.total)}</span>
                    </div>
                </div>
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-2 gap-20 pt-12 mt-12 border-t border-gray-100 print:mt-24">
                <div className="text-center">
                    <div className="border-t border-gray-400 w-3/4 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Autorizado Por</p>
                </div>
                <div className="text-center">
                    <div className="border-t border-gray-400 w-3/4 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Recibido Conforme</p>
                </div>
            </div>
        </div>
    );
};

export default CompraPrint;
