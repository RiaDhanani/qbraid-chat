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
    } catch(error) {
        console.error('Error fetching chat models: ', error);
        return null;
    }
}