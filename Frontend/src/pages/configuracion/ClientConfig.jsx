import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';

// Helper components
const Section = ({ title, children }) => (
    <div className="border border-gray-200 bg-white rounded-lg mb-6 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

const Field = ({ label, children, description }) => (
    <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            {description && <span className="text-xs text-gray-500">{description}</span>}
        </div>
        {children}
    </div>
);

const ClientConfig = () => {
    const [config, setConfig] = useState({
        useAutoSequence: true,
        useInitials: false,
        initials: 'CL',
        sequenceLength: 4,
        currentValue: 1,
        separator: '-',
        nameCase: 'words'
    });
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await fetch('http://localhost:5006/api/ClientConfiguration');
            if (response.ok) {
                const data = await response.json();
                setConfig(data);
            }
        } catch (error) {
            console.error('Error fetching config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        try {
            const response = await fetch('http://localhost:5006/api/ClientConfiguration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                setStatusMessage('Configuración guardada correctamente');
                setTimeout(() => setStatusMessage(''), 3000);
            } else {
                alert('Error al guardar configuración');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            alert('Error de conexión');
        }
    };

    // Calculate preview
    const previewCode = () => {
        const numberPart = String(config.currentValue).padStart(config.sequenceLength, '0');
        if (config.useInitials) {
            return `${config.initials}${config.separator}${numberPart}`;
        }
        return numberPart;
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando configuración...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Configuración de Cliente</h1>
                    <p className="text-gray-500">Defina cómo se generan los códigos de cliente automáticamente.</p>
                </div>
                <div className="flex items-center space-x-4">
                    {statusMessage && <span className="text-green-600 font-medium animate-pulse">{statusMessage}</span>}
                    <Button onClick={handleSave} className="bg-hd-orange hover:bg-orange-600 text-white">
                        <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                    </Button>
                </div>
            </div>

            <Section title="Secuencia Numérica">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <div>
                                <span className="font-medium text-blue-900">Usar Secuencia Automática</span>
                                <p className="text-xs text-blue-700">El sistema generará el código al guardar.</p>
                            </div>
                            <input
                                type="checkbox"
                                name="useAutoSequence"
                                checked={config.useAutoSequence}
                                onChange={handleChange}
                                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div>
                                <span className="font-medium text-gray-900">Usar Iniciales</span>
                                <p className="text-xs text-gray-500">Prefijo antes del número (ej. CL).</p>
                            </div>
                            <input
                                type="checkbox"
                                name="useInitials"
                                checked={config.useInitials}
                                onChange={handleChange}
                                disabled={!config.useAutoSequence}
                                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                        </div>

                        <Field label="Separador">
                            <Input
                                name="separator"
                                value={config.separator}
                                onChange={handleChange}
                                disabled={!config.useAutoSequence || !config.useInitials}
                                maxLength={1}
                                className="w-20 text-center font-bold"
                            />
                        </Field>
                    </div>

                    <div className="space-y-4">
                        <Field label="Iniciales" description="Texto al inicio del código.">
                            <Input
                                name="initials"
                                value={config.initials}
                                onChange={handleChange}
                                disabled={!config.useAutoSequence || !config.useInitials}
                                className="uppercase font-mono"
                            />
                        </Field>

                        <Field label="Valor Inicial / Próximo" description="El próximo número a utilizar.">
                            <Input
                                type="number"
                                name="currentValue"
                                value={config.currentValue}
                                onChange={handleChange}
                                disabled={!config.useAutoSequence}
                                className="font-mono"
                            />
                        </Field>

                        <Field label="Longitud de Secuencia" description="Cantidad de ceros a la izquierda.">
                            <Input
                                type="number"
                                name="sequenceLength"
                                value={config.sequenceLength}
                                onChange={handleChange}
                                disabled={!config.useAutoSequence}
                                min={1}
                                max={10}
                                className="font-mono"
                            />
                        </Field>

                        <div className="mt-6 p-4 border border-dashed border-gray-300 rounded-lg text-center">
                            <span className="text-sm text-gray-500 block mb-1">Vista Previa</span>
                            <span className="text-2xl font-bold text-gray-800 font-mono tracking-wider">
                                {previewCode()}
                            </span>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Sección para configurar el formato del nombre */}
            <Section title="Formato del Nombre">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div>
                                <span className="font-medium text-gray-900">Formato del Nombre</span>
                                <p className="text-xs text-gray-500">Define cómo se capitaliza el nombre del cliente.</p>
                            </div>
                            <select
                                name="nameCase"
                                value={config.nameCase}
                                onChange={handleChange}
                                className="h-8 w-40 p-1 border rounded bg-white"
                            >
                                <option value="words">Cada palabra (Palabras)</option>
                                <option value="first">Primera letra</option>
                                <option value="normal">Sin cambios</option>
                            </select>
                        </div>
                    </div>
                </div>
            </Section>
        </div>
    );
};

export default ClientConfig;

