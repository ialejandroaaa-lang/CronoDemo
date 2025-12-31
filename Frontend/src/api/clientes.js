const API_URL = '/api/Clients';

export const getClients = async () => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error al obtener clientes');
    return await response.json();
};

export const getClient = async (id) => {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error('Error al obtener cliente');
    return await response.json();
};

export const updateClient = async (id, client) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
    });
    if (!response.ok) throw new Error('Error al actualizar cliente');
    // PUT usually returns 204
    if (response.status === 204) return true;
    return await response.json();
};
