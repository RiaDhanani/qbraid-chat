import axios from 'axios';
import { getApiKey } from './auth';

const BASE_URL = 'https://api.qbraid.com/api';

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
        const response = await axios.post(
            `${BASE_URL}/chat`, 
            { prompt, model, stream },
            { headers: getHeaders(), responseType: 'stream' }
        );

        let chatText = '';
        response.data.on('data', (chunk: Buffer) => chatText += chunk.toString());

        return new Promise((resolve, reject) => {
            response.data.on('end', () => resolve(chatText));
            response.data.on('error', reject);
        });
    } catch (error) {
        const err = error as any;
        throw new Error(err.response?.data || err.message);
    }
};