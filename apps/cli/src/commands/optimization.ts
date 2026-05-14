import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';

import { client } from '../client';
import config from '../config/index';
import type { Entity } from '../types';
import { apiCall } from '../utils/api';
import { formatter } from '../utils/formatter';
import { table } from '../utils/table';

const aeoBaseUrl = config.apiBaseUrl.replace(/\/api\/v1$/, '');

export const optimizationCommand = new Command('optimization').description(
    'Knowledge Graph optimization tools',
);

optimizationCommand
    .command('entities')
    .description('List all knowledge graph entities')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
        const spinner = ora('Fetching knowledge graph entities...').start();

        try {
            const entities = await apiCall<Entity[]>(client.api.v1.kg.entities.$get());
            spinner.succeed(`Found ${entities.length} entit${entities.length === 1 ? 'y' : 'ies'}`);

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(entities));
            } else {
                if (entities.length === 0) {
                    console.log(chalk.yellow('\nNo entities in knowledge graph yet.\n'));
                } else {
                    console.log(`\n${chalk.cyan.bold('Knowledge Graph Entities')}\n`);
                    console.log(`${table.entities(entities)}\n`);
                }
            }
        } catch (error) {
            spinner.fail('Failed to fetch entities');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

optimizationCommand
    .command('entity <slug>')
    .description('Get entity details and JSON-LD')
    .option('-j, --json', 'Output as JSON')
    .action(async (slug, options) => {
        const spinner = ora('Fetching entity...').start();

        try {
            const entities = await apiCall<Entity[]>(client.api.v1.kg.entities.$get());
            const entity = entities.find((item) => item.slug === slug);
            if (!entity) {
                throw new Error(`Entity not found: ${slug}`);
            }

            const jsonLdRes = await fetch(
                `${config.apiBaseUrl}/api/v1/kg/entities/${slug}/jsonld`,
                { headers: { Accept: 'application/ld+json' } },
            );
            const jsonLd = jsonLdRes.ok ? await jsonLdRes.json() : null;

            spinner.succeed('Entity retrieved');

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json({ entity, jsonLd }));
            } else {
                console.log(`\n${table.entityDetails(entity)}\n`);

                if (jsonLd) {
                    console.log(`${chalk.cyan('JSON-LD Schema:')}\n`);
                    console.log(`${chalk.gray(JSON.stringify(jsonLd, null, 2))}\n`);
                }
            }
        } catch (error) {
            spinner.fail('Failed to fetch entity');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

optimizationCommand
    .command('overview')
    .description('Quick KG overview with metrics')
    .action(async () => {
        const spinner = ora('Fetching knowledge graph overview...').start();

        try {
            const entities = await apiCall<Entity[]>(client.api.v1.kg.entities.$get());
            spinner.succeed('KG overview retrieved');

            const types = [...new Set(entities.map((e) => e.type))];

            console.log(`\n${chalk.cyan.bold('🧠 Knowledge Graph Overview')}\n`);
            console.log(`  Total Entities: ${chalk.bold(String(entities.length))}`);
            console.log(`  Entity Types:   ${chalk.bold(types.join(', ') || 'None')}`);

            if (entities.length > 0) {
                const primary = entities.find(
                    (e) => e.type === 'Organization' || e.type === 'Person',
                );
                if (primary) {
                    console.log(`  Primary Entity: ${chalk.green(primary.name)}`);
                }
            }
            console.log('');
        } catch (error) {
            spinner.fail('Failed to fetch KG overview');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

optimizationCommand
    .command('files')
    .description('List or print AI-readable optimization files')
    .option('-n, --name <name>', 'Print a single artifact, e.g. llms-full.txt or schema.json')
    .option('-z, --zip', 'Print the ZIP download URL')
    .option('-j, --json', 'Output artifact index as JSON')
    .action(async (options) => {
        const spinner = ora(
            options.name ? `Generating ${options.name}...` : 'Listing AI-readable files...',
        ).start();

        try {
            if (options.name) {
                const response = await fetch(
                    `${aeoBaseUrl}/llms.txt/artifacts/${encodeURIComponent(options.name)}`,
                );
                if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
                const content = await response.text();
                spinner.succeed(`${options.name} generated`);
                console.log(`\n${content}\n`);
                return;
            }

            if (options.zip) {
                spinner.succeed('Artifact ZIP is available');
                console.log(`${aeoBaseUrl}/llms.txt/artifacts.zip`);
                return;
            }

            const response = await fetch(`${aeoBaseUrl}/llms.txt/artifacts`);
            if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
            const json = (await response.json()) as {
                data: Array<{ name: string; mimeType: string; bytes: number }>;
            };

            spinner.succeed(`Found ${json.data.length} AI-readable files`);
            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(json.data));
            } else {
                console.log(`\n${chalk.cyan.bold('AI-readable files')}\n`);
                for (const artifact of json.data) {
                    console.log(
                        `  ${chalk.green(artifact.name.padEnd(22))} ${chalk.gray(`${artifact.bytes} bytes`)}`,
                    );
                }
                console.log('');
            }
        } catch (error) {
            spinner.fail('Failed to generate AI-readable files');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

optimizationCommand
    .command('adapters')
    .description('List framework adapter guidance for AI-readable files')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
        const spinner = ora('Fetching framework adapters...').start();

        try {
            const response = await fetch(`${aeoBaseUrl}/llms.txt/adapters`);
            if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
            const json = (await response.json()) as { data: Array<{ name: string; instructions: string[] }> };
            spinner.succeed(`Found ${json.data.length} framework adapters`);

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(json.data));
            } else {
                console.log(`\n${chalk.cyan.bold('Framework adapters')}\n`);
                for (const adapter of json.data) {
                    console.log(`  ${chalk.green(adapter.name.padEnd(12))} ${adapter.instructions[0]}`);
                }
                console.log('');
            }
        } catch (error) {
            spinner.fail('Failed to fetch framework adapters');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

optimizationCommand
    .command('report <url>')
    .description('Generate an AEO operational report without LLM usage')
    .option('-j, --json', 'Output as JSON')
    .action(async (url, options) => {
        const spinner = ora('Generating AEO operational report...').start();

        try {
            const response = await fetch(
                `${aeoBaseUrl}/llms.txt/report?url=${encodeURIComponent(url)}`,
            );
            if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
            const json = (await response.json()) as { data: { score: { overallScore: number }; events: Array<{ title: string; action: string }> } };
            spinner.succeed('AEO operational report generated');

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(json.data));
            } else {
                console.log(`\n${chalk.cyan.bold('AEO Operational Report')}\n`);
                console.log(`  Score: ${chalk.bold(String(json.data.score.overallScore))}/100\n`);
                for (const event of json.data.events) {
                    console.log(`  - ${chalk.yellow(event.title)}: ${event.action}`);
                }
                console.log('');
            }
        } catch (error) {
            spinner.fail('Failed to generate AEO operational report');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

optimizationCommand
    .command('score <url>')
    .description('Score a URL for AI answer readiness')
    .option('-j, --json', 'Output as JSON')
    .action(async (url, options) => {
        const spinner = ora('Scoring AI readiness...').start();

        try {
            const response = await fetch(
                `${aeoBaseUrl}/llms.txt/score?url=${encodeURIComponent(url)}`,
            );
            if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
            const json = (await response.json()) as {
                data: {
                    url: string;
                    overallScore: number;
                    pillars: Record<string, number>;
                    signals: string[];
                    recommendations: string[];
                };
            };

            spinner.succeed('AI readiness scored');
            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(json.data));
            } else {
                console.log(`\n${chalk.cyan.bold('AI Readiness Score')}\n`);
                console.log(`  URL:     ${json.data.url}`);
                console.log(`  Overall: ${chalk.bold(String(json.data.overallScore))}/100\n`);
                for (const [pillar, score] of Object.entries(json.data.pillars)) {
                    console.log(`  ${pillar.padEnd(20)} ${score}/100`);
                }
                if (json.data.recommendations.length > 0) {
                    console.log(`\n${chalk.yellow('Recommendations')}`);
                    for (const recommendation of json.data.recommendations) {
                        console.log(`  - ${recommendation}`);
                    }
                }
                console.log('');
            }
        } catch (error) {
            spinner.fail('Failed to score AI readiness');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });
