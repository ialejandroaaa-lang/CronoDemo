const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';

export const getReciboConfig = async () => {
    const response = await fetch(`${API_BASE}/Recibos/config`);
    if (!response.ok) throw new Error('Error fetching config');
    return await response.json();
};

export const updateReciboConfig = async (config) => {
    const response = await fetch(`${API_BASE}/Recibos/config`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
    });
    if (!response.ok) throw new Error('Error updating config');
    return await response.json();
};
