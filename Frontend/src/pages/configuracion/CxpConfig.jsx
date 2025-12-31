import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const CxpConfig = () => {
    const [config, setConfig] = useState({
        useAutoSequence: true,
        prefix: 'PAGO-',
        sequenceLength: 6,
        currentValue: 0,
        separator: '-'
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    const safe = (val) => val === null || val === undefined ? '' : val;

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/PaymentConfiguration`);
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } catch (e) {
            console.error("Error loading CXP config:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/PaymentConfiguration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Configuración guardada exitosamente.' });
            } else {
                setMessage({ type: 'error', text: 'Error al guardar configuración.' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Error de conexión.' });
        }

        setTimeout(() => setMessage(null), 3000);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    const getPreview = () => {
        const number = (config.currentValue + 1).toString().padStart(config.sequenceLength || 6, '0');
        return `${config.prefix}${number}`; // Separator is usually implicit or part of prefix in this logic, but model has separator too
    };

    if (loading) return <div className="p-8 text-center">Cargando configuración...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Cuentas por Pagar / Secuencia de Pagos</h1>

            {message && (
                <div className={`p-4 rounded-md flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave} className="bg-white shadow rounded-lg p-6 space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Secuencia de Pagos</h2>
                    <div className="flex items-center space-x-2 mb-6">
                        <input
                            type="checkbox"
                            id="useAutoSequence"
                            name="useAutoSequence"
                            checked={config.useAutoSequence}
                            onChange={handleChange}
                            className="rounded border-gray-300 text-hd-orange focus:ring-hd-orange"
                        />
                        <label htmlFor="useAutoSequence" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                            Generar códigos de pago automáticamente
                        </label>
                    </div>

                    {config.useAutoSequence && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prefijo</label>
                                <input
                                    type="text"
                                    name="prefix"
                                    value={safe(config.prefix)}
                                    onChange={handleChange}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring-hd-orange sm:text-sm"
                                    placeholder="Ej: PAGO-"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Longitud de Secuencia</label>
                                <input
                                    type="number"
                                    name="sequenceLength"
                                    value={config.sequenceLength}
                                    onChange={handleChange}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring-hd-orange sm:text-sm"
                                    min="3" max="20"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Actual (Último usado)</label>
                                <input
                                    type="number"
                                    name="currentValue"
                                    value={config.currentValue}
                                    onChange={handleChange}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring-hd-orange sm:text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">Modificar solo si es necesario reiniciar la secuencia.</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 flex flex-col justify-center items-center">
                                <span className="text-sm text-gray-500 font-medium mb-2">Vista Previa Próximo Código</span>
                                <span className="text-2xl font-mono font-bold text-gray-800 tracking-wider">
                                    {getPreview()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t flex justify-end">
                    <Button type="submit" className="bg-hd-orange hover:bg-orange-600 text-white flex items-center gap-2">
                        <Save size={18} />
                        Guardar Cambios
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CxpConfig;

