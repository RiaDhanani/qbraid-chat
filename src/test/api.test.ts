import * as assert from 'assert';
import * as vscode from 'vscode';
import { getChatModels } from '../api';

suite('Api Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Get chat models from API', async () => {
        try {
            const models = await getChatModels();
            assert.ok(models, 'Failed to fetch chat models');
            assert.ok(Array.isArray(models), 'Response is not an array');
        } catch (error) {
            console.error('Test failed with error:', error); // Log the error in the test
        }
    });
});