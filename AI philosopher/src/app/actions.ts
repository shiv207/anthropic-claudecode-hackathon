'use server'

import { chatCompletion, Message, REFEREE_MODEL } from '@/lib/api';
import { REFEREE_SYSTEM_PROMPT, ROASTER_SYSTEM_PROMPT } from '@/lib/prompts';

export async function generateRoast(
    model: string,
    history: Message[]
) {
    // Filter history to only include user/assistant messages for context if needed, 
    // but for the battle we want the full context.
    // We prepend the system prompt.
    const messages: Message[] = [
        { role: 'system', content: ROASTER_SYSTEM_PROMPT },
        ...history
    ];

    try {
        const response = await chatCompletion(model, messages);
        return cleanResponse(response);
    } catch (error) {
        console.error('Roast generation failed:', error);
        throw new Error('Failed to generate roast');
    }
}

export async function judgeBattle(history: Message[]) {
    const messages: Message[] = [
        { role: 'system', content: REFEREE_SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: 'Who won this exchange? Provide your verdict.' }
    ];

    try {
        const response = await chatCompletion(REFEREE_MODEL, messages);
        return cleanResponse(response);
    } catch (error) {
        console.error('Judging failed:', error);
        throw new Error('Failed to judge battle');
    }
}

function cleanResponse(content: string): string {
    // Remove <think>...</think> blocks often produced by reasoning models
    return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}
