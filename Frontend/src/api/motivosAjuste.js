const API_URL = '/api/MotivosAjuste';

export const getMotivos = async () => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error al obtener motivos');
    return await response.json();
};

export const saveMotivo = async (motivo) => {
    const isEditing = !!motivo.id;
    const url = isEditing ? `${API_URL}/${motivo.id}` : API_URL;
    const method = isEditing ? 'PUT' : 'POST';

    const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(motivo),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar motivo');
    }

    // For POST/PUT, the API might return the created/updated object or NoContent
    // If NoContent (204), it returns null or empty. Safe to just return true or verify.
    if (response.status === 204) return true;
    return await response.json();
};

export const deleteMotivo = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar motivo');
    return true;
};

