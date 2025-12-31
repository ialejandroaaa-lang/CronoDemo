import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const GrupoProductoModal = ({ isOpen, onClose, onSave, grupo }) => {
    const [formData, setFormData] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        activo: true
    });

    useEffect(() => {
        if (grupo) {
            setFormData(grupo);
        } else {
            setFormData({
                codigo: '',
                nombre: '',
                descripcion: '',
                activo: true
            });
        }
    }, [grupo, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-hd-orange p-4 flex justify-between items-center text-white">
                    <h2 className="text-lg font-bold">{grupo ? 'Editar Grupo' : 'Nuevo Grupo'}</h2>
                    <button onClick={onClose} className="hover:bg-orange-700 p-1 rounded transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Código</label>
                        <Input
                            placeholder="Ej: PROF"
                            value={formData.codigo}
                            onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Nombre</label>
                        <Input
                            placeholder="Ej: Profesional"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Descripción</label>
                        <Input
                            placeholder="Opcional..."
                            value={formData.descripcion || ''}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-semibold text-gray-700">Activo</label>
                        <input
                            type="checkbox"
                            checked={formData.activo}
                            onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-hd-orange focus:ring-hd-orange"
                        />
                    </div>
                    <div className="pt-4 flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" className="bg-hd-orange hover:bg-orange-700 text-white shadow-lg">
                            {grupo ? 'Actualizar' : 'Guardar'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GrupoProductoModal;
