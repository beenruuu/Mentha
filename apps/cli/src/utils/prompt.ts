import inquirer from 'inquirer';

import type { ProviderType } from '../types/index';

export const prompt = {
    /**
     * Confirm action
     */
    confirm: async (message: string, defaultValue: boolean = false): Promise<boolean> => {
        const { confirmed } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmed',
                message,
                default: defaultValue,
            },
        ]);
        return confirmed;
    },

    /**
     * Text input
     */
    input: async (
        message: string,
        defaultValue?: string,
        validate?: (input: string) => boolean | string,
    ): Promise<string> => {
        const { answer } = await inquirer.prompt([
            {
                type: 'input',
                name: 'answer',
                message,
                default: defaultValue,
                validate,
            },
        ]);
        return answer;
    },

    /**
     * Select from list
     */
    select: async <T extends string>(
        message: string,
        choices: T[],
        defaultValue?: T,
    ): Promise<T> => {
        const { answer } = await inquirer.prompt([
            {
                type: 'list',
                name: 'answer',
                message,
                choices,
                default: defaultValue,
            },
        ]);
        return answer;
    },

    /**
     * Multi-select from list
     */
    multiSelect: async <T extends string>(
        message: string,
        choices: T[],
        defaultValues?: T[],
    ): Promise<T[]> => {
        const { answers } = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'answers',
                message,
                choices,
                default: defaultValues,
            },
        ]);
        return answers;
    },

    /**
     * Number input
     */
    number: async (
        message: string,
        defaultValue?: number,
        min?: number,
        max?: number,
    ): Promise<number> => {
        const { answer } = await inquirer.prompt([
            {
                type: 'number',
                name: 'answer',
                message,
                default: defaultValue,
                validate: (input: number) => {
                    if (min !== undefined && input < min) {
                        return `Value must be at least ${min}`;
                    }
                    if (max !== undefined && input > max) {
                        return `Value must be at most ${max}`;
                    }
                    return true;
                },
            },
        ]);
        return answer;
    },

    /**
     * Password input
     */
    password: async (message: string): Promise<string> => {
        const { answer } = await inquirer.prompt([
            {
                type: 'password',
                name: 'answer',
                message,
                mask: '*',
            },
        ]);
        return answer;
    },

    /**
     * URL input with validation
     */
    url: async (message: string, defaultValue?: string): Promise<string> => {
        const { answer } = await inquirer.prompt([
            {
                type: 'input',
                name: 'answer',
                message,
                default: defaultValue,
                validate: (input: string) => {
                    try {
                        new URL(input);
                        return true;
                    } catch {
                        return 'Please enter a valid URL (e.g., https://example.com).js';
                    }
                },
            },
        ]);
        return answer;
    },

    /**
     * Comma-separated list input
     */
    list: async (message: string, defaultValue?: string[]): Promise<string[]> => {
        const { answer } = await inquirer.prompt([
            {
                type: 'input',
                name: 'answer',
                message: `${message} (comma-separated)`,
                default: defaultValue?.join(', '),
            },
        ]);
        return answer
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);
    },

    /**
     * Project creation prompts
     */
    createProject: async (): Promise<{
        name: string;
        domain: string;
        competitors: string[];
        description?: string;
    }> => {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Project name:',
                validate: (input: string) => {
                    if (input.length < 3) {
                        return 'Project name must be at least 3 characters.js';
                    }
                    return true;
                },
            },
            {
                type: 'input',
                name: 'domain',
                message: 'Domain URL:',
                validate: (input: string) => {
                    try {
                        new URL(input);
                        return true;
                    } catch {
                        return 'Please enter a valid URL.js';
                    }
                },
            },
            {
                type: 'input',
                name: 'competitors',
                message: 'Competitor URLs (comma-separated, max 5):',
                default: '',
            },
            {
                type: 'input',
                name: 'description',
                message: 'Description (optional):',
                default: '',
            },
        ]);

        const competitors = answers.competitors
            ? answers.competitors
                  .split(',')
                  .map((url: string) => url.trim())
                  .filter((url: string) => url.length > 0)
                  .slice(0, 5)
            : [];

        return {
            name: answers.name,
            domain: answers.domain,
            competitors,
            description: answers.description || undefined,
        };
    },

    /**
     * Keyword creation prompts
     */
    createKeyword: async (
        projectId: string,
    ): Promise<{
        project_id: string;
        query: string;
        intent: 'informational' | 'transactional' | 'navigational' | 'commercial';
        scan_frequency: 'daily' | 'weekly' | 'manual';
        engines: string[];
    }> => {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'query',
                message: 'Search query:',
                validate: (input: string) => {
                    if (input.length < 2) {
                        return 'Query must be at least 2 characters.js';
                    }
                    return true;
                },
            },
            {
                type: 'list',
                name: 'intent',
                message: 'Intent type:',
                choices: ['informational', 'transactional', 'navigational', 'commercial'],
                default: 'informational',
            },
            {
                type: 'list',
                name: 'scan_frequency',
                message: 'Scan frequency:',
                choices: ['daily', 'weekly', 'manual'],
                default: 'weekly',
            },
            {
                type: 'checkbox',
                name: 'engines',
                message: 'Select engines:',
                choices: ['perplexity', 'openai', 'gemini', 'claude'],
                default: ['perplexity'],
                validate: (input: string[]) => {
                    if (input.length === 0) {
                        return 'Please select at least one engine.js';
                    }
                    return true;
                },
            },
        ]);

        return {
            project_id: projectId,
            query: answers.query,
            intent: answers.intent,
            scan_frequency: answers.scan_frequency,
            engines: answers.engines,
        };
    },

    /**
     * Search options prompts
     */
    searchOptions: async (): Promise<{
        provider: ProviderType;
        temperature: number;
        maxTokens: number;
        country?: string;
        location?: string;
    }> => {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'provider',
                message: 'Select provider:',
                choices: ['perplexity', 'openai', 'gemini', 'claude'],
                default: 'perplexity',
            },
            {
                type: 'number',
                name: 'temperature',
                message: 'Temperature (0.0-1.0):',
                default: 0.7,
                validate: (input: number) => {
                    if (input < 0 || input > 1) {
                        return 'Temperature must be between 0.0 and 1.0.js';
                    }
                    return true;
                },
            },
            {
                type: 'number',
                name: 'maxTokens',
                message: 'Max tokens:',
                default: 1000,
                validate: (input: number) => {
                    if (input < 1) {
                        return 'Max tokens must be at least 1.js';
                    }
                    return true;
                },
            },
            {
                type: 'input',
                name: 'country',
                message: 'Country code (optional, e.g., ES, US):',
                default: '',
            },
            {
                type: 'input',
                name: 'location',
                message: 'Location (optional, e.g., Madrid, London):',
                default: '',
            },
        ]);

        return {
            provider: answers.provider,
            temperature: answers.temperature,
            maxTokens: answers.maxTokens,
            country: answers.country || undefined,
            location: answers.location || undefined,
        };
    },

    /**
     * Update project prompts
     */
    updateProject: async (currentProject: {
        name: string;
        domain: string;
        competitors: string[];
        description?: string;
    }): Promise<{
        name?: string;
        domain?: string;
        competitors?: string[];
        description?: string;
    }> => {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Project name:',
                default: currentProject.name,
            },
            {
                type: 'input',
                name: 'domain',
                message: 'Domain URL:',
                default: currentProject.domain,
                validate: (input: string) => {
                    try {
                        new URL(input);
                        return true;
                    } catch {
                        return 'Please enter a valid URL.js';
                    }
                },
            },
            {
                type: 'input',
                name: 'competitors',
                message: 'Competitor URLs (comma-separated):',
                default: currentProject.competitors.join(', '),
            },
            {
                type: 'input',
                name: 'description',
                message: 'Description:',
                default: currentProject.description || '',
            },
        ]);

        const competitors = answers.competitors
            ? answers.competitors
                  .split(',')
                  .map((url: string) => url.trim())
                  .filter((url: string) => url.length > 0)
                  .slice(0, 5)
            : [];

        return {
            name: answers.name !== currentProject.name ? answers.name : undefined,
            domain: answers.domain !== currentProject.domain ? answers.domain : undefined,
            competitors:
                JSON.stringify(competitors) !== JSON.stringify(currentProject.competitors)
                    ? competitors
                    : undefined,
            description:
                answers.description !== currentProject.description
                    ? answers.description
                    : undefined,
        };
    },
};
