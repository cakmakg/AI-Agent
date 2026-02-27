const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://ai-agent-backend-3ixe.onrender.com';

export const analyzeTask = async (task: string) => {
    const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'a7db7ashd7ashd7ahsd7ashd7ashd7hasd7g2367f4e219er'
        },
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
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'a7db7ashd7ashd7ahsd7ashd7ashd7hasd7g2367f4e219er'
        },
        body: JSON.stringify({ message }),
    });

    if (!response.ok) {
        throw new Error('API Request Failed');
    }

    return response.json();
};
