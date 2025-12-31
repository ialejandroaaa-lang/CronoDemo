import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Ban, FileText, Plus } from 'lucide-react';
import NotaForm from './NotaForm';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';

const ProviderDetails = ({ proveedor, proveedorId }) => {
    const [activeTab, setActiveTab] = useState('pendientes');
    const [data, setData] = useState({ pendientes: [], historial: [], pagos: [], notas: [] });
    const [loading, setLoading] = useState(true);
    const [showNotaModal, setShowNotaModal] = useState(false);

    useEffect(() => {
        if (proveedorId) loadDetails();
    }, [proveedorId]);

    const loadDetails = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/EstadoCuenta/${proveedorId}`);
            if (res.ok) {
                const result = await res.json();
                setData({
                    pendientes: result.pendientes || result.Pendientes || [],
                    historial: result.historial || result.Historial || [],
                    pagos: result.pagos || result.Pagos || [],
                    notas: result.notas || result.Notas || []
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-4 text-center text-sm text-gray-500">Cargando detalles de cuenta...</div>;

    const formatDate = (d) => {
        if (!d) return '-';
        return new Date(d).toLocaleDateString();
    };

    const formatMoney = (val) => {
        if (val === undefined || val === null) return '0.00';
        return val.toLocaleString('es-DO', { minimumFractionDigits: 2 });
    };

    const handleVoidPayment = async (paymentId) => {
        if (!confirm('¿Estás seguro de que deseas ANULAR este pago? Esta acción reversará los saldos de las facturas afectadas.')) return;

        try {
            const res = await fetch(`${API_BASE}/Pagos/${paymentId}/anular`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                alert('Pago anulado exitosamente');
                loadDetails();
            } else {
                const err = await res.json();
                alert('Error al anular: ' + (err.message || 'Error desconocido'));
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión');
        }
    };

    const handleVoidNote = async (noteId) => {
        if (!confirm('¿Estás seguro de que deseas ANULAR esta nota? Esta acción reversará los ajustes de saldo en las facturas.')) return;

        try {
            const res = await fetch(`${API_BASE}/Notas/${noteId}/anular`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                alert('Nota anulada exitosamente');
                loadDetails();
            } else {
                const err = await res.json();
                alert('Error al anular: ' + (err.message || 'Error desconocido'));
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión');
        }
    };

    return (
        <div className="p-4 bg-gray-50/80 animate-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center mb-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('pendientes')}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'pendientes'
                            ? 'border-hd-orange text-hd-orange'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Pagar ({data.pendientes.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('historial')}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'historial'
                            ? 'border-hd-orange text-hd-orange'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Historial Facturas
                    </button>
                    <button
                        onClick={() => setActiveTab('pagos')}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'pagos'
                            ? 'border-hd-orange text-hd-orange'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Pagos
                    </button>
                    <button
                        onClick={() => setActiveTab('notas')}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'notas'
                            ? 'border-hd-orange text-hd-orange'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Notas ({data.notas.length})
                    </button>
                </nav>
                {activeTab === 'notas' && (
                    <Button
                        size="xs"
                        className="mb-2 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => setShowNotaModal(true)}
                    >
                        <Plus size={14} className="mr-1" /> Nueva Nota
                    </Button>
                )}
            </div>

            <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
                {activeTab === 'pendientes' && (
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-red-50">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium text-red-800">Fecha</th>
                                <th className="px-3 py-2 text-left font-medium text-red-800">Número de Documento</th>
                                <th className="px-3 py-2 text-right font-medium text-red-800">Total</th>
                                <th className="px-3 py-2 text-right font-medium text-red-800">Pagado</th>
                                <th className="px-3 py-2 text-right font-medium text-red-800">Pendiente</th>
                                <th className="px-3 py-2 text-right font-medium text-red-800 text-[10px]">DOP Equiv.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {data.pendientes.length === 0 ? (
                                <tr><td colSpan={6} className="p-4 text-center text-gray-400 italic">¡Todo al día! No hay facturas pendientes.</td></tr>
                            ) : data.pendientes.map(inv => (
                                <tr key={inv.Id} className="hover:bg-red-50/20">
                                    <td className="px-3 py-2 text-gray-600">{formatDate(inv.FechaCompra)}</td>
                                    <td className="px-3 py-2 font-bold text-gray-800">{inv.ReferenciaProveedor || inv.NumeroCompra}</td>
                                    <td className="px-3 py-2 text-right font-medium">{inv.MonedaSimbolo || inv.monedaSimbolo || 'RD$'} {formatMoney(inv.Total)}</td>
                                    <td className="px-3 py-2 text-right text-green-600">{inv.MonedaSimbolo || inv.monedaSimbolo || 'RD$'} {formatMoney(inv.Total - (inv.Saldo || 0))}</td>
                                    <td className="px-3 py-2 text-right font-bold text-red-600">{inv.MonedaSimbolo || inv.monedaSimbolo || 'RD$'} {formatMoney(inv.Saldo)}</td>
                                    <td className="px-3 py-2 text-right text-[10px] text-gray-400 italic">RD$ {formatMoney((inv.Saldo || 0) * (inv.TasaCambio || inv.tasaCambio || 1))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'historial' && (
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium text-gray-500">Fecha</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-500">Número de Documento</th>
                                <th className="px-3 py-2 text-center font-medium text-gray-500">Estado</th>
                                <th className="px-3 py-2 text-right font-medium text-gray-500">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.historial.map(inv => (
                                <tr key={inv.Id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2">{formatDate(inv.FechaCompra)}</td>
                                    <td className="px-3 py-2 font-mono text-gray-600">{inv.ReferenciaProveedor || inv.NumeroCompra}</td>
                                    <td className="px-3 py-2 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${inv.Estado === 'Completado' ? 'bg-green-100 text-green-800' :
                                            inv.Estado === 'Anulado' ? 'bg-gray-100 text-gray-500' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>{inv.Estado || 'Abierta'}</span>
                                    </td>
                                    <td className="px-3 py-2 text-right font-medium">{inv.MonedaSimbolo || inv.monedaSimbolo || 'RD$'} {formatMoney(inv.Total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'pagos' && (
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-blue-50">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium text-blue-800">Fecha</th>
                                <th className="px-3 py-2 text-left font-medium text-blue-800">Referencia</th>
                                <th className="px-3 py-2 text-left font-medium text-blue-800">Facturas Pagadas</th>
                                <th className="px-3 py-2 text-left font-medium text-blue-800">Método</th>
                                <th className="px-3 py-2 text-right font-medium text-blue-800">Monto</th>
                                <th className="px-3 py-2 text-center font-medium text-blue-800">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.pagos.length === 0 ? (
                                <tr><td colSpan={6} className="p-4 text-center text-gray-400 italic">No hay pagos registrados.</td></tr>
                            ) : data.pagos.map(p => {
                                const isVoided = (p.estado || p.Estado) === 'Anulado';
                                return (
                                    <tr key={p.id || p.Id} className={`hover:bg-blue-50/20 ${isVoided ? 'opacity-50 line-through bg-gray-50' : ''}`}>
                                        <td className="px-3 py-2">{formatDate(p.fecha || p.Fecha)}</td>
                                        <td className="px-3 py-2 font-mono text-blue-600">{p.referencia || p.Referencia}</td>
                                        <td className="px-3 py-2">
                                            {(p.facturasAfectadas || p.FacturasAfectadas) && (p.facturasAfectadas || p.FacturasAfectadas).length > 0 ? (
                                                <div className="flex flex-col space-y-1">
                                                    {(p.facturasAfectadas || p.FacturasAfectadas).map((f, idx) => (
                                                        <span key={idx} className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded w-fit">
                                                            {f.Numero || f.numero} <span className="text-blue-500 opacity-75 ml-1">(${formatMoney(f.Monto || f.monto)})</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic text-[10px]">Sin detalle</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">{p.metodo || p.Metodo}</td>
                                        <td className="px-3 py-2 text-right font-bold text-gray-800 text-nowrap">{p.MonedaSimbolo || p.monedaSimbolo || 'RD$'} {formatMoney(p.monto || p.Monto)}</td>
                                        <td className="px-3 py-2 text-center">
                                            {!isVoided && (
                                                <button
                                                    onClick={() => handleVoidPayment(p.id || p.Id)}
                                                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                                    title="Anular Pago"
                                                >
                                                    <Ban size={14} />
                                                </button>
                                            )}
                                            {isVoided && <span className="text-[10px] text-gray-500 font-bold">ANULADO</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {activeTab === 'notas' && (
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-indigo-50">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium text-indigo-800">Fecha</th>
                                <th className="px-3 py-2 text-left font-medium text-indigo-800">Tipo</th>
                                <th className="px-3 py-2 text-left font-medium text-indigo-800">Referencia</th>
                                <th className="px-3 py-2 text-left font-medium text-indigo-800">Facturas Afectadas</th>
                                <th className="px-3 py-2 text-right font-medium text-indigo-800">Monto</th>
                                <th className="px-3 py-2 text-center font-medium text-indigo-800">Estado</th>
                                <th className="px-3 py-2 text-center font-medium text-indigo-800">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.notas.length === 0 ? (
                                <tr><td colSpan={7} className="p-4 text-center text-gray-400 italic">No hay notas registradas.</td></tr>
                            ) : data.notas.map(n => {
                                const isVoided = (n.estado || n.Estado) === 'Anulada';
                                return (
                                    <tr key={n.id || n.Id} className={`hover:bg-indigo-50/20 ${isVoided ? 'opacity-50 line-through' : ''}`}>
                                        <td className="px-3 py-2">{formatDate(n.fecha || n.Fecha)}</td>
                                        <td className="px-3 py-2">
                                            <span className={`font-bold ${n.tipo === 'Credito' ? 'text-blue-600' : 'text-red-600'}`}>
                                                {n.tipo === 'Credito' ? 'CRÉDITO' : 'DÉBITO'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 font-mono">{n.referencia || n.Referencia}</td>
                                        <td className="px-3 py-2">
                                            {(n.facturasAfectadas || n.FacturasAfectadas)?.map((f, idx) => (
                                                <span key={idx} className="inline-block bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.5 rounded mr-1">
                                                    {f.Numero || f.numero}
                                                </span>
                                            ))}
                                        </td>
                                        <td className="px-3 py-2 text-right font-bold">{n.monedaSimbolo || n.MonedaSimbolo || 'RD$'} {formatMoney(n.monto || n.Monto)}</td>
                                        <td className="px-3 py-2 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${isVoided ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-800'}`}>
                                                {n.estado || 'Completada'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {!isVoided && (
                                                <button
                                                    onClick={() => handleVoidNote(n.id || n.Id)}
                                                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                                    title="Anular Nota"
                                                >
                                                    <Ban size={14} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="mt-2 text-right">
                <Button size="xs" variant="outline" className="text-gray-500" onClick={() => setActiveTab('pendientes')}>Ver todo...</Button>
            </div>

            {showNotaModal && (
                <NotaForm
                    initialProveedorId={proveedorId}
                    onClose={() => setShowNotaModal(false)}
                    onSuccess={() => {
                        loadDetails();
                        setShowNotaModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default ProviderDetails;
