const API_BASE = import.meta.env.VITE_API_URL || '/api';
const ENDPOINT = '/Promotions';

export const getPromotions = async () => {
    const res = await fetch(`${API_BASE}${ENDPOINT}`);
    if (!res.ok) throw new Error("Failed to fetch promotions");
    return res.json();
};

export const getPromotionById = async (id) => {
    const res = await fetch(`${API_BASE}${ENDPOINT}/${id}`);
    if (!res.ok) throw new Error("Failed to fetch promotion");
    return res.json();
};

export const createPromotion = async (promotion) => {
    const res = await fetch(`${API_BASE}${ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promotion)
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        console.error("Backend Error:", errorData);

        let errorMessage = errorData?.title || errorData?.message || "Failed to create promotion";

        // Append validation errors if available
        if (errorData?.errors) {
            const validationErrors = Object.entries(errorData.errors)
                .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
                .join('\n');
            errorMessage += `\n${validationErrors}`;
        }

        throw new Error(errorMessage);
    }
    return res.json();
};

export const updatePromotion = async (id, promotion) => {
    const res = await fetch(`${API_BASE}${ENDPOINT}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promotion)
    });
    if (!res.ok) throw new Error("Failed to update promotion");
    // PUT might return 204 or the object
    if (res.status === 204) return true;
    return res.json();
};

export const deletePromotion = async (id) => {
    const res = await fetch(`${API_BASE}${ENDPOINT}/${id}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete promotion");
    return true;
};

// Calculate Cart Method
export const calculateCartPromotions = async (cartDto) => {
    const res = await fetch(`${API_BASE}${ENDPOINT}/Calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartDto)
    });
    if (!res.ok) throw new Error("Failed to calculate promotions");
    return res.json();
};

