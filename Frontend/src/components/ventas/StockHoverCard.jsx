import React, { useState, useEffect } from 'react';
import { getStockBreakdown } from '../../api/articulos';
import { getAlmacenes } from '../../api/almacenes';

const StockHoverCard = ({ articuloId, warehouses = [] }) => {
    const [stockData, setStockData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [localWarehouses, setLocalWarehouses] = useState(warehouses);

    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch stock data
                const stock = await getStockBreakdown(articuloId);

                // If warehouses not provided, fetch them
                if (localWarehouses.length === 0) {
                    const whs = await getAlmacenes();
                    if (mounted) setLocalWarehouses(whs);
                }

                if (mounted) setStockData(stock);
            } catch (error) {
                console.error("Error fetching stock tooltip:", error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (articuloId) {
            fetchData();
        }

        return () => { mounted = false; };
    }, [articuloId]);

    // Merge logic
    const mergedData = localWarehouses.map(w => {
        const wId = w.id || w.Id;
        const entry = stockData.find(s => {
            const sId = s.almacenId || s.AlmacenId;
            // Robust string comparison
            return String(sId) === String(wId);
        });

        return {
            name: w.nombre || w.Nombre,
            qty: entry ? (entry.cantidad || entry.Cantidad) : 0,
            id: wId
        };
    }).filter(x => x.qty !== 0);

    const total = stockData.reduce((acc, curr) => acc + (curr.cantidad || curr.Cantidad || 0), 0);

    return (
        <div className="absolute left-0 bottom-full mb-1 z-[9999] bg-black/90 backdrop-blur-md border border-gray-700 shadow-2xl rounded-md p-2 min-w-[200px] text-xs text-white animate-in fade-in zoom-in duration-200 pointer-events-none">
            <div className="flex justify-between items-center border-b border-gray-600 pb-1 mb-1">
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-widest text-gray-400">Existencias</span>
                    <span className="text-[8px] text-gray-500 font-mono">ID: {articuloId}</span>
                </div>
                <span className={`font-bold text-sm ${total > 0 ? "text-green-400" : "text-red-400"}`}>{total}</span>
            </div>

            {loading ? (
                <div className="text-gray-500 text-[10px] italic py-1">Cargando datos...</div>
            ) : mergedData.length === 0 ? (
                <div className="text-gray-500 text-[10px] text-center py-1">Sin existencia registrada</div>
            ) : (
                <div className="space-y-1">
                    {mergedData.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center px-1 hover:bg-white/5 rounded">
                            <span className="truncate max-w-[70%] text-gray-300 text-[10px]">{item.name}</span>
                            <span className="font-mono font-bold text-hd-orange">{item.qty}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Arrow Pointer */}
            <div className="absolute -bottom-1 left-4 w-2 h-2 bg-black/90 border-r border-b border-gray-700 transform rotate-45"></div>
        </div>
    );
};

export default StockHoverCard;


