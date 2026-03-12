import { menthaClient } from './client';

export const readLlmsTxt = async (uri: URL) => {
    const response = await menthaClient['llms.txt'].full.$get();

    if (!response.ok) {
        throw new Error('Failed to read llms.txt');
    }

    const data = await response.text();

    return {
        contents: [
            {
                uri: uri.href,
                mimeType: 'text/plain',
                text: data,
            },
        ],
    };
};

export const readEntity = async (uri: URL) => {
    const slug = uri.pathname.replace('/entity/', '');
    const response = await menthaClient.api.v1.kg.entities[':slug'].jsonld.$get({
        param: { slug },
    });

    if (!response.ok) {
        throw new Error(`Failed to read entity: ${slug}`);
    }

    const data = await response.json();

    return {
        contents: [
            {
                uri: uri.href,
                mimeType: 'application/json',
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
};
