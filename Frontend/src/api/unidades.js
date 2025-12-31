const API_URL = ((import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') ? import.meta.env.VITE_API_URL : '/api') + '/UnidadMedida';

export const getPlanes = async () => {
    const response = await fetch(`${API_URL}/Planes`);
    if (!response.ok) throw new Error('Error al obtener planes de medida');
    return await response.json();
};

export const getPlan = async (planId) => {
    if (!planId) return null;
    const response = await fetch(`${API_URL}/Planes/${planId}`);
    if (!response.ok) return null; // Handle 404 gracefully
    return await response.json();
};

export const savePlan = async (plan) => {
    const response = await fetch(`${API_URL}/Planes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
    });
    if (!response.ok) throw new Error('Error al guardar plan');
    return await response.json();
};

export const deletePlan = async (planId) => {
    const response = await fetch(`${API_URL}/Planes/${planId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar plan');
    return true;
};


