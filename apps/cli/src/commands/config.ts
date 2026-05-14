import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';

import { client } from '../client';
import { apiCall } from '../utils/api';
import { formatter } from '../utils/formatter';
import { prompt } from '../utils/prompt';

type ApiKeyInfo = {
    id: string;
    provider: string;
    key_preview: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export const configCommand = new Command('config').description('Manage API keys and configuration');

configCommand
    .command('api-key')
    .description('Manage OpenRouter API key')
    .addCommand(
        new Command('set')
            .description('Set your OpenRouter API key')
            .argument('[key]', 'OpenRouter API key (sk-or-v1-...)')
            .action(async (keyArg?: string) => {
                let key = keyArg;
                if (!key) {
                    key = await prompt.password('Enter your OpenRouter API key (sk-or-v1-...)');
                }

                if (!key || key.length < 10) {
                    console.error(formatter.error('Invalid API key'));
                    process.exit(1);
                }

                const spinner = ora('Saving API key...').start();
                try {
                    const result = await apiCall<ApiKeyInfo>(
                        client.api.v1.settings['api-keys'].$put({
                            json: { provider: 'openrouter', key },
                        }),
                    );
                    spinner.succeed(`API key saved: ${result.key_preview || '********'}`);
                } catch (error) {
                    spinner.fail('Failed to save API key');
                    console.error(formatter.error((error as Error).message));
                    process.exit(1);
                }
            }),
    )
    .addCommand(
        new Command('show')
            .description('Show current API key status')
            .action(async () => {
                const spinner = ora('Fetching API keys...').start();
                try {
                    const result = await apiCall<{ data: ApiKeyInfo[] }>(
                        client.api.v1.settings['api-keys'].$get(),
                    );
                    spinner.stop();

                    const keys = Array.isArray(result) ? result : result.data;
                    const orKey = (keys || []).find(
                        (k: ApiKeyInfo) => k.provider === 'openrouter',
                    );

                    if (orKey) {
                        console.log(formatter.success('OpenRouter API key configured:'));
                        console.log(`  Preview:    ${chalk.cyan(orKey.key_preview || '********')}`);
                        console.log(`  Active:     ${chalk.green('✓')}`);
                        console.log(`  Updated:    ${chalk.gray(orKey.updated_at || 'unknown')}`);
                    } else {
                        console.log(
                            chalk.yellow('No OpenRouter API key configured. Using server default.'),
                        );
                    }
                } catch (error) {
                    spinner.fail('Failed to fetch API keys');
                    console.error(formatter.error((error as Error).message));
                    process.exit(1);
                }
            }),
    )
    .addCommand(
        new Command('test')
            .description('Test the configured API key')
            .action(async () => {
                const spinner = ora('Testing API key...').start();
                try {
                    const result = await apiCall<{ valid: boolean; label?: string }>(
                        client.api.v1.settings['api-keys'].test.$post({
                            json: { provider: 'openrouter' },
                        }),
                    );
                    spinner.stop();

                    if (result.valid) {
                        console.log(formatter.success(`✓ Key valid: ${result.label || 'OpenRouter'}`));
                    } else {
                        console.error(formatter.error('Key rejected by OpenRouter'));
                    }
                } catch (error) {
                    spinner.fail('Test failed');
                    console.error(formatter.error((error as Error).message));
                    process.exit(1);
                }
            }),
    )
    .addCommand(
        new Command('remove')
            .description('Remove the configured API key')
            .action(async () => {
                const confirm = await prompt.confirm(
                    'Remove your OpenRouter API key? Scans will use the server default.',
                );
                if (!confirm) {
                    console.log(chalk.gray('Cancelled'));
                    return;
                }

                const spinner = ora('Removing API key...').start();
                try {
                    await client.api.v1.settings['api-keys'][':provider'].$delete({
                        param: { provider: 'openrouter' },
                    });
                    spinner.succeed('API key removed');
                } catch (error) {
                    spinner.fail('Failed to remove API key');
                    console.error(formatter.error((error as Error).message));
                    process.exit(1);
                }
            }),
    );
