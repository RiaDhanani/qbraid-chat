import * as vscode from 'vscode';
import { getChatModels } from '../api';
import { sendMessage } from '../api';
import * as fs from 'fs';
import * as path from 'path';

interface Model {
    model: string;
    description: string;
    pricing: {
        units: string;
        input: number;
        output: number;
    };
}

export function getChatPanel(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'qbraidChat',
        'qBraid Chat',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media'), 
                               vscode.Uri.joinPath(context.extensionUri, 'src/webview')],
        }
    );

    const cssPath = vscode.Uri.joinPath(context.extensionUri, 'src/webview', 'styles.css');
    const cssUri = panel.webview.asWebviewUri(cssPath);

    const chatPath = path.join(context.extensionPath, 'src/webview', 'chat.html');
    const chat = fs.readFileSync(chatPath, 'utf8');

    getChatModels().then((models: Model[]) => {
        const modelOptionsHTML = models
            .map(model => `<option value="${model.model}">${model.model}</option>`)
            .join('');

        const html = chat
            .replace('{{cssUri}}', cssUri.toString())
            .replace('{{modelOptions}}', modelOptionsHTML);

        panel.webview.html = html;
    }).catch(err => {
        panel.webview.html = `<h1>Error fetching models: ${err.message}</h1>`;
    });

    // Handle the message received from the webview
    panel.webview.onDidReceiveMessage((message) => {
        switch (message.type) {
            case 'sendMessage':
                sendMessage(message.prompt, message.model, true)
                    .then(response => {
                        panel.webview.postMessage({
                            type: 'response',
                            response: response
                        });
                    })
                    .catch(error => {
                        panel.webview.postMessage({
                            type: 'response',
                            response: `Error: ${error.message}`
                        });
                    });
                break;
        }
    });
}