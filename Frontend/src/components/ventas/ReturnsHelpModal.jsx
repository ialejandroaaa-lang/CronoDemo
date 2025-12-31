import React from 'react';

const HelpModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        📘 Guía de Procesos de Devolución
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-center h-12 w-12 min-w-[3rem]">
                            <span className="text-2xl">📦</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 border-l-4 border-gray-600 pl-2">Solo Devolución (Inventario)</h3>
                            <p className="text-gray-600 mt-1 text-sm leading-relaxed">
                                Este proceso reingresa los artículos seleccionados al inventario físico <strong>sin generar ningún reembolso monetario inmediato</strong>. Útil para correcciones de inventario o cuando el cliente deja el producto pendiente de otra acción futura.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-red-100 p-3 rounded-lg flex items-center justify-center h-12 w-12 min-w-[3rem]">
                            <span className="text-2xl">💵</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 border-l-4 border-red-600 pl-2">Reembolso (Efectivo)</h3>
                            <p className="text-gray-600 mt-1 text-sm leading-relaxed">
                                Use esta opción cuando se le devuelve el dinero en efectivo al cliente. El sistema reingresa los artículos al inventario y <strong>registra una salida de caja</strong> por el monto total devuelto, emitiendo una Nota de Crédito interna para fines fiscales.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-green-100 p-3 rounded-lg flex items-center justify-center h-12 w-12 min-w-[3rem]">
                            <span className="text-2xl">💳</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 border-l-4 border-green-600 pl-2">Cambio (Nota de Crédito)</h3>
                            <p className="text-gray-600 mt-1 text-sm leading-relaxed">
                                Ideal para cambios de mercancía. El sistema genera una <strong>Nota de Crédito</strong> con un saldo a favor que se puede aplicar inmediatamente en una nueva factura (POS). No implica salida de efectivo de la caja.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-right">
                    <button
                        onClick={onClose}
                        className="bg-[#F96302] text-white px-6 py-2 rounded font-bold hover:bg-[#d85502] transition"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
