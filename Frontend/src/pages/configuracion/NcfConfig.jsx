import React, { useState, useEffect } from 'react';
import { Save, Settings, Info, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { getNcfSequences, updateNcfSequence } from '../../api/ncf';

const NcfConfig = () => {
    const [ncfTypes, setNcfTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getNcfSequences();
            setNcfTypes(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Error al cargar la configuración de NCF. Verifique la conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = (id, field, value) => {
        setNcfTypes(prev => prev.map(t =>
            t.id === id ? { ...t, [field]: value } : t
        ));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            // Save all modified types
            const promises = ncfTypes.map(ncf => updateNcfSequence(ncf.id, ncf));
            await Promise.all(promises);
            alert("Configuración de NCF guardada correctamente.");
        } catch (err) {
            console.error(err);
            alert("Error al guardar cambios. Revise la consola.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-hd-orange" size={48} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 rounded-lg">
                <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                <h3 className="text-xl font-bold text-red-700 mb-2">Error de Carga</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={loadData} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                    Reintentar
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                        <Settings size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Comprobantes Fiscales (NCF)</h1>
                        <p className="text-sm text-gray-500">Configuración de secuencias para República Dominicana (DGII)</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-hd-orange hover:bg-orange-600 shadow-md">
                    {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>

            <div className="grid gap-6">
                {ncfTypes.sort((a, b) => a.tipoNCF.localeCompare(b.tipoNCF)).map((type) => (
                    <Card key={type.id} className={`overflow-hidden border-l-4 ${type.activo ? 'border-l-hd-orange' : 'border-l-gray-300 opacity-75'}`}>
                        <CardHeader className="bg-gray-50/50 pb-3">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-medium text-gray-800 flex items-center">
                                    <span className="bg-gray-200 text-gray-700 text-xs font-mono px-2 py-1 rounded mr-3">{type.prefijo || type.tipoNCF}</span>
                                    {type.nombre}
                                </CardTitle>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={type.activo}
                                            onChange={(e) => handleUpdate(type.id, 'activo', e.target.checked)}
                                            className="mr-2 rounded text-hd-orange focus:ring-hd-orange"
                                        />
                                        <span className="text-xs font-bold text-gray-500">ACTIVO</span>
                                    </label>
                                    <Info size={16} className="text-gray-400 cursor-help" title="Configuración de secuencia DGII" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Prefijo Serie</label>
                                    <Input
                                        value={type.prefijo || ''}
                                        onChange={(e) => handleUpdate(type.id, 'prefijo', e.target.value)}
                                        className="font-mono uppercase"
                                        placeholder="Ej: B01"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Secuencia Inicial</label>
                                    <Input
                                        type="number"
                                        value={type.desde}
                                        onChange={(e) => handleUpdate(type.id, 'desde', parseInt(e.target.value))}
                                        className="font-mono text-right"
                                    />
                                    <p className="text-[10px] text-gray-400">Inicio del rango</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Secuencia Actual / Siguiente</label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={type.actual + 1}
                                            onChange={(e) => handleUpdate(type.id, 'actual', parseInt(e.target.value) - 1)}
                                            className="font-mono text-right font-bold text-gray-900 border-hd-orange/50 focus:border-hd-orange ring-hd-orange/20"
                                        />
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">Sig:</div>
                                    </div>
                                    <p className="text-[10px] text-blue-600 font-medium">
                                        NCF a generar: {(type.prefijo || type.tipoNCF)}{String((type.actual || 0) + 1).padStart(8, '0')}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Límite / Vencimiento</label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            value={type.hasta}
                                            onChange={(e) => handleUpdate(type.id, 'hasta', parseInt(e.target.value))}
                                            className="font-mono text-right flex-1"
                                            placeholder="Límite"
                                        />
                                        <Input
                                            type="date"
                                            value={type.fechaVencimiento ? type.fechaVencimiento.split('T')[0] : ''}
                                            onChange={(e) => handleUpdate(type.id, 'fechaVencimiento', e.target.value)}
                                            className="font-mono flex-1"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400">Límite Secuencia / Fecha Vencimiento</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

        </div>
    );
};

export default NcfConfig;

