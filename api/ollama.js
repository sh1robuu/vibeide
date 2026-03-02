export default async function handler(req, res) {
    // CORS headers for preflight
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { model, messages, temperature, stream } = req.body;
        const ollamaKey = req.headers.authorization || '';
        const ollamaBaseUrl = process.env.VITE_OLLAMA_BASE_URL || 'https://ollama.com';

        const ollamaResponse = await fetch(`${ollamaBaseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': ollamaKey
            },
            body: JSON.stringify({
                model,
                messages,
                stream: stream || false,
                options: { temperature: temperature || 0.7 }
            })
        });

        if (!ollamaResponse.ok) {
            const errorText = await ollamaResponse.text().catch(() => '');
            return res.status(ollamaResponse.status).json({
                error: `Ollama API error: ${ollamaResponse.statusText}`,
                detail: errorText
            });
        }

        if (stream) {
            // Stream the response back
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const reader = ollamaResponse.body.getReader();
            const decoder = new TextDecoder();

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    res.write(chunk);
                }
            } finally {
                res.end();
            }
        } else {
            const data = await ollamaResponse.json();
            return res.status(200).json(data);
        }
    } catch (error) {
        console.error('[Ollama Proxy] Error:', error);
        return res.status(500).json({ error: 'Proxy error', detail: error.message });
    }
}
