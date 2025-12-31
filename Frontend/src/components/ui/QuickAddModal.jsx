import React, { useState } from 'react';
import { X, Plus, Save } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

export const QuickAddModal = ({ isOpen, onClose, onSave, title, fields }) => {
    const [formData, setFormData] = useState({});

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(formData);
        setFormData({});
        onClose();
    };

    const handleChange = (fieldName, value) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {fields.map((field) => (
                        <div key={field.name}>
                            {field.type === 'select' ? (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        {field.label}
                                    </label>
                                    <select
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {field.options?.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <Input
                                    label={field.label}
                                    placeholder={field.placeholder}
                                    value={formData[field.name] || ''}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    type={field.type || 'text'}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} className="bg-hd-orange hover:bg-orange-600">
                        <Save className="h-4 w-4 mr-2" />
                        Guardar
                    </Button>
                </div>
            </div>
        </div>
    );
};

export const QuickAddButton = ({ onClick }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className="ml-2 inline-flex items-center justify-center h-10 w-10 rounded-md border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-hd-orange transition-colors"
            title="Agregar nuevo"
        >
            <Plus className="h-4 w-4 text-gray-600" />
        </button>
    );
};
