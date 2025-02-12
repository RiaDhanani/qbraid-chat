import axios from 'axios';
import { ExtensionContext } from 'vscode';
import { getApiKey } from './auth';

const BASE_URL = 'https://api.qbraid.com/api';

let extensionContext: ExtensionContext;

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface ConversationContext {
    messages: Message[];
    lastMessageId?: string;
}

export const initializeStorage = (context: ExtensionContext) => {
    extensionContext = context;
};

const getContext = (): ConversationContext => {
    if (!extensionContext) {
        return { messages: [] };
    }
    return extensionContext.globalState.get('conversationContext', { messages: [] });
};

const updateContext = async (role: 'user' | 'assistant', content: string) => {
    if (!extensionContext) {
        return;
    }

    const context = getContext();
    context.messages.push({
        role,
        content,
        timestamp: Date.now()
    });

    if (context.messages.length > 10) {
        context.messages = context.messages.slice(-10);
    }

    await extensionContext.globalState.update('conversationContext', context);
};

const formatConversationHistory = (messages: Message[]): string => {
    return messages
        .map(msg => {
            const rolePrefix = msg.role === 'user' ? 'User' : 'Assistant';
            return `${rolePrefix}: ${msg.content.trim()}`;
        })
        .join('\n\n');
};

const getHeaders = () => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('API Key is missing');

    return {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
};

export const getChatModels = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/chat/models`, { headers: getHeaders() });
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch chat models');
    }
};

/**
 * Sends a message to the chat API while maintaining conversation context.
 * Includes up to 10 previous messages for context and returns a streamed response.
 */
export const sendMessage = async (prompt: string, model: string, stream: boolean) => {
    try {
        await updateContext('user', prompt);

        const context = getContext();
        const conversationHistory = formatConversationHistory(context.messages);

        const enhancedPrompt = `
Previous conversation:
${conversationHistory}

Current question:
${prompt}

Please provide a response that takes into account the full conversation history above.`;

        const response = await axios.post(
            `${BASE_URL}/chat`,
            { prompt: enhancedPrompt, model, stream },
            { headers: getHeaders(), responseType: 'stream' }
        );

        let chatText = '';
        response.data.on('data', (chunk: Buffer) => chatText += chunk.toString());

        return new Promise((resolve, reject) => {
            response.data.on('end', async () => {
                await updateContext('assistant', chatText);
                resolve(chatText);
            });
            response.data.on('error', reject);
        });
    } catch (error) {
        const err = error as any;
        throw new Error(err.response?.data || err.message);
    }
};

export const clearConversationContext = async () => {
    if (!extensionContext) {
        return;
    }
    await extensionContext.globalState.update('conversationContext', { messages: [] });
};

export const getConversationHistory = () => {
    return getContext().messages;
};