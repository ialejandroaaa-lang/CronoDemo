export const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const getPlanes = async () => {
    const res = await fetch(`${API_BASE}/UnidadMedida/Planes`);
    if (!res.ok) throw new Error('Error getting plans');
    return res.json();
};

export const getPlan = async (id) => {
    const res = await fetch(`${API_BASE}/UnidadMedida/Planes/${id}`);
    if (!res.ok) throw new Error('Error getting plan');
    return res.json();
};

export const savePlan = async (plan) => {
    const res = await fetch(`${API_BASE}/UnidadMedida/Planes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
    });
    if (!res.ok) throw new Error('Error saving plan');
    return res.json();
};

export const deletePlan = async (id) => {
    const res = await fetch(`${API_BASE}/UnidadMedida/Planes/${id}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error deleting plan');
    return res.json();
};

