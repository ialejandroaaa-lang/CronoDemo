import React, { useState, useEffect } from 'react';
// Minimal fetch wrapper if no global axios instance is handy, or rely on fetch
const API_URL = 'http://localhost:5006/api';

const InvoiceSelector = ({ onSelect, onCancel }) => {
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Clients on Mount
    useEffect(() => {
        const fetchClients = async () => {
            setLoadingClients(true);
            try {
                const res = await fetch(`${API_URL}/Clients`);
                if (res.ok) {
                    const data = await res.json();
                    setClients(data);
                }
            } catch (e) {
                console.error("Error fetching clients", e);
            } finally {
                setLoadingClients(false);
            }
        };
        fetchClients();
    }, []);

    // Fetch Invoices when Client Selected
    useEffect(() => {
        if (!selectedClient) {
            setInvoices([]);
            return;
        }

        const fetchInvoices = async () => {
            setLoadingInvoices(true);
            try {
                console.log("Fetching invoices for client:", selectedClient);
                const res = await fetch(`${API_URL}/Ventas/ByClient/${selectedClient.id}`);
                if (res.ok) {
                    const data = await res.json();
                    console.log("Invoices loaded:", data);
                    setInvoices(data);
                } else {
                    console.error("Failed to fetch invoices:", res.status);
                }
            } catch (e) {
                console.error("Error fetching invoices", e);
            } finally {
                setLoadingInvoices(false);
            }
        };
        fetchInvoices();
    }, [selectedClient]);

    const filteredClients = clients.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                <div className="p-4 border-b flex justify-between items-center bg-[#F96302] text-white rounded-t-lg">
                    <h2 className="text-xl font-bold">Seleccionar Factura</h2>
                    <button onClick={onCancel} className="text-white hover:text-gray-200 text-2xl">&times;</button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left: Client List */}
                    <div className="w-1/3 border-r flex flex-col bg-gray-50">
                        <div className="p-3 border-b">
                            <input
                                type="text"
                                placeholder="Buscar Cliente..."
                                className="w-full p-2 border rounded"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {loadingClients ? (
                                <p className="p-4 text-center text-gray-500">Cargando...</p>
                            ) : (
                                <ul>
                                    {filteredClients.map(c => (
                                        <li
                                            key={c.id}
                                            onClick={() => setSelectedClient(c)}
                                            className={`p-3 border-b cursor-pointer hover:bg-orange-50 transition ${selectedClient?.id === c.id ? 'bg-orange-100 border-l-4 border-l-[#F96302]' : ''}`}
                                        >
                                            <div className="font-semibold text-gray-700 text-sm">{c.name}</div>
                                            <div className="text-xs text-gray-500">{c.code}</div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Right: Invoices List */}
                    <div className="w-2/3 flex flex-col bg-white">
                        <div className="p-4 border-b bg-gray-50 h-16 flex items-center">
                            {selectedClient ? (
                                <h3 className="font-bold text-lg">Facturas de: <span className="text-[#F96302]">{selectedClient.name}</span></h3>
                            ) : (
                                <p className="text-gray-400 italic">Seleccione un cliente para ver sus facturas</p>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {loadingInvoices ? (
                                <p className="text-center text-gray-500 mt-10">Cargando facturas...</p>
                            ) : invoices.length > 0 ? (
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100 text-left text-sm text-gray-600">
                                            <th className="p-2 border-b">Factura</th>
                                            <th className="p-2 border-b">Fecha</th>
                                            <th className="p-2 border-b">NCF</th>
                                            <th className="p-2 border-b text-right">Total</th>
                                            <th className="p-2 border-b text-right">Saldo</th>
                                            <th className="p-2 border-b"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.map(inv => (
                                            <tr key={inv.id || inv.Id} className="hover:bg-gray-50 border-b">
                                                <td className="p-2 font-semibold text-gray-700 text-sm">{inv.numeroFactura || inv.NumeroFactura}</td>
                                                <td className="p-2 text-sm">{new Date(inv.fecha || inv.Fecha).toLocaleDateString()}</td>
                                                <td className="p-2 text-xs text-gray-500">{inv.ncf || inv.NCF}</td>
                                                <td className="p-2 text-right font-mono">${(inv.total || inv.Total)?.toFixed(2)}</td>
                                                <td className="p-2 text-right font-mono text-red-600">${(inv.saldo || inv.Saldo)?.toFixed(2)}</td>
                                                <td className="p-2 text-right">
                                                    <button
                                                        onClick={() => onSelect(inv)}
                                                        className="bg-[#F96302] text-white px-3 py-1 rounded text-sm hover:bg-[#d85502] transition"
                                                    >
                                                        Seleccionar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : selectedClient ? (
                                <p className="text-center text-gray-500 mt-10">No hay facturas registradas para este cliente.</p>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceSelector;


