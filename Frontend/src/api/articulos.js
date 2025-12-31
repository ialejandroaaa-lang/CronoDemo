const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';

export const saveArticulo = async (articulo) => {
    const res = await fetch(`${API_BASE}/Articulos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articulo),
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to save article: ${res.status} ${errText}`);
    }
    return res.json();
};

export const updateArticulo = async (id, articulo) => {
    const res = await fetch(`${API_BASE}/Articulos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articulo),
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to update article: ${res.status} ${errText}`);
    }
    // PUT usually returns 204 No Content, but checking if it returns JSON just in case
    if (res.status === 204) return null;
    return res.json();
};

export const deleteArticulo = async (id) => {
    const res = await fetch(`${API_BASE}/Articulos/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to delete article: ${res.status} ${errText}`);
    }
    return true;
};

export const getArticulo = async (id) => {
    const res = await fetch(`${API_BASE}/Articulos/${id}`);
    if (!res.ok) {
        throw new Error(`Failed to get article: ${res.status}`);
    }
    return res.json();
};

export const getArticulos = async () => {
    const res = await fetch(`${API_BASE}/Articulos`);
    if (!res.ok) {
        throw new Error(`Failed to get articles: ${res.status}`);
    }
    return res.json();
};

export const getPrecios = async (id) => {
    const res = await fetch(`${API_BASE}/Articulos/${id}/Precios`);
    if (!res.ok) throw new Error("Failed to load prices");
    return res.json();
};

export const getNavigationList = async () => {
    const res = await fetch(`${API_BASE}/Articulos/NavigationList`);
    if (!res.ok) throw new Error("Failed to load navigation list");
    return res.json();
};

export const getStock = async (id, almacenId) => {
    const query = almacenId ? `?almacenId=${almacenId}` : '';
    const res = await fetch(`${API_BASE}/Articulos/${id}/Stock${query}`);
    if (!res.ok) throw new Error("Failed to load stock");
    return res.json();
};

export const getStockBreakdown = async (id) => {
    const res = await fetch(`${API_BASE}/Articulos/${id}/StockBreakdown`);
    if (!res.ok) throw new Error("Failed to load stock breakdown");
    return res.json();
};

export const uploadProductImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/Upload/ProductImage`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to upload image: ${res.status} ${errText}`);
    }
    return res.json();
};
