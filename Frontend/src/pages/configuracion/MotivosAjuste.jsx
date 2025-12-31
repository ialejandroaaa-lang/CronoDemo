import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, FolderOpen, Save, X, AlertTriangle, Lock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { getMotivos, saveMotivo, deleteMotivo } from '../../api/motivosAjuste';

const MotivosAjuste = () => {
    const navigate = useNavigate();
    const [motivos, setMotivos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMotivo, setCurrentMotivo] = useState(null);
    const [formData, setFormData] = useState({
        grupo: '',
        codigo: '',
        motivo: '',
        activo: true
    });
    const [error, setError] = useState('');

    const loadMotivos = async () => {
        setLoading(true);
        try {
            const data = await getMotivos();
            setMotivos(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMotivos();
    }, []);

    // Helper to group data
    const groupedMotivos = motivos.reduce((acc, curr) => {
        const group = curr.grupo || 'Sin Grupo';
        if (!acc[group]) acc[group] = [];
        acc[group].push(curr);
        return acc;
    }, {});

    // Filter logic
    const filteredGroups = Object.entries(groupedMotivos).reduce((acc, [groupName, items]) => {
        const filteredItems = items.filter(m =>
            m.motivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.codigo.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filteredItems.length > 0) {
            acc[groupName] = filteredItems;
        }
        return acc;
    }, {});

    const handleOpenModal = (item = null) => {
        setError('');
        if (item) {
            setCurrentMotivo(item);
            setFormData({ ...item });
        } else {
            setCurrentMotivo(null);
            setFormData({
                grupo: 'Conteo Físico', // Default
                codigo: '',
                motivo: '',
                activo: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await saveMotivo(formData);
            await loadMotivos();
            setIsModalOpen(false);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Está seguro de eliminar este motivo? Esta acción no se puede deshacer si ya ha sido utilizado.')) return;
        try {
            await deleteMotivo(id);
            loadMotivos();
        } catch (err) {
            console.error(err);
            alert('Error al eliminar');
        }
    };

    // Predefined Groups for dropdown
    const groupOptions = [
        "Conteo Físico",
        "Daño / Merma",
        "Pérdida / Robo",
        "Errores Operativos",
        "Producción / Proceso",
        "Conversión de Unidades",
        "Reclasificación Interna",
        "Obsolescencia",
        "Ajuste Inicial / Migración"
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" onClick={() => navigate('/configuracion')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Motivos de Ajuste</h1>
                        <p className="text-sm text-gray-500">Catálogo de razones para movimientos de inventario</p>
                    </div>
                </div>
                <Button className="bg-hd-orange hover:bg-orange-600" onClick={() => handleOpenModal()}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Motivo
                </Button>
            </div>

            {/* Search */}
            <Card className="mb-6">
                <div className="p-4">
                    <Input
                        placeholder="Buscar por código o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </Card>

            {/* Content Groups */}
            <div className="space-y-6">
                {Object.keys(filteredGroups).length === 0 && !loading && (
                    <div className="text-center py-10 text-gray-500">No se encontraron resultados</div>
                )}

                {Object.entries(filteredGroups).map(([groupName, items]) => (
                    <Card key={groupName} className="overflow-hidden">
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-gray-500" />
                            <h3 className="font-semibold text-gray-700">{groupName}</h3>
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                {items.length}
                            </span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {items.map(item => (
                                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-orange-50 text-orange-700 font-mono text-sm px-3 py-1 rounded border border-orange-100 min-w-[80px] text-center">
                                            {item.codigo}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{item.motivo}</p>
                                            {!item.activo && (
                                                <span className="text-xs text-red-500 font-medium">Inactivo</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(item)}>
                                            <Edit2 className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                                            <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-bold text-gray-800">
                                {currentMotivo ? 'Editar Motivo' : 'Nuevo Motivo'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded text-sm flex items-center gap-2">
                                    <AlertTriangle size={16} />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                                <select
                                    className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange"
                                    value={formData.grupo}
                                    onChange={e => setFormData({ ...formData, grupo: e.target.value })}
                                >
                                    {groupOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                                <div className="relative">
                                    <Input
                                        value={formData.codigo}
                                        onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                                        disabled={!!currentMotivo} // Disable if editing
                                        placeholder="Ej. CF-01"
                                        maxLength={10}
                                        className={currentMotivo ? 'bg-gray-100 pr-8' : ''}
                                    />
                                    {currentMotivo && (
                                        <Lock className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                    )}
                                </div>
                                {currentMotivo && <p className="text-xs text-gray-500 mt-1">El código no se puede modificar.</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Descripción</label>
                                <Input
                                    value={formData.motivo}
                                    onChange={e => setFormData({ ...formData, motivo: e.target.value })}
                                    placeholder="Descripción del motivo"
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="activo"
                                    checked={formData.activo}
                                    onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                                    className="h-4 w-4 text-hd-orange focus:ring-hd-orange border-gray-300 rounded"
                                />
                                <label htmlFor="activo" className="text-sm text-gray-700">Activo</label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-hd-orange hover:bg-orange-600">
                                    <Save className="mr-2 h-4 w-4" /> Guardar
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MotivosAjuste;

