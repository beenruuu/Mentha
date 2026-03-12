import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';

import config from '../config/index';
import type { Citation, ProviderType, SearchOptions } from '../types/index';
import { formatter } from '../utils/formatter';
import { prompt } from '../utils/prompt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const searchCommand = new Command('search').description(
    'Execute search queries with LLM providers',
);

searchCommand
    .command('query <text>')
    .description('Execute a search query')
    .option('-p, --provider <type>', 'Provider (perplexity, openai, gemini, claude)', 'perplexity')
    .option('-t, --temperature <number>', 'Temperature (0.0-1.0)', '0.7')
    .option('-m, --max-tokens <number>', 'Maximum tokens', '1000')
    .option('-c, --country <code>', 'Country code (e.g., ES, US)')
    .option('-l, --location <name>', 'Location (e.g., Madrid, London)')
    .option('-j, --json', 'Output as JSON')
    .action(async (text, options) => {
        const searchOptions: SearchOptions = {
            temperature: parseFloat(options.temperature),
            maxTokens: parseInt(options.maxTokens, 10),
            geo: {},
        };

        if (options.country) {
            searchOptions.geo!.country = options.country;
        }

        if (options.location) {
            searchOptions.geo!.location = options.location;
        }

        const provider = options.provider as ProviderType;
        const spinner = ora(`Searching with ${formatter.provider(provider)}...`).start();

        try {
            const apiSearchPath = resolve(
                __dirname,
                '../../../api/src/infrastructure/search/factory',
            );
            const { createProvider } = await import(apiSearchPath);
            const searchProvider = createProvider(provider);

            const startTime = Date.now();
            const result = await searchProvider.search(text, searchOptions);
            const endTime = Date.now();

            spinner.succeed(`Search completed in ${formatter.latency(endTime - startTime)}`);

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(result));
            } else {
                console.log(`\n${chalk.cyan.bold('Response:')}`);
                console.log(chalk.gray('─'.repeat(100)));
                console.log(result.content);
                console.log(`${chalk.gray('─'.repeat(100))}\n`);

                if (result.citations.length > 0) {
                    console.log(chalk.cyan.bold('Citations:'));
                    result.citations.forEach((citation: Citation, index: number) => {
                        console.log(
                            `${chalk.yellow(`${index + 1}.`)} ${chalk.blue(citation.url)} - ${
                                citation.title || formatter.domain(citation.url)
                            }`,
                        );
                        if (citation.snippet) {
                            console.log(
                                `   ${chalk.gray(formatter.truncate(citation.snippet, 80))}`,
                            );
                        }
                    });
                    console.log('');
                }

                console.log(chalk.cyan.bold('Metadata:'));
                console.log(`Model: ${result.model}`);
                console.log(`Tokens: ${formatter.tokens(result.usage)}`);
                console.log(`Latency: ${formatter.latency(result.latencyMs)}\n`);
            }
        } catch (error) {
            spinner.fail('Search failed');
            console.error(formatter.error((error as Error).message));
            console.log(chalk.yellow('\nTip: Make sure API keys are configured in apps/api/.env'));
            console.log(
                chalk.gray(
                    'Required: PERPLEXITY_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY',
                ),
            );
            process.exit(1);
        }
    });

searchCommand
    .command('interactive')
    .alias('i')
    .description('Interactive search with prompts')
    .action(async () => {
        console.log(chalk.cyan.bold('\n🔍 Interactive AI Search\n'));

        const query = await prompt.input('Enter your search query:', undefined, (input: string) => {
            if (input.length < 2) {
                return 'Query must be at least 2 characters.js';
            }
            return true;
        });

        const options = await prompt.searchOptions();
        const spinner = ora(`Searching with ${formatter.provider(options.provider)}...`).start();

        try {
            const apiSearchPath = resolve(
                __dirname,
                '../../../api/src/infrastructure/search/factory',
            );
            const { createProvider } = await import(apiSearchPath);
            const searchProvider = createProvider(options.provider);

            const searchOptions: SearchOptions = {
                temperature: options.temperature,
                maxTokens: options.maxTokens,
                geo: {
                    country: options.country,
                    location: options.location,
                },
            };

            const startTime = Date.now();
            const result = await searchProvider.search(query, searchOptions);
            const endTime = Date.now();

            spinner.succeed(`Search completed in ${formatter.latency(endTime - startTime)}`);

            console.log(`\n${chalk.cyan.bold('Response:')}`);
            console.log(chalk.gray('─'.repeat(100)));
            console.log(result.content);
            console.log(`${chalk.gray('─'.repeat(100))}\n`);

            if (result.citations.length > 0) {
                console.log(chalk.cyan.bold('Citations:'));
                result.citations.forEach((citation: Citation, index: number) => {
                    console.log(
                        `${chalk.yellow(`${index + 1}.`)} ${chalk.blue(citation.url)} - ${
                            citation.title || formatter.domain(citation.url)
                        }`,
                    );
                    if (citation.snippet) {
                        console.log(`   ${chalk.gray(formatter.truncate(citation.snippet, 80))}`);
                    }
                });
                console.log('');
            }

            console.log(chalk.cyan.bold('Metadata:'));
            console.log(`Model: ${result.model}`);
            console.log(`Tokens: ${formatter.tokens(result.usage)}`);
            console.log(`Latency: ${formatter.latency(result.latencyMs)}\n`);

            const continueSearch = await prompt.confirm('Search again?', false);
            if (continueSearch) {
                const { Command } = await import('commander');
                const program = new Command();
                program.addCommand(searchCommand);
                await program.parseAsync(['node', 'mentha', 'search', 'interactive']);
            }
        } catch (error) {
            spinner.fail('Search failed');
            console.error(formatter.error((error as Error).message));
            console.log(chalk.yellow('\nTip: Make sure API keys are configured in apps/api/.env'));
            process.exit(1);
        }
    });

