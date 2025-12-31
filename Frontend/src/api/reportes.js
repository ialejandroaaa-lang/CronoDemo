const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const getValoracionInventario = async () => {
    const res = await fetch(`${API_BASE}/ReportesInventario/Valoracion`);
    if (!res.ok) {
        throw new Error(`Failed to get valuation: ${res.status}`);
    }
    return res.json();
};

