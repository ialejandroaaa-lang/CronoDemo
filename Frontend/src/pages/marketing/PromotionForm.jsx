import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Gift, AlertCircle, Search, Layers } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import ProductSearchModal from '../../components/ProductSearchModal';
import CategorySearchModal from '../../components/CategorySearchModal';

import { createPromotion, updatePromotion, getPromotionById } from '../../api/promotions';

const PromotionForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isActive: true,
        priority: 0,
        rules: [],
        actions: [],
        autoApply: false,
        stackable: false,
        requiresCoupon: false,
        applyTo: 'Both'
    });

    const [showProductSearch, setShowProductSearch] = useState(false);
    const [showCategorySearch, setShowCategorySearch] = useState(false);
    const [activeRuleIndex, setActiveRuleIndex] = useState(null);
    const [activeActionIndex, setActiveActionIndex] = useState(null);

    useEffect(() => {
        if (isEdit) {
            loadPromotion();
        }
    }, [id]);

    const loadPromotion = async () => {
        try {
            const data = await getPromotionById(id);
            // Format dates for input type="date"
            const formatted = {
                ...data,
                startDate: data.startDate?.split('T')[0],
                endDate: data.endDate?.split('T')[0] || ''
            };
            setFormData(formatted);
        } catch (error) {
            console.error("Error loading promo", error);
        }
    };

    // Backend compatible Types
    const ruleTypes = [
        { value: 'MinOrderTotal', label: 'Monto Mínimo Orden' },
        { value: 'ContainsProduct', label: 'Contiene Producto (ID)' },
        { value: 'ContainsCategory', label: 'Contiene Categoría (Nombre)' }
    ];

    const actionTypes = [
        { value: 'DiscountPercentage', label: 'Descuento (%)' },
        { value: 'DiscountAmount', label: 'Descuento Fijo ($)' }
    ];

    const handleSave = async () => {
        try {
            // Prepare payload
            const payload = {
                ...formData,
                endDate: formData.endDate ? formData.endDate : null,
                priority: parseInt(formData.priority) || 0,
                // Ensure correct types for actions & Filter invalid
                actions: formData.actions
                    .map(a => ({
                        ...a,
                        value: parseFloat(a.value) || 0,
                        targetArtifact: a.targetArtifact || null
                    }))
                    .filter(a => a.value > 0), // Ignore 0 value actions

                // Ensure rules have string values & Filter invalid
                rules: formData.rules
                    .map(r => ({
                        ...r,
                        value: r.value ? r.value.toString() : ""
                    }))
                    .filter(r => r.value !== "") // Ignore empty rules
            };

            if (isEdit) {
                await updatePromotion(id, payload);
            } else {
                await createPromotion(payload);
            }
            navigate('/marketing/promociones');
        } catch (error) {
            console.error("Error saving promotion", error);
            alert(`Error al guardar: ${error.message}`);
        }
    };

    // Helper to safely update simple fields
    const handleChange = (field, value) => {
        // Allow empty string for number inputs to clear them
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleProductSelect = (product) => {
        if (activeRuleIndex !== null) {
            const newRules = [...formData.rules];
            newRules[activeRuleIndex].value = product.id.toString();
            setFormData({ ...formData, rules: newRules });
            setActiveRuleIndex(null);
        } else if (activeActionIndex !== null) {
            const newActions = [...formData.actions];
            newActions[activeActionIndex].targetArtifact = product.id.toString();
            setFormData({ ...formData, actions: newActions });
            setActiveActionIndex(null);
        }
        setShowProductSearch(false);
    };

    const handleCategorySelect = (category) => {
        if (activeRuleIndex !== null) {
            const newRules = [...formData.rules];
            newRules[activeRuleIndex].value = category.nombre;
            setFormData({ ...formData, rules: newRules });
            setActiveRuleIndex(null);
        } else if (activeActionIndex !== null) {
            const newActions = [...formData.actions];
            newActions[activeActionIndex].targetArtifact = category.nombre;
            setFormData({ ...formData, actions: newActions });
            setActiveActionIndex(null);
        }
        setShowCategorySearch(false);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20 p-6">
            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 bg-gray-50/95 backdrop-blur z-20 py-4 border-b border-gray-200 -mx-6 px-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/marketing/promociones')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Editar Promoción' : 'Nueva Promoción'}</h1>
                        <p className="text-sm text-gray-500">{isEdit ? `ID: ${id}` : 'Configura las reglas y beneficios'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/marketing/promociones')}>Cancelar</Button>
                    <Button onClick={handleSave} className="bg-hd-orange hover:bg-orange-600"><Save className="mr-2 h-4 w-4" /> Guardar</Button>
                </div>
            </div>

            {/* General Info */}
            <Card className="shadow-sm border-l-4 border-l-hd-orange">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-gray-500" /> Información General</CardTitle>
                </CardHeader>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre de la Promoción</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring focus:ring-orange-200 sm:text-sm p-2 border"
                            value={formData.name}
                            onChange={e => handleChange('name', e.target.value)}
                            placeholder="Ej: Descuento Verano 2025"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                        <input
                            type="number"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring focus:ring-orange-200 sm:text-sm p-2 border"
                            value={formData.priority}
                            onChange={e => handleChange('priority', e.target.value)}
                        />
                        <p className="text-xs text-gray-400 mt-1">Mayor número = Se aplica primero.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Aplicar A:</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring focus:ring-orange-200 sm:text-sm p-2 border"
                            value={formData.applyTo}
                            onChange={e => handleChange('applyTo', e.target.value)}
                        >
                            <option value="Both">Ambos (POS y Distribución)</option>
                            <option value="POS">Solo POS</option>
                            <option value="Distribution">Solo Ventas Distribución</option>
                        </select>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">Inicio</label>
                            <input
                                type="date"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring focus:ring-orange-200 sm:text-sm p-2 border"
                                value={formData.startDate}
                                onChange={e => handleChange('startDate', e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">Fin (Opcional)</label>
                            <input
                                type="date"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring focus:ring-orange-200 sm:text-sm p-2 border"
                                value={formData.endDate}
                                onChange={e => handleChange('endDate', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={e => handleChange('isActive', e.target.checked)}
                                className="rounded text-hd-orange focus:ring-orange-500 h-5 w-5"
                            />
                            <span className="text-gray-900 font-medium">Activa</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer ml-4">
                            <input
                                type="checkbox"
                                checked={formData.autoApply}
                                onChange={e => handleChange('autoApply', e.target.checked)}
                                className="rounded text-hd-orange focus:ring-orange-500 h-5 w-5"
                            />
                            <span className="text-gray-900 font-medium">Aplicar Automáticamente</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer ml-4">
                            <input
                                type="checkbox"
                                checked={formData.stackable}
                                onChange={e => handleChange('stackable', e.target.checked)}
                                className="rounded text-hd-orange focus:ring-orange-500 h-5 w-5"
                            />
                            <span className="text-gray-900 font-medium">Acumulable</span>
                        </label>
                    </div>
                </div>
            </Card>

            {/* Rules Section */}
            <Card className="shadow-sm">
                <CardHeader className="bg-gray-50 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-gray-800">Reglas (Condiciones)</CardTitle>
                        <Button size="sm" variant="outline" onClick={() => setFormData({ ...formData, rules: [...formData.rules, { type: 'MinOrderTotal', operator: 'GreaterThan', value: '' }] })}>
                            <Plus className="h-4 w-4 mr-1" /> Agregar Regla
                        </Button>
                    </div>
                </CardHeader>
                <div className="p-6 space-y-4">
                    {formData.rules.length === 0 && (
                        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                            No hay reglas definidas. La promoción se aplicará siempre.
                        </div>
                    )}
                    {formData.rules.map((rule, idx) => (
                        <div key={idx} className="flex gap-4 items-center bg-gray-50 p-3 rounded border border-gray-200">
                            <select
                                className="block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring-orange-200 sm:text-sm p-2 border"
                                value={rule.type}
                                onChange={(e) => {
                                    const newRules = [...formData.rules];
                                    newRules[idx].type = e.target.value;
                                    setFormData({ ...formData, rules: newRules });
                                }}
                            >
                                {ruleTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>

                            <select
                                className="block w-1/5 rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring-orange-200 sm:text-sm p-2 border"
                                value={rule.operator}
                                onChange={(e) => {
                                    const newRules = [...formData.rules];
                                    newRules[idx].operator = e.target.value;
                                    setFormData({ ...formData, rules: newRules });
                                }}
                            >
                                <option value="GreaterThan">Mayor que</option>
                                <option value="Equals">Igual a</option>
                            </select>

                            <div className="relative flex-1 group">
                                <input
                                    type="text"
                                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring-orange-200 sm:text-sm p-2 border ${(rule.type === 'ContainsProduct' || rule.type === 'ContainsCategory') ? 'pr-10' : ''
                                        }`}
                                    placeholder={
                                        rule.type === 'ContainsProduct' ? 'ID Producto' :
                                            rule.type === 'ContainsCategory' ? 'Nombre Categoría' : 'Valor'
                                    }
                                    value={rule.value}
                                    onChange={(e) => {
                                        const newRules = [...formData.rules];
                                        newRules[idx].value = e.target.value;
                                        setFormData({ ...formData, rules: newRules });
                                    }}
                                />
                                {/* Merged Search Button */}
                                {(rule.type === 'ContainsProduct' || rule.type === 'ContainsCategory') && (
                                    <button
                                        type="button"
                                        className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-hd-orange transition-colors rounded-r-md border-l border-transparent hover:bg-orange-50"
                                        onClick={() => {
                                            setActiveRuleIndex(idx);
                                            if (rule.type === 'ContainsProduct') setShowProductSearch(true);
                                            else setShowCategorySearch(true);
                                        }}
                                        title="Buscar..."
                                    >
                                        {rule.type === 'ContainsProduct' ? <Search size={16} /> : <Layers size={16} />}
                                    </button>
                                )}
                            </div>

                            <Button variant="ghost" size="sm" onClick={() => {
                                const newRules = [...formData.rules];
                                newRules.splice(idx, 1);
                                setFormData({ ...formData, rules: newRules });
                            }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Actions Section */}
            <Card className="shadow-sm">
                <CardHeader className="bg-gray-50 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-gray-800">Beneficios (Acciones)</CardTitle>
                        <Button size="sm" variant="outline" className="text-hd-orange border-hd-orange hover:bg-orange-50"
                            onClick={() => setFormData({ ...formData, actions: [...formData.actions, { type: 'DiscountPercentage', value: 0, appliesTo: 'Order', targetArtifact: '' }] })}
                        >
                            <Plus className="h-4 w-4 mr-1" /> Agregar Beneficio
                        </Button>
                    </div>
                </CardHeader>
                <div className="p-6 space-y-4">
                    {formData.actions.length === 0 && (
                        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            ¿Qué gana el cliente? Agrega un beneficio.
                        </div>
                    )}
                    {formData.actions.map((action, idx) => (
                        <div key={idx} className="flex flex-col gap-2 bg-green-50 p-3 rounded border border-green-200">
                            <div className="flex gap-4 items-center">
                                <select
                                    className="block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring-orange-200 sm:text-sm p-2 border"
                                    value={action.type}
                                    onChange={(e) => {
                                        const newActions = [...formData.actions];
                                        newActions[idx].type = e.target.value;
                                        setFormData({ ...formData, actions: newActions });
                                    }}
                                >
                                    {actionTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                <input
                                    type="number"
                                    className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring-orange-200 sm:text-sm p-2 border"
                                    placeholder="0"
                                    value={action.value}
                                    onChange={(e) => {
                                        const newActions = [...formData.actions];
                                        // Allow empty input for better UX, parse on save
                                        newActions[idx].value = e.target.value;
                                        setFormData({ ...formData, actions: newActions });
                                    }}
                                />
                                <span className="text-sm text-gray-500">en</span>
                                <select
                                    className="block w-1/4 rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring-orange-200 sm:text-sm p-2 border"
                                    value={action.appliesTo}
                                    onChange={(e) => {
                                        const newActions = [...formData.actions];
                                        newActions[idx].appliesTo = e.target.value;
                                        setFormData({ ...formData, actions: newActions });
                                    }}
                                >
                                    <option value="Order">Total de la Orden</option>
                                    <option value="SpecificProduct">Producto Específico</option>
                                    <option value="Category">Categoría</option>
                                </select>
                                <Button variant="ghost" size="sm" onClick={() => {
                                    const newActions = [...formData.actions];
                                    newActions.splice(idx, 1);
                                    setFormData({ ...formData, actions: newActions });
                                }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                            </div>

                            {/* Conditional Target Input */}
                            {(action.appliesTo === 'SpecificProduct' || action.appliesTo === 'Category') && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-xs text-gray-500 uppercase font-bold w-1/3 text-right pr-2">
                                        {action.appliesTo === 'SpecificProduct' ? 'ID del Producto:' : 'Nombre Categoría:'}
                                    </span>
                                    <div className="relative flex-1 group">
                                        <input
                                            type="text"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring-green-200 sm:text-sm p-2 border pr-10"
                                            placeholder={action.appliesTo === 'SpecificProduct' ? 'Ej: 101' : 'Ej: Herramientas'}
                                            value={action.targetArtifact || ''}
                                            onChange={(e) => {
                                                const newActions = [...formData.actions];
                                                newActions[idx].targetArtifact = e.target.value;
                                                setFormData({ ...formData, actions: newActions });
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-hd-orange transition-colors rounded-r-md border-l border-transparent hover:bg-orange-50"
                                            onClick={() => {
                                                setActiveActionIndex(idx);
                                                if (action.appliesTo === 'SpecificProduct') setShowProductSearch(true);
                                                else setShowCategorySearch(true);
                                            }}
                                            title="Buscar..."
                                        >
                                            {action.appliesTo === 'SpecificProduct' ? <Search size={16} /> : <Layers size={16} />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            <ProductSearchModal
                isOpen={showProductSearch}
                onClose={() => setShowProductSearch(false)}
                onSelect={handleProductSelect}
            />

            <CategorySearchModal
                isOpen={showCategorySearch}
                onClose={() => setShowCategorySearch(false)}
                onSelect={handleCategorySelect}
            />
        </div>
    );
};

export default PromotionForm;
