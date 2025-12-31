const API_BASE = ((import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') ? import.meta.env.VITE_API_URL : '/api');

export const getNcfSequences = async () => {
    const response = await fetch(`${API_BASE}/Ncf`);
    if (!response.ok) throw new Error('Error al obtener NCFs');
    return response.json();
};

export const updateNcfSequence = async (id, ncf) => {
    const response = await fetch(`${API_BASE}/Ncf/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ncf)
    });
    if (!response.ok) throw new Error('Error al actualizar NCF');
    return true;
};

export const createNcfSequence = async (ncf) => {
    const response = await fetch(`${API_BASE}/Ncf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ncf)
    });
    if (!response.ok) throw new Error('Error al crear NCF');
    return response.json();
};


