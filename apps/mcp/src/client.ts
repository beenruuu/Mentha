import { createMenthaClient } from '@mentha/core';
import { config } from 'dotenv';
import type { AppType } from 'mentha-api';

config();

const apiUrl = process.env.MENTHA_API_URL;
const apiToken = process.env.MENTHA_API_TOKEN;

if (!apiUrl) {
    throw new Error('MENTHA_API_URL environment variable is required');
}

export const menthaClient = createMenthaClient<AppType>({
    baseUrl: apiUrl,
    auth: apiToken ? { token: apiToken } : undefined,
});
