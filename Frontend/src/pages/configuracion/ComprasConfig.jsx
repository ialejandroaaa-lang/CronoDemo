import React, { useState, useEffect } from 'react';
import { Save, FileText, Package } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';

const ComprasConfig = () => {
    const [sequences, setSequences] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSequences();
    }, []);

    const fetchSequences = async () => {
        try {
            const res = await fetch(`${API_BASE}/Sequences`);
            if (res.ok) {
                const data = await res.json();
                setSequences(data.filter(s => ['PURCHASE_ORDER', 'GOODS_RECEIPT', 'DIRECT_PURCHASE'].includes(s.code)));
            }
        } catch (error) {
            console.error('Error fetching sequences:', error);
        }
    };

    const handleUpdate = (id, field, value) => {
        setSequences(prev => prev.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ));
    };

    const handleSave = async (sequence) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/Sequences/${sequence.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sequence)
            });

            if (res.ok) {
                setMessage('Configuración guardada correctamente');
                setTimeout(() => setMessage(''), 3000);
            } else {
                alert('Eror al guardar');
            }
        } catch (error) {
            console.error('Error saving:', error);
            alert('Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    const renderSequenceCard = (code, title, icon) => {
        const seq = sequences.find(s => s.code === code);
        if (!seq) return null;

        return (
            <Card className="shadow-lg border-none overflow-hidden h-full">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                    <CardTitle className="flex items-center gap-2">
                        {icon}
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prefijo</label>
                            <input
                                type="text"
                                value={seq.prefix || ''}
                                onChange={e => handleUpdate(seq.id, 'prefix', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Secuencia Actual</label>
                            <input
                                type="number"
                                value={seq.currentValue}
                                onChange={e => handleUpdate(seq.id, 'currentValue', parseInt(e.target.value))}
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 font-mono"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Próximo: {seq.prefix}{String(seq.currentValue + 1).padStart(seq.length, '0')}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Longitud (Ceros)</label>
                            <input
                                type="number"
                                value={seq.length}
                                onChange={e => handleUpdate(seq.id, 'length', parseInt(e.target.value))}
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                                min="1"
                                max="20"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-end pt-4">
                        <Button
                            onClick={() => handleSave(seq)}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 w-full"
                        >
                            Guardar Cambios
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Configuración de Compras</h1>
                    <p className="text-sm text-gray-500">Gestione las secuencias de documentos para el ciclo de compras.</p>
                </div>
                {message && (
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium animate-pulse">
                        {message}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSequenceCard('PURCHASE_ORDER', 'Orden de Compra', <FileText className="h-5 w-5 text-blue-600" />)}
                {renderSequenceCard('GOODS_RECEIPT', 'Recepción de Mercancía', <Package className="h-5 w-5 text-orange-600" />)}
                {renderSequenceCard('DIRECT_PURCHASE', 'Factura Directa', <FileText className="h-5 w-5 text-emerald-600" />)}
            </div>
        </div>
    );
};

export default ComprasConfig;
