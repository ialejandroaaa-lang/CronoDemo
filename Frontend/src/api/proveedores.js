const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';

export const getProveedores = async () => {
    const res = await fetch(`${API_BASE}/Proveedores`);
    if (!res.ok) {
        throw new Error(`Failed to get providers: ${res.status}`);
    }
    return res.json();
};

export const getProveedor = async (id) => {
    const res = await fetch(`${API_BASE}/Proveedores/${id}`);
    if (!res.ok) {
        throw new Error(`Failed to get provider: ${res.status}`);
    }
    return res.json();
};

export const saveProveedor = async (proveedor) => {
    const res = await fetch(`${API_BASE}/Proveedores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proveedor),
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to save provider: ${res.status} ${errText}`);
    }
    return res.json();
};

export const updateProveedor = async (id, proveedor) => {
    const res = await fetch(`${API_BASE}/Proveedores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proveedor),
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to update provider: ${res.status} ${errText}`);
    }
    if (res.status === 204) return null;
    return res.json();
};

export const deleteProveedor = async (id) => {
    const res = await fetch(`${API_BASE}/Proveedores/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to delete provider: ${res.status} ${errText}`);
    }
    return true;
};
