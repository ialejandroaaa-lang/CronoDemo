import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Target, Users, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

const CrmDashboard = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Dashboard CRM</h1>
                <p className="text-sm text-gray-500">Resumen de actividad y rendimiento comercial</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    <CardContent className="p-5 flex justify-between items-center">
                        <div>
                            <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Valor Pipeline</p>
                            <h3 className="text-2xl font-black">$45,200.00</h3>
                            <div className="flex items-center mt-2 text-[10px] text-blue-200">
                                <ArrowUpRight size={12} className="mr-1" /> +12% vs mes anterior
                            </div>
                        </div>
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
                            <Target size={24} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-hd-orange to-orange-600 text-white">
                    <CardContent className="p-5 flex justify-between items-center">
                        <div>
                            <p className="text-orange-100 text-xs font-bold uppercase tracking-wider mb-1">Prospectos Nuevos</p>
                            <h3 className="text-2xl font-black">24</h3>
                            <div className="flex items-center mt-2 text-[10px] text-orange-200">
                                <ArrowUpRight size={12} className="mr-1" /> +8 esta semana
                            </div>
                        </div>
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
                            <Users size={24} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-green-600 to-green-700 text-white">
                    <CardContent className="p-5 flex justify-between items-center">
                        <div>
                            <p className="text-green-100 text-xs font-bold uppercase tracking-wider mb-1">Tasa Conversión</p>
                            <h3 className="text-2xl font-black">18.5%</h3>
                            <div className="flex items-center mt-2 text-[10px] text-green-200">
                                <TrendingUp size={12} className="mr-1" /> Meta: 20%
                            </div>
                        </div>
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
                            <Activity size={24} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                    <CardContent className="p-5 flex justify-between items-center">
                        <div>
                            <p className="text-purple-100 text-xs font-bold uppercase tracking-wider mb-1">Citas Pendientes</p>
                            <h3 className="text-2xl font-black">12</h3>
                            <div className="flex items-center mt-2 text-[10px] text-purple-200">
                                <Calendar size={12} className="mr-1" /> 4 para hoy
                            </div>
                        </div>
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
                            <Calendar size={24} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="border-b bg-gray-50/50">
                        <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider">Estado del Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {[
                                { label: 'Prospección', count: 15, value: '$12,000', color: 'bg-blue-500', width: '75%' },
                                { label: 'Calificación', count: 8, value: '$8,500', color: 'bg-yellow-500', width: '40%' },
                                { label: 'Propuesta', count: 5, value: '$15,200', color: 'bg-hd-orange', width: '25%' },
                                { label: 'Negociación', count: 3, value: '$9,500', color: 'bg-green-500', width: '15%' },
                            ].map((item, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-gray-600">{item.label} ({item.count})</span>
                                        <span className="text-gray-900">{item.value}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div className={`${item.color} h-full rounded-full`} style={{ width: item.width }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="border-b bg-gray-50/50">
                        <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider">Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y max-h-[300px] overflow-y-auto">
                            {[
                                { user: 'Admin', action: 'Nuevo prospecto creado', target: 'Ferretería Central', time: 'Hace 10 min' },
                                { user: 'Vendedor 1', action: 'Tarea completada', target: 'Llamada a María García', time: 'Hace 1 hora' },
                                { user: 'Vendedor 2', action: 'Oportunidad ganada', target: 'Tienda El Sol', time: 'Hace 3 horas' },
                                { user: 'Admin', action: 'Email enviado', target: 'Roberto Soto', time: 'Hace 5 horas' },
                                { user: 'Vendedor 1', action: 'Cita agendada', target: 'Inmobiliaria S.A.', time: 'Ayer' },
                            ].map((activity, idx) => (
                                <div key={idx} className="p-4 flex items-start space-x-3 hover:bg-gray-50 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                        {activity.user[0]}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-900">
                                            <span className="font-bold">{activity.user}</span> {activity.action} para <span className="text-hd-orange font-medium">{activity.target}</span>
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CrmDashboard;

