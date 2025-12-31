import React, { useEffect, useState } from 'react';
import { X, Calendar, User, FileText, Package } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { getAjusteById } from '../../api/ajustes';

const AjusteDetailModal = ({ ajusteId, onClose }) => {
    const [ajuste, setAjuste] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (ajusteId) {
            setLoading(true);
            getAjusteById(ajusteId)
                .then(data => setAjuste(data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [ajusteId]);

    if (!ajusteId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="text-hd-orange" size={24} />
                        Detalle de Ajuste {ajuste ? console.log(ajuste) || ajuste.documento : ''}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X size={20} />
                    </Button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Cargando detalles...</div>
                    ) : ajuste ? (
                        <>
                            {/* Header Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Fecha</label>
                                    <div className="flex items-center gap-2 text-gray-800 font-medium">
                                        <Calendar size={16} className="text-gray-400" />
                                        {new Date(ajuste.fecha).toLocaleDateString()}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Tipo / Motivo</label>
                                    <div className="text-gray-800 font-medium">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold mr-2 ${ajuste.tipoAjuste === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {ajuste.tipoAjuste === 'in' ? 'ENTRADA' : 'SALIDA'}
                                        </span>
                                        {ajuste.motivoDescripcion}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Almacén</label>
                                    <div className="flex items-center gap-2 text-gray-800 font-medium">
                                        <Package size={16} className="text-gray-400" />
                                        {ajuste.almacenNombre || 'General'}
                                    </div>
                                </div>
                                {ajuste.observaciones && (
                                    <div className="md:col-span-3">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Observaciones</label>
                                        <div className="text-gray-700 text-sm italic border-l-2 border-gray-300 pl-2 mt-1">
                                            {ajuste.observaciones}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Lines */}
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Artículos Ajustados</h3>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-gray-50">
                                            <TableRow>
                                                <TableHead>Código</TableHead>
                                                <TableHead>Descripción</TableHead>
                                                <TableHead>Plan</TableHead>
                                                <TableHead>Unidad</TableHead>
                                                <TableHead className="text-right">Cant.</TableHead>
                                                <TableHead className="text-right">Costo</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {ajuste.detalles?.map((det, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-mono text-xs text-gray-600">{det.codigo}</TableCell>
                                                    <TableCell className="font-medium text-gray-800">{det.descripcion}</TableCell>
                                                    <TableCell className="text-xs text-gray-500">{det.planUoM || '-'}</TableCell>
                                                    <TableCell className="text-xs">{det.unidad}</TableCell>
                                                    <TableCell className="text-right font-bold text-gray-800">{parseFloat(det.cantidad).toLocaleString()}</TableCell>
                                                    <TableCell className="text-right text-xs text-gray-600">
                                                        {parseFloat(det.costo).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm font-semibold text-gray-900 bg-gray-50/50">
                                                        {(det.cantidad * det.costo).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-gray-100 font-bold">
                                                <TableCell colSpan={6} className="text-right">Total Ajuste:</TableCell>
                                                <TableCell className="text-right text-hd-orange">
                                                    {ajuste.detalles?.reduce((sum, d) => sum + (d.cantidad * d.costo), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-red-500">No se encontró el ajuste.</div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                </div>
            </div>
        </div>
    );
};

export default AjusteDetailModal;

