import { menthaClient } from './client';

export const generateLlmsTxt = async () => {
    const response = await menthaClient['llms.txt'].$get();

    if (!response.ok) {
        throw new Error('Failed to generate llms.txt');
    }

    const data = await response.text();

    return {
        content: [
            {
                type: 'text' as const,
                text: data,
            },
        ],
    };
};

export const listProjects = async () => {
    const response = await menthaClient.api.v1.projects.$get();

    if (!response.ok) {
        throw new Error('Failed to list projects');
    }

    const data = await response.json();

    return {
        content: [
            {
                type: 'text' as const,
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
};
