const API_BASE = ((import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') ? import.meta.env.VITE_API_URL : '/api');

export const getPrecios = async (articuloId) => {
    const res = await fetch(`${API_BASE}/Articulos/${articuloId}/Precios`);
    if (!res.ok) throw new Error('Error al obtener precios');
    return res.json();
};

export const savePrecios = async (articuloId, precios) => {
    const res = await fetch(`${API_BASE}/Articulos/${articuloId}/Precios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(precios)
    });
    if (!res.ok) throw new Error('Error al guardar precios');
    return res.json();
};

export const copyPrecios = async (sourceId, targetId) => {
    const res = await fetch(`${API_BASE}/Articulos/CopyPrecios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceArticuloId: sourceId, targetArticuloId: targetId })
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error al copiar precios: ${errorText}`);
    }
    return res.json();
};

export const getReportePrecios = async () => {
    const res = await fetch(`${API_BASE}/Articulos/ReportePrecios`);
    if (!res.ok) throw new Error('Error al obtener reporte de precios');
    return res.json();
};


