export const API_BASE = ((import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') ? import.meta.env.VITE_API_URL : '/api');

export const getNivelesPrecio = async () => {
    const res = await fetch(`${API_BASE}/NivelesPrecio`);
    if (!res.ok) throw new Error('Error getting price levels');
    return res.json();
};

export const saveNivelPrecio = async (nivel) => {
    const res = await fetch(`${API_BASE}/NivelesPrecio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nivel),
    });
    if (!res.ok) throw new Error('Error saving price level');
    return res.json();
};

export const updateNivelPrecio = async (id, nivel) => {
    const res = await fetch(`${API_BASE}/NivelesPrecio/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nivel),
    });
    if (!res.ok) throw new Error('Error updating price level');
    return true;
};

export const deleteNivelPrecio = async (id) => {
    const res = await fetch(`${API_BASE}/NivelesPrecio/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error deleting price level');
    return true;
};


