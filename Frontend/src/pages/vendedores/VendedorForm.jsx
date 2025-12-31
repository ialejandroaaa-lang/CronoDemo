import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const VendedorForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [statusMessage, setStatusMessage] = useState('');
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        phone: '',
        email: '',
        status: 'Active'
    });

    const fetchSellerData = async (sellerId) => {
        try {
            const response = await fetch(`http://localhost:5006/api/Sellers/${sellerId}`);
            if (response.ok) {
                const data = await response.json();
                setFormData(data);
            } else {
                alert('No se pudo cargar el vendedor');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    useEffect(() => {
        if (id) {
            fetchSellerData(id);
        }
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            if (!formData.name) {
                alert('El nombre es obligatorio');
                return;
            }

            const method = id ? 'PUT' : 'POST';
            const url = id
                ? `http://localhost:5006/api/Sellers/${id}`
                : 'http://localhost:5006/api/Sellers';

            const dataToSend = {
                ...formData,
                code: formData.code || `V${Math.floor(Math.random() * 1000)}`
            };

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });

            if (response.ok) {
                setStatusMessage(id ? 'Vendedor actualizado correctamente.' : 'Vendedor registrado correctamente.');
            } else {
                alert('Error al guardar');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 min-h-screen">
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/vendedores')} className="text-gray-500 hover:text-gray-800">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 font-medium">Vendedores</span>
                            <span className="text-gray-400 text-xs">/</span>
                            <span className="text-sm text-gray-800 font-bold">{id ? 'Editar Vendedor' : 'Nuevo Vendedor'}</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">Tarjeta de Vendedor</h1>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    {statusMessage && (
                        <span className="text-lg font-bold text-blue-400 animate-pulse">{statusMessage}</span>
                    )}
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => navigate('/vendedores')}>
                            <X className="mr-2 h-4 w-4" /> Cancelar
                        </Button>
                        <Button size="sm" onClick={handleSave} className="bg-hd-orange hover:bg-orange-600 text-white">
                            <Save className="mr-2 h-4 w-4" /> Guardar
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 max-w-4xl mx-auto w-full">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Código</label>
                        <Input name="code" value={formData.code} onChange={handleChange} placeholder="(Auto)" className="bg-gray-50" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Nombre *</label>
                        <Input name="name" value={formData.name} onChange={handleChange} placeholder="Nombre completo" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500">Teléfono</label>
                            <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="(809) 000-0000" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500">Email</label>
                            <Input name="email" value={formData.email} onChange={handleChange} placeholder="vendedor@empresa.com" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Estado</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-hd-orange">
                            <option value="Active">Activo</option>
                            <option value="Inactive">Inactivo</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendedorForm;
