import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

const TrialBanner = () => {
    const [trialInfo, setTrialInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/Trial/status`);
                if (res.ok) {
                    const data = await res.json();
                    setTrialInfo(data);
                }
            } catch (e) {
                console.error("Error fetching trial status", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    if (loading || !trialInfo) return null;

    const { daysRemaining, isExpired } = trialInfo;

    if (isExpired) {
        return (
            <div className="bg-red-600 text-white py-4 px-4 flex flex-col items-center justify-center gap-3 z-[9999] sticky top-0 shadow-lg">
                <div className="flex items-center gap-3">
                    <AlertTriangle size={24} className="text-yellow-300 animate-pulse" />
                    <span className="font-bold text-lg uppercase tracking-wider">
                        PERIODO DE PRUEBA EXPIRADO
                    </span>
                </div>
                <div className="flex gap-2 mt-2">
                    <input
                        type="text"
                        placeholder="Ingrese Clave de Activación"
                        id="licenseKey"
                        className="px-3 py-1 text-black rounded text-sm w-64"
                    />
                    <button
                        onClick={async () => {
                            const key = document.getElementById('licenseKey').value;
                            const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/Trial/activate`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ key })
                            });
                            if (res.ok) {
                                alert("¡Licencia Activada! El sistema se reiniciará.");
                                window.location.reload();
                            } else {
                                alert("Clave inválida.");
                            }
                        }}
                        className="bg-white text-red-600 px-4 py-1 rounded font-bold text-sm hover:bg-gray-200 transition-colors"
                    >
                        ACTIVAR AHORA
                    </button>
                </div>
            </div>
        );
    }

    if (daysRemaining <= 10) {
        return (
            <div className="bg-orange-500 text-white py-1.5 px-4 flex items-center justify-center gap-2 z-[9999] sticky top-0 shadow-md">
                <Clock size={16} />
                <span className="font-medium text-xs">
                    Atención: Quedan <strong>{daysRemaining} días</strong> de tu periodo de prueba gratuito.
                </span>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 text-gray-300 py-1 px-4 flex items-center justify-center gap-2 z-[9999] sticky top-0 text-[10px] opacity-90 hover:opacity-100 transition-opacity">
            <span className="uppercase tracking-widest font-semibold flex items-center gap-1">
                <Clock size={10} /> Versión Demo: {daysRemaining} días restantes
            </span>
        </div>
    );
};

export default TrialBanner;

