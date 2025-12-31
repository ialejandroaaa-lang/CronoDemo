const API_BASE = ((import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') ? import.meta.env.VITE_API_URL : '/api');

export const getKardex = async (almacenId) => {
    const url = almacenId
        ? `${API_BASE}/Kardex?almacenId=${almacenId}`
        : `${API_BASE}/Kardex`;

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to get kardex: ${res.status}`);
    }
    return res.json();
};


