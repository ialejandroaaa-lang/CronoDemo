const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const getAlmacenes = async () => {
    const res = await fetch(`${API_BASE}/Almacenes`);
    if (!res.ok) throw new Error('Error al cargar almacenes');
    return res.json();
};

export const saveAlmacen = async (item) => {
    const isEdit = !!item.id;
    const url = isEdit ? `${API_BASE}/Almacenes/${item.id}` : `${API_BASE}/Almacenes`;
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Error al guardar almacén');
    return res.json();
};

export const deleteAlmacen = async (id) => {
    const res = await fetch(`${API_BASE}/Almacenes/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar almacén');
    return res.ok;
};

