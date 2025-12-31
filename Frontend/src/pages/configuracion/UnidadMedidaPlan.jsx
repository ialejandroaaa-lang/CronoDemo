import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, ArrowLeft, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { getPlanes, getPlan, savePlan, deletePlan } from '../../api/unidadMedida';

const UnidadMedidaPlan = () => {
    const navigate = useNavigate();
    const [headerContainer, setHeaderContainer] = useState(null);
    const [messageContainer, setMessageContainer] = useState(null);
    const [saveMessage, setSaveMessage] = useState('');

    // Data States
    const [planes, setPlanes] = useState([]);
    const [loading, setLoading] = useState(false);

    // Current Plan State
    const [currentPlan, setCurrentPlan] = useState({
        id: 0,
        planId: '',
        descripcion: '',
        unidadBase: 'UND',
        decimales: 0,
        detalles: []
    });

    const [isNew, setIsNew] = useState(true);

    useEffect(() => {
        setHeaderContainer(document.getElementById('header-actions'));
        setMessageContainer(document.getElementById('header-message'));
        loadPlanes();
    }, []);

    const loadPlanes = async () => {
        setLoading(true);
        try {
            const data = await getPlanes();
            setPlanes(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = async (planId) => {
        setLoading(true);
        try {
            const data = await getPlan(planId);
            setCurrentPlan({ ...data, detalles: data.detalles || [] });
            setIsNew(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewPlan = () => {
        setCurrentPlan({
            id: 0,
            planId: '',
            descripcion: '',
            unidadBase: 'UND',
            decimales: 0,
            detalles: []
        });
        setIsNew(true);
    };

    const handleChange = (field, value) => {
        setCurrentPlan(prev => ({ ...prev, [field]: value }));
    };

    const handleDetailChange = (index, field, value) => {
        setCurrentPlan(prev => {
            const newDetalles = [...prev.detalles];
            newDetalles[index] = { ...newDetalles[index], [field]: value };
            return { ...prev, detalles: newDetalles };
        });
    };

    const handleAddDetail = () => {
        setCurrentPlan(prev => ({
            ...prev,
            detalles: [...prev.detalles, {
                id: 0,
                unidadMedida: '',
                cantidad: 1,
                equivalente: prev.unidadBase,
                orden: prev.detalles.length + 1
            }]
        }));
    };

    const handleDeleteDetail = (index) => {
        setCurrentPlan(prev => {
            const newDetalles = prev.detalles.filter((_, i) => i !== index);
            return { ...prev, detalles: newDetalles };
        });
    };

    const handleSave = async () => {
        if (!currentPlan.planId) {
            alert('El ID del plan es obligatorio');
            return;
        }

        try {
            // Ensure details have correct PlanId and Equivalente
            const planToSave = {
                ...currentPlan,
                detalles: currentPlan.detalles.map((d, idx) => ({
                    ...d,
                    planId: currentPlan.planId,
                    equivalente: currentPlan.unidadBase,
                    orden: idx + 1
                }))
            };

            await savePlan(planToSave);
            setSaveMessage('Plan guardado correctamente');
            setTimeout(() => setSaveMessage(''), 3000);
            loadPlanes();
            if (isNew) setIsNew(false);
        } catch (error) {
            console.error(error);
            alert('Error al guardar el plan');
        }
    };

    const handleDeletePlan = async () => {
        if (!confirm('¿Está seguro de eliminar este plan de unidades de medida?')) return;

        try {
            await deletePlan(currentPlan.planId);
            setSaveMessage('Plan eliminado');
            setTimeout(() => setSaveMessage(''), 3000);
            loadPlanes();
            handleNewPlan();
        } catch (error) {
            console.error(error);
            alert('Error al eliminar el plan');
        }
    };

    // Update equivalent unit when Base Unit changes
    useEffect(() => {
        setCurrentPlan(prev => ({
            ...prev,
            detalles: prev.detalles.map(d => ({ ...d, equivalente: prev.unidadBase }))
        }));
    }, [currentPlan.unidadBase]);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {headerContainer && createPortal(
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={() => navigate('/configuracion')} className="mr-2">
                        <span className="text-gray-600">Cancelar</span>
                    </Button>
                    <Button className="bg-hd-orange hover:bg-orange-600" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar
                    </Button>
                    {!isNew && (
                        <Button variant="ghost" onClick={handleDeletePlan} className="text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                        </Button>
                    )}
                </div>,
                headerContainer
            )}

            {messageContainer && saveMessage && createPortal(
                <div className="text-green-600 text-sm font-medium">
                    {saveMessage}
                </div>,
                messageContainer
            )}

            <div className="grid grid-cols-12 gap-6">
                {/* List Sidebar */}
                <div className="col-span-12 md:col-span-4 h-full">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="py-4 px-4 border-b">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-md">Planes Existentes</CardTitle>
                                <Button size="sm" variant="outline" onClick={handleNewPlan}>
                                    <Plus className="h-4 w-4 mr-1" /> Nuevo
                                </Button>
                            </div>
                        </CardHeader>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[600px]">
                            {loading ? (
                                <p className="text-center text-gray-400 py-4">Cargando...</p>
                            ) : planes.map(plan => (
                                <div
                                    key={plan.planId}
                                    onClick={() => handleSelectPlan(plan.planId)}
                                    className={`p-3 rounded-md cursor-pointer border transition-colors ${currentPlan.planId === plan.planId
                                            ? 'bg-orange-50 border-orange-200 text-hd-orange'
                                            : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                                        }`}
                                >
                                    <div className="font-semibold">{plan.planId}</div>
                                    <div className="text-xs text-gray-500 truncate">{plan.descripcion}</div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Detail Form */}
                <div className="col-span-12 md:col-span-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>{isNew ? 'Nuevo Plan de U de M' : `Editando: ${currentPlan.planId}`}</CardTitle>
                        </CardHeader>
                        <div className="p-6 space-y-6">
                            {/* Header Fields */}
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
                                <div>
                                    <label className="text-xs font-bold text-gray-600">Id. de plan de U de M</label>
                                    <Input
                                        value={currentPlan.planId}
                                        onChange={(e) => handleChange('planId', e.target.value)}
                                        disabled={!isNew}
                                        placeholder="EJ: CAJAS"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600">Descripción</label>
                                    <Input
                                        value={currentPlan.descripcion}
                                        onChange={(e) => handleChange('descripcion', e.target.value)}
                                        placeholder="Descripción del plan"
                                        className="mt-1"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-600">U de M Base</label>
                                        <Input
                                            value={currentPlan.unidadBase}
                                            onChange={(e) => handleChange('unidadBase', e.target.value)}
                                            placeholder="UND"
                                            className="mt-1 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600">Posiciones decimales</label>
                                        <select
                                            value={currentPlan.decimales}
                                            onChange={(e) => handleChange('decimales', parseInt(e.target.value))}
                                            className="mt-1 flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        >
                                            {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Detail Grid */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-semibold">Conversiones</label>
                                    <Button size="sm" variant="outline" onClick={handleAddDetail}>
                                        <Plus className="h-4 w-4 mr-1" /> Agregar Unidad
                                    </Button>
                                </div>
                                <div className="border rounded-md overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-gray-100">
                                            <TableRow>
                                                <TableHead className="w-1/3">U de M</TableHead>
                                                <TableHead className="w-1/3">Cantidad</TableHead>
                                                <TableHead className="w-1/4">Equivalente</TableHead>
                                                <TableHead className="w-10"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {/* Base row (read only logic display) */}
                                            <TableRow className="bg-gray-50/50">
                                                <TableCell className="font-bold">{currentPlan.unidadBase}</TableCell>
                                                <TableCell className="font-mono">1.00000</TableCell>
                                                <TableCell className="text-gray-500">{currentPlan.unidadBase}</TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>

                                            {currentPlan.detalles.map((det, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>
                                                        <Input
                                                            value={det.unidadMedida}
                                                            onChange={(e) => handleDetailChange(idx, 'unidadMedida', e.target.value)}
                                                            placeholder="Ej: CAJA"
                                                            className="h-8"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={det.cantidad}
                                                            onChange={(e) => handleDetailChange(idx, 'cantidad', parseFloat(e.target.value))}
                                                            className="h-8 font-mono"
                                                            step="0.00001"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-gray-500 text-sm">
                                                        {det.equivalente}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                                                            onClick={() => handleDeleteDetail(idx)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {currentPlan.detalles.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                                                        No hay conversiones adicionales definidas
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default UnidadMedidaPlan;

