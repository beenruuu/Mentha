import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';

import { client } from '../client';
import config from '../config/index';
import type { Entity } from '../types';
import { apiCall } from '../utils/api';
import { formatter } from '../utils/formatter';
import { table } from '../utils/table';

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
            const entity = await apiCall<Entity>(
                client.api.v1.kg.entities[':slug'].$get({
                    param: { slug },
                }),
            );

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
