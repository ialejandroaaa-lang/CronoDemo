// API para gestión de plantillas de recibos
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';

export const getReceiptTemplates = async () => {
    const response = await fetch(`${API_BASE}/ReceiptTemplates`);
    if (!response.ok) throw new Error('Error al obtener plantillas');
    return response.json();
};

export const getReceiptTemplateById = async (id) => {
    const response = await fetch(`${API_BASE}/ReceiptTemplates/${id}`);
    if (!response.ok) throw new Error('Error al obtener plantilla');
    return response.json();
};

export const getDefaultTemplate = async (tipoRecibo = 'Venta') => {
    const response = await fetch(`${API_BASE}/ReceiptTemplates/default/${tipoRecibo}`);
    if (!response.ok) throw new Error('Error al obtener plantilla por defecto');
    return response.json();
};

export const createReceiptTemplate = async (template) => {
    const response = await fetch(`${API_BASE}/ReceiptTemplates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
    });
    if (!response.ok) throw new Error('Error al crear plantilla');
    return response.json();
};

export const updateReceiptTemplate = async (id, template) => {
    const response = await fetch(`${API_BASE}/ReceiptTemplates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
    });
    if (!response.ok) throw new Error('Error al actualizar plantilla');
    return response.status === 204 ? null : response.json();
};

export const deleteReceiptTemplate = async (id) => {
    const response = await fetch(`${API_BASE}/ReceiptTemplates/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar plantilla');
    return response.status === 204 ? null : response.json();
};

export const setDefaultTemplate = async (id) => {
    const response = await fetch(`${API_BASE}/ReceiptTemplates/${id}/setDefault`, {
        method: 'POST'
    });
    if (!response.ok) throw new Error('Error al establecer plantilla por defecto');
    return response.json();
};

export const duplicateTemplate = async (id) => {
    const response = await fetch(`${API_BASE}/ReceiptTemplates/duplicate/${id}`, {
        method: 'POST'
    });
    if (!response.ok) throw new Error('Error al duplicar plantilla');
    return response.json();
};
