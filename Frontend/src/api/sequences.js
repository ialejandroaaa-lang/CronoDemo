const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5006/api') + '/Sequences';

export const getSequences = async () => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Error fetching sequences: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching sequences:", error);
        throw error;
    }
};

export const updateSequence = async (id, sequence) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sequence),
        });

        if (!response.ok) {
            // Check if 204 No Content
            if (response.status === 204) return null;
            throw new Error(`Error updating sequence: ${response.statusText}`);
        }

        // Check if response has content before parsing JSON
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    } catch (error) {
        console.error(`Error updating sequence ${id}:`, error);
        throw error;
    }
};
