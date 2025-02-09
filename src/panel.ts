import * as vscode from 'vscode';
import { getChatModels } from './api'; // Import to fetch available models
import { sendMessage } from './api'; // Import sendMessage to send actual messages

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
            localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')],
        }
    );

    // Fetch the available models and set up the chat UI
    getChatModels().then((models: Model[]) => {
        const modelOptionsHTML = models.map(model => {
            return `<option value="${model.model}">${model.model}</option>`;
        }).join('');

        panel.webview.html = `
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                        background-color: #ffffff;
                    }

                    .chat-container {
                        display: flex;
                        flex-direction: column;
                        flex-grow: 1;
                        padding: 20px;
                        overflow-y: auto;
                        background-color: #ffffff;
                        margin: 0;
                        justify-content: flex-end; /* Ensures chat starts at the bottom */
                    }

                    .message, .response {
                        max-width: 80%;
                        margin: 5px;
                        padding: 10px;
                        border-radius: 10px;
                        font-size: 14px;
                        line-height: 1.5;
                        word-wrap: break-word;
                    }

                    .message {
                        align-self: flex-end;
                        text-align: right;
                        color: #000000;
                        background-color: #f0f0f0; /* Light grey background for user messages */
                    }

                    .response {
                        align-self: flex-start;
                        text-align: left;
                        color: #333333;
                    }

                    .input-container {
                        display: flex;
                        align-items: center;
                        padding: 10px;
                        background-color: #ffffff;
                        border-top: 1px solid #ddd;
                        width: 100%;
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        margin: 0;
                        box-sizing: border-box; /* Ensures no overflow and maintains border size */
                    }

                    .input-field {
                        width: calc(100% - 40px); /* Ensure input width fits with the send button */
                        padding: 10px;
                        border-radius: 5px;
                        border: 1px solid #ddd;
                        font-size: 14px;
                        box-sizing: border-box; /* Ensure padding is included in width calculation */
                    }

                    .send-button {
                        position: absolute;
                        right: 15px; /* Adjusted to be closer to the right edge */
                        top: 50%;
                        transform: translateY(-50%);
                        width: 30px;  /* Smaller size */
                        height: 30px; /* Smaller size */
                        border: none;
                        background-color: #000000;
                        color: white;
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 18px; /* Slightly smaller arrow */
                    }

                    .send-button:hover {
                        background-color: #333333;
                    }

                    .model-select-container {
                        position: absolute;
                        top: 10px;
                        left: 20px;
                        z-index: 1;
                    }

                    .model-select {
                        padding: 5px;
                        margin: 0;
                        border-radius: 5px;
                        border: 1px solid #ddd;
                        background-color: #ffffff;
                        color: #000000;
                        font-size: 14px;
                    }

                    .message-container {
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-start;
                        flex-grow: 1;
                    }

                    /* Prevent horizontal scrolling */
                    body, html {
                        overflow-x: hidden;
                    }

                    .input-wrapper {
                        display: flex;
                        justify-content: space-between;
                        width: 100%;
                    }
                </style>
            </head>
            <body>
                <!-- Model selection dropdown in top-left corner -->
                <div class="model-select-container">
                    <select class="model-select" id="modelSelect">${modelOptionsHTML}</select>
                </div>

                <div class="chat-container" id="chat-container">
                    <!-- Chat messages will be dynamically inserted here -->
                </div>

                <div class="input-container">
                    <div class="input-wrapper">
                        <input type="text" id="messageInput" class="input-field" placeholder="Type a message" />
                        <button class="send-button" id="sendButton">&#8593;</button> <!-- Upward facing arrow -->
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();

                    const sendMessage = async () => {
                        const message = document.getElementById('messageInput').value;
                        const model = document.getElementById('modelSelect').value;
                        if (message && model) {
                            // Add the user's message to the chat
                            const messageContainer = document.getElementById('chat-container');
                            const userMessage = document.createElement('div');
                            userMessage.classList.add('message');
                            userMessage.textContent = message;
                            messageContainer.appendChild(userMessage);

                            // Clear the input field
                            document.getElementById('messageInput').value = '';

                            // Send the message to the extension to get the model's response
                            vscode.postMessage({
                                type: 'sendMessage',
                                prompt: message,
                                model: model
                            });
                        }
                    };

                    // Listen for the response from the extension
                    window.addEventListener('message', event => {
                        const messageContainer = document.getElementById('chat-container');
                        if (event.data.type === 'response') {
                            const responseMessage = document.createElement('div');
                            responseMessage.classList.add('response');
                            responseMessage.textContent = event.data.response;
                            messageContainer.appendChild(responseMessage);

                            // Scroll to the bottom
                            messageContainer.scrollTop = messageContainer.scrollHeight;
                        }
                    });

                    document.getElementById('sendButton').addEventListener('click', sendMessage);

                    document.getElementById('messageInput').addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            sendMessage();
                        }
                    });
                </script>
            </body>
        </html>`;
    }).catch(err => {
        panel.webview.html = `<h1>Error fetching models: ${err.message}</h1>`;
    });

    // Handle the message received from the webview
    panel.webview.onDidReceiveMessage((message) => {
        switch (message.type) {
            case 'sendMessage':
                // Send the message to the backend
                sendMessage(message.prompt, message.model, true) // stream = true to handle streaming
                    .then(response => {
                        // Send the actual response from the model to the webview
                        panel.webview.postMessage({
                            type: 'response',
                            response: response // This is the actual response from the backend
                        });
                    })
                    .catch(error => {
                        // If error, send the error message to the webview
                        panel.webview.postMessage({
                            type: 'response',
                            response: `Error: ${error.message}`
                        });
                    });
                break;
        }
    });
}