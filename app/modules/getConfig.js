let CONFIG = null;

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = "../../CONFIG.env";

function getConfig() {

    if(CONFIG) {
        return CONFIG;
    }

    const envPath = path.join(__dirname, configPath);
    const envData = {};
    const envFile = fs.readFileSync(envPath, 'utf-8');
    const lines = envFile.split('\n');
    lines.forEach(line => {
        const [key, value] = line.split('=');
        envData[key.trim()] = value.trim();
    });
    CONFIG = envData;
    return envData;

}

export default getConfig;