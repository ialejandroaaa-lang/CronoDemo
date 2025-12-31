import React, { useState } from 'react';
import { Plus, Search, UserPlus, Phone, Mail, MoreHorizontal, Edit, Trash2, Tag, Calendar, AlertCircle, X, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Card, CardContent } from '../../components/ui/Card';

const INITIAL_PROSPECTOS = [
    { id: 1, nombre: 'Juan Pérez', empresa: 'Ferretería Central', interes: 'Equipos POS', origen: 'Web', estado: 'Nuevo', fecha: '2025-12-19' },
    { id: 2, nombre: 'María García', empresa: 'Inmobiliaria S.A.', interes: 'Software Contable', origen: 'Referido', estado: 'Contactado', fecha: '2025-12-18' },
    { id: 3, nombre: 'Roberto Soto', empresa: 'Comercial Robert', interes: 'Mantenimiento', origen: 'Llamada Fría', estado: 'Calificado', fecha: '2025-12-15' },
    { id: 4, nombre: 'Laura Luna', empresa: 'Tienda El Sol', interes: 'Equipos POS', origen: 'Expo Feria', estado: 'Perdido', fecha: '2025-12-10' },
];

const ProspectosList = () => {
    const [prospectos, setProspectos] = useState(INITIAL_PROSPECTOS);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newProspecto, setNewProspecto] = useState({
        nombre: '', empresa: '', interes: 'Equipos POS', origen: 'Web', estado: 'Nuevo'
    });

    const handleAdd = (e) => {
        e.preventDefault();
        const id = prospectos.length + 1;
        const fecha = new Date().toISOString().split('T')[0];
        setProspectos([{ ...newProspecto, id, fecha }, ...prospectos]);
        setShowModal(false);
        setNewProspecto({ nombre: '', empresa: '', interes: 'Equipos POS', origen: 'Web', estado: 'Nuevo' });
    };

    const filtered = prospectos.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.empresa.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'Nuevo': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Contactado': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Calificado': return 'bg-green-100 text-green-700 border-green-200';
            case 'Perdido': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Prospectos (Leads)</h1>
                    <p className="text-sm text-gray-500">Clientes potenciales que aún no son compradores</p>
                </div>
                <Button onClick={() => setShowModal(true)} className="bg-hd-orange hover:bg-orange-600 text-white shadow-lg">
                    <UserPlus className="mr-2 h-4 w-4" /> Nuevo Prospecto
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50/50 border-blue-100">
                    <CardContent className="p-4">
                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Nuevos</p>
                        <h3 className="text-2xl font-black text-blue-900">{prospectos.filter(p => p.estado === 'Nuevo').length}</h3>
                    </CardContent>
                </Card>
                <Card className="bg-yellow-50/50 border-yellow-100">
                    <CardContent className="p-4">
                        <p className="text-xs text-yellow-600 font-bold uppercase tracking-wider">En Seguimiento</p>
                        <h3 className="text-2xl font-black text-yellow-900">{prospectos.filter(p => p.estado === 'Contactado').length}</h3>
                    </CardContent>
                </Card>
                <Card className="bg-green-50/50 border-green-100">
                    <CardContent className="p-4">
                        <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Calificados</p>
                        <h3 className="text-2xl font-black text-green-900">{prospectos.filter(p => p.estado === 'Calificado').length}</h3>
                    </CardContent>
                </Card>
                <Card className="bg-orange-50/50 border-orange-100">
                    <CardContent className="p-4">
                        <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Origen: Web</p>
                        <h3 className="text-2xl font-black text-orange-900">{prospectos.filter(p => p.origen === 'Web').length}</h3>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar prospecto..."
                            className="pl-9 bg-white border-gray-200 focus:ring-hd-orange"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 uppercase text-[10px] font-bold text-gray-500 tracking-widest">
                            <TableRow>
                                <TableHead className="px-6 py-4">Nombre / Empresa</TableHead>
                                <TableHead className="px-6 py-4 text-center">Interés</TableHead>
                                <TableHead className="px-6 py-4 text-center">Estado</TableHead>
                                <TableHead className="px-6 py-4 text-center">Origen</TableHead>
                                <TableHead className="px-6 py-4 text-center">Fecha</TableHead>
                                <TableHead className="px-6 py-4 text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((p) => (
                                <TableRow key={p.id} className="hover:bg-orange-50/30 transition-colors group">
                                    <TableCell className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">{p.nombre}</span>
                                            <span className="text-xs text-gray-500">{p.empresa}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-center">
                                        <span className="text-xs font-medium text-gray-600">{p.interes}</span>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(p.estado)}`}>
                                            {p.estado.toUpperCase()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                                            <Tag size={12} className="text-orange-400" />
                                            {p.origen}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-center text-xs text-gray-400">
                                        {new Date(p.fecha).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-1 opacity-10 sm:opacity-100 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                                                <Edit size={16} />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50">
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
                        <div className="p-4 bg-hd-orange text-white flex justify-between items-center bg-gradient-to-r from-hd-orange to-orange-500">
                            <h2 className="text-lg font-bold flex items-center">
                                <UserPlus className="mr-2" size={20} />
                                Nuevo Prospecto
                            </h2>
                            <button onClick={() => setShowModal(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAdd} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                                <Input
                                    required
                                    className="focus:ring-hd-orange"
                                    value={newProspecto.nombre}
                                    onChange={e => setNewProspecto({ ...newProspecto, nombre: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Empresa / Negocio</label>
                                <Input
                                    required
                                    className="focus:ring-hd-orange"
                                    value={newProspecto.empresa}
                                    onChange={e => setNewProspecto({ ...newProspecto, empresa: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Interés</label>
                                    <select
                                        className="w-full text-sm rounded-md border border-gray-300 p-2 focus:ring-hd-orange focus:border-hd-orange"
                                        value={newProspecto.interes}
                                        onChange={e => setNewProspecto({ ...newProspecto, interes: e.target.value })}
                                    >
                                        <option>Equipos POS</option>
                                        <option>Software</option>
                                        <option>Mantenimiento</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Origen</label>
                                    <select
                                        className="w-full text-sm rounded-md border border-gray-300 p-2 focus:ring-hd-orange focus:border-hd-orange"
                                        value={newProspecto.origen}
                                        onChange={e => setNewProspecto({ ...newProspecto, origen: e.target.value })}
                                    >
                                        <option>Web</option>
                                        <option>Referido</option>
                                        <option>Llamada</option>
                                        <option>Publicidad</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="text-gray-500 border-gray-200">
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-hd-orange hover:bg-orange-600 text-white shadow-md">
                                    <Save className="mr-2 h-4 w-4" /> Guardar Prospecto
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProspectosList;
