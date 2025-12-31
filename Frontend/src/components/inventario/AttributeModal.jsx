import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const AttributeModal = ({ isOpen, onClose, onSave, title, type, initialData, error: externalError }) => {
    const [currentItem, setCurrentItem] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        activo: true
    });
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setCurrentItem(initialData || { codigo: '', nombre: '', descripcion: '', activo: true });
            setLocalError('');
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await onSave(currentItem);
            // If onSave throws, it will be caught here. If parent handles closing, good.
            // If parent handles API, parent should throw if error to keep modal open.
        } catch (err) {
            console.error(err);
            setLocalError(`Error al guardar ${title}`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {currentItem.id ? 'Editar' : 'Nueva'} {title}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {(localError || externalError) && (
                        <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                            {localError || externalError}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                        <Input
                            value={currentItem.codigo}
                            onChange={(e) => setCurrentItem({ ...currentItem, codigo: e.target.value })}
                            placeholder="EJ: COD-01"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <Input
                            value={currentItem.nombre}
                            onChange={(e) => setCurrentItem({ ...currentItem, nombre: e.target.value })}
                            placeholder={`Nombre de ${title}`}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <Input
                            value={currentItem.descripcion || ''}
                            onChange={(e) => setCurrentItem({ ...currentItem, descripcion: e.target.value })}
                            placeholder="Breve descripción"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="activo"
                            checked={currentItem.activo}
                            onChange={(e) => setCurrentItem({ ...currentItem, activo: e.target.checked })}
                            className="h-4 w-4 text-hd-orange focus:ring-hd-orange border-gray-300 rounded"
                        />
                        <label htmlFor="activo" className="text-sm font-medium text-gray-700">Activo</label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-hd-orange hover:bg-orange-600">
                            <Save className="h-4 w-4 mr-2" />
                            Guardar
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AttributeModal;

