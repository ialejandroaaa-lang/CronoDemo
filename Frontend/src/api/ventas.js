const API_URL = import.meta.env.VITE_API_URL || '/api';

export const getVentas = async () => {
    const response = await fetch(`${API_URL}/Ventas`);
    if (!response.ok) {
        throw new Error('Error al obtener ventas');
    }
    return response.json();
};

export const getHistory = async () => {
    const response = await fetch(`${API_URL}/Ventas/UnifiedHistory`);
    if (!response.ok) {
        throw new Error('Error al obtener historial');
    }
    return response.json();
};

export const createVenta = async (ventaDto) => {
    const response = await fetch(`${API_URL}/Ventas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ventaDto)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear venta');
    }
    return response.json();
};

export const getVentaById = async (id) => {
    const response = await fetch(`${API_URL}/Ventas/${id}`);
    if (!response.ok) {
        throw new Error('Error al obtener detalle de venta');
    }
    return response.json();
};

export const getNCFSequences = async () => {
    const response = await fetch(`${API_URL}/Ventas/NCF/Sequences`);
    if (!response.ok) {
        throw new Error('Error al obtener secuencias NCF');
    }
    return response.json();
};

// Alias for backward compatibility
export const getSecuenciasNCF = getNCFSequences;
