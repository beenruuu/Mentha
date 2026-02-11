import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

export interface CliConfig {
    apiBaseUrl: string;
    defaultTimeout: number;
    outputFormat: 'table' | 'json';
}

const config: CliConfig = {
    apiBaseUrl: process.env['MENTHA_API_URL'] || 'http://localhost:3000',
    defaultTimeout: parseInt(process.env['MENTHA_DEFAULT_TIMEOUT'] || '30000', 10),
    outputFormat: (process.env['MENTHA_OUTPUT_FORMAT'] as 'table' | 'json') || 'table',
};

export default config;
