import React, { useState, useEffect } from 'react';
import { getCotizaciones } from '../../api/cotizaciones';

const QuotationSelector = ({ onSelect, onCancel, clientContextId }) => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchQuotations = async () => {
            setLoading(true);
            try {
                const data = await getCotizaciones();
                setQuotations(data);
            } catch (e) {
                console.error("Error fetching quotations", e);
            } finally {
                setLoading(false);
            }
        };
        fetchQuotations();
    }, []);

    // Filter logic
    const filtered = quotations.filter(q => {
        const matchesClient = clientContextId
            ? (q.clienteId === clientContextId || q.ClienteId === clientContextId)
            : true;

        // Search by ID/Name
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            (q.id?.toString().includes(searchLower)) ||
            (q.clienteNombre?.toLowerCase().includes(searchLower)) ||
            (q.observaciones?.toLowerCase().includes(searchLower));

        return matchesClient && matchesSearch;
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl">
                <div className="p-4 border-b flex justify-between items-center bg-blue-600 text-white rounded-t-lg">
                    <h2 className="text-xl font-bold">Importar Cotización</h2>
                    <button onClick={onCancel} className="text-white hover:text-gray-200 text-2xl">&times;</button>
                </div>

                <div className="p-4 bg-gray-50 border-b">
                    <input
                        type="text"
                        placeholder="Buscar por ID o Cliente..."
                        className="w-full p-2 border rounded"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <p className="text-center text-gray-500">Cargando cotizaciones...</p>
                    ) : filtered.length === 0 ? (
                        <p className="text-center text-gray-500">No se encontraron cotizaciones {clientContextId ? 'para este cliente' : ''}.</p>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100 text-left text-sm text-gray-600">
                                    <th className="p-2 border-b">ID</th>
                                    <th className="p-2 border-b">Fecha</th>
                                    <th className="p-2 border-b">Cliente</th>
                                    <th className="p-2 border-b text-right">Total</th>
                                    <th className="p-2 border-b"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(q => (
                                    <tr key={q.id || q.Id} className="hover:bg-gray-50 border-b">
                                        <td className="p-2 font-bold text-blue-600">{q.id || q.Id}</td>
                                        <td className="p-2 text-sm">{new Date(q.fecha || q.Fecha).toLocaleDateString()}</td>
                                        <td className="p-2 text-sm">{q.clienteNombre || 'Sin Nombre'}</td>
                                        <td className="p-2 text-right font-mono font-bold">${(q.total || q.Total)?.toFixed(2)}</td>
                                        <td className="p-2 text-right">
                                            <button
                                                onClick={() => onSelect(q)}
                                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                                            >
                                                Importar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuotationSelector;
