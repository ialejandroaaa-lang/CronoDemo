import React, { useState, useEffect } from 'react';
import { Save, Settings, Loader2, RefreshCcw, Layers } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { getSequences, updateSequence } from '../../api/sequences';
import { getPlanes as getPlanesUoM } from '../../api/unidadMedida';
import { getAjusteConfig, updateAjusteConfig } from '../../api/ajusteConfig';

const AjusteConfig = () => {
    const [sequence, setSequence] = useState(null);
    const [config, setConfig] = useState(null);
    const [planes, setPlanes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getSequences();
            // Find the sequence for Adjustments (handle casing)
            const ajusteSeq = data.find(s => (s.code || s.Code || '').toUpperCase() === 'AJUSTE') || {
                id: 0, code: 'AJUSTE', name: 'Ajuste de Inventario', prefix: 'AJ-', currentValue: 0, length: 6
            };

            setSequence(ajusteSeq);

            // Load Plans and Config
            const [planesData, configData] = await Promise.all([
                getPlanesUoM(),
                getAjusteConfig()
            ]);
            setPlanes(planesData || []);
            setConfig(configData || { defaultPlanId: '', defaultUnit: '' });

            setError(null);
        } catch (err) {
            console.error(err);
            setError('Error al cargar la secuencia o configuración. Verifique la conexión.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = (field, value) => {
        setSequence(prev => ({ ...prev, [field]: value }));
    };

    const handleConfigUpdate = (field, value) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!sequence) return;

        try {
            setSaving(true);
            if (sequence.id > 0) {
                await Promise.all([
                    updateSequence(sequence.id, sequence),
                    updateAjusteConfig(config)
                ]);
            } else {
                alert("Secuencia no inicializada en base de datos. Guarde un ajuste primero o contacte soporte.");
                return;
            }
            alert("Configuración guardada correctamente.");
        } catch (err) {
            console.error(err);
            alert("Error al guardar cambios.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-hd-orange" /></div>;
    if (error) return <div className="p-8 text-red-600 font-bold text-center">{error}</div>;

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                        <Settings size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Conf. Ajustes</h1>
                        <p className="text-sm text-gray-500">Secuencia y preferencias</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-hd-orange hover:bg-orange-600">
                    {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar
                </Button>
            </div>

            <Card className="border-l-4 border-l-hd-orange">
                <CardHeader className="bg-gray-50/50">
                    <CardTitle className="text-lg font-medium text-gray-800 flex items-center gap-2">
                        <RefreshCcw size={18} />
                        Secuencia de Ajustes
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Prefijo</label>
                            <Input
                                value={sequence.prefix || ''}
                                onChange={(e) => handleUpdate('prefix', e.target.value)}
                                className="font-mono uppercase"
                                placeholder="AJ-"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Longitud Numérica</label>
                            <Input
                                type="number"
                                value={sequence.length}
                                onChange={(e) => handleUpdate('length', parseInt(e.target.value))}
                                className="font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Último Número Usado</label>
                            <Input
                                type="number"
                                value={sequence.currentValue}
                                onChange={(e) => handleUpdate('currentValue', parseInt(e.target.value))}
                                className="font-mono text-right font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Siguiente Número</label>
                            <div className="p-2 bg-gray-100 rounded border border-gray-200 text-right font-mono text-gray-700">
                                {sequence.prefix}{String(sequence.currentValue + 1).padStart(sequence.length, '0')}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="bg-gray-50/50">
                    <CardTitle className="text-lg font-medium text-gray-800 flex items-center gap-2">
                        <Layers size={18} />
                        Plan de Medida por Defecto
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Plan de Medida</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={config?.defaultPlanId || ''}
                            onChange={(e) => handleConfigUpdate('defaultPlanId', e.target.value)}
                        >
                            <option value="">(Ninguno / Usar del Artículo)</option>
                            {planes.map(p => (
                                <option key={p.planId} value={p.planId}>{p.descripcion || p.planId}</option>
                            ))}
                        </select>
                        <p className="text-sm text-gray-500">
                            Este plan se asignará a las nuevas líneas en el Ajuste si es compatible con la unidad base del artículo o si se fuerza su uso.
                        </p>
                    </div>
                    <div className="space-y-2 mt-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Unidad por Defecto</label>
                        <Input
                            className="bg-white"
                            placeholder="Ej. CAJA, UND..."
                            value={config?.defaultUnit || ''}
                            onChange={(e) => handleConfigUpdate('defaultUnit', e.target.value)}
                        />
                        <p className="text-sm text-gray-500">
                            Si el artículo o su plan tienen esta unidad, se seleccionará automáticamente.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AjusteConfig;


