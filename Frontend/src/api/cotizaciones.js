const API_URL = import.meta.env.VITE_API_URL || '/api';

export const getCotizaciones = async () => {
    const res = await fetch(`${API_URL}/Cotizaciones`);
    if (!res.ok) throw new Error('Error al cargar cotizaciones');
    return await res.json();
};

export const getCotizacionById = async (id) => {
    const res = await fetch(`${API_URL}/Cotizaciones/${id}`);
    if (!res.ok) throw new Error('Error al cargar detalle de cotización');
    return await res.json();
};

export const createCotizacion = async (cotizacion) => {
    const res = await fetch(`${API_URL}/Cotizaciones`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(cotizacion),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar cotización');
    }
    return await res.json();
};
export const updateCotizacion = async (id, cotizacion) => {
    const res = await fetch(`${API_URL}/Cotizaciones/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(cotizacion),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al actualizar cotización');
    }
    return await res.json();
};

