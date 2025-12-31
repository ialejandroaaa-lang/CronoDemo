const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const searchSaleForReturn = async (invoiceNumber) => {
    try {
        const response = await fetch(`${API_BASE}/Returns/Search/${invoiceNumber}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error searching sale');
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const createReturn = async (returnData) => {
    try {
        const response = await fetch(`${API_BASE}/Returns/Create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(returnData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error creating return');
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const getReturnReport = async (returnId) => {
    try {
        const response = await fetch(`${API_BASE}/Returns/Report/${returnId}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error fetching return report');
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const getReturnsHistory = async (start, end) => {
    try {
        const query = new URLSearchParams();
        if (start) query.append('start', start);
        if (end) query.append('end', end);

        const response = await fetch(`${API_BASE}/Returns?${query.toString()}`);
        if (!response.ok) throw new Error('Error fetching returns history');
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const getCreditNotesHistory = async (start, end) => {
    try {
        const query = new URLSearchParams();
        if (start) query.append('start', start);
        if (end) query.append('end', end);

        const response = await fetch(`${API_BASE}/CreditNotes?${query.toString()}`);
        if (!response.ok) throw new Error('Error fetching credit notes history');
        return await response.json();
    } catch (error) {
        throw error;
    }
};