searchCommand
    .command('chat')
    .description('Multi-turn conversation with AI (maintains context)')
    .option('-p, --provider <type>', 'Provider (openai, gemini, claude)', 'openai')
    .action(async (options) => {
        console.log(chalk.cyan.bold('\n💬 AI Chat Mode\n'));
        console.log(chalk.gray('Type "exit" or "quit" to end the conversation'));
        console.log(chalk.gray('Type "clear" to clear conversation history\n'));

        const provider = options.provider as ProviderType;

        if (provider === 'perplexity') {
            console.log(chalk.yellow('Note: Perplexity is optimized for search, not chat.'));
            console.log(
                chalk.yellow(
                    'Consider using openai, gemini, or claude for better chat experience.\n',
                ),
            );
        }

        try {
            const apiSearchPath = resolve(
                __dirname,
                '../../../api/src/infrastructure/search/factory',
            );
            const { createProvider } = await import(apiSearchPath);
            const searchProvider = createProvider(provider);

            while (true) {
                const userMessage = await prompt.input(
                    chalk.green('You:'),
                    undefined,
                    (input: string) => {
                        if (
                            input.length < 1 &&
                            input.toLowerCase() !== 'exit' &&
                            input.toLowerCase() !== 'quit'
                        ) {
                            return 'Message cannot be empty.js';
                        }
                        return true;
                    },
                );

                const lowerMsg = userMessage.toLowerCase().trim();

                if (lowerMsg === 'exit' || lowerMsg === 'quit') {
                    console.log(chalk.cyan('\n👋 Goodbye!\n'));
                    break;
                }

                if (lowerMsg === 'clear') {
                    console.log(chalk.yellow('\nConversation history cleared.\n'));
                    continue;
                }

                const spinner = ora('Thinking...').start();

                try {
                    const result = await searchProvider.search(userMessage, {
                        temperature: 0.7,
                        maxTokens: 2000,
                        systemPrompt:
                            'You are a helpful AI assistant. Provide clear, concise, and accurate responses.',
                    });

                    spinner.stop();

                    console.log(chalk.cyan('\nAI:'), result.content);
                    console.log(
                        chalk.gray(
                            `\n(${formatter.latency(result.latencyMs)}, ${formatter.tokens(result.usage)})\n`,
                        ),
                    );
                } catch (error) {
                    spinner.fail('Error getting response');
                    console.error(formatter.error(`${(error as Error).message}\n`));
                }
            }
        } catch (error) {
            console.error(formatter.error((error as Error).message));
            console.log(chalk.yellow('\nTip: Make sure API keys are configured in apps/api/.env'));
            process.exit(1);
        }
    });

searchCommand
    .command('test')
    .description('Test connectivity with all providers')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
        const spinner = ora('Testing provider connections...').start();

        try {
            const apiSearchPath = resolve(
                __dirname,
                '../../../api/src/infrastructure/search/factory',
            );
            const { testAllProviders } = await import(apiSearchPath);
            const results = await testAllProviders();

            spinner.succeed('Provider tests completed');

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(results));
            } else {
                console.log(`\n${chalk.cyan.bold('Provider Connectivity:')}\n`);

                Object.entries(results).forEach(([provider, status]) => {
                    const icon = status ? chalk.green('✓') : chalk.red('✗');
                    const statusText = status ? chalk.green('Connected') : chalk.red('Failed');
                    console.log(`${icon} ${formatter.provider(provider)}: ${statusText}`);
                });

                console.log('');
                console.log(chalk.gray('Configure API keys in apps/api/.env to enable providers.'));
                console.log('');
            }
        } catch (error) {
            spinner.fail('Provider tests failed');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

searchCommand
    .command('info')
    .description('Show available search providers')
    .action(() => {
        console.log(chalk.cyan.bold('\n🔍 Available Search Providers\n'));
        console.log('Available providers:');
        console.log(`  ${formatter.provider('perplexity')} - Perplexity AI (Search-optimized)`);
        console.log(`  ${formatter.provider('openai')} - OpenAI GPT (Chat & Search)`);
        console.log(`  ${formatter.provider('gemini')} - Google Gemini (Multi-modal)`);
        console.log(`  ${formatter.provider('claude')} - Anthropic Claude (Long context)`);
        console.log('');
        console.log(chalk.yellow('Note: API keys must be configured in apps/api/.env'));
        console.log('');
        console.log(chalk.cyan('Usage examples:'));
        console.log('  mentha search query "best toys for kids" -p perplexity');
        console.log('  mentha search query "juguetes Madrid" -p perplexity -c ES -l Madrid');
        console.log('  mentha search interactive');
        console.log('  mentha search chat -p openai');
        console.log('  mentha search test');
        console.log('');
    });

searchCommand
    .command('providers')
    .description('List available search providers')
    .alias('list')
    .action(() => {
        const providers: ProviderType[] = ['perplexity', 'openai', 'gemini', 'claude'];

        console.log(chalk.cyan.bold('\n📋 Search Providers\n'));
        providers.forEach((provider) => {
            console.log(`  • ${formatter.provider(provider)}`);
        });
        console.log('');
        console.log(chalk.gray('Each provider offers different capabilities and models.'));
        console.log(chalk.gray('Configure API keys in apps/api/.env to enable providers.'));
        console.log('');
    });
