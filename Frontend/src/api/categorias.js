export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';

// --- Categorias ---
export const getCategorias = async () => {
    const res = await fetch(`${API_BASE}/Categorias`);
    if (!res.ok) throw new Error('Error al cargar categorías');
    return res.json();
};

export const saveCategoria = async (item) => {
    const isEdit = !!item.id;
    const url = isEdit ? `${API_BASE}/Categorias/${item.id}` : `${API_BASE}/Categorias`;
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Error al guardar categoría');
    return res.json();
};

export const deleteCategoria = async (id) => {
    const res = await fetch(`${API_BASE}/Categorias/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar categoría');
    return res.ok;
};

// --- Marcas ---
export const getMarcas = async () => {
    const res = await fetch(`${API_BASE}/Marcas`);
    if (!res.ok) throw new Error('Error al cargar marcas');
    return res.json();
};

export const saveMarca = async (item) => {
    const isEdit = !!item.id;
    const url = isEdit ? `${API_BASE}/Marcas/${item.id}` : `${API_BASE}/Marcas`;
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Error al guardar marca');
    return res.json();
};

export const deleteMarca = async (id) => {
    const res = await fetch(`${API_BASE}/Marcas/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar marca');
    return res.ok;
};

// --- Tipos ---
export const getTipos = async () => {
    const res = await fetch(`${API_BASE}/Tipos`);
    if (!res.ok) throw new Error('Error al cargar tipos');
    return res.json();
};

export const saveTipo = async (item) => {
    const isEdit = !!item.id;
    const url = isEdit ? `${API_BASE}/Tipos/${item.id}` : `${API_BASE}/Tipos`;
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Error al guardar tipo');
    return res.json();
};

export const deleteTipo = async (id) => {
    const res = await fetch(`${API_BASE}/Tipos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar tipo');
    return res.ok;
};
