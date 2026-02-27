const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const analyzeTask = async (task: string) => {
    const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
    });

    if (!response.ok) {
        throw new Error('API Request Failed');
    }

    return response.json();
};

export const simulateInbox = async (message: string) => {
    const response = await fetch(`${API_URL}/api/inbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
    });

    if (!response.ok) {
        throw new Error('API Request Failed');
    }

    return response.json();
};
