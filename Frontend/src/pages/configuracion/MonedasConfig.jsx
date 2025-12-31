import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Plus, Trash2, Calendar, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';

const API_BASE = ((import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') ? import.meta.env.VITE_API_URL : '/api');

const MonedasConfig = () => {
    const [monedas, setMonedas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMoneda, setSelectedMoneda] = useState(null);
    const [tasas, setTasas] = useState([]);
    const [editingTasa, setEditingTasa] = useState(null);

    useEffect(() => {
        loadMonedas();
    }, []);

    useEffect(() => {
        if (selectedMoneda && !selectedMoneda.esFuncional) {
            loadHistorial(selectedMoneda.id);
            setEditingTasa(null);
        }
    }, [selectedMoneda]);

    const loadMonedas = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/Monedas`);
            if (res.ok) {
                const data = await res.json();
                setMonedas(data);
                if (data.length > 0 && !selectedMoneda) setSelectedMoneda(data.find(m => !m.esFuncional) || data[0]);
            }
        } catch (error) {
            console.error("Error loading monedas:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadHistorial = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/Monedas/${id}/historial`);
            if (res.ok) setTasas(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleSaveRate = async (rateData) => {
        const payload = {
            Id: editingTasa?.id || 0,
            MonedaId: selectedMoneda.id,
            Tasa: parseFloat(rateData.tasa),
            FechaInicio: rateData.fechaInicio,
            FechaFin: rateData.fechaFin || null
        };

        try {
            const url = editingTasa
                ? `${API_BASE}/Monedas/tasas/${editingTasa.id}`
                : `${API_BASE}/Monedas/tasas`;

            const res = await fetch(url, {
                method: editingTasa ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert(editingTasa ? "Tasa actualizada" : "Tasa guardada");
                loadHistorial(selectedMoneda.id);
                loadMonedas();
                setEditingTasa(null);
                return true;
            } else {
                const err = await res.text();
                alert("Error al guardar tasa: " + err);
                return false;
            }
        } catch (e) {
            console.error(e);
            alert("Error de red al guardar tasa");
            return false;
        }
    };

    const handleDeleteRate = async (id) => {
        if (!window.confirm("¿Está seguro de eliminar esta tasa?")) return;
        try {
            const res = await fetch(`${API_BASE}/Monedas/tasas/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert("Tasa eliminada");
                loadHistorial(selectedMoneda.id);
                loadMonedas();
            }
        } catch (e) { console.error(e); }
    };

    const getStatus = (tasa) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const fin = tasa.fechaFin ? new Date(tasa.fechaFin) : null;
        if (fin && fin < today) return { label: 'Histórico', color: 'bg-gray-100 text-gray-600' };
        return { label: 'Abierto', color: 'bg-green-100 text-green-700' };
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Configuración de Monedas y Tasas</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Monedas Disponibles</CardTitle>
                    </CardHeader>
                    <div className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Código</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Tasa Actual</TableHead>
                                    <TableHead>Funcional</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {monedas.map(m => (
                                    <TableRow
                                        key={m.id}
                                        className={selectedMoneda?.id === m.id ? "bg-orange-50 cursor-pointer" : "cursor-pointer"}
                                        onClick={() => setSelectedMoneda(m)}
                                    >
                                        <TableCell className="font-bold">{m.codigo}</TableCell>
                                        <TableCell>{m.nombre}</TableCell>
                                        <TableCell>
                                            {m.esFuncional ? '1.00' : 'Ver Historial'}
                                        </TableCell>
                                        <TableCell>{m.esFuncional ? 'Sí' : 'No'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle>
                            Historial de Tasas: {selectedMoneda?.nombre} ({selectedMoneda?.codigo})
                        </CardTitle>
                    </CardHeader>
                    <div className="p-6">
                        {selectedMoneda?.esFuncional ? (
                            <p className="text-gray-500 italic">La moneda funcional tiene una tasa fija de 1.00</p>
                        ) : (
                            <div className="space-y-4">
                                <div className="border rounded-md p-4 bg-gray-50">
                                    <h3 className="font-medium mb-2">
                                        {editingTasa ? 'Modificar Tasa' : 'Registrar Nueva Tasa'}
                                    </h3>
                                    <RateForm
                                        onSubmit={handleSaveRate}
                                        initialData={editingTasa}
                                        onCancel={editingTasa ? () => setEditingTasa(null) : null}
                                    />
                                </div>

                                <div className="mt-4">
                                    <h3 className="font-bold mb-2">Historial de Tasas</h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tasa</TableHead>
                                                <TableHead>Desde</TableHead>
                                                <TableHead>Hasta</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead className="text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tasas.map(t => {
                                                const status = getStatus(t);
                                                return (
                                                    <TableRow key={t.id}>
                                                        <TableCell className="font-bold">{t.tasa.toFixed(4)}</TableCell>
                                                        <TableCell>{new Date(t.fechaInicio).toLocaleDateString()}</TableCell>
                                                        <TableCell>{t.fechaFin ? new Date(t.fechaFin).toLocaleDateString() : 'Vigente'}</TableCell>
                                                        <TableCell>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${status.color}`}>
                                                                {status.label}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end space-x-2">
                                                                <button onClick={() => setEditingTasa(t)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                                                    <Calendar size={14} />
                                                                </button>
                                                                <button onClick={() => handleDeleteRate(t.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            {tasas.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-gray-400">No hay tasas registradas</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

const RateForm = ({ onSubmit, initialData, onCancel }) => {
    const { register, handleSubmit, reset, setValue } = useForm();

    useEffect(() => {
        if (initialData) {
            setValue("tasa", initialData.tasa);
            setValue("fechaInicio", new Date(initialData.fechaInicio).toISOString().split('T')[0]);
            setValue("fechaFin", initialData.fechaFin ? new Date(initialData.fechaFin).toISOString().split('T')[0] : "");
        } else {
            reset({
                tasa: "",
                fechaInicio: new Date().toISOString().split('T')[0],
                fechaFin: ""
            });
        }
    }, [initialData, reset, setValue]);

    const internalSubmit = async (data) => {
        const success = await onSubmit(data);
        if (success) reset();
    };

    return (
        <form onSubmit={handleSubmit(internalSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Input label="Tasa de Cambio" {...register("tasa", { required: true })} placeholder="Ej: 58.50" />
                <Input label="Fecha Inicio" type="date" {...register("fechaInicio", { required: true })} />
                <Input label="Fecha Fin (Opcional)" type="date" {...register("fechaFin")} />
            </div>
            <div className="flex space-x-2">
                <Button type="submit" size="sm" className="bg-hd-orange hover:bg-orange-600">
                    <Save size={16} className="mr-2" /> {initialData ? 'Actualizar' : 'Guardar'} Tasa
                </Button>
                {onCancel && (
                    <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                        Cancelar
                    </Button>
                )}
            </div>
        </form>
    );
}

export default MonedasConfig;


