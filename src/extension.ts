import * as vscode from 'vscode';
import { getApiKey } from './auth';
import { getChatPanel } from './webview/panel';
import { sendMessage } from './api';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('qbraid-chat.start', () => {
        const apiKey = getApiKey();
        if (apiKey) {
            getChatPanel(context);  // Opens the chat panel when the extension starts
        } else {
            vscode.window.showErrorMessage('Failed to retrieve API Key.');
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

// Listen for messages from the webview
export function handleWebviewMessages(panel: vscode.WebviewPanel) {
    panel.webview.onDidReceiveMessage((message: any) => {
        switch (message.type) {
            case 'sendMessage':
                const { prompt, model } = message;
                sendMessage(prompt, model,true)
                    .then((response) => {
                        // Send the response back to the webview
                        panel.webview.postMessage({
                            type: 'response',
                            response: response,
                        });
                    })
                    .catch((error) => {
                        panel.webview.postMessage({
                            type: 'response',
                            response: `Error: ${error.message}`,
                        });
                    });
                break;
        }
    });
}