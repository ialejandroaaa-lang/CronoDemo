// src/api/articuloConfig.js
export const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const getConfig = async () => {
    const res = await fetch(`${API_BASE}/ArticuloConfiguration`);
    if (!res.ok) throw new Error('Failed to load configuration');
    return res.json();
};

export const saveConfig = async (config) => {
    const res = await fetch(`${API_BASE}/ArticuloConfiguration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error('Failed to save configuration');
    return res.json();
};

export const getSecuencias = async () => {
    const res = await fetch(`${API_BASE}/ArticuloConfiguration/SecuenciasPorGrupo`);
    if (!res.ok) throw new Error('Failed to load sequences');
    return res.json();
};

export const saveSecuencias = async (secuencias) => {
    console.log('Saving sequences payload:', secuencias);
    const res = await fetch(`${API_BASE}/ArticuloConfiguration/SecuenciasPorGrupo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(secuencias),
    });
    if (!res.ok) {
        const errText = await res.text();
        console.error('Failed to save sequences:', errText);
        throw new Error(`Failed to save sequences: ${res.status} ${errText}`);
    }
    return res.json();
};

export const generarNumeroArticulo = async (grupoProducto) => {
    const res = await fetch(`${API_BASE}/ArticuloConfiguration/GenerarNumeroArticulo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grupoProducto }),
    });
    if (!res.ok) {
        const errText = await res.text();
        console.error('Failed to generate article number:', errText);
        throw new Error(`Failed to generate article number: ${res.status} ${errText}`);
    }
    return res.json();
};
