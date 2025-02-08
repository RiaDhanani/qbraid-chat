import axios from 'axios';
import * as vscode from 'vscode';
import { getApiKey } from './auth';

const BASE_URL = 'https://api.qbraid.com/api';

export async function getChatModels() {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('API Key is missing.');
        return null;
    }

    try {
        const response = await axios.get(`${BASE_URL}/chat/models`, {
            method: 'GET',
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching chat models: ', error);
        return null;
    }
}

export async function sendMessage(prompt: string, model: string, stream: boolean) {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('API Key is missing.');
        return null;
    }

    try {
        const response = await axios.post(`${BASE_URL}/chat`, {
            prompt,
            model,
            stream,
        }, {
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            responseType: 'stream'
        });

        // Collect all the chunks of the response
        let chatText = '';
        response.data.on('data', (chunk: Buffer) => {
            chatText += chunk.toString();
        });

        return new Promise((resolve, reject) => {
            response.data.on('end', () => {
                resolve(chatText); // Resolve when the response stream is complete
            });

            response.data.on('error', (err: any) => {
                reject(err); // Reject if there's an error during the stream
            });
        });
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                console.error('API Error:', error.response.data);
                throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                console.error('No response received:', error.request);
                throw new Error('No response received from the API');
            } else {
                console.error('Request setup error:', error.message);
                throw new Error(`Request error: ${error.message}`);
            }
        } else {
            console.error('Unknown Error:', error);
            throw new Error(`Unknown error: ${error}`);
        }
    }
}