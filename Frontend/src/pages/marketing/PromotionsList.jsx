import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Tag, Calendar, MoreVertical, Edit, Search, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { getPromotions, deletePromotion } from '../../api/promotions';

const PromotionsList = () => {
    const navigate = useNavigate();
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPromotions();
    }, []);

    const loadPromotions = async () => {
        try {
            setLoading(true);
            const data = await getPromotions();
            setPromotions(data);
        } catch (error) {
            console.error("Failed to load promotions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta promoción?')) {
            await deletePromotion(id);
            loadPromotions();
        }
    };


    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Promociones y Ofertas</h1>
                    <p className="text-gray-500 mt-1">Gestiona descuentos, cupones y reglas automáticas.</p>
                </div>
                <Button onClick={() => navigate('/marketing/promociones/nuevo')} className="bg-hd-orange hover:bg-orange-600 font-bold">
                    <Plus className="mr-2 h-5 w-5" /> Nueva Promoción
                </Button>
            </div>

            <Card className="border-0 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-4 px-6 font-bold text-gray-600">Nombre</th>
                                <th className="text-left py-4 px-6 font-bold text-gray-600">Tipo</th>
                                <th className="text-left py-4 px-6 font-bold text-gray-600">Vigencia</th>
                                <th className="text-center py-4 px-6 font-bold text-gray-600">Estado</th>
                                <th className="text-right py-4 px-6 font-bold text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {promotions.map((promo) => (
                                <tr key={promo.id} className="hover:bg-orange-50/30 transition-colors group">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-orange-100 p-2 rounded-lg text-hd-orange">
                                                <Tag size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{promo.name}</p>
                                                <p className="text-xs text-gray-400">ID: {promo.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-sm">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200 font-medium">
                                            {promo.type}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            {promo.startDate}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${promo.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {promo.isActive ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <Button variant="ghost" size="sm" onClick={() => navigate(`/marketing/promociones/editar/${promo.id}`)}>
                                            <Edit className="h-4 w-4 text-gray-400 group-hover:text-hd-orange" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default PromotionsList;
