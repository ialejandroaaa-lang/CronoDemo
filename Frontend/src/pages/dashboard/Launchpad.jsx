import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MENU_ITEMS } from '../../config/menuItems';
import { Card } from '../../components/ui/Card';
import { Activity, X, LayoutGrid, ChevronRight, GripVertical, RefreshCcw, Eye, EyeOff, Settings2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const Launchpad = () => {
    const navigate = useNavigate();
    const [modules, setModules] = useState([]);
    const [hiddenModules, setHiddenModules] = useState([]);
    const [showSettings, setShowSettings] = useState(false);

    // Initialize items with persisted structure or default
    useEffect(() => {
        const savedStructure = localStorage.getItem('launchpad_structure');
        const savedHidden = localStorage.getItem('launchpad_hidden');
        const defaultModules = MENU_ITEMS.filter(i => i.id !== 'inicio');

        if (savedHidden) {
            try { setHiddenModules(JSON.parse(savedHidden)); } catch (e) { }
        }

        if (savedStructure) {
            try {
                const structure = JSON.parse(savedStructure);
                // 1. Restore saved structure
                let restored = structure.map(mod => {
                    const originalMod = defaultModules.find(m => m.id === mod.id);
                    if (!originalMod) return null; // Module no longer exists in menuItems
                    return {
                        ...originalMod,
                        id: mod.id,
                        label: mod.label,
                        subItems: mod.subItems.map(sub => {
                            let foundSub = null;
                            defaultModules.forEach(m => {
                                const s = m.subItems?.find(si => si.path === sub.path);
                                if (s) foundSub = s;
                            });
                            return foundSub || sub;
                        })
                    };
                }).filter(Boolean);

                // 2. Add any NEW modules that aren't in the saved structure
                const missingModules = defaultModules.filter(dm => !restored.some(rm => rm.id === dm.id));
                if (missingModules.length > 0) {
                    restored = [...restored, ...missingModules];
                }

                setModules(restored);
            } catch (e) {
                setModules(defaultModules);
            }
        } else {
            setModules(defaultModules);
        }
    }, []);

    const saveStructure = (newModules, newHidden = hiddenModules) => {
        setModules(newModules);
        const structureToSave = newModules.map(m => ({
            id: m.id,
            label: m.label,
            subItems: m.subItems?.map(s => ({
                label: s.label,
                path: s.path,
                highlight: s.highlight
            })) || []
        }));
        localStorage.setItem('launchpad_structure', JSON.stringify(structureToSave));
        localStorage.setItem('launchpad_hidden', JSON.stringify(newHidden));
    };

    const toggleVisibility = (moduleId) => {
        const newHidden = hiddenModules.includes(moduleId)
            ? hiddenModules.filter(id => id !== moduleId)
            : [...hiddenModules, moduleId];
        setHiddenModules(newHidden);
        localStorage.setItem('launchpad_hidden', JSON.stringify(newHidden));
    };

    const handleReset = () => {
        if (window.confirm('¿Restablecer el menú a su estado original?')) {
            localStorage.removeItem('launchpad_structure');
            localStorage.removeItem('launchpad_hidden');
            window.location.reload();
        }
    };

    const onDragEnd = (result) => {
        const { source, destination, type } = result;
        if (!destination) return;

        if (type === 'MODULE') {
            const newModules = Array.from(modules);
            const [reorderedModule] = newModules.splice(source.index, 1);
            newModules.splice(destination.index, 0, reorderedModule);
            saveStructure(newModules);
            return;
        }

        if (type === 'SUBITEM') {
            const sourceModuleIndex = modules.findIndex(m => m.id === source.droppableId);
            const destModuleIndex = modules.findIndex(m => m.id === destination.droppableId);
            if (sourceModuleIndex === -1 || destModuleIndex === -1) return;

            const newModules = [...modules];
            const sourceModule = { ...newModules[sourceModuleIndex] };
            const destModule = { ...newModules[destModuleIndex] };
            const sourceSubItems = Array.from(sourceModule.subItems || []);
            const [movedItem] = sourceSubItems.splice(source.index, 1);

            if (source.droppableId === destination.droppableId) {
                sourceSubItems.splice(destination.index, 0, movedItem);
                sourceModule.subItems = sourceSubItems;
                newModules[sourceModuleIndex] = sourceModule;
            } else {
                const destSubItems = Array.from(destModule.subItems || []);
                destSubItems.splice(destination.index, 0, movedItem);
                sourceModule.subItems = sourceSubItems;
                destModule.subItems = destSubItems;
                newModules[sourceModuleIndex] = sourceModule;
                newModules[destModuleIndex] = destModule;
            }
            saveStructure(newModules);
        }
    };

    const visibleModules = showSettings ? modules : modules.filter(m => !hiddenModules.includes(m.id));

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-12 animate-in fade-in duration-500 overflow-y-auto font-sans">
            <div className="max-w-[1600px] mx-auto space-y-10">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-gray-200 pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-hd-orange rounded-lg shadow-lg shadow-hd-orange/20">
                                <LayoutGrid size={22} className="text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-widest uppercase italic">
                                Mapa Operativo
                            </h1>
                        </div>
                        <p className="text-gray-400 font-bold uppercase tracking-[0.4em] text-[10px] flex items-center gap-2 font-mono">
                            Personalización y Control Unificado
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant={showSettings ? "hd-orange" : "outline"}
                            size="sm"
                            className={`font-bold uppercase tracking-tight text-[10px] h-10 px-4 ${showSettings ? 'bg-hd-orange text-white' : 'bg-white text-gray-400 border-gray-200 hover:text-hd-orange'}`}
                            onClick={() => setShowSettings(!showSettings)}
                        >
                            <Settings2 size={16} className="mr-2" />
                            {showSettings ? 'Guardar Cambios' : 'Personalizar Vista'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white text-gray-300 hover:text-red-500 border-gray-100 h-10"
                            onClick={handleReset}
                        >
                            <RefreshCcw size={14} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-hd-orange hover:bg-orange-50 rounded-full h-12 w-12 transition-colors"
                            onClick={() => navigate('/')}
                        >
                            <X size={32} />
                        </Button>
                    </div>
                </div>

                {showSettings && (
                    <div className="bg-white p-6 rounded-xl border border-hd-orange/20 shadow-sm animate-in slide-in-from-top duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <Settings2 size={18} className="text-hd-orange" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 italic">Gestión de Visibilidad</h3>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            {modules.map(mod => {
                                const isHidden = hiddenModules.includes(mod.id);
                                return (
                                    <label
                                        key={mod.id}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer ${isHidden ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-orange-50 border-orange-100 text-hd-orange'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={!isHidden}
                                            onChange={() => toggleVisibility(mod.id)}
                                            className="accent-hd-orange h-4 w-4"
                                        />
                                        <span className="text-[10px] font-bold uppercase tracking-tighter">{mod.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                        <p className="text-[9px] text-gray-400 mt-4 italic font-bold uppercase tracking-wider">
                            * Los módulos desmarcados no aparecerán en la vista normal. Puedes arrastrar los paneles abajo para reordenarlos.
                        </p>
                    </div>
                )}

                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="all-modules" direction="horizontal" type="MODULE">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 pb-20"
                            >
                                {visibleModules.map((module, index) => {
                                    const ModuleIcon = module.icon || Activity;
                                    const isHidden = hiddenModules.includes(module.id);

                                    return (
                                        <Draggable key={module.id} draggableId={module.id} index={index} isDragDisabled={!showSettings}>
                                            {(providedModule, snapshotModule) => (
                                                <Card
                                                    ref={providedModule.innerRef}
                                                    {...providedModule.draggableProps}
                                                    className={`border-none shadow-md bg-white hover:shadow-xl transition-all duration-300 flex flex-col relative ${snapshotModule.isDragging ? 'ring-2 ring-hd-orange shadow-2xl scale-105 z-50' : ''
                                                        } ${isHidden && showSettings ? 'opacity-50 grayscale' : ''}`}
                                                >
                                                    <div className="p-5 flex-grow flex flex-col space-y-4">
                                                        {/* Module Header */}
                                                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-2 rounded-lg border transition-colors ${isHidden ? 'bg-gray-100 text-gray-400' : 'bg-orange-50 text-hd-orange border-orange-100'}`}>
                                                                    <ModuleIcon size={20} />
                                                                </div>
                                                                <h2 className="text-lg font-black text-gray-800 tracking-tight uppercase italic">{module.label}</h2>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {showSettings && (
                                                                    <button
                                                                        onClick={() => toggleVisibility(module.id)}
                                                                        className={`p-1.5 rounded-full transition-colors ${isHidden ? 'text-gray-400 hover:text-green-500 bg-gray-50' : 'text-hd-orange hover:text-gray-400 bg-orange-50'}`}
                                                                        title={isHidden ? 'Mostrar' : 'Ocultar'}
                                                                    >
                                                                        {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                                                    </button>
                                                                )}
                                                                {showSettings && (
                                                                    <div
                                                                        {...providedModule.dragHandleProps}
                                                                        className="text-gray-300 hover:text-hd-orange cursor-grab active:cursor-grabbing p-1"
                                                                    >
                                                                        <GripVertical size={18} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Sub-items Droppable Area */}
                                                        <Droppable droppableId={module.id} type="SUBITEM" isDropDisabled={!showSettings && !module.id.includes('utilidades')}>
                                                            {(providedSub, snapshotSub) => (
                                                                <div
                                                                    {...providedSub.droppableProps}
                                                                    ref={providedSub.innerRef}
                                                                    className={`flex-grow space-y-1 p-2 rounded-lg transition-colors min-h-[50px] ${snapshotSub.isDraggingOver ? 'bg-orange-50/50 outline-2 outline-dashed outline-hd-orange/20' : ''
                                                                        }`}
                                                                >
                                                                    {module.subItems?.map((sub, subIdx) => {
                                                                        const SubIcon = sub.icon || ChevronRight;
                                                                        const subId = `${module.id}-${sub.path}-${subIdx}`;

                                                                        return (
                                                                            <Draggable key={subId} draggableId={subId} index={subIdx} isDragDisabled={!showSettings}>
                                                                                {(providedItem, snapshotItem) => (
                                                                                    <div
                                                                                        ref={providedItem.innerRef}
                                                                                        {...providedItem.draggableProps}
                                                                                        {...providedItem.dragHandleProps}
                                                                                        onClick={() => !snapshotItem.isDragging && navigate(sub.path)}
                                                                                        className={`flex items-center group cursor-pointer p-3 rounded-lg transition-all border border-transparent ${snapshotItem.isDragging ? 'bg-white shadow-xl scale-105 border-hd-orange z-[100]' : 'hover:bg-gray-50'
                                                                                            } ${sub.highlight ? 'bg-orange-50/50 border-orange-100' : ''}`}
                                                                                    >
                                                                                        <div className={`p-1.5 rounded bg-gray-100 mr-3 transition-colors ${sub.highlight ? 'text-hd-orange' : 'text-gray-400 group-hover:text-hd-orange'
                                                                                            }`}>
                                                                                            <SubIcon size={14} />
                                                                                        </div>
                                                                                        <div className="flex-grow">
                                                                                            <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${sub.highlight ? 'text-hd-orange' : 'text-gray-600 group-hover:text-gray-900'
                                                                                                }`}>
                                                                                                {sub.label}
                                                                                            </span>
                                                                                        </div>
                                                                                        <ChevronRight
                                                                                            size={12}
                                                                                            className={`transition-all text-hd-orange ${snapshotItem.isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-1'}`}
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                            </Draggable>
                                                                        );
                                                                    })}
                                                                    {providedSub.placeholder}
                                                                </div>
                                                            )}
                                                        </Droppable>
                                                    </div>
                                                </Card>
                                            )}
                                        </Draggable>
                                    );
                                })}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                <div className="text-center opacity-40 pt-8 border-t border-gray-200">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.5em]">
                        CENTRO DE CONTROL PERSONALIZABLE • v1.3.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Launchpad;

