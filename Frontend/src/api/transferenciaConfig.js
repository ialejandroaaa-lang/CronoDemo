const API_URL = (import.meta.env.VITE_API_URL || '/api') + '/TransferenciaConfiguration';

export const getTransferenciaConfig = async () => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error fetching config');
        return await response.json();
    } catch (error) {
        console.error("Error fetching transfer config:", error);
        throw error;
    }
};

export const updateTransferenciaConfig = async (config) => {
    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        if (!response.ok) throw new Error('Error updating config');
        return await response.json();
    } catch (error) {
        console.error("Error updating transfer config:", error);
        throw error;
    }
};

