const GROQ_API_KEY = process.env.GROQ_API_KEY;

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    model?: string;
}

export interface Model {
    id: string;
    name: string;
}

export const GROQ_MODELS: Model[] = [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B' },
    { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B' },
    { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B' },
    { id: 'qwen/qwen3-32b', name: 'Qwen 3 32B' },
    { id: 'moonshotai/kimi-k2-instruct', name: 'Kimi K2' },
    { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick 17B (Preview)' },
    { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B (Preview)' },
    { id: 'groq/compound', name: 'Groq Compound' },
    { id: 'groq/compound-mini', name: 'Groq Compound Mini' },
    { id: 'canopylabs/orpheus-v1-english', name: 'Orpheus V1 English' },
];

export const REFEREE_MODEL = 'llama-3.3-70b-versatile';

export async function chatCompletion(
    model: string,
    messages: Message[]
): Promise<string> {
    if (!GROQ_API_KEY) {
        throw new Error('Missing GROQ_API_KEY');
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: messages.map(({ role, content }) => ({ role, content })),
                temperature: 0.7,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Groq API Error: ${response.statusText} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error calling Groq:', error);
        throw error;
    }
}
