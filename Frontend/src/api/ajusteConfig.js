const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5006/api') + '/AjusteConfiguration';

export const getAjusteConfig = async () => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Error fetching ajuste config: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching ajuste config:", error);
        throw error;
    }
};

export const updateAjusteConfig = async (config) => {
    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(config),
        });

        if (!response.ok) {
            throw new Error(`Error updating ajuste config: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error updating ajuste config:", error);
        throw error;
    }
};
