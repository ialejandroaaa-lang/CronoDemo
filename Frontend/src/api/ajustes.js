const API_URL = (import.meta.env.VITE_API_URL || '/api') + '/Ajustes';

export const createAjuste = async (ajuste) => {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ajuste),
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Error al guardar ajuste: ${res.status} ${errText}`);
    }
    return res.json();
};

export const getAjustes = async () => {
    const res = await fetch(API_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Error al obtener ajustes: ${res.status} ${errText}`);
    }
    return res.json();
};

export const getAjusteById = async (id) => {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
        throw new Error(`Error fetching details: ${res.statusText}`);
    }
    return res.json();
};

