const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const getCompras = async () => {
    const res = await fetch(`${API_BASE}/Compras`);
    if (!res.ok) {
        throw new Error(`Failed to get purchases: ${res.status}`);
    }
    return res.json();
};

export const getCompra = async (id) => {
    const res = await fetch(`${API_BASE}/Compras/${id}`);
    if (!res.ok) {
        throw new Error(`Failed to get purchase: ${res.status}`);
    }
    return res.json();
};

export const saveCompra = async (compra) => {
    const res = await fetch(`${API_BASE}/Compras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compra),
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to save purchase: ${res.status} ${errText}`);
    }
    return res.json();
};
export const anularCompra = async (id) => {
    const res = await fetch(`${API_BASE}/Compras/${id}/anular`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to annul purchase: ${res.status} ${errText}`);
    }
    return res.json();
};

