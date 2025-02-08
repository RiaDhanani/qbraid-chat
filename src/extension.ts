import * as vscode from 'vscode';
import { getApiKey } from './auth';

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('qbraid-chat.testAuth', () => {
		const apiKey = getApiKey();
		if (apiKey) {
			vscode.window.showInformationMessage(`'API Key found!`);
		}
		else {
			vscode.window.showErrorMessage('Failed to retrieve API Key.');
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
