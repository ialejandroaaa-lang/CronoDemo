import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Layers, Tag as TagIcon, Check } from 'lucide-react';
import { Dialog, DialogContent } from './ui/Dialog';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { getCategorias } from '../api/categorias';

const CategorySearchModal = ({ isOpen, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadCategories();
            setSearchTerm('');
        }
    }, [isOpen]);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await getCategorias();
            setCategories(data);
        } catch (error) {
            console.error("Error loading categories:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCategories = useMemo(() => {
        const term = searchTerm.toLowerCase();
        if (!term) return categories;
        return categories.filter(c =>
            c.nombre.toLowerCase().includes(term) ||
            (c.descripcion && c.descripcion.toLowerCase().includes(term))
        );
    }, [categories, searchTerm]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl bg-white rounded-xl h-[60vh] flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-gray-100 p-4 flex flex-col gap-3 shrink-0">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800 tracking-tight flex items-center gap-2">
                            <Layers className="h-5 w-5 text-hd-orange" />
                            Seleccionar Categoría
                        </h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full h-8 w-8"
                        >
                            <X size={20} />
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            className="w-full pl-9 h-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                            placeholder="Buscar categoría..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-gray-50">
                    {loading ? (
                        <div className="flex justify-center p-8 text-gray-400 animate-pulse">Cargando...</div>
                    ) : (
                        filteredCategories.map(cat => (
                            <div
                                key={cat.id}
                                onClick={() => { onSelect(cat); onClose(); }}
                                className="group flex items-center gap-3 p-3 rounded-lg hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 cursor-pointer transition-all"
                            >
                                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-hd-orange group-hover:bg-hd-orange group-hover:text-white transition-colors">
                                    <TagIcon size={18} />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-800">{cat.nombre}</div>
                                    {cat.descripcion && <div className="text-xs text-gray-500">{cat.descripcion}</div>}
                                </div>
                                <div className="ml-auto opacity-0 group-hover:opacity-100 text-hd-orange">
                                    <Check size={16} />
                                </div>
                            </div>
                        ))
                    )}
                    {!loading && filteredCategories.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                            No se encontraron categorías.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CategorySearchModal;

