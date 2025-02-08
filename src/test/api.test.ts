import * as assert from 'assert';
import * as vscode from 'vscode';
import { getChatModels, sendMessage } from '../api';

suite('Api Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Get chat models from API', async () => {
        try {
            const models = await getChatModels();
            assert.ok(models, 'Failed to fetch chat models');
            assert.ok(Array.isArray(models), 'Response is not an array');
        } catch (error) {
            console.error('Test failed with error:', error);
            assert.fail('API call failed with error: ' + error);
        }
    });

    test('Send message to API', function (done) {
        this.timeout(10000); 
        const message = 'What quantum devices available through qBraid are currently online and available?';
        const model = 'gpt-4o';
        const stream = true;

        sendMessage(message, model, stream)
        .then((response) => {
            console.log('Chat response: ', response);
            assert.ok(response, 'Failed to send message');
            assert.ok(typeof response === 'string', 'Response is not a string');
            assert.ok(response.length > 0, 'Response is empty');
            done();
        })
        .catch((error) => {
            console.error('Test failed with error:', error);
            assert.fail('API call failed with error: ' + error);
            done();
        });
    });
});