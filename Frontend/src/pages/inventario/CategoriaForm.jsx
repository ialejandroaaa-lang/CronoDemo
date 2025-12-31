import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';

const CategoriaForm = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/categorias')}>
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Nueva Categoría</h1>
                        <p className="text-xs text-gray-500">Definición de familia de productos</p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/categorias')}>
                        <X className="mr-2 h-4 w-4" /> Cancelar
                    </Button>
                    <Button size="sm" className="bg-hd-orange hover:bg-orange-600 text-white">
                        <Save className="mr-2 h-4 w-4" /> Guardar
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Datos de la Categoría</CardTitle>
                </CardHeader>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Código" placeholder="AUTO" disabled />
                        <Input label="Nombre" placeholder="Ej. Herramientas Eléctricas" />
                    </div>
                    <div className="flex flex-col space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Descripción</label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-hd-orange focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Descripción detallada de la categoría..."
                        />
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <input type="checkbox" id="active" className="h-4 w-4 text-hd-orange rounded border-gray-300 focus:ring-hd-orange" defaultChecked />
                        <label htmlFor="active" className="text-sm text-gray-700">Categoría Activa</label>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default CategoriaForm;

