const API_URL = import.meta.env.VITE_API_URL || '/api';

export const getGruposProducto = async () => {
    try {
        const response = await fetch(`${API_URL}/GruposProducto`);
        if (!response.ok) throw new Error('Error fetching product groups');
        return await response.json();
    } catch (error) {
        console.error('Error fetching product groups:', error);
        throw error;
    }
};

export const saveGrupoProducto = async (grupo) => {
    try {
        const method = grupo.id ? 'PUT' : 'POST';
        const url = grupo.id ? `${API_URL}/GruposProducto/${grupo.id}` : `${API_URL}/GruposProducto`;

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(grupo),
        });

        if (!response.ok) throw new Error('Error saving product group');
        return await response.json();
    } catch (error) {
        console.error('Error saving product group:', error);
        throw error;
    }
};

export const deleteGrupoProducto = async (id) => {
    try {
        const response = await fetch(`${API_URL}/GruposProducto/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Error deleting product group');
        return await response.json();
    } catch (error) {
        console.error('Error deleting product group:', error);
        throw error;
    }
};
