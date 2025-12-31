const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';

export const getGruposImpuestos = async () => {
    const res = await fetch(`${API_BASE}/GruposImpuestos`);
    if (!res.ok) throw new Error('Error al cargar grupos de impuestos');
    return res.json();
};

export const saveGrupoImpuesto = async (item) => {
    const isEdit = !!item.id;
    const url = isEdit ? `${API_BASE}/GruposImpuestos/${item.id}` : `${API_BASE}/GruposImpuestos`;
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Error al guardar grupo de impuestos');
    return res.json();
};

export const deleteGrupoImpuesto = async (id) => {
    const res = await fetch(`${API_BASE}/GruposImpuestos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar grupo de impuestos');
    return res.ok;
};
