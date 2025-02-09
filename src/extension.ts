import * as vscode from 'vscode';
import { getApiKey } from './auth'; // Function to retrieve the API key
import { getChatPanel } from './panel'; // Import the function that opens the chat panel
import { sendMessage } from './api'; // Function to send the message to the backend API

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('qbraid-chat.start', () => {
        const apiKey = getApiKey();
        if (apiKey) {
            vscode.window.showInformationMessage('API Key found!');
            getChatPanel(context);  // Open the chat panel when the extension starts
        } else {
            vscode.window.showErrorMessage('Failed to retrieve API Key.');
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

// Listen for messages from the webview (chat UI)
export function handleWebviewMessages(panel: vscode.WebviewPanel) {
    panel.webview.onDidReceiveMessage((message: any) => {
        switch (message.type) {
            case 'sendMessage':
                const { prompt, model } = message;

                // Handle sending the message to the backend model API
                sendMessage(prompt, model,true)
                    .then((response) => {
                        // Send the response back to the webview
                        panel.webview.postMessage({
                            type: 'response',
                            response: response,
                        });
                    })
                    .catch((error) => {
                        // Send an error message back to the webview
                        panel.webview.postMessage({
                            type: 'response',
                            response: `Error: ${error.message}`,
                        });
                    });
                break;
        }
    });
}