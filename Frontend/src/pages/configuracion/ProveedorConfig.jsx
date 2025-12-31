import React, { useState, useEffect } from 'react';
import { Save, Info } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

const Section = ({ title, children, description }) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
        <div className="p-6">
            {children}
        </div>
    </div>
);

const ToggleSwitch = ({ label, description, checked, onChange, disabled, tooltip }) => (
    <div
        className={`flex items-center justify-between p-4 rounded-lg border ${checked ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'} ${disabled ? 'opacity-50' : ''}`}
        title={tooltip || description} // Add native tooltip on hover
    >
        <div>
            <span className={`font-medium ${checked ? 'text-blue-900' : 'text-gray-900'}`}>{label}</span>
            {description && <p className={`text-xs ${checked ? 'text-blue-700' : 'text-gray-500'}`}>{description}</p>}
        </div>
        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer peer checked:right-0 right-6"
                style={{ top: 0, transition: 'right 0.2s' }}
            />
            <div className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${checked ? 'bg-hd-orange' : 'bg-gray-300'}`}></div>
        </div>
        {/* Simple checkbox fallback if CSS toggle issues */}
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="h-6 w-6 text-hd-orange rounded border-gray-300 focus:ring-hd-orange ml-4"
        />
    </div>
);

const ProveedorConfig = () => {
    const [config, setConfig] = useState({
        useAutoSequence: true,
        useInitials: true,
        initials: 'PROV',
        currentValue: 1,
        sequenceLength: 4,
        separator: '-',

        habilitarFacturas: true,
        habilitarPagoRecurrente: false,

        habilitarFrecuenciaSemanal: false,
        habilitarFrecuenciaQuincenal: false,
        habilitarFrecuenciaMensual: true,
        habilitarFechasEspecificas: false
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${((import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') ? import.meta.env.VITE_API_URL : '/api')}/ProveedorConfiguration`);
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            const res = await fetch(`${((import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') ? import.meta.env.VITE_API_URL : '/api')}/ProveedorConfiguration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: 'Error al guardar la configuración' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión' });
        }
    };

    const previewCode = () => {
        const number = String(config.currentValue).padStart(config.sequenceLength || 0, '0');
        if (config.useInitials && config.initials) {
            return `${config.initials}${config.separator}${number}`;
        }
        return number;
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando configuración...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Configuración de Proveedores</h1>
                    <p className="text-gray-500">Gestione reglas de negocio, secuencias y opciones de pago.</p>
                </div>
                <Button className="bg-hd-orange hover:bg-orange-600 text-white" onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                </Button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column 1: General & Sequence */}
                <div className="space-y-6">
                    <Section title="Opciones Generales" description="Funcionalidades habilitadas para el módulo.">
                        <div className="space-y-4">
                            <ToggleSwitch
                                label="Gestión de Facturas"
                                description="Habilitar registro y seguimiento detallado de facturas de compra."
                                tooltip="Active para Modo Fiscal: Exige NCF, Impuestos y RNC. Desactive para Modo Simple."
                                checked={config.habilitarFacturas}
                                onChange={(e) => handleChange('habilitarFacturas', e.target.checked)}
                            />
                        </div>
                    </Section>

                    <Section title="Secuencia de Código" description="Formato automático para nuevos proveedores.">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 mb-4">
                                <input
                                    type="checkbox"
                                    checked={config.useAutoSequence}
                                    onChange={(e) => handleChange('useAutoSequence', e.target.checked)}
                                    className="h-4 w-4 text-hd-orange focus:ring-hd-orange border-gray-300 rounded"
                                />
                                <label className="text-sm font-medium text-gray-700">Activar Secuencia Automática</label>
                            </div>

                            <div className={`grid grid-cols-2 gap-4 ${!config.useAutoSequence ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Iniciales</label>
                                    <Input
                                        value={config.initials}
                                        onChange={(e) => handleChange('initials', e.target.value)}
                                        className="uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Separador</label>
                                    <Input
                                        value={config.separator}
                                        onChange={(e) => handleChange('separator', e.target.value)}
                                        className="text-center"
                                        maxLength={1}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitud (# ceros)</label>
                                    <Input
                                        type="number"
                                        value={config.sequenceLength}
                                        onChange={(e) => handleChange('sequenceLength', parseInt(e.target.value))}
                                        min={1} max={10}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Siguiente Valor</label>
                                    <Input
                                        type="number"
                                        value={config.currentValue}
                                        onChange={(e) => handleChange('currentValue', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-center border border-gray-200">
                                <span className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Vista Previa</span>
                                <span className="text-xl font-mono font-bold text-gray-800 tracking-wider">
                                    {previewCode()}
                                </span>
                            </div>
                        </div>
                    </Section>
                </div>

                {/* Column 2: Recurring Payments */}
                <div className="space-y-6">
                    <Section
                        title="Pagos Recurrentes"
                        description="Configuración de automatización de pagos regulares."
                    >
                        <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200 mb-6">
                            <div>
                                <span className="font-bold text-orange-900">Habilitar Pagos Recurrentes</span>
                                <p className="text-xs text-orange-800">Permitir configurar ciclos de pago automáticos en la ficha del proveedor.</p>
                            </div>
                            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input
                                    type="checkbox"
                                    checked={config.habilitarPagoRecurrente}
                                    onChange={(e) => handleChange('habilitarPagoRecurrente', e.target.checked)}
                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer peer checked:right-0 right-6"
                                />
                                <div className={`block overflow-hidden h-6 rounded-full cursor-pointer ${config.habilitarPagoRecurrente ? 'bg-hd-orange' : 'bg-gray-300'}`}></div>
                            </div>
                            <input
                                type="checkbox"
                                checked={config.habilitarPagoRecurrente}
                                onChange={(e) => handleChange('habilitarPagoRecurrente', e.target.checked)}
                                className="h-6 w-6 text-hd-orange rounded border-gray-300 focus:ring-hd-orange ml-4"
                            />
                        </div>

                        <div className={`space-y-4 transition-all duration-300 ${!config.habilitarPagoRecurrente ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                            <h4 className="font-medium text-gray-700 mb-2 border-b pb-2">Frecuencias Permitidas</h4>

                            <div className="grid grid-cols-1 gap-3">
                                <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.habilitarFrecuenciaSemanal}
                                        onChange={(e) => handleChange('habilitarFrecuenciaSemanal', e.target.checked)}
                                        className="h-5 w-5 text-hd-orange focus:ring-hd-orange border-gray-300 rounded mr-3"
                                    />
                                    <div>
                                        <span className="block font-medium text-gray-900">Semanal</span>
                                        <span className="text-xs text-gray-500">Pagos cada 7 días (ej. Todos los viernes).</span>
                                    </div>
                                </label>

                                <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.habilitarFrecuenciaQuincenal}
                                        onChange={(e) => handleChange('habilitarFrecuenciaQuincenal', e.target.checked)}
                                        className="h-5 w-5 text-hd-orange focus:ring-hd-orange border-gray-300 rounded mr-3"
                                    />
                                    <div>
                                        <span className="block font-medium text-gray-900">Quincenal</span>
                                        <span className="text-xs text-gray-500">Pagos cada 15 días.</span>
                                    </div>
                                </label>

                                <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.habilitarFrecuenciaMensual}
                                        onChange={(e) => handleChange('habilitarFrecuenciaMensual', e.target.checked)}
                                        className="h-5 w-5 text-hd-orange focus:ring-hd-orange border-gray-300 rounded mr-3"
                                    />
                                    <div>
                                        <span className="block font-medium text-gray-900">Mensual</span>
                                        <span className="text-xs text-gray-500">Pagos una vez al mes (ej. día 15 o fin de mes).</span>
                                    </div>
                                </label>

                                <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.habilitarFechasEspecificas}
                                        onChange={(e) => handleChange('habilitarFechasEspecificas', e.target.checked)}
                                        className="h-5 w-5 text-hd-orange focus:ring-hd-orange border-gray-300 rounded mr-3"
                                    />
                                    <div>
                                        <span className="block font-medium text-gray-900">Fechas Específicas</span>
                                        <span className="text-xs text-gray-500">Permitir seleccionar días puntuales (ej. días 5 y 20).</span>
                                    </div>
                                </label>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-md flex items-start mt-4">
                                <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-blue-700">
                                    Al habilitar estas opciones, aparecerán los selectores correspondientes en la ficha de creación y edición de proveedores.
                                </p>
                            </div>
                        </div>
                    </Section>
                </div>
            </div>
        </div>
    );
};

export default ProveedorConfig;


