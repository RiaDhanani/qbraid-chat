# qBraid Chat Extension for VS Code

A VS Code extension that integrates qBraid's chat API directly within your development environment.

![Chat Interface](assets/image.png)
![Model selection](assets/image-1.png)

## Features

- Direct access to qBraid's chat models within VS Code
- Context-aware conversation history (maintains up to 10 previous messages)
- Model selection capability
- Clean, intuitive chat interface

## Prerequisites

- Visual Studio Code 1.85.0 or higher
- Node.js and npm installed
- A valid qBraid API key
- **qBraid CLI installed and authenticated** ([Installation Guide](https://docs.qbraid.com/cli/user-guide/overview#local-setup)) 

## Installation

1. Clone the repository:
```bash
git clone https://github.com/RiaDhanani/qbraid-chat.git
cd qbraid-chat
npm install
```

2. Package the extension:
```bash
npm run vsce:package
```

3. Install the extension in VS Code:
```bash
code --install-extension qbraid-chat-0.1.0.vsix
```

## Usage

1. Open the Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Type "Start qBraid Chat" and select the command
3. Select your preferred model from the dropdown
4. Type your message and press Enter or click the send button

## Development

- Build: `npm run compile`
- Watch: `npm run watch`
- Lint: `npm run lint`
- Test: `npm run test`

## Configuration

This extension retrieves the qBraid API key automatically from ~/.qbraid/qbraidrc.