import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export function getApiKey(): string | null {
    const configPath = path.join(os.homedir(), '.qbraid', 'qbraidrc');

    try {
        const configFile = fs.readFileSync(configPath, 'utf-8');
        const match = configFile.match(/api-key\s*=\s*(\S+)/);

        if (match) {
            return match[1].trim()
        } else {
            console.error('API key not founf in config file');
            return null;
        }
    } catch (error) {
        console.error('Error reading config file:', error);
        return null;
    }
}