import axios from 'axios';
import { ExtensionContext } from 'vscode';
import { getApiKey } from './auth';

const BASE_URL = 'https://api.qbraid.com/api';

// Extension context for storage
let extensionContext: ExtensionContext;

export const initializeStorage = (context: ExtensionContext) => {
    extensionContext = context;
};

// Enhanced conversation context interface
interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface ConversationContext {
    messages: Message[];
    lastMessageId?: string;
}

// Helper functions for context management
const getContext = (): ConversationContext => {
    if (!extensionContext) {
        return { messages: [] };
    }
    return extensionContext.globalState.get('conversationContext', { messages: [] });
};

const updateContext = async (role: 'user' | 'assistant', content: string) => {
    if (!extensionContext) {
        console.warn('Extension context not initialized');
        return;
    }
    
    const context = getContext();
    context.messages.push({
        role,
        content,
        timestamp: Date.now()
    });
    
    // Keep only the last 10 messages to prevent context from growing too large
    if (context.messages.length > 10) {
        context.messages = context.messages.slice(-10);
    }
    
    await extensionContext.globalState.update('conversationContext', context);
    
    // Debug logging
    console.log(`Context updated. Current message count: ${context.messages.length}`);
};

// Format conversation history for the API
const formatConversationHistory = (messages: Message[]): string => {
    const formattedHistory = messages
        .map((msg, index) => {
            const rolePrefix = msg.role === 'user' ? 'User' : 'Assistant';
            // Add message number for debugging
            return `[${index + 1}] ${rolePrefix}: ${msg.content.trim()}`;
        })
        .join('\n\n');
    
    // Debug logging
    console.log(`Formatting ${messages.length} messages for context`);
    
    return formattedHistory;
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
        console.error('Error fetching chat models:', error);
        return null;
    }
};

export const sendMessage = async (prompt: string, model: string, stream: boolean) => {
    try {
        // Save user message to context
        await updateContext('user', prompt);
        
        // Get conversation context
        const context = getContext();
        
        // Debug logging
        console.log(`Preparing to send message. Context size: ${context.messages.length}`);
        
        // Format the conversation history with all available messages
        const conversationHistory = formatConversationHistory(context.messages);
        
        // Construct the enhanced prompt with clear separation
        const enhancedPrompt = `
Previous conversation:
${conversationHistory}

Current question:
${prompt}

Please provide a response that takes into account the full conversation history above.`;

        // Debug logging of full prompt
        console.log('Enhanced prompt being sent:', enhancedPrompt);

        const response = await axios.post(
            `${BASE_URL}/chat`, 
            { 
                prompt: enhancedPrompt, 
                model, 
                stream 
            },
            { 
                headers: getHeaders(), 
                responseType: 'stream' 
            }
        );

        let chatText = '';
        response.data.on('data', (chunk: Buffer) => chatText += chunk.toString());

        return new Promise((resolve, reject) => {
            response.data.on('end', async () => {
                // Save assistant's response to context
                await updateContext('assistant', chatText);
                // Debug logging
                console.log('Response received and saved to context');
                resolve(chatText);
            });
            response.data.on('error', reject);
        });
    } catch (error) {
        const err = error as any;
        console.error('Error in sendMessage:', err);
        throw new Error(err.response?.data || err.message);
    }
};

// Helper function to clear conversation context
export const clearConversationContext = async () => {
    if (!extensionContext) {
        console.warn('Extension context not initialized');
        return;
    }
    await extensionContext.globalState.update('conversationContext', { messages: [] });
    console.log('Conversation context cleared');
};

// Helper function to get conversation history
export const getConversationHistory = () => {
    const context = getContext();
    console.log(`Getting conversation history. ${context.messages.length} messages available`);
    return context.messages;
};

// Helper function to get the number of messages in context
export const getContextSize = () => {
    return getContext().messages.length;
};

// New helper function to inspect the current context
export const inspectContext = () => {
    const context = getContext();
    console.log('Current context:');
    context.messages.forEach((msg, index) => {
        console.log(`[${index + 1}] ${msg.role}: ${msg.content.substring(0, 50)}...`);
    });
    return context;
};